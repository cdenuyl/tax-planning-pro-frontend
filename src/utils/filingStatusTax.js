// Calculate federal tax using filing status specific brackets
export function calculateFederalTaxByFilingStatus(taxableIncome, filingStatus) {
  const brackets = FEDERAL_TAX_BRACKETS_2025[filingStatus];
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    tax += taxableAtThisBracket * bracket.rate;
    remainingIncome -= taxableAtThisBracket;
  }
  
  return tax;
}

// Get current marginal rate based on filing status
export function getCurrentMarginalRateByFilingStatus(taxableIncome, filingStatus) {
  if (taxableIncome <= 0) return 0;
  
  const brackets = FEDERAL_TAX_BRACKETS_2025[filingStatus];
  
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
      return bracket.rate;
    }
  }
  
  // If no bracket matches, return the highest rate
  return brackets[brackets.length - 1].rate;
}

