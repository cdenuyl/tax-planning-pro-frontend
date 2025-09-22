/**
 * Net Investment Income Tax (NIIT) Calculation Module
 * 
 * This module provides functions for calculating the Net Investment Income Tax (NIIT),
 * which is a 3.8% tax on investment income for high earners.
 * 
 * Refactored to use consolidated tax constants and engine.
 */

import {
  NIIT_RATE,
  NIIT_THRESHOLDS_2025,
  getNIITThreshold,
  normalizeFilingStatus,
  calculateNIIT as calculateNIITEngine
} from './tax/index.js';

// Re-export constants for backward compatibility
export { NIIT_RATE };

export const NIIT_THRESHOLDS = {
  'single': 200000,
  'marriedFilingJointly': 250000,
  'headOfHousehold': 200000,
  // Legacy format support
  'married-filing-jointly': 250000
};

/**
 * Calculate Net Investment Income Tax (NIIT) - refactored to use consolidated engine
 * 
 * @param {number} modifiedAGI - Modified Adjusted Gross Income
 * @param {number} netInvestmentIncome - Net investment income amount
 * @param {string} filingStatus - Tax filing status
 * @returns {object} NIIT calculation details
 */
export function calculateNIIT(filingStatus, modifiedAGI, netInvestmentIncome) {
  try {
    // Input validation
    if (typeof modifiedAGI !== 'number' || isNaN(modifiedAGI)) {
      console.warn('Invalid modifiedAGI provided to calculateNIIT, converting to 0:', modifiedAGI);
      modifiedAGI = 0;
    }
    
    if (typeof netInvestmentIncome !== 'number' || isNaN(netInvestmentIncome)) {
      console.warn('Invalid netInvestmentIncome provided to calculateNIIT, converting to 0:', netInvestmentIncome);
      netInvestmentIncome = 0;
    }

    if (typeof filingStatus !== 'string') {
      console.warn('Invalid filingStatus provided to calculateNIIT, defaulting to single:', filingStatus);
      filingStatus = 'single';
    }
    
    // Use the consolidated tax engine
    const result = calculateNIITEngine(filingStatus, modifiedAGI, netInvestmentIncome);
    
    // Transform result for backward compatibility
    return {
      threshold: result.threshold,
      modifiedAGI: result.breakdown.modifiedAGI,
      netInvestmentIncome: result.breakdown.netInvestmentIncome,
      excessIncome: result.breakdown.excessIncome,
      taxableAmount: result.breakdown.taxableAmount,
      niitTax: result.tax,
      applies: result.applies,
      rate: result.rate
    };
  } catch (error) {
    console.error('Error in calculateNIIT:', error);
    
    // Return safe default values
    const threshold = getNIITThreshold(filingStatus);
    return {
      threshold,
      modifiedAGI: modifiedAGI || 0,
      netInvestmentIncome: netInvestmentIncome || 0,
      excessIncome: 0,
      taxableAmount: 0,
      niitTax: 0,
      applies: false,
      rate: NIIT_RATE
    };
  }
}

/**
 * Calculate net investment income from income sources
 * 
 * @param {Array} incomeSources - Array of income source objects
 * @returns {number} Total net investment income
 */
export function calculateNetInvestmentIncome(incomeSources) {
  // Input validation
  if (!incomeSources || !Array.isArray(incomeSources)) {
    console.warn('Invalid incomeSources provided to calculateNetInvestmentIncome:', incomeSources);
    return 0;
  }
  
  let netInvestmentIncome = 0;
  
  incomeSources.forEach(source => {
    // Skip disabled sources
    if (!source || !source.enabled) return;
    
    // Calculate yearly amount based on frequency
    const yearlyAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
    
    // Investment income types subject to NIIT
    switch (source.type) {
      case 'dividends':
      case 'qualified-dividends':
      case 'interest':
      case 'long-term-capital-gains':
      case 'short-term-capital-gains':
      case 'rental':
      case 'royalties':
      case 'passive-business':
        netInvestmentIncome += yearlyAmount;
        break;
      default:
        // Not investment income
        break;
    }
  });
  
  return netInvestmentIncome;
}

/**
 * Get NIIT analysis for display
 * 
 * @param {number} modifiedAGI - Modified Adjusted Gross Income
 * @param {number} netInvestmentIncome - Net investment income
 * @param {string} filingStatus - Filing status
 * @returns {object} NIIT analysis for UI display
 */
export function getNIITAnalysis(modifiedAGI, netInvestmentIncome, filingStatus) {
  // Calculate NIIT
  const niit = calculateNIIT(filingStatus, modifiedAGI, netInvestmentIncome);
  
  // Return enhanced analysis with formatted values
  return {
    ...niit,
    ratePercent: `${(NIIT_RATE * 100).toFixed(1)}%`,
    thresholdFormatted: `$${niit.threshold.toLocaleString()}`,
    taxFormatted: `$${Math.round(niit.niitTax).toLocaleString()}`,
    distanceToThreshold: Math.max(0, niit.threshold - modifiedAGI),
    distanceToThresholdFormatted: `$${Math.max(0, niit.threshold - modifiedAGI).toLocaleString()}`
  };
}

