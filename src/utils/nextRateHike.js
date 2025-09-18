import { calculateComprehensiveTaxes, getCurrentMarginalRate, MICHIGAN_TAX_RATE } from './taxCalculations.js';
import { getSocialSecurityThresholds, getIrmaaThresholds } from './irmaaThresholds.js';

// Tax bracket thresholds for 2024 (single filer)
const TAX_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 }
];

const TAX_BRACKETS_MFJ = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 }
];

// Function to find the next several rate changes using direct threshold calculations
export function findNextRateChanges(incomeSources, currentAge = 65, filingStatus = 'single', maxChanges = 4) {
  const currentCalculations = calculateComprehensiveTaxes(incomeSources, currentAge, null, filingStatus);
  const currentTotalIncome = currentCalculations.totalIncome;
  
  // Use FEDERAL-ONLY effective rate to ignore state tax variations
  const currentEffectiveRate = currentCalculations.federalTax / currentTotalIncome;
  
  // Get all potential thresholds
  const allThresholds = getAllThresholds(currentCalculations, filingStatus, currentAge, incomeSources);
  
  // Filter to thresholds above current income and sort by distance
  const upcomingThresholds = allThresholds
    .filter(threshold => threshold.incomeLevel > currentTotalIncome)
    .sort((a, b) => a.incomeLevel - b.incomeLevel)
    .slice(0, maxChanges);
  
  // Calculate rate changes for each threshold using FEDERAL-ONLY rates
  const rateChanges = upcomingThresholds.map(threshold => {
    // Calculate what the FEDERAL rate would be at this threshold
    const testSources = scaleIncomeSources(incomeSources, threshold.incomeLevel);
    const testCalculations = calculateComprehensiveTaxes(testSources, currentAge, null, filingStatus);
    const testEffectiveRate = testCalculations.federalTax / testCalculations.totalIncome;
    
    return {
      amountToChange: threshold.incomeLevel - currentTotalIncome,
      fromRate: currentEffectiveRate,
      toRate: testEffectiveRate,
      cause: threshold.cause,
      thresholdIncome: threshold.incomeLevel,
      changeType: testEffectiveRate > currentEffectiveRate ? 'increase' : 'decrease',
      thresholdType: threshold.type
    };
  });
  
  return {
    currentRate: currentEffectiveRate,
    rateChanges: rateChanges
  };
}

// Get all potential thresholds that could cause rate changes
function getAllThresholds(currentCalc, filingStatus, currentAge, incomeSources) {
  const thresholds = [];
  const currentTotalIncome = currentCalc.totalIncome;
  const standardDeduction = filingStatus === 'single' ? 14600 : 29200; // 2024 values
  
  // 1. Tax bracket thresholds (based on taxable income)
  const brackets = filingStatus === 'single' ? TAX_BRACKETS_SINGLE : TAX_BRACKETS_MFJ;
  const currentTaxableIncome = currentCalc.federalTaxableIncome || 0;
  
  for (let i = 0; i < brackets.length - 1; i++) {
    const bracket = brackets[i];
    const nextBracket = brackets[i + 1];
    
    // Calculate total income needed to reach next bracket
    // Account for Social Security cascade effects
    const adjustmentFactor = currentTotalIncome - currentTaxableIncome;
    let totalIncomeForNextBracket = bracket.max + adjustmentFactor;
    
    // Adjust for Social Security cascade effect
    if (currentCalc.socialSecurity?.taxableSocialSecurity > 0) {
      // Additional income will increase SS taxation, so we need less total income to reach the bracket
      const ssAdjustment = (bracket.max - currentTaxableIncome) * 0.15; // Approximate SS cascade effect
      totalIncomeForNextBracket -= ssAdjustment;
    }
    
    if (totalIncomeForNextBracket > currentTotalIncome) {
      thresholds.push({
        incomeLevel: totalIncomeForNextBracket,
        type: 'tax_bracket',
        cause: `Federal bracket increases (${(bracket.rate * 100).toFixed(0)}% → ${(nextBracket.rate * 100).toFixed(0)}%)`,
        priority: 1
      });
    }
  }
  
  // 2. Social Security thresholds (based on provisional income)
  const ssThresholds = getSocialSecurityThresholds(filingStatus);
  const currentProvisionalIncome = currentCalc.socialSecurity?.provisionalIncome || 0;
  
  // Calculate income adjustment factor for provisional income
  const provisionalAdjustment = currentTotalIncome - currentProvisionalIncome;
  
  if (currentProvisionalIncome < ssThresholds.tier1) {
    const totalIncomeForSSTier1 = ssThresholds.tier1 + provisionalAdjustment;
    if (totalIncomeForSSTier1 > currentTotalIncome) {
      thresholds.push({
        incomeLevel: totalIncomeForSSTier1,
        type: 'social_security',
        cause: `Social Security 50% taxation begins ($${ssThresholds.tier1.toLocaleString()} threshold)`,
        priority: 2
      });
    }
  }
  
  if (currentProvisionalIncome < ssThresholds.tier2) {
    const totalIncomeForSSTier2 = ssThresholds.tier2 + provisionalAdjustment;
    if (totalIncomeForSSTier2 > currentTotalIncome) {
      thresholds.push({
        incomeLevel: totalIncomeForSSTier2,
        type: 'social_security',
        cause: `Social Security 85% taxation begins ($${ssThresholds.tier2.toLocaleString()} threshold)`,
        priority: 2
      });
    }
  }
  
  // 3. Social Security effect tapering (rate decreases)
  // This happens when SS effects become a smaller percentage of total income
  if (currentCalc.socialSecurity?.taxableSocialSecurity > 0) {
    // Test a wider range of income levels to find actual rate decreases
    const currentEffectiveRate = currentCalc.federalTax / currentTotalIncome;
    
    // Test income levels from 1.5x to 3x current income
    for (let multiplier = 1.5; multiplier <= 3.0; multiplier += 0.1) {
      const testIncomeLevel = Math.round(currentTotalIncome * multiplier);
      
      // Scale income sources proportionally
      const testSources = incomeSources.map(source => {
        if (!source.enabled) return source;
        const scaleFactor = testIncomeLevel / currentTotalIncome;
        return { ...source, amount: source.amount * scaleFactor };
      });
      
      const testCalc = calculateComprehensiveTaxes(testSources, currentAge, null, filingStatus);
      const testEffectiveRate = testCalc.federalTax / testCalc.totalIncome;
      
      // Look for a significant rate decrease (at least 0.5%)
      if (testEffectiveRate < currentEffectiveRate - 0.005) {
        const rateDecrease = (currentEffectiveRate - testEffectiveRate) * 100;
        thresholds.push({
          incomeLevel: testIncomeLevel,
          type: 'ss_tapering',
          cause: `Social Security effect tapering (${rateDecrease.toFixed(2)}% rate decrease)`,
          priority: 4
        });
        break; // Only add the first significant decrease found
      }
    }
    
    // Also check for specific income levels where SS effects might taper
    // When income gets high enough, SS becomes a smaller portion of total tax burden
    const highIncomeTest = currentTotalIncome * 2.5; // Test at 2.5x current income
    const highIncomeSources = incomeSources.map(source => {
      if (!source.enabled) return source;
      const scaleFactor = highIncomeTest / currentTotalIncome;
      return { ...source, amount: source.amount * scaleFactor };
    });
    
    const highIncomeCalc = calculateComprehensiveTaxes(highIncomeSources, currentAge, null, filingStatus);
    const highIncomeEffectiveRate = highIncomeCalc.federalTax / highIncomeCalc.totalIncome;
    
    // If rate is lower at high income, add as a tapering threshold
    if (highIncomeEffectiveRate < currentEffectiveRate - 0.003) {
      const rateDecrease = (currentEffectiveRate - highIncomeEffectiveRate) * 100;
      thresholds.push({
        incomeLevel: highIncomeTest,
        type: 'ss_tapering',
        cause: `Social Security effect diminishes (${rateDecrease.toFixed(2)}% rate decrease at higher income)`,
        priority: 5
      });
    }
  }
  
  // 4. IRMAA thresholds (based on total income/MAGI)
  const irmaaThresholds = getIrmaaThresholds(filingStatus);
  for (let i = 0; i < irmaaThresholds.length; i++) {
    const threshold = irmaaThresholds[i];
    if (threshold.min > 0 && currentTotalIncome < threshold.min) {
      const monthlyIncrease = threshold.partB + threshold.partD;
      thresholds.push({
        incomeLevel: threshold.min,
        type: 'irmaa',
        cause: `IRMAA Tier ${i} begins (+$${monthlyIncrease.toFixed(0)}/month)`,
        priority: 3
      });
    }
  }
  
  // 5. Standard deduction exhaustion (when federal tax begins)
  if (currentCalc.federalTax === 0) {
    // Calculate income needed to exhaust standard deduction
    const incomeToExhaustDeduction = standardDeduction + (currentTotalIncome - (currentCalc.federalAGI || currentTotalIncome));
    if (incomeToExhaustDeduction > currentTotalIncome) {
      thresholds.push({
        incomeLevel: incomeToExhaustDeduction,
        type: 'deduction_exhaustion',
        cause: 'Federal taxation begins (0% → 10%)',
        priority: 1
      });
    }
  }
  
  return thresholds;
}

// Scale income sources proportionally to reach target income
function scaleIncomeSources(incomeSources, targetIncome) {
  const currentTotal = incomeSources.reduce((sum, source) => 
    sum + (source.enabled ? source.amount : 0), 0);
  
  if (currentTotal === 0) return incomeSources;
  
  const scaleFactor = targetIncome / currentTotal;
  
  return incomeSources.map(source => ({
    ...source,
    amount: source.enabled ? source.amount * scaleFactor : source.amount
  }));
}

// Legacy function for backward compatibility
export function findNextRateHike(incomeSources, currentAge = 65, filingStatus = 'single') {
  const result = findNextRateChanges(incomeSources, currentAge, filingStatus, 1);
  
  if (result.rateChanges.length > 0) {
    const firstChange = result.rateChanges[0];
    return {
      amountToHike: firstChange.amountToChange,
      currentRate: result.currentRate,
      newRate: firstChange.toRate,
      cause: firstChange.cause,
      thresholdIncome: firstChange.thresholdIncome
    };
  }
  
  return {
    amountToHike: null,
    currentRate: result.currentRate,
    newRate: null,
    cause: 'No rate changes found within range',
    thresholdIncome: null
  };
}

