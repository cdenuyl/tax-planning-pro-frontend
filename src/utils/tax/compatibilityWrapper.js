/**
 * Tax Calculation Compatibility Wrapper
 * 
 * This module provides the same interface as existing tax calculation functions
 * but uses enhanced, consolidated logic internally. This allows for gradual
 * migration without breaking existing functionality.
 */

import { 
  TAX_DATA_2025, 
  normalizeFilingStatusEnhanced, 
  getTaxDataEnhanced,
  formatCurrencyEnhanced,
  formatPercentageEnhanced,
  getFederalBracketsEnhanced,
  getStandardDeductionEnhanced,
  getCapitalGainsBracketsEnhanced,
  getNIITThresholdEnhanced,
  ONE_BIG_BEAUTIFUL_BILL_PROVISIONS_2025
} from './enhancedConstants.js';

// ============================================================================
// ONE BIG BEAUTIFUL BILL ACT CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate the One Big Beautiful Bill Act senior deduction
 * @param {string} filingStatus - Filing status
 * @param {number} taxpayerAge - Taxpayer age
 * @param {number} spouseAge - Spouse age (for joint filers)
 * @param {number} magi - Modified Adjusted Gross Income
 * @param {number} taxYear - Tax year (default 2025)
 * @returns {number} Senior deduction amount
 */
export function calculateSeniorDeductionEnhanced(filingStatus, taxpayerAge = null, spouseAge = null, magi = 0, taxYear = 2025) {
  const provision = ONE_BIG_BEAUTIFUL_BILL_PROVISIONS_2025.seniorDeduction;
  
  // Check if provision is effective for this tax year
  if (!provision.effectiveYears.includes(taxYear)) {
    return 0;
  }
  
  const normalized = normalizeFilingStatusEnhanced(filingStatus);
  const phaseOutThreshold = provision.phaseOut[normalized] || provision.phaseOut.single;
  
  // Count eligible persons (age 65 or older)
  let eligiblePersons = 0;
  
  if (normalized === 'marriedFilingJointly') {
    if (taxpayerAge && taxpayerAge >= 65) eligiblePersons++;
    if (spouseAge && spouseAge >= 65) eligiblePersons++;
  } else {
    if (taxpayerAge && taxpayerAge >= 65) eligiblePersons++;
  }
  
  if (eligiblePersons === 0) return 0;
  
  // Calculate base deduction
  let deduction = provision.amount * eligiblePersons;
  
  // Define elimination points (threshold + $100,000 phase-out range)
  const eliminationPoints = {
    single: 175000,
    marriedFilingJointly: 250000,
    headOfHousehold: 175000,
    marriedFilingSeparately: 175000
  };
  
  const eliminationPoint = eliminationPoints[normalized] || eliminationPoints.single;
  
  // Complete elimination if MAGI exceeds elimination point
  if (magi >= eliminationPoint) {
    return 0;
  }
  
  // Apply gradual phase-out if MAGI exceeds threshold but is below elimination point
  if (magi > phaseOutThreshold) {
    const excessIncome = magi - phaseOutThreshold;
    const reduction = excessIncome * provision.phaseOutRate;
    deduction = Math.max(0, deduction - reduction);
  }
  
  return Math.round(deduction);
}

/**
 * Calculate tips deduction under One Big Beautiful Bill Act
 * @param {number} qualifiedTips - Amount of qualified tips
 * @param {string} filingStatus - Filing status
 * @param {number} magi - Modified Adjusted Gross Income
 * @param {number} taxYear - Tax year (default 2025)
 * @returns {number} Tips deduction amount
 */
export function calculateTipsDeductionEnhanced(qualifiedTips = 0, filingStatus, magi = 0, taxYear = 2025) {
  const provision = ONE_BIG_BEAUTIFUL_BILL_PROVISIONS_2025.tipsDeduction;
  
  if (!provision.effectiveYears.includes(taxYear) || qualifiedTips <= 0) {
    return 0;
  }
  
  const normalized = normalizeFilingStatusEnhanced(filingStatus);
  const phaseOutThreshold = provision.phaseOut[normalized] || provision.phaseOut.single;
  
  // Start with the lesser of qualified tips or maximum amount
  let deduction = Math.min(qualifiedTips, provision.maxAmount);
  
  // Apply phase-out if MAGI exceeds threshold
  if (magi > phaseOutThreshold) {
    const excessIncome = magi - phaseOutThreshold;
    const reduction = excessIncome * provision.phaseOutRate;
    deduction = Math.max(0, deduction - reduction);
  }
  
  return Math.round(deduction);
}

/**
 * Calculate overtime deduction under One Big Beautiful Bill Act
 * @param {number} qualifiedOvertime - Amount of qualified overtime compensation
 * @param {string} filingStatus - Filing status
 * @param {number} magi - Modified Adjusted Gross Income
 * @param {number} taxYear - Tax year (default 2025)
 * @returns {number} Overtime deduction amount
 */
export function calculateOvertimeDeductionEnhanced(qualifiedOvertime = 0, filingStatus, magi = 0, taxYear = 2025) {
  const provision = ONE_BIG_BEAUTIFUL_BILL_PROVISIONS_2025.overtimeDeduction;
  
  if (!provision.effectiveYears.includes(taxYear) || qualifiedOvertime <= 0) {
    return 0;
  }
  
  const normalized = normalizeFilingStatusEnhanced(filingStatus);
  const phaseOutThreshold = provision.phaseOut[normalized] || provision.phaseOut.single;
  const maxAmount = provision.maxAmount[normalized] || provision.maxAmount.single;
  
  // Start with the lesser of qualified overtime or maximum amount
  let deduction = Math.min(qualifiedOvertime, maxAmount);
  
  // Apply phase-out if MAGI exceeds threshold
  if (magi > phaseOutThreshold) {
    const excessIncome = magi - phaseOutThreshold;
    const reduction = excessIncome * provision.phaseOutRate;
    deduction = Math.max(0, deduction - reduction);
  }
  
  return Math.round(deduction);
}

// ============================================================================
// ENHANCED CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate progressive tax using enhanced logic
 * @param {number} income - Income amount
 * @param {Array} brackets - Tax brackets
 * @returns {number} Calculated tax
 */
export function calculateProgressiveTaxEnhanced(income, brackets) {
  if (income <= 0) return 0;
  
  let totalTax = 0;
  
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    
    const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
    totalTax += taxableInBracket * bracket.rate;
  }
  
  return totalTax;
}

/**
 * Calculate federal income tax (enhanced)
 * @param {number} taxableIncome - Taxable income
 * @param {string} filingStatus - Filing status
 * @returns {Object} Tax calculation details
 */
export function calculateFederalTaxEnhanced(taxableIncome, filingStatus) {
  if (taxableIncome <= 0) {
    return {
      tax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      bracket: '0%'
    };
  }

  const brackets = getFederalBracketsEnhanced(filingStatus);
  const tax = calculateProgressiveTaxEnhanced(taxableIncome, brackets);
  
  // Find marginal rate
  let marginalRate = 0;
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
      marginalRate = bracket.rate;
      break;
    }
  }
  
  const effectiveRate = taxableIncome > 0 ? tax / taxableIncome : 0;

  return {
    tax: Math.round(tax),
    effectiveRate,
    marginalRate,
    bracket: `${(marginalRate * 100).toFixed(1)}%`
  };
}

/**
 * Calculate FICA taxes (enhanced)
 * @param {number} earnedIncome - Earned income
 * @param {string} filingStatus - Filing status
 * @returns {Object} FICA calculation details
 */
export function calculateFICATaxesEnhanced(earnedIncome, filingStatus) {
  if (earnedIncome <= 0) {
    return {
      socialSecurityTax: 0,
      medicareTax: 0,
      additionalMedicareTax: 0,
      totalFICA: 0
    };
  }

  const rates = TAX_DATA_2025.ficaRates;
  const limits = TAX_DATA_2025.ficaLimits;
  const normalized = normalizeFilingStatusEnhanced(filingStatus);
  
  // Social Security tax
  const socialSecurityTaxableWages = Math.min(earnedIncome, limits.socialSecurityWageBase);
  const socialSecurityTax = socialSecurityTaxableWages * rates.socialSecurity;
  
  // Medicare tax
  const medicareTax = earnedIncome * rates.medicare;
  
  // Additional Medicare tax
  const additionalMedicareThreshold = limits.additionalMedicareThreshold[normalized] || limits.additionalMedicareThreshold.single;
  const additionalMedicareTaxableWages = Math.max(0, earnedIncome - additionalMedicareThreshold);
  const additionalMedicareTax = additionalMedicareTaxableWages * rates.additionalMedicare;
  
  const totalFICA = socialSecurityTax + medicareTax + additionalMedicareTax;

  return {
    socialSecurityTax: Math.round(socialSecurityTax),
    medicareTax: Math.round(medicareTax),
    additionalMedicareTax: Math.round(additionalMedicareTax),
    totalFICA: Math.round(totalFICA)
  };
}

/**
 * Calculate capital gains tax (enhanced)
 * @param {number} capitalGains - Capital gains amount
 * @param {number} ordinaryIncome - Ordinary income
 * @param {string} filingStatus - Filing status
 * @returns {Object} Capital gains tax details
 */
export function calculateCapitalGainsTaxEnhanced(capitalGains, ordinaryIncome, filingStatus) {
  if (!capitalGains || capitalGains <= 0) {
    return {
      tax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      bracket: '0%'
    };
  }

  const brackets = getCapitalGainsBracketsEnhanced(filingStatus);
  const totalIncome = ordinaryIncome + capitalGains;
  
  let totalTax = 0;
  let marginalRate = 0;

  for (const bracket of brackets) {
    if (totalIncome <= bracket.min) break;

    const taxableInBracket = Math.min(totalIncome, bracket.max) - bracket.min;
    const applicableGains = Math.min(capitalGains, taxableInBracket);
    
    totalTax += applicableGains * bracket.rate;
    marginalRate = bracket.rate;
  }

  const effectiveRate = capitalGains > 0 ? totalTax / capitalGains : 0;

  return {
    tax: Math.round(totalTax),
    effectiveRate,
    marginalRate,
    bracket: `${(marginalRate * 100).toFixed(1)}%`
  };
}

/**
 * Calculate NIIT (enhanced)
 * @param {number} modifiedAGI - Modified AGI
 * @param {number} netInvestmentIncome - Net investment income
 * @param {string} filingStatus - Filing status
 * @returns {Object} NIIT calculation details
 */
export function calculateNIITEnhanced(modifiedAGI, netInvestmentIncome, filingStatus) {
  if (!modifiedAGI || !netInvestmentIncome || modifiedAGI <= 0 || netInvestmentIncome <= 0) {
    return {
      tax: 0,
      rate: TAX_DATA_2025.niit.rate,
      applies: false
    };
  }

  const normalized = normalizeFilingStatusEnhanced(filingStatus);
  const threshold = TAX_DATA_2025.niit.thresholds[normalized] || TAX_DATA_2025.niit.thresholds.single;
  const excessIncome = Math.max(0, modifiedAGI - threshold);
  
  if (excessIncome <= 0) {
    return {
      tax: 0,
      rate: TAX_DATA_2025.niit.rate,
      applies: false
    };
  }

  const taxableAmount = Math.min(netInvestmentIncome, excessIncome);
  const tax = taxableAmount * TAX_DATA_2025.niit.rate;

  return {
    tax: Math.round(tax),
    rate: TAX_DATA_2025.niit.rate,
    applies: true
  };
}

// ============================================================================
// COMPATIBILITY WRAPPER FUNCTIONS
// ============================================================================

/**
 * Wrapper for formatCurrency that uses enhanced logic
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
export function formatCurrencyWrapper(amount) {
  return formatCurrencyEnhanced(amount);
}

/**
 * Wrapper for formatPercentage that uses enhanced logic
 * @param {number} rate - Rate to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentageWrapper(rate, decimals = 2) {
  return formatPercentageEnhanced(rate, { decimals });
}

/**
 * Wrapper for getCurrentMarginalRate that uses enhanced logic
 * @param {number} taxableIncome - Taxable income
 * @param {string} filingStatus - Filing status
 * @returns {number} Marginal tax rate
 */
export function getCurrentMarginalRateWrapper(taxableIncome, filingStatus) {
  if (taxableIncome <= 0) return 0;
  
  const brackets = getFederalBracketsEnhanced(filingStatus);
  
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  
  return brackets[brackets.length - 1].rate;
}

/**
 * Wrapper for getTaxBrackets that uses enhanced logic
 * @param {string} filingStatus - Filing status
 * @param {Object} appSettings - App settings (for backward compatibility)
 * @returns {Array} Tax brackets
 */
export function getTaxBracketsWrapper(filingStatus, appSettings = {}) {
  return getFederalBracketsEnhanced(filingStatus);
}

/**
 * Enhanced wrapper for getStandardDeduction with One Big Beautiful Bill Act provisions
 * @param {string} filingStatus - Filing status
 * @param {number} taxpayerAge - Taxpayer age
 * @param {number} spouseAge - Spouse age
 * @param {number} magi - Modified Adjusted Gross Income (for phase-out calculations)
 * @param {number} taxYear - Tax year (default 2025)
 * @returns {number} Total standard deduction including all applicable provisions
 */
export function getStandardDeductionWrapper(filingStatus, taxpayerAge = null, spouseAge = null, magi = 0, taxYear = 2025) {
  // For 2025 and later, use enhanced logic with One Big Beautiful Bill Act provisions
  if (taxYear >= 2025) {
    const normalized = normalizeFilingStatusEnhanced(filingStatus);
    
    // Base standard deduction
    let totalDeduction = getTaxDataEnhanced('standardDeductions', normalized);
    
    // Traditional additional deduction for age 65+ (existing law)
    const traditionalAdditional = getTaxDataEnhanced('additionalDeductionOver65', normalized);
    
    if (normalized === 'marriedFilingJointly') {
      if (taxpayerAge && taxpayerAge >= 65) totalDeduction += traditionalAdditional;
      if (spouseAge && spouseAge >= 65) totalDeduction += traditionalAdditional;
    } else {
      if (taxpayerAge && taxpayerAge >= 65) totalDeduction += traditionalAdditional;
    }
    
    // NEW: One Big Beautiful Bill Act Senior Deduction
    const seniorDeduction = calculateSeniorDeductionEnhanced(filingStatus, taxpayerAge, spouseAge, magi, taxYear);
    totalDeduction += seniorDeduction;
    
    return totalDeduction;
  }
  
  // For years before 2025, use original logic (fallback to existing function)
  return getStandardDeductionEnhanced(filingStatus, taxpayerAge, spouseAge);
}

/**
 * @param {number} taxableIncome - Taxable income
 * @param {string} filingStatus - Filing status
 * @param {Object} appSettings - App settings (for backward compatibility)
 * @returns {Object} Federal tax calculation
 */
export function calculateFederalTaxWrapper(taxableIncome, filingStatus, appSettings = {}) {
  return calculateFederalTaxEnhanced(taxableIncome, filingStatus);
}

/**
 * Wrapper for calculateFICATaxes that uses enhanced logic
 * @param {number} earnedIncome - Earned income
 * @param {string} filingStatus - Filing status
 * @returns {Object} FICA calculation details
 */
export function calculateFICATaxesWrapper(earnedIncome, filingStatus) {
  return calculateFICATaxesEnhanced(earnedIncome, filingStatus);
}

/**
 * Test function to verify enhanced calculations match original results
 * @param {Object} testData - Test data
 * @returns {Object} Comparison results
 */
export function testEnhancedCalculations(testData) {
  const { taxableIncome = 100000, filingStatus = 'single', earnedIncome = 100000 } = testData;
  
  const federalTax = calculateFederalTaxEnhanced(taxableIncome, filingStatus);
  const ficaTaxes = calculateFICATaxesEnhanced(earnedIncome, filingStatus);
  const marginalRate = getCurrentMarginalRateWrapper(taxableIncome, filingStatus);
  const taxBrackets = getTaxBracketsWrapper(filingStatus);
  const standardDeduction = getStandardDeductionWrapper(filingStatus);
  
  return {
    federalTax,
    ficaTaxes,
    marginalRate,
    taxBrackets,
    standardDeduction,
    formattedTax: formatCurrencyWrapper(federalTax.tax),
    formattedRate: formatPercentageWrapper(marginalRate)
  };
}

