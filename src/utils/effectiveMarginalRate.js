// Effective Marginal Rate System - Covisum Style
// This calculates the true marginal rate including all tax effects

import { calculateComprehensiveTaxes } from './taxCalculations.js';

/**
 * Calculate the effective marginal rate at a specific income level
 * This includes all effects: tax brackets, SS taxation, OBBB phase-out, IRMAA, etc.
 */
export function calculateEffectiveMarginalRate(incomeSources, taxpayerAge, spouseAge, filingStatus, settings = null, testIncomeIncrease = 1000) {
  // Calculate tax at current income level
  const currentCalc = calculateComprehensiveTaxes(incomeSources, taxpayerAge, spouseAge, filingStatus, null, settings);
  
  // Create a copy of income sources with additional income
  const adjustedSources = [...incomeSources];
  
  // Add test income to the first enabled traditional IRA source (or create one)
  let foundTraditionalIRA = false;
  for (let i = 0; i < adjustedSources.length; i++) {
    if (adjustedSources[i].type === 'traditional-ira' && adjustedSources[i].enabled) {
      adjustedSources[i] = {
        ...adjustedSources[i],
        amount: adjustedSources[i].amount + testIncomeIncrease
      };
      foundTraditionalIRA = true;
      break;
    }
  }
  
  // If no traditional IRA found, add income to first enabled source
  if (!foundTraditionalIRA) {
    for (let i = 0; i < adjustedSources.length; i++) {
      if (adjustedSources[i].enabled) {
        adjustedSources[i] = {
          ...adjustedSources[i],
          amount: adjustedSources[i].amount + testIncomeIncrease
        };
        break;
      }
    }
  }
  
  // Calculate tax with increased income
  const increasedCalc = calculateComprehensiveTaxes(adjustedSources, taxpayerAge, spouseAge, filingStatus, null, settings);
  
  // Calculate effective marginal rate
  const taxIncrease = increasedCalc.totalTax - currentCalc.totalTax;
  const effectiveMarginalRate = taxIncrease / testIncomeIncrease;
  
  return {
    effectiveMarginalRate,
    currentTotalTax: currentCalc.totalTax,
    increasedTotalTax: increasedCalc.totalTax,
    taxIncrease,
    testIncomeIncrease
  };
}

/**
 * Find the next significant rate hike by scanning forward
 * Returns the income amount needed to reach the next spike in effective marginal rate
 */
export function findNextRateHike(incomeSources, taxpayerAge, spouseAge, filingStatus, settings = null) {
  const currentRate = calculateEffectiveMarginalRate(incomeSources, taxpayerAge, spouseAge, filingStatus, settings);
  const baseRate = currentRate.effectiveMarginalRate;
  
  // Scan forward in increments to find the next significant rate increase
  const scanIncrement = 500; // Check every $500
  const maxScan = 200000; // Don't scan beyond $200k additional income
  const significantIncrease = 0.01; // 1% increase is considered significant
  
  for (let additionalIncome = scanIncrement; additionalIncome <= maxScan; additionalIncome += scanIncrement) {
    // Create adjusted sources with additional income
    const adjustedSources = [...incomeSources];
    
    // Add income to first enabled traditional IRA or first enabled source
    let foundTraditionalIRA = false;
    for (let i = 0; i < adjustedSources.length; i++) {
      if (adjustedSources[i].type === 'traditional-ira' && adjustedSources[i].enabled) {
        adjustedSources[i] = {
          ...adjustedSources[i],
          amount: adjustedSources[i].amount + additionalIncome
        };
        foundTraditionalIRA = true;
        break;
      }
    }
    
    if (!foundTraditionalIRA) {
      for (let i = 0; i < adjustedSources.length; i++) {
        if (adjustedSources[i].enabled) {
          adjustedSources[i] = {
            ...adjustedSources[i],
            amount: adjustedSources[i].amount + additionalIncome
          };
          break;
        }
      }
    }
    
    // Calculate effective rate at this income level
    const testRate = calculateEffectiveMarginalRate(adjustedSources, taxpayerAge, spouseAge, filingStatus, settings);
    
    // Check if we found a significant increase
    if (testRate.effectiveMarginalRate > baseRate + significantIncrease) {
      // Found a rate hike! Now narrow down the exact point
      return narrowDownRateHike(incomeSources, taxpayerAge, spouseAge, filingStatus, settings, additionalIncome - scanIncrement, additionalIncome, baseRate);
    }
  }
  
  // If no significant rate hike found, return distance to next tax bracket
  const currentCalc = calculateComprehensiveTaxes(incomeSources, taxpayerAge, spouseAge, filingStatus, null, settings);
  return {
    amountToNextRateHike: currentCalc.amountToNextBracket || 0,
    nextMarginalRate: currentCalc.nextBracket ? currentCalc.nextBracket.rate : baseRate,
    currentMarginalRate: baseRate,
    rateHikeSource: 'tax_bracket'
  };
}

/**
 * Narrow down the exact point where the rate hike occurs
 */
function narrowDownRateHike(incomeSources, taxpayerAge, spouseAge, filingStatus, settings, minIncome, maxIncome, baseRate) {
  const precision = 100; // Narrow down to $100 precision
  
  while (maxIncome - minIncome > precision) {
    const midIncome = Math.floor((minIncome + maxIncome) / 2);
    
    // Create adjusted sources
    const adjustedSources = [...incomeSources];
    let foundTraditionalIRA = false;
    for (let i = 0; i < adjustedSources.length; i++) {
      if (adjustedSources[i].type === 'traditional-ira' && adjustedSources[i].enabled) {
        adjustedSources[i] = {
          ...adjustedSources[i],
          amount: adjustedSources[i].amount + midIncome
        };
        foundTraditionalIRA = true;
        break;
      }
    }
    
    if (!foundTraditionalIRA) {
      for (let i = 0; i < adjustedSources.length; i++) {
        if (adjustedSources[i].enabled) {
          adjustedSources[i] = {
            ...adjustedSources[i],
            amount: adjustedSources[i].amount + midIncome
          };
          break;
        }
      }
    }
    
    const testRate = calculateEffectiveMarginalRate(adjustedSources, taxpayerAge, spouseAge, filingStatus, settings);
    
    if (testRate.effectiveMarginalRate > baseRate + 0.01) {
      maxIncome = midIncome;
    } else {
      minIncome = midIncome;
    }
  }
  
  // Calculate the rate at the hike point
  const adjustedSources = [...incomeSources];
  let foundTraditionalIRA = false;
  for (let i = 0; i < adjustedSources.length; i++) {
    if (adjustedSources[i].type === 'traditional-ira' && adjustedSources[i].enabled) {
      adjustedSources[i] = {
        ...adjustedSources[i],
        amount: adjustedSources[i].amount + maxIncome
      };
      foundTraditionalIRA = true;
      break;
    }
  }
  
  if (!foundTraditionalIRA) {
    for (let i = 0; i < adjustedSources.length; i++) {
      if (adjustedSources[i].enabled) {
        adjustedSources[i] = {
          ...adjustedSources[i],
          amount: adjustedSources[i].amount + maxIncome
        };
        break;
      }
    }
  }
  
  const hikeRate = calculateEffectiveMarginalRate(adjustedSources, taxpayerAge, spouseAge, filingStatus, settings);
  
  return {
    amountToNextRateHike: maxIncome,
    nextMarginalRate: hikeRate.effectiveMarginalRate,
    currentMarginalRate: baseRate,
    rateHikeSource: 'detected_spike'
  };
}

/**
 * Get comprehensive marginal rate analysis for UI display
 */
export function getMarginalRateAnalysis(incomeSources, taxpayerAge, spouseAge, filingStatus, settings = null) {
  const currentRate = calculateEffectiveMarginalRate(incomeSources, taxpayerAge, spouseAge, filingStatus, settings);
  const nextHike = findNextRateHike(incomeSources, taxpayerAge, spouseAge, filingStatus, settings);
  
  return {
    currentMarginalRate: currentRate.effectiveMarginalRate,
    amountToNextRateHike: nextHike.amountToNextRateHike,
    nextMarginalRate: nextHike.nextMarginalRate,
    rateHikeSource: nextHike.rateHikeSource
  };
}

