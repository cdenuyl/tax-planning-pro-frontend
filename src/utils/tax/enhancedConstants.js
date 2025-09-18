/**
 * Enhanced Tax Constants - Supplemental
 * 
 * This module provides enhanced, consolidated tax constants that supplement
 * the existing constants without replacing them. This allows for gradual
 * migration to a more organized structure.
 */

// ============================================================================
// FILING STATUS ENUMS (Enhanced)
// ============================================================================

export const FILING_STATUS_ENHANCED = {
  SINGLE: 'single',
  MARRIED_FILING_JOINTLY: 'marriedFilingJointly',
  HEAD_OF_HOUSEHOLD: 'headOfHousehold',
  MARRIED_FILING_SEPARATELY: 'marriedFilingSeparately'
};

// ============================================================================
// CONSOLIDATED TAX DATA (2025)
// ============================================================================

export const TAX_DATA_2025 = {
  federalBrackets: {
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
  },
  
  standardDeductions: {
    single: 15000,
    marriedFilingJointly: 31500,
    headOfHousehold: 22500,
    marriedFilingSeparately: 15000
  },
  
  additionalDeductionOver65: {
    single: 2000,
    marriedFilingJointly: 1600, // per spouse
    headOfHousehold: 2000,
    marriedFilingSeparately: 1600
  },
  
  capitalGainsBrackets: {
    single: [
      { min: 0, max: 48350, rate: 0.00 },
      { min: 48350, max: 533400, rate: 0.15 },
      { min: 533400, max: Infinity, rate: 0.20 }
    ],
    marriedFilingJointly: [
      { min: 0, max: 96700, rate: 0.00 },
      { min: 96700, max: 600050, rate: 0.15 },
      { min: 600050, max: Infinity, rate: 0.20 }
    ],
    headOfHousehold: [
      { min: 0, max: 64750, rate: 0.00 },
      { min: 64750, max: 566700, rate: 0.15 },
      { min: 566700, max: Infinity, rate: 0.20 }
    ]
  },
  
  ficaRates: {
    socialSecurity: 0.062,
    medicare: 0.0145,
    additionalMedicare: 0.009
  },
  
  ficaLimits: {
    socialSecurityWageBase: 176100,
    additionalMedicareThreshold: {
      single: 200000,
      marriedFilingJointly: 250000,
      marriedFilingSeparately: 125000,
      headOfHousehold: 200000
    }
  },
  
  niit: {
    rate: 0.038,
    thresholds: {
      single: 200000,
      marriedFilingJointly: 250000,
      headOfHousehold: 200000,
      marriedFilingSeparately: 125000
    }
  },
  
  socialSecurityThresholds: {
    single: { tier1: 25000, tier2: 34000 },
    marriedFilingJointly: { tier1: 32000, tier2: 44000 },
    headOfHousehold: { tier1: 25000, tier2: 34000 },
    marriedFilingSeparately: { tier1: 0, tier2: 0 }
  },
  
  michigan: {
    taxRate: 0.0425,
    homesteadThreshold: 69700,
    homesteadCredit: 1715
  }
};

// ============================================================================
// ONE BIG BEAUTIFUL BILL ACT OF 2025 PROVISIONS
// ============================================================================

export const ONE_BIG_BEAUTIFUL_BILL_PROVISIONS_2025 = {
  seniorDeduction: {
    amount: 6000,
    perPerson: true,
    phaseOut: {
      single: 75000,
      marriedFilingJointly: 150000,
      headOfHousehold: 75000,
      marriedFilingSeparately: 75000
    },
    phaseOutRate: 0.06, // 6% reduction per dollar over threshold (6 cents per dollar)
    effectiveYears: [2025, 2026, 2027, 2028],
    description: "Additional $6,000 deduction for individuals age 65 and older"
  },
  
  tipsDeduction: {
    maxAmount: 25000,
    phaseOut: {
      single: 150000,
      marriedFilingJointly: 300000,
      headOfHousehold: 150000,
      marriedFilingSeparately: 150000
    },
    phaseOutRate: 0.05,
    effectiveYears: [2025, 2026, 2027, 2028],
    description: "Deduction for qualified tips received"
  },
  
  overtimeDeduction: {
    maxAmount: {
      single: 12500,
      marriedFilingJointly: 25000,
      headOfHousehold: 12500,
      marriedFilingSeparately: 12500
    },
    phaseOut: {
      single: 150000,
      marriedFilingJointly: 300000,
      headOfHousehold: 150000,
      marriedFilingSeparately: 150000
    },
    phaseOutRate: 0.05,
    effectiveYears: [2025, 2026, 2027, 2028],
    description: "Deduction for qualified overtime compensation"
  },
  
  carLoanInterestDeduction: {
    maxAmount: 10000,
    phaseOut: {
      single: 100000,
      marriedFilingJointly: 200000,
      headOfHousehold: 100000,
      marriedFilingSeparately: 100000
    },
    phaseOutRate: 0.05,
    effectiveYears: [2025, 2026, 2027, 2028],
    description: "Deduction for interest on qualified vehicle loans"
  }
};

// ============================================================================
// ENHANCED UTILITY FUNCTIONS
// ============================================================================

/**
 * Enhanced filing status normalization
 * @param {string} filingStatus - Filing status to normalize
 * @returns {string} Normalized filing status
 */
export function normalizeFilingStatusEnhanced(filingStatus) {
  if (!filingStatus) return FILING_STATUS_ENHANCED.SINGLE;
  
  const normalized = filingStatus.toLowerCase().replace(/[^a-z]/g, '');
  
  switch (normalized) {
    case 'single':
      return FILING_STATUS_ENHANCED.SINGLE;
    case 'marriedfilingjointly':
    case 'marriedjoint':
    case 'joint':
      return FILING_STATUS_ENHANCED.MARRIED_FILING_JOINTLY;
    case 'headofhousehold':
    case 'hoh':
      return FILING_STATUS_ENHANCED.HEAD_OF_HOUSEHOLD;
    case 'marriedfilingseparately':
    case 'marriedseparate':
    case 'separate':
      return FILING_STATUS_ENHANCED.MARRIED_FILING_SEPARATELY;
    default:
      return FILING_STATUS_ENHANCED.SINGLE;
  }
}

/**
 * Get tax data for specific filing status and data type
 * @param {string} dataType - Type of data (federalBrackets, standardDeductions, etc.)
 * @param {string} filingStatus - Filing status
 * @returns {*} Requested tax data
 */
export function getTaxDataEnhanced(dataType, filingStatus) {
  const normalized = normalizeFilingStatusEnhanced(filingStatus);
  const data = TAX_DATA_2025[dataType];
  
  if (!data) return null;
  
  // If data is an object with filing status keys, return the specific one
  if (typeof data === 'object' && data[normalized]) {
    return data[normalized];
  }
  
  // If data is a direct value, return it
  return data;
}

/**
 * Enhanced currency formatting
 * @param {number} amount - Amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency
 */
export function formatCurrencyEnhanced(amount, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    currency = 'USD',
    locale = 'en-US'
  } = options;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount || 0);
}

/**
 * Enhanced percentage formatting
 * @param {number} rate - Rate to format (as decimal)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted percentage
 */
export function formatPercentageEnhanced(rate, options = {}) {
  const { decimals = 2, includeSymbol = true } = options;
  const percentage = ((rate || 0) * 100).toFixed(decimals);
  return includeSymbol ? `${percentage}%` : percentage;
}

// ============================================================================
// COMPATIBILITY HELPERS
// ============================================================================

/**
 * Get federal tax brackets (enhanced version)
 * @param {string} filingStatus - Filing status
 * @returns {Array} Tax brackets
 */
export function getFederalBracketsEnhanced(filingStatus) {
  return getTaxDataEnhanced('federalBrackets', filingStatus) || TAX_DATA_2025.federalBrackets.single;
}

/**
 * Get standard deduction (enhanced version)
 * @param {string} filingStatus - Filing status
 * @param {number} taxpayerAge - Taxpayer age
 * @param {number} spouseAge - Spouse age
 * @returns {number} Standard deduction amount
 */
export function getStandardDeductionEnhanced(filingStatus, taxpayerAge = null, spouseAge = null) {
  const normalized = normalizeFilingStatusEnhanced(filingStatus);
  let baseDeduction = getTaxDataEnhanced('standardDeductions', normalized);
  const additionalDeduction = getTaxDataEnhanced('additionalDeductionOver65', normalized);
  
  if (normalized === FILING_STATUS_ENHANCED.MARRIED_FILING_JOINTLY) {
    if (taxpayerAge && taxpayerAge >= 65) baseDeduction += additionalDeduction;
    if (spouseAge && spouseAge >= 65) baseDeduction += additionalDeduction;
  } else {
    if (taxpayerAge && taxpayerAge >= 65) baseDeduction += additionalDeduction;
  }
  
  return baseDeduction;
}

/**
 * Get capital gains brackets (enhanced version)
 * @param {string} filingStatus - Filing status
 * @returns {Array} Capital gains brackets
 */
export function getCapitalGainsBracketsEnhanced(filingStatus) {
  return getTaxDataEnhanced('capitalGainsBrackets', filingStatus) || TAX_DATA_2025.capitalGainsBrackets.single;
}

/**
 * Get NIIT threshold (enhanced version)
 * @param {string} filingStatus - Filing status
 * @returns {number} NIIT threshold
 */
export function getNIITThresholdEnhanced(filingStatus) {
  return getTaxDataEnhanced('niit', filingStatus)?.thresholds || TAX_DATA_2025.niit.thresholds.single;
}

