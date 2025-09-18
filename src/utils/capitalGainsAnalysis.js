// Enhanced capital gains analysis functions for Tax Bracket Analysis
import { LONG_TERM_CAPITAL_GAINS_BRACKETS_2025, NIIT_THRESHOLDS_2025, calculateLongTermCapitalGainsTax, calculateQualifiedDividendsTax } from './capitalGainsTax.js';

// Get comprehensive capital gains information for display
export function getCapitalGainsAnalysis(incomeSources, ordinaryIncome, filingStatus) {
  const getYearlyAmount = (source) => {
    return source.frequency === 'monthly' ? source.amount * 12 : source.amount;
  };

  // Calculate total capital gains by type
  const longTermGains = incomeSources
    .filter(source => source.enabled && source.type === 'long-term-capital-gains')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
    
  const shortTermGains = incomeSources
    .filter(source => source.enabled && source.type === 'short-term-capital-gains')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);

  const qualifiedDividends = incomeSources
    .filter(source => source.enabled && source.type === 'qualified-dividends')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);

  // Get brackets for this filing status
  const ltcgBrackets = LONG_TERM_CAPITAL_GAINS_BRACKETS_2025[filingStatus] || LONG_TERM_CAPITAL_GAINS_BRACKETS_2025.single;
  
  // Calculate current rates and positions
  const totalIncome = ordinaryIncome + longTermGains + shortTermGains + qualifiedDividends;
  
  // Find current long-term capital gains bracket
  const currentLTCGBracket = ltcgBrackets.find(bracket => 
    totalIncome > bracket.min && totalIncome <= bracket.max
  ) || ltcgBrackets[ltcgBrackets.length - 1];
  
  // Find next bracket
  const currentBracketIndex = ltcgBrackets.indexOf(currentLTCGBracket);
  const nextLTCGBracket = currentBracketIndex < ltcgBrackets.length - 1 ? 
    ltcgBrackets[currentBracketIndex + 1] : null;
  
  // Calculate tax amounts at current rates
  const longTermTax = calculateLongTermCapitalGainsTax(longTermGains, ordinaryIncome, filingStatus);
  const qualifiedDividendsTax = calculateQualifiedDividendsTax(qualifiedDividends, ordinaryIncome, filingStatus);
  
  // Calculate distance to next bracket
  const distanceToNextBracket = nextLTCGBracket ? 
    nextLTCGBracket.min - totalIncome : null;

  return {
    // Current amounts
    longTermGains,
    shortTermGains,
    qualifiedDividends,
    totalCapitalGains: longTermGains + shortTermGains + qualifiedDividends,
    
    // Current rates
    currentLTCGRate: currentLTCGBracket.rate,
    currentLTCGRatePercent: `${(currentLTCGBracket.rate * 100).toFixed(0)}%`,
    shortTermRate: 'Ordinary Income Rates', // Short-term gains taxed as ordinary income
    
    // Tax amounts at current rates
    longTermTaxAmount: longTermTax.tax,
    qualifiedDividendsTaxAmount: qualifiedDividendsTax.tax,
    longTermEffectiveRate: longTermTax.effectiveRate,
    qualifiedDividendsEffectiveRate: qualifiedDividendsTax.effectiveRate,
    
    // Next bracket information
    nextLTCGRate: nextLTCGBracket ? nextLTCGBracket.rate : null,
    nextLTCGRatePercent: nextLTCGBracket ? `${(nextLTCGBracket.rate * 100).toFixed(0)}%` : null,
    distanceToNextBracket: distanceToNextBracket,
    
    // NIIT information
    niitApplies: longTermTax.niitApplies || qualifiedDividendsTax.niitApplies,
    niitTax: (longTermTax.niitTax || 0) + (qualifiedDividendsTax.niitTax || 0),
    niitThreshold: NIIT_THRESHOLDS_2025[filingStatus] || NIIT_THRESHOLDS_2025.single,
    
    // Detailed breakdown
    breakdown: {
      totalIncome,
      ordinaryIncome,
      currentBracket: currentLTCGBracket,
      nextBracket: nextLTCGBracket,
      longTermDetails: longTermTax,
      qualifiedDividendsDetails: qualifiedDividendsTax
    }
  };
}

// Format currency for display
export function formatCapitalGainsCurrency(amount) {
  if (amount === 0) return '$0';
  if (amount < 1000) return `$${Math.round(amount)}`;
  if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${(amount / 1000000).toFixed(1)}M`;
}

// Format percentage for display
export function formatCapitalGainsPercentage(rate) {
  return `${(rate * 100).toFixed(1)}%`;
}

