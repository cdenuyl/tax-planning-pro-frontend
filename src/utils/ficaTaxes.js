// FICA (Social Security and Medicare) Tax Calculations
// Refactored to use consolidated tax constants

import {
  FICA_RATES_2025,
  FICA_LIMITS_2025,
  getAdditionalMedicareThreshold,
  calculateFICATaxes as calculateFICATaxesEngine
} from './tax/index.js';

// Re-export constants for backward compatibility
export { FICA_RATES_2025, FICA_LIMITS_2025 };

// Calculate FICA taxes on earned income - refactored to use consolidated engine
export function calculateFICATaxes(earnedIncome, filingStatus = 'single') {
  try {
    // Use the consolidated tax engine
    const result = calculateFICATaxesEngine(earnedIncome, filingStatus);
    
    // Return result in expected format (already matches)
    return result;
  } catch (error) {
    console.error('Error in calculateFICATaxes:', error);
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
}

// Get earned income from income sources
export function getEarnedIncome(incomeSources) {
  const earnedIncomeTypes = ['wages', 'self-employment', 'business'];
  
  return incomeSources
    .filter(source => source.enabled && earnedIncomeTypes.includes(source.type))
    .reduce((sum, source) => {
      // Handle frequency conversion
      const yearlyAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
      return sum + yearlyAmount;
    }, 0);
}

// Format FICA tax breakdown for display
export function formatFICABreakdown(ficaTaxes) {
  const { breakdown } = ficaTaxes;
  
  return {
    summary: `Total FICA: $${ficaTaxes.totalFICA.toLocaleString()}`,
    details: [
      `Social Security: $${ficaTaxes.socialSecurityTax.toLocaleString()} (${(breakdown.socialSecurityRate * 100).toFixed(1)}% on $${breakdown.socialSecurityTaxableWages.toLocaleString()})`,
      `Medicare: $${ficaTaxes.medicareTax.toLocaleString()} (${(breakdown.medicareRate * 100).toFixed(2)}% on $${breakdown.medicareTaxableWages.toLocaleString()})`,
      ...(ficaTaxes.additionalMedicareTax > 0 ? [
        `Additional Medicare: $${ficaTaxes.additionalMedicareTax.toLocaleString()} (${(breakdown.additionalMedicareRate * 100).toFixed(1)}% on wages over $${breakdown.additionalMedicareThreshold.toLocaleString()})`
      ] : [])
    ]
  };
}

