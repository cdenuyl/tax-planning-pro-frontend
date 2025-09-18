/**
 * Centralized Tax Calculation Engine
 * 
 * This module provides a unified interface for all tax calculations,
 * orchestrating various tax types and ensuring consistent data flow
 * throughout the application.
 */

import {
  FILING_STATUS,
  FEDERAL_TAX_BRACKETS_2025,
  FICA_RATES_2025,
  FICA_LIMITS_2025,
  NIIT_RATE,
  MICHIGAN_TAX_RATE,
  normalizeFilingStatus,
  getTaxBrackets,
  getStandardDeduction,
  getCapitalGainsBrackets,
  getNIITThreshold,
  getSSThresholds,
  getAdditionalMedicareThreshold
} from './taxConstants.js';

// ============================================================================
// CORE TAX CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate federal income tax using progressive brackets
 * @param {number} taxableIncome - Taxable income amount
 * @param {string} filingStatus - Filing status
 * @returns {Object} Tax calculation details
 */
export function calculateFederalIncomeTax(taxableIncome, filingStatus) {
  if (taxableIncome <= 0) {
    return {
      tax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      bracket: '0%',
      breakdown: []
    };
  }

  const brackets = getTaxBrackets(filingStatus);
  let totalTax = 0;
  let marginalRate = 0;
  const breakdown = [];

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;

    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    const taxInBracket = taxableInBracket * bracket.rate;
    
    totalTax += taxInBracket;
    marginalRate = bracket.rate;

    if (taxableInBracket > 0) {
      breakdown.push({
        min: bracket.min,
        max: bracket.max === Infinity ? 'No limit' : bracket.max,
        rate: bracket.rate,
        taxableAmount: taxableInBracket,
        tax: taxInBracket
      });
    }
  }

  const effectiveRate = taxableIncome > 0 ? totalTax / taxableIncome : 0;

  return {
    tax: Math.round(totalTax),
    effectiveRate,
    marginalRate,
    bracket: `${(marginalRate * 100).toFixed(1)}%`,
    breakdown
  };
}

/**
 * Calculate FICA taxes (Social Security and Medicare)
 * @param {number} earnedIncome - Earned income amount
 * @param {string} filingStatus - Filing status
 * @returns {Object} FICA tax calculation details
 */
export function calculateFICATaxes(earnedIncome, filingStatus) {
  if (earnedIncome <= 0) {
    return {
      socialSecurityTax: 0,
      medicareTax: 0,
      additionalMedicareTax: 0,
      totalFICA: 0,
      breakdown: {
        earnedIncome: 0,
        socialSecurityTaxableWages: 0,
        medicareTaxableWages: 0,
        additionalMedicareTaxableWages: 0
      }
    };
  }

  // Social Security tax (6.2% up to wage base)
  const socialSecurityTaxableWages = Math.min(earnedIncome, FICA_LIMITS_2025.socialSecurityWageBase);
  const socialSecurityTax = socialSecurityTaxableWages * FICA_RATES_2025.socialSecurity;

  // Medicare tax (1.45% on all wages)
  const medicareTaxableWages = earnedIncome;
  const medicareTax = medicareTaxableWages * FICA_RATES_2025.medicare;

  // Additional Medicare tax (0.9% on high earners)
  const additionalMedicareThreshold = getAdditionalMedicareThreshold(filingStatus);
  const additionalMedicareTaxableWages = Math.max(0, earnedIncome - additionalMedicareThreshold);
  const additionalMedicareTax = additionalMedicareTaxableWages * FICA_RATES_2025.additionalMedicare;

  const totalFICA = socialSecurityTax + medicareTax + additionalMedicareTax;

  return {
    socialSecurityTax: Math.round(socialSecurityTax),
    medicareTax: Math.round(medicareTax),
    additionalMedicareTax: Math.round(additionalMedicareTax),
    totalFICA: Math.round(totalFICA),
    breakdown: {
      earnedIncome,
      socialSecurityTaxableWages,
      medicareTaxableWages,
      additionalMedicareTaxableWages,
      socialSecurityRate: FICA_RATES_2025.socialSecurity,
      medicareRate: FICA_RATES_2025.medicare,
      additionalMedicareRate: FICA_RATES_2025.additionalMedicare,
      additionalMedicareThreshold
    }
  };
}

/**
 * Calculate long-term capital gains tax
 * @param {number} capitalGains - Capital gains amount
 * @param {number} ordinaryIncome - Ordinary income amount
 * @param {string} filingStatus - Filing status
 * @returns {Object} Capital gains tax calculation details
 */
export function calculateCapitalGainsTax(capitalGains, ordinaryIncome, filingStatus) {
  if (!capitalGains || capitalGains <= 0) {
    return {
      tax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      bracket: '0%',
      breakdown: {
        capitalGains: capitalGains || 0,
        ordinaryIncome: ordinaryIncome || 0,
        totalIncome: (ordinaryIncome || 0) + (capitalGains || 0)
      }
    };
  }

  const brackets = getCapitalGainsBrackets(filingStatus);
  const totalIncome = ordinaryIncome + capitalGains;
  
  let totalTax = 0;
  let marginalRate = 0;
  const breakdown = [];

  for (const bracket of brackets) {
    if (totalIncome <= bracket.min) break;

    const taxableInBracket = Math.min(totalIncome, bracket.max) - bracket.min;
    const applicableGains = Math.min(capitalGains, taxableInBracket);
    const taxInBracket = applicableGains * bracket.rate;
    
    totalTax += taxInBracket;
    marginalRate = bracket.rate;

    if (applicableGains > 0) {
      breakdown.push({
        min: bracket.min,
        max: bracket.max === Infinity ? 'No limit' : bracket.max,
        rate: bracket.rate,
        taxableAmount: applicableGains,
        tax: taxInBracket
      });
    }
  }

  const effectiveRate = capitalGains > 0 ? totalTax / capitalGains : 0;

  return {
    tax: Math.round(totalTax),
    effectiveRate,
    marginalRate,
    bracket: `${(marginalRate * 100).toFixed(1)}%`,
    breakdown: {
      capitalGains,
      ordinaryIncome,
      totalIncome,
      taxBreakdown: breakdown
    }
  };
}

/**
 * Calculate Net Investment Income Tax (NIIT)
 * @param {number} modifiedAGI - Modified Adjusted Gross Income
 * @param {number} netInvestmentIncome - Net investment income
 * @param {string} filingStatus - Filing status
 * @returns {Object} NIIT calculation details
 */
export function calculateNIIT(modifiedAGI, netInvestmentIncome, filingStatus) {
  if (!modifiedAGI || !netInvestmentIncome || modifiedAGI <= 0 || netInvestmentIncome <= 0) {
    return {
      tax: 0,
      rate: NIIT_RATE,
      threshold: getNIITThreshold(filingStatus),
      applies: false,
      breakdown: {
        modifiedAGI: modifiedAGI || 0,
        netInvestmentIncome: netInvestmentIncome || 0,
        excessIncome: 0,
        taxableAmount: 0
      }
    };
  }

  const threshold = getNIITThreshold(filingStatus);
  const excessIncome = Math.max(0, modifiedAGI - threshold);
  
  if (excessIncome <= 0) {
    return {
      tax: 0,
      rate: NIIT_RATE,
      threshold,
      applies: false,
      breakdown: {
        modifiedAGI,
        netInvestmentIncome,
        excessIncome: 0,
        taxableAmount: 0
      }
    };
  }

  // NIIT applies to the lesser of net investment income or excess income
  const taxableAmount = Math.min(netInvestmentIncome, excessIncome);
  const tax = taxableAmount * NIIT_RATE;

  return {
    tax: Math.round(tax),
    rate: NIIT_RATE,
    threshold,
    applies: true,
    breakdown: {
      modifiedAGI,
      netInvestmentIncome,
      excessIncome,
      taxableAmount
    }
  };
}

/**
 * Calculate state income tax (Michigan)
 * @param {number} taxableIncome - Taxable income amount
 * @returns {Object} State tax calculation details
 */
export function calculateStateTax(taxableIncome) {
  if (taxableIncome <= 0) {
    return {
      tax: 0,
      rate: MICHIGAN_TAX_RATE,
      effectiveRate: 0
    };
  }

  const tax = taxableIncome * MICHIGAN_TAX_RATE;
  
  return {
    tax: Math.round(tax),
    rate: MICHIGAN_TAX_RATE,
    effectiveRate: MICHIGAN_TAX_RATE,
    breakdown: {
      taxableIncome,
      rate: MICHIGAN_TAX_RATE
    }
  };
}

// ============================================================================
// COMPREHENSIVE TAX CALCULATION
// ============================================================================

/**
 * Calculate all applicable taxes for given income sources
 * @param {Array} incomeSources - Array of income source objects
 * @param {number} taxpayerAge - Age of taxpayer
 * @param {number} spouseAge - Age of spouse
 * @param {string} filingStatus - Filing status
 * @param {Object} deductions - Deduction amounts
 * @returns {Object} Comprehensive tax calculation results
 */
export function calculateComprehensiveTaxes(incomeSources, taxpayerAge, spouseAge, filingStatus, deductions = {}) {
  // Normalize filing status
  const normalizedFilingStatus = normalizeFilingStatus(filingStatus);
  
  // Calculate income totals
  const incomeBreakdown = calculateIncomeBreakdown(incomeSources);
  
  // Calculate deductions
  const standardDeduction = getStandardDeduction(normalizedFilingStatus, taxpayerAge, spouseAge);
  const totalDeductions = Math.max(standardDeduction, deductions.itemized || 0);
  
  // Calculate taxable income
  const adjustedGrossIncome = incomeBreakdown.totalIncome;
  const taxableIncome = Math.max(0, adjustedGrossIncome - totalDeductions);
  
  // Calculate individual tax components
  const federalTax = calculateFederalIncomeTax(taxableIncome, normalizedFilingStatus);
  const ficaTaxes = calculateFICATaxes(incomeBreakdown.earnedIncome, normalizedFilingStatus);
  const capitalGainsTax = calculateCapitalGainsTax(
    incomeBreakdown.longTermCapitalGains, 
    incomeBreakdown.ordinaryIncome, 
    normalizedFilingStatus
  );
  const niitTax = calculateNIIT(
    adjustedGrossIncome, 
    incomeBreakdown.investmentIncome, 
    normalizedFilingStatus
  );
  const stateTax = calculateStateTax(taxableIncome);
  
  // Calculate totals
  const totalFederalTax = federalTax.tax + capitalGainsTax.tax + niitTax.tax;
  const totalTax = totalFederalTax + ficaTaxes.totalFICA + stateTax.tax;
  const afterTaxIncome = adjustedGrossIncome - totalTax;
  const effectiveTaxRate = adjustedGrossIncome > 0 ? totalTax / adjustedGrossIncome : 0;
  
  return {
    income: {
      ...incomeBreakdown,
      adjustedGrossIncome,
      taxableIncome
    },
    deductions: {
      standard: standardDeduction,
      itemized: deductions.itemized || 0,
      total: totalDeductions
    },
    taxes: {
      federal: federalTax,
      fica: ficaTaxes,
      capitalGains: capitalGainsTax,
      niit: niitTax,
      state: stateTax,
      totalFederal: totalFederalTax,
      total: totalTax
    },
    summary: {
      grossIncome: adjustedGrossIncome,
      totalTax,
      afterTaxIncome,
      effectiveTaxRate
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate income breakdown from income sources
 * @param {Array} incomeSources - Array of income source objects
 * @returns {Object} Income breakdown by type
 */
function calculateIncomeBreakdown(incomeSources) {
  const breakdown = {
    wages: 0,
    selfEmployment: 0,
    business: 0,
    socialSecurity: 0,
    pension: 0,
    ira401k: 0,
    rothIRA: 0,
    annuity: 0,
    lifeInsurance: 0,
    interest: 0,
    dividends: 0,
    shortTermCapitalGains: 0,
    longTermCapitalGains: 0,
    rental: 0,
    other: 0
  };

  let earnedIncome = 0;
  let ordinaryIncome = 0;
  let investmentIncome = 0;
  let totalIncome = 0;

  for (const source of incomeSources) {
    if (!source.enabled) continue;

    const yearlyAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
    
    breakdown[source.type] = (breakdown[source.type] || 0) + yearlyAmount;
    totalIncome += yearlyAmount;

    // Categorize income types
    if (['wages', 'selfEmployment', 'business'].includes(source.type)) {
      earnedIncome += yearlyAmount;
      ordinaryIncome += yearlyAmount;
    } else if (['interest', 'dividends', 'shortTermCapitalGains', 'rental'].includes(source.type)) {
      investmentIncome += yearlyAmount;
      if (source.type !== 'longTermCapitalGains') {
        ordinaryIncome += yearlyAmount;
      }
    } else {
      ordinaryIncome += yearlyAmount;
    }
  }

  return {
    ...breakdown,
    earnedIncome,
    ordinaryIncome,
    investmentIncome,
    totalIncome
  };
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage for display
 * @param {number} rate - Rate to format (as decimal)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(rate, decimals = 2) {
  return `${(rate * 100).toFixed(decimals)}%`;
}

