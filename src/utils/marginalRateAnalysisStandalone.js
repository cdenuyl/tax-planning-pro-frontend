/**
 * Standalone Marginal Rate Analysis
 * Provides comprehensive marginal rate calculations without circular dependencies
 */

import { FEDERAL_TAX_BRACKETS_2025, STANDARD_DEDUCTIONS_2025 } from './taxCalculations.js';
import { getIrmaaThresholds, getSocialSecurityThresholds } from './irmaaThresholds.js';
import { calculateFICATaxes } from './ficaTaxes.js';

/**
 * Calculate federal tax for a given taxable income
 */
function calculateFederalTaxStandalone(taxableIncome, filingStatus) {
  const brackets = FEDERAL_TAX_BRACKETS_2025[filingStatus] || FEDERAL_TAX_BRACKETS_2025.single;
  let tax = 0;
  
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    
    const taxableInThisBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInThisBracket * bracket.rate;
  }
  
  return tax;
}

/**
 * Calculate Social Security taxation standalone
 */
function calculateSocialSecurityTaxationStandalone(socialSecurityBenefits, otherIncome, filingStatus) {
  if (socialSecurityBenefits === 0) {
    return {
      taxableSocialSecurity: 0,
      provisionalIncome: otherIncome,
      tier: 1,
      taxationPercentage: 0
    };
  }

  const thresholds = getSocialSecurityThresholds(filingStatus);
  const provisionalIncome = otherIncome + (socialSecurityBenefits * 0.5);
  
  let taxableSocialSecurity = 0;
  let tier = 1;
  let taxationPercentage = 0;

  if (provisionalIncome <= thresholds.tier1) {
    // Tier 1: 0% taxable
    taxableSocialSecurity = 0;
    tier = 1;
    taxationPercentage = 0;
  } else if (provisionalIncome <= thresholds.tier2) {
    // Tier 2: Up to 50% taxable
    const excessOverTier1 = provisionalIncome - thresholds.tier1;
    taxableSocialSecurity = Math.min(excessOverTier1, socialSecurityBenefits * 0.5);
    tier = 2;
    taxationPercentage = (taxableSocialSecurity / socialSecurityBenefits) * 100;
  } else {
    // Tier 3: Up to 85% taxable
    const tier2Amount = Math.min(thresholds.tier2 - thresholds.tier1, socialSecurityBenefits * 0.5);
    const excessOverTier2 = provisionalIncome - thresholds.tier2;
    const tier3Amount = Math.min(excessOverTier2 * 0.85, socialSecurityBenefits * 0.85 - tier2Amount);
    taxableSocialSecurity = tier2Amount + tier3Amount;
    tier = 3;
    taxationPercentage = (taxableSocialSecurity / socialSecurityBenefits) * 100;
  }

  return {
    taxableSocialSecurity: Math.min(taxableSocialSecurity, socialSecurityBenefits),
    provisionalIncome,
    tier,
    taxationPercentage: Math.round(taxationPercentage)
  };
}

/**
 * Calculate comprehensive taxes standalone (simplified version)
 */
function calculateTaxesStandalone(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings = {}) {
  const getYearlyAmount = (source) => {
    return source.frequency === 'monthly' ? source.amount * 12 : source.amount;
  };

  // Calculate total income and separate Social Security
  let totalIncome = 0;
  let socialSecurityBenefits = 0;
  let otherIncome = 0;

  incomeSources.forEach(source => {
    if (!source.enabled) return;
    
    const yearlyAmount = getYearlyAmount(source);
    totalIncome += yearlyAmount;
    
    if (source.type === 'social-security') {
      socialSecurityBenefits += yearlyAmount;
    } else {
      otherIncome += yearlyAmount;
    }
  });

  // Calculate Social Security taxation
  const ssCalculation = calculateSocialSecurityTaxationStandalone(
    socialSecurityBenefits, 
    otherIncome, 
    filingStatus
  );

  // Calculate federal AGI and taxable income
  const federalAGI = otherIncome + ssCalculation.taxableSocialSecurity;
  const standardDeduction = STANDARD_DEDUCTIONS_2025[filingStatus] || STANDARD_DEDUCTIONS_2025.single;
  const federalTaxableIncome = Math.max(0, federalAGI - standardDeduction);

  // Calculate federal tax
  const federalTax = calculateFederalTaxStandalone(federalTaxableIncome, filingStatus);

  // Calculate state tax (simplified Michigan calculation)
  const MICHIGAN_TAX_RATE = 0.0425;
  const stateTax = Math.max(0, (federalAGI - socialSecurityBenefits)) * MICHIGAN_TAX_RATE;

  const totalTax = federalTax + stateTax;
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;

  return {
    totalIncome,
    federalAGI,
    federalTaxableIncome,
    federalTax,
    stateTax,
    totalTax,
    effectiveRate,
    socialSecurity: ssCalculation
  };
}

/**
 * Enhanced marginal rate analysis with comprehensive rate change detection
 */
export function getEnhancedMarginalRateAnalysis(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings = {}) {
  // Calculate base scenario
  const baseCalc = calculateTaxesStandalone(incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings);
  
  // Test with additional income to find true marginal rate
  const testAmount = 1000;
  const testSources = incomeSources.map(source => {
    if (source.enabled && source.type === 'traditional-ira') {
      return {
        ...source,
        amount: source.amount + (source.frequency === 'monthly' ? testAmount / 12 : testAmount)
      };
    }
    return source;
  });

  // If no traditional IRA found, add test income as wages
  if (!testSources.some(s => s.enabled && s.type === 'traditional-ira')) {
    testSources.push({
      id: 'test-income',
      type: 'wages',
      name: 'Test Income',
      amount: testAmount,
      frequency: 'yearly',
      enabled: true
    });
  }

  const testCalc = calculateTaxesStandalone(testSources, taxpayerAge, spouseAge, filingStatus, appSettings);
  
  // Calculate true marginal rate
  const marginalTaxIncrease = testCalc.totalTax - baseCalc.totalTax;
  const trueMarginalRate = marginalTaxIncrease / testAmount;

  // Find next rate changes by testing income increments
  const rateChanges = [];
  const maxTestIncome = 200000; // Test up to $200k additional income
  const stepSize = 1000;
  
  let currentRate = trueMarginalRate;
  let lastTotalTax = baseCalc.totalTax;
  
  for (let additionalIncome = stepSize; additionalIncome <= maxTestIncome; additionalIncome += stepSize) {
    const testSourcesIncremental = incomeSources.map(source => {
      if (source.enabled && source.type === 'traditional-ira') {
        return {
          ...source,
          amount: source.amount + (source.frequency === 'monthly' ? additionalIncome / 12 : additionalIncome)
        };
      }
      return source;
    });

    if (!testSourcesIncremental.some(s => s.enabled && s.type === 'traditional-ira')) {
      testSourcesIncremental.push({
        id: 'test-income-incremental',
        type: 'wages',
        name: 'Test Income',
        amount: additionalIncome,
        frequency: 'yearly',
        enabled: true
      });
    }

    const incrementalCalc = calculateTaxesStandalone(testSourcesIncremental, taxpayerAge, spouseAge, filingStatus, appSettings);
    const incrementalRate = (incrementalCalc.totalTax - lastTotalTax) / stepSize;
    
    // Check for significant rate change (more than 1% difference)
    if (Math.abs(incrementalRate - currentRate) > 0.01) {
      rateChanges.push({
        incomeLevel: baseCalc.totalIncome + additionalIncome,
        additionalIncomeNeeded: additionalIncome,
        oldRate: currentRate,
        newRate: incrementalRate,
        rateChange: incrementalRate - currentRate,
        source: determineRateChangeSource(additionalIncome, baseCalc.totalIncome, filingStatus)
      });
      
      currentRate = incrementalRate;
      
      // Stop after finding first few rate changes
      if (rateChanges.length >= 3) break;
    }
    
    lastTotalTax = incrementalCalc.totalTax;
  }

  return {
    currentIncome: baseCalc.totalIncome,
    currentMarginalRate: trueMarginalRate,
    effectiveRate: baseCalc.effectiveRate,
    nextRateChanges: rateChanges,
    federalTaxableIncome: baseCalc.federalTaxableIncome,
    socialSecurityAnalysis: baseCalc.socialSecurity,
    recommendations: generateMarginalRateRecommendations(trueMarginalRate, rateChanges, baseCalc)
  };
}

/**
 * Determine the likely source of a rate change
 */
function determineRateChangeSource(additionalIncome, baseIncome, filingStatus) {
  const totalIncome = baseIncome + additionalIncome;
  
  // Check federal tax brackets
  const brackets = FEDERAL_TAX_BRACKETS_2025[filingStatus] || FEDERAL_TAX_BRACKETS_2025.single;
  for (const bracket of brackets) {
    if (totalIncome >= bracket.min && totalIncome <= bracket.max + 5000) {
      return `Federal tax bracket (${(bracket.rate * 100).toFixed(1)}%)`;
    }
  }
  
  // Check IRMAA thresholds
  const irmaaThresholds = getIrmaaThresholds(filingStatus);
  for (const [level, threshold] of Object.entries(irmaaThresholds)) {
    if (Math.abs(totalIncome - threshold) < 5000) {
      return `IRMAA threshold (${level})`;
    }
  }
  
  // Check Social Security thresholds
  const ssThresholds = getSocialSecurityThresholds(filingStatus);
  if (Math.abs(totalIncome - ssThresholds.tier1) < 5000) {
    return 'Social Security taxation (50%)';
  }
  if (Math.abs(totalIncome - ssThresholds.tier2) < 5000) {
    return 'Social Security taxation (85%)';
  }
  
  return 'Tax rate change';
}

/**
 * Generate recommendations based on marginal rate analysis
 */
function generateMarginalRateRecommendations(marginalRate, rateChanges, baseCalc) {
  const recommendations = [];
  
  if (marginalRate > 0.30) {
    recommendations.push({
      priority: 'high',
      category: 'tax_reduction',
      title: 'High Marginal Rate Alert',
      description: `Current marginal rate of ${(marginalRate * 100).toFixed(1)}% suggests significant tax optimization opportunities.`,
      actions: ['Consider Roth conversions in lower-income years', 'Evaluate tax-loss harvesting', 'Review asset location strategies']
    });
  }
  
  if (rateChanges.length > 0) {
    const nextChange = rateChanges[0];
    if (nextChange.additionalIncomeNeeded < 10000) {
      recommendations.push({
        priority: 'medium',
        category: 'rate_management',
        title: 'Upcoming Rate Change',
        description: `Marginal rate will change from ${(nextChange.oldRate * 100).toFixed(1)}% to ${(nextChange.newRate * 100).toFixed(1)}% with $${nextChange.additionalIncomeNeeded.toLocaleString()} additional income.`,
        actions: ['Consider timing of income recognition', 'Evaluate bunching strategies', 'Plan withdrawal sequences carefully']
      });
    }
  }
  
  if (baseCalc.socialSecurity.tier >= 2) {
    recommendations.push({
      priority: 'medium',
      category: 'social_security',
      title: 'Social Security Taxation',
      description: `${baseCalc.socialSecurity.taxationPercentage}% of Social Security benefits are currently taxable.`,
      actions: ['Consider Roth conversion strategies', 'Evaluate municipal bond investments', 'Review withdrawal sequencing']
    });
  }
  
  return recommendations;
}

export default getEnhancedMarginalRateAnalysis;

