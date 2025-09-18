/**
 * Advanced Social Security Optimization Module
 * 
 * This module provides sophisticated Social Security claiming strategy optimization
 * with tax integration, IRMAA avoidance, Roth conversion coordination, and Monte Carlo analysis.
 */

import { calculateComprehensiveTaxes } from './taxCalculations.js';
import { getIrmaaThresholds } from './irmaaThresholds.js';

/**
 * Calculate tax-efficient Social Security claiming strategy
 * 
 * @param {Object} taxpayerInfo - Taxpayer information including dateOfBirth and filingStatus
 * @param {Object} spouseInfo - Spouse information (if married) including dateOfBirth
 * @param {Array} incomeSources - Current income sources
 * @param {Object} optimizationSettings - Optimization parameters
 * @param {number} [optimizationSettings.taxpayerFRABenefit=2500] - Taxpayer's monthly benefit at full retirement age
 * @param {number} [optimizationSettings.spouseFRABenefit=1800] - Spouse's monthly benefit at full retirement age
 * @param {number} [optimizationSettings.taxpayerLifeExpectancy=85] - Taxpayer's life expectancy
 * @param {number} [optimizationSettings.spouseLifeExpectancy=87] - Spouse's life expectancy
 * @param {number} [optimizationSettings.discountRate=3] - Discount rate for present value calculations
 * @param {number} [optimizationSettings.colaRate=2.5] - Cost of living adjustment rate
 * @param {boolean} [optimizationSettings.considerIRMAA=true] - Whether to consider IRMAA in optimization
 * @param {boolean} [optimizationSettings.considerRothConversions=true] - Whether to consider Roth conversion opportunities
 * @param {number} [optimizationSettings.targetTaxBracket=12] - Target tax bracket percentage
 * @returns {Object} Tax-efficient claiming strategy with detailed analysis
 */
export function calculateTaxEfficientClaimingStrategy(taxpayerInfo, spouseInfo, incomeSources, optimizationSettings = {}) {
  // Input validation
  if (!taxpayerInfo || typeof taxpayerInfo !== 'object') {
    console.warn('Invalid taxpayerInfo provided to calculateTaxEfficientClaimingStrategy');
    taxpayerInfo = { dateOfBirth: new Date(1960, 0, 1), filingStatus: 'single' };
  }

  if (!incomeSources || !Array.isArray(incomeSources)) {
    console.warn('Invalid incomeSources provided to calculateTaxEfficientClaimingStrategy');
    incomeSources = [];
  }

  // Default optimization settings
  const {
    taxpayerFRABenefit = 2500,
    spouseFRABenefit = 1800,
    taxpayerLifeExpectancy = 85,
    spouseLifeExpectancy = 87,
    discountRate = 3,
    colaRate = 2.5,
    considerIRMAA = true,
    considerRothConversions = true,
    targetTaxBracket = 12 // Target to stay in 12% bracket
  } = optimizationSettings;

  const isMarried = spouseInfo && spouseInfo.dateOfBirth;
  const claimingAges = [62, 63, 64, 65, 66, 67, 68, 69, 70];
  
  // Calculate current age and FRA for both taxpayer and spouse
  const taxpayerAge = calculateAge(taxpayerInfo.dateOfBirth);
  const spouseAge = isMarried ? calculateAge(spouseInfo.dateOfBirth) : 0;
  const taxpayerFRA = calculateFRA(taxpayerInfo.dateOfBirth);
  const spouseFRA = isMarried ? calculateFRA(spouseInfo.dateOfBirth) : { years: 67, months: 0 };

  let bestStrategy = null;
  let maxAfterTaxValue = 0;

  // Test all claiming age combinations
  for (const taxpayerClaimingAge of claimingAges) {
    if (isMarried) {
      for (const spouseClaimingAge of claimingAges) {
        const strategy = analyzeClaimingStrategy({
          taxpayerClaimingAge,
          spouseClaimingAge,
          taxpayerInfo,
          spouseInfo,
          incomeSources,
          taxpayerFRABenefit,
          spouseFRABenefit,
          taxpayerLifeExpectancy,
          spouseLifeExpectancy,
          discountRate,
          colaRate,
          considerIRMAA,
          considerRothConversions,
          targetTaxBracket
        });

        if (strategy.afterTaxPresentValue > maxAfterTaxValue) {
          maxAfterTaxValue = strategy.afterTaxPresentValue;
          bestStrategy = strategy;
        }
      }
    } else {
      const strategy = analyzeClaimingStrategy({
        taxpayerClaimingAge,
        spouseClaimingAge: null,
        taxpayerInfo,
        spouseInfo: null,
        incomeSources,
        taxpayerFRABenefit,
        spouseFRABenefit: 0,
        taxpayerLifeExpectancy,
        spouseLifeExpectancy: 0,
        discountRate,
        colaRate,
        considerIRMAA,
        considerRothConversions,
        targetTaxBracket
      });

      if (strategy.afterTaxPresentValue > maxAfterTaxValue) {
        maxAfterTaxValue = strategy.afterTaxPresentValue;
        bestStrategy = strategy;
      }
    }
  }

  return {
    bestStrategy,
    optimizationFactors: {
      considerIRMAA,
      considerRothConversions,
      targetTaxBracket,
      discountRate,
      colaRate
    },
    analysis: generateOptimizationAnalysis(bestStrategy, incomeSources, taxpayerInfo, spouseInfo)
  };
}

/**
 * Analyze a specific claiming strategy with tax considerations
 * 
 * @param {Object} params - Strategy parameters
 * @returns {Object} Analysis results for the strategy
 * @private
 */
function analyzeClaimingStrategy(params) {
  const {
    taxpayerClaimingAge,
    spouseClaimingAge,
    taxpayerInfo,
    spouseInfo,
    incomeSources,
    taxpayerFRABenefit,
    spouseFRABenefit,
    taxpayerLifeExpectancy,
    spouseLifeExpectancy,
    discountRate,
    colaRate,
    considerIRMAA,
    considerRothConversions,
    targetTaxBracket
  } = params;

  // Input validation
  if (!taxpayerInfo || !taxpayerInfo.dateOfBirth) {
    console.warn('Invalid taxpayer information in analyzeClaimingStrategy');
    return {
      taxpayerClaimingAge: 0,
      spouseClaimingAge: 0,
      taxpayerMonthlyBenefit: 0,
      spouseMonthlyBenefit: 0,
      afterTaxPresentValue: 0,
      grossPresentValue: 0,
      irmaaImpact: 0,
      taxBracketViolations: 0,
      rothConversionOpportunities: [],
      strategy: {
        taxpayerDelay: 0,
        spouseDelay: 0,
        isOptimal: false
      }
    };
  }

  const isMarried = spouseInfo !== null;
  const taxpayerFRA = calculateFRA(taxpayerInfo.dateOfBirth);
  const spouseFRA = isMarried ? calculateFRA(spouseInfo.dateOfBirth) : { years: 67, months: 0 };

  // Calculate adjusted benefits based on claiming age
  const taxpayerAdjustmentFactor = calculateAdjustmentFactor(taxpayerClaimingAge, taxpayerFRA, taxpayerInfo.dateOfBirth);
  const taxpayerMonthlyBenefit = taxpayerFRABenefit * taxpayerAdjustmentFactor;

  let spouseMonthlyBenefit = 0;
  if (isMarried && spouseClaimingAge) {
    const spouseAdjustmentFactor = calculateAdjustmentFactor(spouseClaimingAge, spouseFRA, spouseInfo.dateOfBirth);
    spouseMonthlyBenefit = spouseFRABenefit * spouseAdjustmentFactor;
  }

  // Calculate year-by-year after-tax present value
  let afterTaxPresentValue = 0;
  let totalIRMAAImpact = 0;
  let rothConversionOpportunities = [];
  let taxBracketViolations = 0;

  const currentAge = calculateAge(taxpayerInfo.dateOfBirth);
  const maxAge = Math.max(taxpayerLifeExpectancy, isMarried ? spouseLifeExpectancy : 0);

  for (let age = currentAge; age <= maxAge; age++) {
    // Determine if benefits are being received this year
    const taxpayerReceiving = age >= taxpayerClaimingAge;
    const spouseReceiving = isMarried && spouseClaimingAge && age >= spouseClaimingAge;

    // Calculate Social Security income for this year
    const yearsFromClaiming = Math.max(0, age - taxpayerClaimingAge);
    const spouseYearsFromClaiming = isMarried && spouseClaimingAge ? Math.max(0, age - spouseClaimingAge) : 0;

    const taxpayerSSIncome = taxpayerReceiving ? 
      taxpayerMonthlyBenefit * 12 * Math.pow(1 + colaRate / 100, yearsFromClaiming) : 0;
    const spouseSSIncome = spouseReceiving ? 
      spouseMonthlyBenefit * 12 * Math.pow(1 + colaRate / 100, spouseYearsFromClaiming) : 0;

    // Create modified income sources with Social Security
    const modifiedIncomeSources = [...incomeSources];
    
    // Add or update Social Security income
    const ssIndex = modifiedIncomeSources.findIndex(source => source.type === 'social-security');
    const totalSSIncome = taxpayerSSIncome + spouseSSIncome;
    
    if (ssIndex >= 0) {
      modifiedIncomeSources[ssIndex] = {
        ...modifiedIncomeSources[ssIndex],
        amount: totalSSIncome,
        enabled: totalSSIncome > 0
      };
    } else if (totalSSIncome > 0) {
      modifiedIncomeSources.push({
        type: 'social-security',
        amount: totalSSIncome,
        frequency: 'yearly',
        enabled: true,
        name: 'Social Security Benefits'
      });
    }

    // Calculate comprehensive taxes for this year
    const taxCalc = calculateComprehensiveTaxes(
      modifiedIncomeSources, 
      age, 
      isMarried ? age : null, 
      taxpayerInfo.filingStatus || 'single'
    );

    // Calculate after-tax Social Security income
    const afterTaxSSIncome = totalSSIncome - (taxCalc.socialSecurity?.taxableSocialSecurity || 0) * taxCalc.federalMarginalRate;

    // Apply discount factor
    const yearsFromNow = age - currentAge;
    const discountFactor = Math.pow(1 + discountRate / 100, -yearsFromNow);
    const discountedAfterTaxValue = afterTaxSSIncome * discountFactor;

    afterTaxPresentValue += discountedAfterTaxValue;

    // Track IRMAA impact if considering it
    if (considerIRMAA && taxCalc.irmaa) {
      totalIRMAAImpact += (taxCalc.irmaa.annualIncrease || 0) * discountFactor;
    }

    // Check for tax bracket violations
    if (targetTaxBracket && taxCalc.federalMarginalRate > targetTaxBracket / 100) {
      taxBracketViolations++;
    }

    // Identify Roth conversion opportunities
    if (considerRothConversions && !taxpayerReceiving) {
      const remainingBracketRoom = calculateRemainingBracketRoom(taxCalc, targetTaxBracket);
      if (remainingBracketRoom > 10000) { // Minimum threshold for meaningful conversion
        rothConversionOpportunities.push({
          age,
          availableRoom: remainingBracketRoom,
          currentBracket: taxCalc.federalMarginalRate
        });
      }
    }
  }

  // Subtract IRMAA impact from total value
  const netAfterTaxValue = afterTaxPresentValue - totalIRMAAImpact;

  return {
    taxpayerClaimingAge,
    spouseClaimingAge,
    taxpayerMonthlyBenefit,
    spouseMonthlyBenefit,
    afterTaxPresentValue: netAfterTaxValue,
    grossPresentValue: afterTaxPresentValue + totalIRMAAImpact,
    irmaaImpact: totalIRMAAImpact,
    taxBracketViolations,
    rothConversionOpportunities,
    strategy: {
      taxpayerDelay: taxpayerClaimingAge - taxpayerFRA.years,
      spouseDelay: isMarried && spouseClaimingAge ? spouseClaimingAge - spouseFRA.years : 0,
      isOptimal: false // Will be set by calling function
    }
  };
}

/**
 * Calculate remaining room in target tax bracket
 * 
 * @param {Object} taxCalc - Tax calculation results
 * @param {number} targetBracket - Target tax bracket percentage
 * @returns {number} Remaining room in the target bracket
 * @private
 */
function calculateRemainingBracketRoom(taxCalc, targetBracket) {
  if (!targetBracket) return 0;
  
  const targetRate = targetBracket / 100;
  const brackets = taxCalc.federalTaxBrackets || [];
  
  const targetBracketInfo = brackets.find(bracket => bracket.rate === targetRate);
  if (!targetBracketInfo) return 0;
  
  return Math.max(0, targetBracketInfo.max - taxCalc.federalTaxableIncome);
}

/**
 * Generate optimization analysis and recommendations
 * 
 * @param {Object} bestStrategy - Best claiming strategy
 * @param {Array} incomeSources - Income sources
 * @param {Object} taxpayerInfo - Taxpayer information
 * @param {Object} spouseInfo - Spouse information
 * @returns {Object} Detailed analysis with recommendations
 * @private
 */
function generateOptimizationAnalysis(bestStrategy, incomeSources, taxpayerInfo, spouseInfo) {
  const recommendations = [];
  const warnings = [];
  const opportunities = [];

  if (!bestStrategy) {
    return { recommendations, warnings, opportunities };
  }

  // Analyze delay strategy
  if (bestStrategy.strategy.taxpayerDelay > 0) {
    recommendations.push({
      type: 'delay',
      title: 'Delay Taxpayer Claiming',
      description: `Delaying Social Security claiming to age ${bestStrategy.taxpayerClaimingAge} increases lifetime benefits`,
      impact: `+$${Math.round(bestStrategy.afterTaxPresentValue - (bestStrategy.grossPresentValue * 0.8)).toLocaleString()} after-tax value`,
      priority: 'high'
    });
  }

  if (bestStrategy.strategy.spouseDelay > 0) {
    recommendations.push({
      type: 'delay',
      title: 'Delay Spouse Claiming',
      description: `Delaying spouse Social Security claiming to age ${bestStrategy.spouseClaimingAge} optimizes joint benefits`,
      impact: `Contributes to overall optimization strategy`,
      priority: 'high'
    });
  }

  // IRMAA warnings
  if (bestStrategy.irmaaImpact > 1000) {
    warnings.push({
      type: 'irmaa',
      title: 'IRMAA Impact Detected',
      description: `This strategy results in $${Math.round(bestStrategy.irmaaImpact).toLocaleString()} in additional Medicare premiums`,
      suggestion: 'Consider income smoothing strategies to reduce IRMAA exposure'
    });
  }

  // Tax bracket violations
  if (bestStrategy.taxBracketViolations > 0) {
    warnings.push({
      type: 'tax_bracket',
      title: 'Tax Bracket Exceeded',
      description: `Strategy exceeds target tax bracket in ${bestStrategy.taxBracketViolations} years`,
      suggestion: 'Consider adjusting claiming timing or other income sources'
    });
  }

  // Roth conversion opportunities
  if (bestStrategy.rothConversionOpportunities.length > 0) {
    const totalOpportunity = bestStrategy.rothConversionOpportunities.reduce((sum, opp) => sum + opp.availableRoom, 0);
    opportunities.push({
      type: 'roth_conversion',
      title: 'Roth Conversion Window',
      description: `${bestStrategy.rothConversionOpportunities.length} years with conversion opportunities`,
      potential: `Up to $${Math.round(totalOpportunity).toLocaleString()} in low-bracket conversions`,
      years: bestStrategy.rothConversionOpportunities.map(opp => opp.age)
    });
  }

  return {
    recommendations,
    warnings,
    opportunities,
    summary: {
      afterTaxValue: bestStrategy.afterTaxPresentValue,
      irmaaImpact: bestStrategy.irmaaImpact,
      netBenefit: bestStrategy.afterTaxPresentValue,
      optimizationScore: calculateOptimizationScore(bestStrategy)
    }
  };
}

/**
 * Calculate optimization score (0-100)
 * 
 * @param {Object} strategy - Claiming strategy
 * @returns {number} Optimization score between 0 and 100
 * @private
 */
function calculateOptimizationScore(strategy) {
  let score = 70; // Base score
  
  // Bonus for delaying (up to +20 points)
  if (strategy.strategy.taxpayerDelay > 0) {
    score += Math.min(20, strategy.strategy.taxpayerDelay * 3);
  }
  
  // Penalty for IRMAA impact (-10 points max)
  if (strategy.irmaaImpact > 0) {
    score -= Math.min(10, strategy.irmaaImpact / 1000);
  }
  
  // Penalty for tax bracket violations (-15 points max)
  if (strategy.taxBracketViolations > 0) {
    score -= Math.min(15, strategy.taxBracketViolations * 2);
  }
  
  // Bonus for Roth opportunities (+10 points max)
  if (strategy.rothConversionOpportunities.length > 0) {
    score += Math.min(10, strategy.rothConversionOpportunities.length);
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Run Monte Carlo analysis for Social Security claiming strategies
 * 
 * @param {Object} taxpayerInfo - Taxpayer information
 * @param {Object} spouseInfo - Spouse information
 * @param {Array} incomeSources - Income sources
 * @param {Object} optimizationSettings - Optimization settings
 * @param {number} [scenarios=1000] - Number of Monte Carlo scenarios to run
 * @returns {Object} Monte Carlo analysis results
 */
export function runMonteCarloAnalysis(taxpayerInfo, spouseInfo, incomeSources, optimizationSettings = {}, scenarios = 1000) {
  // Input validation
  if (!taxpayerInfo || typeof taxpayerInfo !== 'object') {
    console.warn('Invalid taxpayerInfo provided to runMonteCarloAnalysis');
    return {
      scenarios: 0,
      mostFrequentStrategy: 'N/A',
      valuePercentiles: {},
      claimingAgeFrequency: {},
      riskMetrics: {}
    };
  }

  // Limit scenarios for performance
  const actualScenarios = Math.min(scenarios, 2000);
  const results = [];
  
  for (let i = 0; i < actualScenarios; i++) {
    // Vary key assumptions
    const scenarioSettings = {
      ...optimizationSettings,
      discountRate: optimizationSettings.discountRate + (Math.random() - 0.5) * 2, // ±1%
      colaRate: optimizationSettings.colaRate + (Math.random() - 0.5) * 1, // ±0.5%
      taxpayerLifeExpectancy: optimizationSettings.taxpayerLifeExpectancy + (Math.random() - 0.5) * 10, // ±5 years
      spouseLifeExpectancy: optimizationSettings.spouseLifeExpectancy + (Math.random() - 0.5) * 10 // ±5 years
    };
    
    const strategy = calculateTaxEfficientClaimingStrategy(taxpayerInfo, spouseInfo, incomeSources, scenarioSettings);
    if (strategy && strategy.bestStrategy) {
      results.push(strategy.bestStrategy);
    }
  }
  
  // Handle case with no valid results
  if (results.length === 0) {
    return {
      scenarios: 0,
      mostFrequentStrategy: 'N/A',
      valuePercentiles: {},
      claimingAgeFrequency: {},
      riskMetrics: {}
    };
  }
  
  // Analyze results
  const claimingAgeFrequency = {};
  const valueDistribution = results.map(r => r.afterTaxPresentValue).sort((a, b) => a - b);
  
  results.forEach(result => {
    const key = `${result.taxpayerClaimingAge}-${result.spouseClaimingAge || 'N/A'}`;
    claimingAgeFrequency[key] = (claimingAgeFrequency[key] || 0) + 1;
  });
  
  // Find most frequent strategy
  const mostFrequentStrategy = Object.keys(claimingAgeFrequency).reduce((a, b) => 
    claimingAgeFrequency[a] > claimingAgeFrequency[b] ? a : b
  );
  
  return {
    scenarios: results.length,
    mostFrequentStrategy,
    valuePercentiles: {
      p10: valueDistribution[Math.floor(results.length * 0.1)],
      p25: valueDistribution[Math.floor(results.length * 0.25)],
      p50: valueDistribution[Math.floor(results.length * 0.5)],
      p75: valueDistribution[Math.floor(results.length * 0.75)],
      p90: valueDistribution[Math.floor(results.length * 0.9)]
    },
    claimingAgeFrequency,
    riskMetrics: {
      standardDeviation: calculateStandardDeviation(valueDistribution),
      worstCase: Math.min(...valueDistribution),
      bestCase: Math.max(...valueDistribution)
    }
  };
}

/**
 * Calculate age from date of birth
 * 
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} Current age
 * @private
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 65; // Default age
  
  try {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.warn('Error calculating age:', error);
    return 65; // Default age on error
  }
}

/**
 * Calculate Full Retirement Age (FRA) based on birth year
 * 
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {Object} FRA in years and months
 * @private
 */
function calculateFRA(dateOfBirth) {
  if (!dateOfBirth) return { years: 67, months: 0 };
  
  try {
    const birthYear = new Date(dateOfBirth).getFullYear();
    if (birthYear <= 1954) return { years: 66, months: 0 };
    if (birthYear >= 1960) return { years: 67, months: 0 };
    const monthsToAdd = (birthYear - 1954) * 2;
    return { years: 66, months: monthsToAdd };
  } catch (error) {
    console.warn('Error calculating FRA:', error);
    return { years: 67, months: 0 }; // Default FRA on error
  }
}

/**
 * Calculate benefit adjustment factor based on claiming age
 * 
 * @param {number} claimingAge - Age at which benefits are claimed
 * @param {Object} fra - Full retirement age in years and months
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} Benefit adjustment factor
 * @private
 */
function calculateAdjustmentFactor(claimingAge, fra, dateOfBirth) {
  try {
    const fraInMonths = fra.years * 12 + fra.months;
    const claimingAgeInMonths = claimingAge * 12;
    const monthsDifference = claimingAgeInMonths - fraInMonths;
    const birthYear = new Date(dateOfBirth).getFullYear();

    if (monthsDifference === 0) {
      return 1.0;
    } else if (monthsDifference < 0) {
      const monthsEarly = Math.abs(monthsDifference);
      let reduction = 0;
      const firstPeriod = Math.min(monthsEarly, 36);
      reduction += firstPeriod * (5/9) * 0.01;
      if (monthsEarly > 36) {
        const additionalMonths = monthsEarly - 36;
        reduction += additionalMonths * (5/12) * 0.01;
      }
      return Math.max(0.75, 1.0 - reduction);
    } else {
      const monthsDelayed = monthsDifference;
      const yearsDelayed = monthsDelayed / 12;
      if (birthYear >= 1943) {
        return 1.0 + (yearsDelayed * 0.08);
      } else {
        return 1.0 + (yearsDelayed * 0.065);
      }
    }
  } catch (error) {
    console.warn('Error calculating adjustment factor:', error);
    return 1.0; // Default to no adjustment on error
  }
}

/**
 * Calculate standard deviation of a set of values
 * 
 * @param {Array<number>} values - Array of numeric values
 * @returns {number} Standard deviation
 * @private
 */
function calculateStandardDeviation(values) {
  if (!values || values.length === 0) return 0;
  
  try {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  } catch (error) {
    console.warn('Error calculating standard deviation:', error);
    return 0;
  }
}

