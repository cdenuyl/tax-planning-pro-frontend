/**
 * Consolidated Tax Constants
 * 
 * This module centralizes all tax rates, brackets, thresholds, and constants
 * used throughout the Tax-on-a-Me application to eliminate duplication
 * and provide a single source of truth for tax data.
 */

// ============================================================================
// FILING STATUS DEFINITIONS
// ============================================================================

export const FILING_STATUS = {
  SINGLE: 'single',
  MARRIED_FILING_JOINTLY: 'marriedFilingJointly',
  HEAD_OF_HOUSEHOLD: 'headOfHousehold',
  MARRIED_FILING_SEPARATELY: 'marriedFilingSeparately'
};

export const FILING_STATUS_LABELS = {
  [FILING_STATUS.SINGLE]: 'Single',
  [FILING_STATUS.MARRIED_FILING_JOINTLY]: 'Married Filing Jointly',
  [FILING_STATUS.HEAD_OF_HOUSEHOLD]: 'Head of Household',
  [FILING_STATUS.MARRIED_FILING_SEPARATELY]: 'Married Filing Separately'
};

// ============================================================================
// 2025 FEDERAL TAX BRACKETS
// ============================================================================

export const FEDERAL_TAX_BRACKETS_2025 = {
  [FILING_STATUS.SINGLE]: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ],
  [FILING_STATUS.MARRIED_FILING_JOINTLY]: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ],
  [FILING_STATUS.HEAD_OF_HOUSEHOLD]: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ]
};

// ============================================================================
// STANDARD DEDUCTIONS
// ============================================================================

export const STANDARD_DEDUCTIONS_2025 = {
  [FILING_STATUS.SINGLE]: 15000,
  [FILING_STATUS.MARRIED_FILING_JOINTLY]: 30000,
  [FILING_STATUS.HEAD_OF_HOUSEHOLD]: 22500,
  [FILING_STATUS.MARRIED_FILING_SEPARATELY]: 15000
};

export const ADDITIONAL_DEDUCTION_OVER_65 = {
  [FILING_STATUS.SINGLE]: 2000,
  [FILING_STATUS.MARRIED_FILING_JOINTLY]: 1600, // per spouse
  [FILING_STATUS.HEAD_OF_HOUSEHOLD]: 2000,
  [FILING_STATUS.MARRIED_FILING_SEPARATELY]: 1600
};

// ============================================================================
// CAPITAL GAINS TAX BRACKETS
// ============================================================================

export const LONG_TERM_CAPITAL_GAINS_BRACKETS_2025 = {
  [FILING_STATUS.SINGLE]: [
    { min: 0, max: 48350, rate: 0.00 },
    { min: 48350, max: 533400, rate: 0.15 },
    { min: 533400, max: Infinity, rate: 0.20 }
  ],
  [FILING_STATUS.MARRIED_FILING_JOINTLY]: [
    { min: 0, max: 96700, rate: 0.00 },
    { min: 96700, max: 600050, rate: 0.15 },
    { min: 600050, max: Infinity, rate: 0.20 }
  ],
  [FILING_STATUS.HEAD_OF_HOUSEHOLD]: [
    { min: 0, max: 64750, rate: 0.00 },
    { min: 64750, max: 566700, rate: 0.15 },
    { min: 566700, max: Infinity, rate: 0.20 }
  ]
};

// ============================================================================
// FICA TAX RATES AND LIMITS
// ============================================================================

export const FICA_RATES_2025 = {
  socialSecurity: 0.062,    // 6.2%
  medicare: 0.0145,         // 1.45%
  additionalMedicare: 0.009 // 0.9% on high earners
};

export const FICA_LIMITS_2025 = {
  socialSecurityWageBase: 176100,
  additionalMedicareThreshold: {
    [FILING_STATUS.SINGLE]: 200000,
    [FILING_STATUS.MARRIED_FILING_JOINTLY]: 250000,
    [FILING_STATUS.MARRIED_FILING_SEPARATELY]: 125000,
    [FILING_STATUS.HEAD_OF_HOUSEHOLD]: 200000
  }
};

// ============================================================================
// NET INVESTMENT INCOME TAX (NIIT)
// ============================================================================

export const NIIT_RATE = 0.038; // 3.8%

export const NIIT_THRESHOLDS_2025 = {
  [FILING_STATUS.SINGLE]: 200000,
  [FILING_STATUS.MARRIED_FILING_JOINTLY]: 250000,
  [FILING_STATUS.HEAD_OF_HOUSEHOLD]: 200000,
  [FILING_STATUS.MARRIED_FILING_SEPARATELY]: 125000
};

// ============================================================================
// SOCIAL SECURITY TAXATION THRESHOLDS
// ============================================================================

export const SS_TAXATION_THRESHOLDS = {
  [FILING_STATUS.SINGLE]: {
    tier1: 25000,
    tier2: 34000
  },
  [FILING_STATUS.MARRIED_FILING_JOINTLY]: {
    tier1: 32000,
    tier2: 44000
  },
  [FILING_STATUS.HEAD_OF_HOUSEHOLD]: {
    tier1: 25000,
    tier2: 34000
  },
  [FILING_STATUS.MARRIED_FILING_SEPARATELY]: {
    tier1: 0,
    tier2: 0
  }
};

// ============================================================================
// STATE TAX RATES (MICHIGAN)
// ============================================================================

export const MICHIGAN_TAX_RATE = 0.0425; // 4.25%
export const MICHIGAN_HOMESTEAD_THRESHOLD = 69700;
export const MICHIGAN_HOMESTEAD_CREDIT = 1715;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize filing status to ensure consistency
 * @param {string} filingStatus - The filing status to normalize
 * @returns {string} Normalized filing status
 */
export function normalizeFilingStatus(filingStatus) {
  if (!filingStatus || typeof filingStatus !== 'string') return FILING_STATUS.SINGLE;
  
  const normalized = filingStatus.toLowerCase().replace(/[^a-z]/g, '');
  
  switch (normalized) {
    case 'single':
      return FILING_STATUS.SINGLE;
    case 'marriedfilingjointly':
    case 'marriedjoint':
    case 'joint':
      return FILING_STATUS.MARRIED_FILING_JOINTLY;
    case 'headofhousehold':
    case 'hoh':
      return FILING_STATUS.HEAD_OF_HOUSEHOLD;
    case 'marriedfilingseparately':
    case 'marriedseparate':
    case 'separate':
      return FILING_STATUS.MARRIED_FILING_SEPARATELY;
    default:
      console.warn(`Unknown filing status: ${filingStatus}, defaulting to single`);
      return FILING_STATUS.SINGLE;
  }
}

/**
 * Get tax brackets for a specific filing status
 * @param {string} filingStatus - The filing status
 * @returns {Array} Tax brackets array
 */
export function getTaxBrackets(filingStatus) {
  const normalized = normalizeFilingStatus(filingStatus);
  return FEDERAL_TAX_BRACKETS_2025[normalized] || FEDERAL_TAX_BRACKETS_2025[FILING_STATUS.SINGLE];
}

/**
 * Get standard deduction for a specific filing status and age
 * @param {string} filingStatus - The filing status
 * @param {number} taxpayerAge - Age of taxpayer
 * @param {number} spouseAge - Age of spouse (for joint filing)
 * @returns {number} Total standard deduction
 */
export function getStandardDeduction(filingStatus, taxpayerAge = null, spouseAge = null) {
  const normalized = normalizeFilingStatus(filingStatus);
  let baseDeduction = STANDARD_DEDUCTIONS_2025[normalized] || STANDARD_DEDUCTIONS_2025[FILING_STATUS.SINGLE];
  
  const additionalDeduction = ADDITIONAL_DEDUCTION_OVER_65[normalized] || ADDITIONAL_DEDUCTION_OVER_65[FILING_STATUS.SINGLE];
  
  if (normalized === FILING_STATUS.MARRIED_FILING_JOINTLY) {
    // For joint filing, add additional deduction for each spouse over 65
    if (taxpayerAge && taxpayerAge >= 65) {
      baseDeduction += additionalDeduction;
    }
    if (spouseAge && spouseAge >= 65) {
      baseDeduction += additionalDeduction;
    }
  } else {
    // For single/HOH, add additional deduction if taxpayer is over 65
    if (taxpayerAge && taxpayerAge >= 65) {
      baseDeduction += additionalDeduction;
    }
  }
  
  return baseDeduction;
}

/**
 * Get capital gains brackets for a specific filing status
 * @param {string} filingStatus - The filing status
 * @returns {Array} Capital gains brackets array
 */
export function getCapitalGainsBrackets(filingStatus) {
  const normalized = normalizeFilingStatus(filingStatus);
  return LONG_TERM_CAPITAL_GAINS_BRACKETS_2025[normalized] || LONG_TERM_CAPITAL_GAINS_BRACKETS_2025[FILING_STATUS.SINGLE];
}

/**
 * Get NIIT threshold for a specific filing status
 * @param {string} filingStatus - The filing status
 * @returns {number} NIIT threshold
 */
export function getNIITThreshold(filingStatus) {
  const normalized = normalizeFilingStatus(filingStatus);
  return NIIT_THRESHOLDS_2025[normalized] || NIIT_THRESHOLDS_2025[FILING_STATUS.SINGLE];
}

/**
 * Get Social Security taxation thresholds for a specific filing status
 * @param {string} filingStatus - The filing status
 * @returns {Object} SS taxation thresholds
 */
export function getSSThresholds(filingStatus) {
  const normalized = normalizeFilingStatus(filingStatus);
  return SS_TAXATION_THRESHOLDS[normalized] || SS_TAXATION_THRESHOLDS[FILING_STATUS.SINGLE];
}

/**
 * Get FICA additional Medicare threshold for a specific filing status
 * @param {string} filingStatus - The filing status
 * @returns {number} Additional Medicare threshold
 */
export function getAdditionalMedicareThreshold(filingStatus) {
  const normalized = normalizeFilingStatus(filingStatus);
  return FICA_LIMITS_2025.additionalMedicareThreshold[normalized] || FICA_LIMITS_2025.additionalMedicareThreshold[FILING_STATUS.SINGLE];
}

