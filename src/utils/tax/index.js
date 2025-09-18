/**
 * Tax Module Index
 * 
 * This module provides a clean interface for importing all tax-related
 * functionality from the consolidated tax calculation system.
 */

// Export all constants
export * from './taxConstants.js';

// Export all calculation functions
export * from './taxEngine.js';

// Re-export commonly used functions with cleaner names
export {
  calculateComprehensiveTaxes as calculateTaxes,
  formatCurrency,
  formatPercentage
} from './taxEngine.js';

export {
  normalizeFilingStatus,
  getTaxBrackets,
  getStandardDeduction,
  getCapitalGainsBrackets,
  getNIITThreshold,
  getSSThresholds,
  getAdditionalMedicareThreshold,
  FILING_STATUS
} from './taxConstants.js';

