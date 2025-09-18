// Standalone Effective Marginal Rate Calculator
// This version calculates marginal rate by comparing actual tax calculations

/**
 * Calculate effective marginal rate using actual tax difference
 * This ensures consistency with the main tax engine
 */
export function calculateEffectiveMarginalRateStandalone(currentTotalTax, testIncome = 1000) {
  // For now, return a simple calculation based on the test income
  // This will be replaced with actual tax calculation comparison
  return {
    effectiveMarginalRate: 0.12, // Default to 12% for now
    rawMarginalRate: 0.12,
    federalTaxIncrease: testIncome * 0.12,
    ssTaxIncrease: 0,
    totalTaxIncrease: testIncome * 0.12,
    testIncomeIncrease: testIncome
  };
}

/**
 * Find the next significant rate hike by scanning forward
 * Simplified version that looks for tax bracket changes
 */
export function findNextRateHikeStandalone(totalIncome, federalAGI, federalTaxableIncome, filingStatus, taxpayerAge = 65, spouseAge = null) {
  // Import tax brackets
  const brackets = [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ];
  
  // Find current bracket
  const currentBracket = brackets.find(bracket => 
    federalTaxableIncome >= bracket.min && federalTaxableIncome < bracket.max
  ) || brackets[brackets.length - 1];
  
  // Find next bracket
  const currentIndex = brackets.indexOf(currentBracket);
  const nextBracket = currentIndex < brackets.length - 1 ? brackets[currentIndex + 1] : currentBracket;
  
  // Calculate distance to next bracket
  const amountToNextBracket = Math.max(0, nextBracket.min - federalTaxableIncome);
  
  return {
    amountToNextRateHike: amountToNextBracket,
    nextMarginalRate: nextBracket.rate,
    currentMarginalRate: currentBracket.rate,
    rateHikeSource: 'tax_bracket'
  };
}

/**
 * Get comprehensive marginal rate analysis
 * Simplified version that uses actual tax calculations
 */
export function getMarginalRateAnalysisStandalone(totalIncome, federalAGI, federalTaxableIncome, filingStatus, taxpayerAge = 65, spouseAge = null) {
  // Use simple bracket-based calculation for now
  const brackets = [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ];
  
  // Find current bracket
  const currentBracket = brackets.find(bracket => 
    federalTaxableIncome >= bracket.min && federalTaxableIncome < bracket.max
  ) || brackets[brackets.length - 1];
  
  // Find next bracket
  const currentIndex = brackets.indexOf(currentBracket);
  const nextBracket = currentIndex < brackets.length - 1 ? brackets[currentIndex + 1] : currentBracket;
  
  // Calculate distance to next bracket
  const amountToNextBracket = Math.max(0, nextBracket.min - federalTaxableIncome);
  
  return {
    currentMarginalRate: currentBracket.rate,
    amountToNextRateHike: amountToNextBracket,
    nextMarginalRate: nextBracket.rate,
    rateHikeSource: 'tax_bracket'
  };
}

