// Additional Medicare Tax calculations
// 0.9% additional tax on wages, self-employment income, and RRTA compensation

export const ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9%

// Additional Medicare Tax thresholds for 2025
export const ADDITIONAL_MEDICARE_THRESHOLDS = {
  'single': 200000,
  'married-filing-jointly': 250000,
  'head-of-household': 200000
};

/**
 * Calculate Additional Medicare Tax
 * @param {number} earnedIncome - Wages, self-employment income, etc.
 * @param {string} filingStatus - Tax filing status
 * @returns {object} Additional Medicare Tax calculation details
 */
export function calculateAdditionalMedicareTax(earnedIncome, filingStatus) {
  const threshold = ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus] || ADDITIONAL_MEDICARE_THRESHOLDS['single'];
  
  const excessIncome = Math.max(0, earnedIncome - threshold);
  const additionalMedicareTax = excessIncome * ADDITIONAL_MEDICARE_RATE;
  
  return {
    threshold,
    earnedIncome,
    excessIncome,
    additionalMedicareTax,
    applies: additionalMedicareTax > 0,
    rate: ADDITIONAL_MEDICARE_RATE
  };
}

/**
 * Get Additional Medicare Tax analysis for display
 * @param {number} earnedIncome - Earned income amount
 * @param {string} filingStatus - Filing status
 * @returns {object} Additional Medicare Tax analysis for UI display
 */
export function getAdditionalMedicareTaxAnalysis(earnedIncome, filingStatus) {
  const amt = calculateAdditionalMedicareTax(earnedIncome, filingStatus);
  
  return {
    ...amt,
    ratePercent: `${(ADDITIONAL_MEDICARE_RATE * 100).toFixed(1)}%`,
    thresholdFormatted: `$${amt.threshold.toLocaleString()}`,
    taxFormatted: `$${amt.additionalMedicareTax.toLocaleString()}`,
    distanceToThreshold: Math.max(0, amt.threshold - earnedIncome),
    distanceToThresholdFormatted: `$${Math.max(0, amt.threshold - earnedIncome).toLocaleString()}`
  };
}

