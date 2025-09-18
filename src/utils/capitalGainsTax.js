/**
 * Capital Gains Tax Calculations Module
 * 
 * This module provides functions for calculating capital gains taxes,
 * including long-term capital gains, short-term capital gains, and
 * qualified dividends taxation.
 * 
 * Refactored to use consolidated tax constants and engine.
 */

import {
  LONG_TERM_CAPITAL_GAINS_BRACKETS_2025,
  NIIT_THRESHOLDS_2025,
  NIIT_RATE,
  getCapitalGainsBrackets,
  getNIITThreshold,
  normalizeFilingStatus,
  calculateCapitalGainsTax as calculateCapitalGainsTaxEngine,
  calculateNIIT as calculateNIITEngine,
  formatCurrency,
  formatPercentage
} from './tax/index.js';

// Re-export constants for backward compatibility
export { LONG_TERM_CAPITAL_GAINS_BRACKETS_2025, NIIT_RATE, NIIT_THRESHOLDS_2025 };

/**
 * Calculate long-term capital gains tax - refactored to use consolidated engine
 * 
 * @param {number} capitalGains - Amount of long-term capital gains
 * @param {number} ordinaryIncome - Amount of ordinary income
 * @param {string} filingStatus - Tax filing status
 * @returns {Object} Tax calculation result with detailed breakdown
 */
export function calculateLongTermCapitalGainsTax(capitalGains, ordinaryIncome, filingStatus) {
  try {
    // Use the consolidated tax engine
    const result = calculateCapitalGainsTaxEngine(capitalGains, ordinaryIncome, filingStatus);
    
    // Transform result for backward compatibility
    return {
      tax: result.tax,
      ordinaryCapitalGainsTax: result.tax,
      niitTax: 0, // NIIT calculated separately
      effectiveRate: result.effectiveRate,
      marginalRate: result.marginalRate,
      bracket: result.bracket,
      niitApplies: false, // NIIT calculated separately
      breakdown: {
        capitalGains: result.breakdown.capitalGains,
        ordinaryIncome: result.breakdown.ordinaryIncome,
        totalIncome: result.breakdown.totalIncome,
        niitThreshold: getNIITThreshold(filingStatus),
        taxBreakdown: result.breakdown.taxBreakdown
      }
    };
  } catch (error) {
    console.error('Error in calculateLongTermCapitalGainsTax:', error);
    return {
      tax: 0,
      ordinaryCapitalGainsTax: 0,
      niitTax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      bracket: '0%',
      niitApplies: false,
      breakdown: {
        capitalGains: capitalGains || 0,
        ordinaryIncome: ordinaryIncome || 0,
        totalIncome: (ordinaryIncome || 0) + (capitalGains || 0),
        niitThreshold: getNIITThreshold(filingStatus)
      }
    };
  }
}

/**
 * Calculate short-term capital gains tax (taxed as ordinary income)
 * 
 * @param {number} capitalGains - Amount of short-term capital gains
 * @param {number} ordinaryIncome - Amount of ordinary income
 * @param {string} filingStatus - Tax filing status
 * @param {Array} taxBrackets - Tax brackets for calculation
 * @returns {Object} Tax calculation result
 */
export function calculateShortTermCapitalGainsTax(capitalGains, ordinaryIncome, filingStatus, taxBrackets) {
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

  // Short-term capital gains are taxed as ordinary income
  // Calculate tax on total income vs tax on ordinary income alone
  const totalIncome = ordinaryIncome + capitalGains;
  
  // Use provided tax brackets or get from consolidated constants
  const brackets = taxBrackets || getTaxBrackets(filingStatus);
  
  const totalTax = calculateProgressiveTax(totalIncome, brackets);
  const ordinaryTax = calculateProgressiveTax(ordinaryIncome, brackets);
  const capitalGainsTax = totalTax - ordinaryTax;
  
  const effectiveRate = capitalGains > 0 ? capitalGainsTax / capitalGains : 0;
  const marginalRate = getMarginalRate(totalIncome, brackets);

  return {
    tax: Math.round(capitalGainsTax),
    effectiveRate,
    marginalRate,
    bracket: `${(marginalRate * 100).toFixed(1)}%`,
    breakdown: {
      capitalGains,
      ordinaryIncome,
      totalIncome,
      totalTax,
      ordinaryTax,
      capitalGainsTax
    }
  };
}

/**
 * Calculate qualified dividends tax (same as long-term capital gains)
 * 
 * @param {number} dividends - Amount of qualified dividends
 * @param {number} ordinaryIncome - Amount of ordinary income
 * @param {string} filingStatus - Tax filing status
 * @returns {Object} Tax calculation result
 */
export function calculateQualifiedDividendsTax(dividends, ordinaryIncome, filingStatus) {
  // Qualified dividends are taxed at the same rates as long-term capital gains
  return calculateLongTermCapitalGainsTax(dividends, ordinaryIncome, filingStatus);
}

/**
 * Get comprehensive capital gains information
 * 
 * @param {string} filingStatus - Tax filing status
 * @param {number} longTermGains - Long-term capital gains amount
 * @param {number} shortTermGains - Short-term capital gains amount
 * @param {number} ordinaryIncome - Ordinary income amount
 * @param {Array} taxBrackets - Tax brackets for calculation
 * @returns {Object} Comprehensive capital gains analysis
 */
export function getCapitalGainsInfo(filingStatus, longTermGains, shortTermGains, ordinaryIncome, taxBrackets) {
  const longTermResult = calculateLongTermCapitalGainsTax(longTermGains, ordinaryIncome, filingStatus);
  const shortTermResult = calculateShortTermCapitalGainsTax(shortTermGains, ordinaryIncome, filingStatus, taxBrackets);
  
  const totalCapitalGains = (longTermGains || 0) + (shortTermGains || 0);
  const totalCapitalGainsTax = longTermResult.tax + shortTermResult.tax;
  const totalEffectiveRate = totalCapitalGains > 0 ? totalCapitalGainsTax / totalCapitalGains : 0;

  return {
    longTerm: {
      gains: longTermGains || 0,
      tax: longTermResult.tax,
      effectiveRate: longTermResult.effectiveRate,
      marginalRate: longTermResult.marginalRate,
      bracket: longTermResult.bracket
    },
    shortTerm: {
      gains: shortTermGains || 0,
      tax: shortTermResult.tax,
      effectiveRate: shortTermResult.effectiveRate,
      marginalRate: shortTermResult.marginalRate,
      bracket: shortTermResult.bracket
    },
    total: {
      gains: totalCapitalGains,
      tax: totalCapitalGainsTax,
      effectiveRate: totalEffectiveRate
    },
    breakdown: {
      longTermBreakdown: longTermResult.breakdown,
      shortTermBreakdown: shortTermResult.breakdown
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate progressive tax using tax brackets
 * @param {number} income - Income amount
 * @param {Array} brackets - Tax brackets
 * @returns {number} Calculated tax
 */
function calculateProgressiveTax(income, brackets) {
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
 * Get marginal tax rate for given income
 * @param {number} income - Income amount
 * @param {Array} brackets - Tax brackets
 * @returns {number} Marginal tax rate
 */
function getMarginalRate(income, brackets) {
  for (const bracket of brackets) {
    if (income > bracket.min && income <= bracket.max) {
      return bracket.rate;
    }
  }
  return 0;
}

/**
 * Get tax brackets for filing status (backward compatibility)
 * @param {string} filingStatus - Filing status
 * @returns {Array} Tax brackets
 */
function getTaxBrackets(filingStatus) {
  // This is a simplified version for backward compatibility
  // The full implementation is in the consolidated tax constants
  const normalized = normalizeFilingStatus(filingStatus);
  
  const brackets = {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 }
    ],
    marriedFilingJointly: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 }
    ],
    headOfHousehold: [
      { min: 0, max: 16550, rate: 0.10 },
      { min: 16550, max: 63100, rate: 0.12 },
      { min: 63100, max: 100500, rate: 0.22 },
      { min: 100500, max: 191950, rate: 0.24 },
      { min: 191950, max: 243700, rate: 0.32 },
      { min: 243700, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 }
    ]
  };
  
  return brackets[normalized] || brackets.single;
}

