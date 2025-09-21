// Comprehensive Marginal Rate Analysis
// This calculates accurate distances to next rate changes by testing actual tax calculations

import { calculateComprehensiveTaxes } from './taxCalculations.js';

/**
 * Calculate the true effective marginal rate by testing actual tax calculations
 */
export function calculateTrueEffectiveMarginalRate(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings, testAmount = 1000) {
  // Ensure incomeSources is an array
  if (!Array.isArray(incomeSources)) {
    incomeSources = [];
  }
  // Calculate base tax
  const baseCalc = calculateComprehensiveTaxes(incomeSources, taxpayerAge, spouseAge, filingStatus, null, appSettings);
  
  // Create test scenario with additional income
  const testSources = [...incomeSources];
  
  // Add test income to the first enabled traditional IRA source (or create one)
  let foundTraditionalIRA = false;
  for (let i = 0; i < testSources.length; i++) {
    if (testSources[i].type === 'traditional-ira' && testSources[i].enabled) {
      testSources[i] = {
        ...testSources[i],
        amount: testSources[i].amount + testAmount
      };
      foundTraditionalIRA = true;
      break;
    }
  }
  
  // If no traditional IRA found, add to first enabled source
  if (!foundTraditionalIRA) {
    for (let i = 0; i < testSources.length; i++) {
      if (testSources[i].enabled) {
        testSources[i] = {
          ...testSources[i],
          amount: testSources[i].amount + testAmount
        };
        break;
      }
    }
  }
  
  // Calculate tax with additional income
  const testCalc = calculateComprehensiveTaxes(testSources, taxpayerAge, spouseAge, filingStatus, null, appSettings);
  
  // Calculate effective marginal rate
  const taxIncrease = testCalc.totalTax - baseCalc.totalTax;
  const effectiveMarginalRate = taxIncrease / testAmount;
  
  return {
    effectiveMarginalRate,
    baseTotalTax: baseCalc.totalTax,
    testTotalTax: testCalc.totalTax,
    taxIncrease,
    testAmount
  };
}

/**
 * Find the next tax bracket change (pure bracket math)
 */
export function findNextTaxBracket(federalTaxableIncome, filingStatus) {
  // 2025 tax brackets for MFJ
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
    currentBracket,
    nextBracket,
    amountToNextBracket,
    currentRate: currentBracket.rate,
    nextRate: nextBracket.rate
  };
}

/**
 * Find the next significant rate hike by scanning forward with actual tax calculations
 * and identify the specific cause of the rate increase
 */
export function findNextRateHike(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings) {
  // Ensure incomeSources is an array
  if (!Array.isArray(incomeSources)) {
    incomeSources = [];
  }
  const baseRate = calculateTrueEffectiveMarginalRate(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings);
  const baseCalc = calculateComprehensiveTaxes(incomeSources, taxpayerAge, spouseAge, filingStatus, null, appSettings);
  
  // Scan forward in increments to find the next significant rate increase
  const scanIncrement = 100; // Check every $100 for better precision
  const maxScan = 200000; // Don't scan beyond $200k additional income
  const significantIncrease = 0.005; // 0.5% increase is considered significant
  
  for (let additionalIncome = scanIncrement; additionalIncome <= maxScan; additionalIncome += scanIncrement) {
    // Create test scenario with additional income
    const testSources = [...incomeSources];
    
    // Add income to first enabled traditional IRA or first enabled source
    let foundTraditionalIRA = false;
    for (let i = 0; i < testSources.length; i++) {
      if (testSources[i].type === 'traditional-ira' && testSources[i].enabled) {
        testSources[i] = {
          ...testSources[i],
          amount: testSources[i].amount + additionalIncome
        };
        foundTraditionalIRA = true;
        break;
      }
    }
    
    if (!foundTraditionalIRA) {
      for (let i = 0; i < testSources.length; i++) {
        if (testSources[i].enabled) {
          testSources[i] = {
            ...testSources[i],
            amount: testSources[i].amount + additionalIncome
          };
          break;
        }
      }
    }
    
    // Calculate new rate
    const testRate = calculateTrueEffectiveMarginalRate(testSources, taxpayerAge, spouseAge, filingStatus, appSettings);
    const testCalc = calculateComprehensiveTaxes(testSources, taxpayerAge, spouseAge, filingStatus, null, appSettings);
    
    // Check for significant increase
    if (testRate.effectiveMarginalRate - baseRate.effectiveMarginalRate >= significantIncrease) {
      // Identify the specific cause of the rate hike
      const reason = identifyRateHikeCause(baseCalc, testCalc, additionalIncome, filingStatus, taxpayerAge, spouseAge);
      
      return {
        amountToNextRateHike: additionalIncome,
        currentRate: baseRate.effectiveMarginalRate,
        nextRate: testRate.effectiveMarginalRate,
        reason: reason,
        rateIncrease: testRate.effectiveMarginalRate - baseRate.effectiveMarginalRate
      };
    }
  }
  
  // If no significant rate hike found, return the next tax bracket
  const bracketInfo = findNextTaxBracket(baseCalc.federalTaxableIncome, filingStatus);
  return {
    amountToNextRateHike: bracketInfo.amountToNextBracket,
    currentRate: baseRate.effectiveMarginalRate,
    nextRate: bracketInfo.nextRate,
    reason: `Tax Bracket (${(bracketInfo.currentRate * 100).toFixed(0)}% → ${(bracketInfo.nextRate * 100).toFixed(0)}%)`,
    rateIncrease: bracketInfo.nextRate - bracketInfo.currentRate
  };
}

/**
 * Identify the specific cause of a rate hike by comparing calculations
 */
function identifyRateHikeCause(baseCalc, testCalc, additionalIncome, filingStatus, taxpayerAge, spouseAge) {
  const reasons = [];
  
  // Check for tax bracket change
  if (testCalc.federalMarginalRate !== baseCalc.federalMarginalRate) {
    reasons.push(`Tax Bracket (${(baseCalc.federalMarginalRate * 100).toFixed(0)}% → ${(testCalc.federalMarginalRate * 100).toFixed(0)}%)`);
  }
  
  // Check for Social Security taxation changes
  const baseSSTax = baseCalc.socialSecurityTax || 0;
  const testSSTax = testCalc.socialSecurityTax || 0;
  if (testSSTax > baseSSTax) {
    // Determine if it's 50% or 85% threshold
    const ssIncrease = testSSTax - baseSSTax;
    const incomeIncrease = additionalIncome;
    const ssRate = ssIncrease / incomeIncrease;
    
    if (ssRate >= 0.08 && ssRate <= 0.12) {
      reasons.push('Social Security (50% Taxable)');
    } else if (ssRate >= 0.15 && ssRate <= 0.20) {
      reasons.push('Social Security (85% Taxable)');
    } else {
      reasons.push('Social Security Effect');
    }
  }
  
  // Check for IRMAA changes
  const baseIRMAA = (baseCalc.irmaaPartB || 0) + (baseCalc.irmaaPartD || 0);
  const testIRMAA = (testCalc.irmaaPartB || 0) + (testCalc.irmaaPartD || 0);
  if (testIRMAA > baseIRMAA) {
    // Determine IRMAA tier based on income levels
    const magi = testCalc.federalAGI;
    if (filingStatus === 'marriedFilingJointly') {
      if (magi >= 212000 && magi < 266000) reasons.push('IRMAA Tier 1');
      else if (magi >= 266000 && magi < 334000) reasons.push('IRMAA Tier 2');
      else if (magi >= 334000 && magi < 400000) reasons.push('IRMAA Tier 3');
      else if (magi >= 400000 && magi < 500000) reasons.push('IRMAA Tier 4');
      else if (magi >= 500000) reasons.push('IRMAA Tier 5');
      else reasons.push('IRMAA Effect');
    } else {
      if (magi >= 106000 && magi < 133000) reasons.push('IRMAA Tier 1');
      else if (magi >= 133000 && magi < 167000) reasons.push('IRMAA Tier 2');
      else if (magi >= 167000 && magi < 200000) reasons.push('IRMAA Tier 3');
      else if (magi >= 200000 && magi < 500000) reasons.push('IRMAA Tier 4');
      else if (magi >= 500000) reasons.push('IRMAA Tier 5');
      else reasons.push('IRMAA Effect');
    }
  }
  
  // Check for OBBB (Senior Deduction) phase-out
  const baseDeduction = baseCalc.standardDeduction || 0;
  const testDeduction = testCalc.standardDeduction || 0;
  if (testDeduction < baseDeduction && (taxpayerAge >= 65 || spouseAge >= 65)) {
    reasons.push('OBBB Phase-Out');
  }
  
  // Return the most specific reason or combine multiple reasons
  if (reasons.length === 0) {
    return 'Tax Map Effect';
  } else if (reasons.length === 1) {
    return reasons[0];
  } else {
    return reasons.join(' + ');
  }
}

/**
 * Narrow down the exact point where the rate hike occurs
 */
function narrowDownRateHike(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings, minIncome, maxIncome, baseRate) {
  const precision = 100; // Narrow down to $100 precision
  
  while (maxIncome - minIncome > precision) {
    const midIncome = Math.floor((minIncome + maxIncome) / 2);
    
    // Create test scenario
    const testSources = [...incomeSources];
    let foundTraditionalIRA = false;
    for (let i = 0; i < testSources.length; i++) {
      if (testSources[i].type === 'traditional-ira' && testSources[i].enabled) {
        testSources[i] = {
          ...testSources[i],
          amount: testSources[i].amount + midIncome
        };
        foundTraditionalIRA = true;
        break;
      }
    }
    
    if (!foundTraditionalIRA) {
      for (let i = 0; i < testSources.length; i++) {
        if (testSources[i].enabled) {
          testSources[i] = {
            ...testSources[i],
            amount: testSources[i].amount + midIncome
          };
          break;
        }
      }
    }
    
    const testRate = calculateTrueEffectiveMarginalRate(testSources, taxpayerAge, spouseAge, filingStatus, appSettings);
    
    if (testRate.effectiveMarginalRate > baseRate + 0.01) {
      maxIncome = midIncome;
    } else {
      minIncome = midIncome;
    }
  }
  
  // Calculate the rate at the hike point
  const testSources = [...incomeSources];
  let foundTraditionalIRA = false;
  for (let i = 0; i < testSources.length; i++) {
    if (testSources[i].type === 'traditional-ira' && testSources[i].enabled) {
      testSources[i] = {
        ...testSources[i],
        amount: testSources[i].amount + maxIncome
      };
      foundTraditionalIRA = true;
      break;
    }
  }
  
  if (!foundTraditionalIRA) {
    for (let i = 0; i < testSources.length; i++) {
      if (testSources[i].enabled) {
        testSources[i] = {
          ...testSources[i],
          amount: testSources[i].amount + maxIncome
        };
        break;
      }
    }
  }
  
  const hikeRate = calculateTrueEffectiveMarginalRate(testSources, taxpayerAge, spouseAge, filingStatus, appSettings);
  
  return {
    amountToNextRateHike: maxIncome,
    nextMarginalRate: hikeRate.effectiveMarginalRate,
    currentMarginalRate: baseRate,
    rateHikeSource: 'detected_spike'
  };
}

/**
 * Get comprehensive analysis with both bracket and rate hike calculations
 */
export function getComprehensiveMarginalAnalysis(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings) {
  // Ensure incomeSources is an array
  if (!Array.isArray(incomeSources)) {
    incomeSources = [];
  }
  const baseCalc = calculateComprehensiveTaxes(incomeSources, taxpayerAge, spouseAge, filingStatus, null, appSettings);
  
  // Get pure tax bracket info
  const bracketInfo = findNextTaxBracket(baseCalc.federalTaxableIncome, filingStatus);
  
  // Get comprehensive rate hike info
  const rateHikeInfo = findNextRateHike(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings);
  
  // Get current effective marginal rate
  const currentEffectiveRate = calculateTrueEffectiveMarginalRate(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings);
  
  return {
    // Current rates
    currentMarginalRate: currentEffectiveRate.effectiveMarginalRate,
    currentBracketRate: bracketInfo.currentRate,
    
    // Tax bracket analysis
    amountToNextBracket: bracketInfo.amountToNextBracket,
    nextBracketRate: bracketInfo.nextRate,
    
    // Comprehensive rate hike analysis
    amountToNextRateHike: rateHikeInfo.amountToNextRateHike,
    nextEffectiveMarginalRate: rateHikeInfo.nextMarginalRate,
    rateHikeSource: rateHikeInfo.rateHikeSource
  };
}

