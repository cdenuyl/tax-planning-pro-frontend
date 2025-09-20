import { calculateComprehensiveTaxes } from './taxCalculations.js';
import { getIrmaaThresholds, getSocialSecurityThresholds } from './irmaaThresholds.js';

// Main AI optimization function
export function generateOptimizationRecommendations(incomeSources, taxpayer, spouse, deductions, appSettings) {
  const recommendations = [];
  const currentCalculations = calculateComprehensiveTaxes(incomeSources, taxpayer.age, spouse.age, taxpayer.filingStatus, deductions, appSettings);
  
  // 1. Tax Bracket Optimization
  const bracketOptimization = analyzeTaxBracketOptimization(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalculations);
  if (bracketOptimization) recommendations.push(bracketOptimization);
  
  // 2. Social Security Optimization
  const ssOptimization = analyzeSocialSecurityOptimization(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalculations);
  if (ssOptimization) recommendations.push(ssOptimization);
  
  // 3. IRMAA Optimization
  const irmaaOptimization = analyzeIrmaaOptimization(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalculations);
  if (irmaaOptimization) recommendations.push(irmaaOptimization);
  
  // 4. Roth Conversion Analysis
  const rothAnalysis = analyzeRothConversions(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalculations);
  if (rothAnalysis) recommendations.push(rothAnalysis);
  
  // 5. Income Timing Strategies
  const timingStrategies = analyzeIncomeTimingStrategies(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalculations);
  if (timingStrategies) recommendations.push(timingStrategies);
  
  return recommendations;
}

// Tax Bracket Optimization Analysis
function analyzeTaxBracketOptimization(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalc) {
  const currentIncome = currentCalc.totalIncome;
  const currentMarginalRate = currentCalc.federalMarginalRate;
  
  // Find the next tax bracket threshold
  const brackets = [
    { threshold: 11600, rate: 0.12, name: "12%" },
    { threshold: 47150, rate: 0.22, name: "22%" },
    { threshold: 100525, rate: 0.24, name: "24%" },
    { threshold: 191950, rate: 0.32, name: "32%" },
    { threshold: 243725, rate: 0.35, name: "35%" },
    { threshold: 609350, rate: 0.37, name: "37%" }
  ];
  
  // Adjust for filing status
  if (taxpayer.filingStatus === 'marriedFilingJointly') {
    brackets.forEach(bracket => {
      if (bracket.threshold <= 23200) bracket.threshold *= 2;
      else if (bracket.threshold <= 94300) bracket.threshold = 23200 + (bracket.threshold - 11600) * 2;
    });
  }
  
  const nextBracket = brackets.find(bracket => currentIncome < bracket.threshold);
  
  if (nextBracket) {
    const roomInBracket = nextBracket.threshold - currentIncome;
    const nextRateIncrease = (nextBracket.rate - currentMarginalRate) * 100;
    
    if (roomInBracket < 50000 && nextRateIncrease >= 2) {
      return {
        type: 'tax-bracket',
        priority: 'high',
        title: 'Tax Bracket Management',
        description: `You have $${roomInBracket.toLocaleString()} of room before moving to the ${nextBracket.name} tax bracket.`,
        recommendation: `Consider timing income or deductions to stay below $${nextBracket.threshold.toLocaleString()} to avoid a ${nextRateIncrease.toFixed(1)}% marginal rate increase.`,
        potentialSavings: parseFloat((roomInBracket * nextRateIncrease / 100).toFixed(2)),
        actionItems: [
          'Defer income to next year if possible',
          'Accelerate deductible expenses',
          'Consider tax-deferred retirement contributions'
        ]
      };
    }
  }
  
  return null;
}

// Social Security Optimization Analysis
function analyzeSocialSecurityOptimization(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalc) {
  if (!Array.isArray(incomeSources)) {
    incomeSources = [];
  }
  const ssThresholds = getSocialSecurityThresholds(taxpayer.filingStatus);
  const provisionalIncome = currentCalc.socialSecurity.provisionalIncome;
  const ssAmount = incomeSources
    .filter(source => source.type === 'social-security' && source.enabled)
    .reduce((sum, source) => sum + source.amount, 0);
  
  if (ssAmount === 0) return null;
  
  if (provisionalIncome < ssThresholds.tier1 && provisionalIncome > ssThresholds.tier1 - 10000) {
    const roomToTier1 = ssThresholds.tier1 - provisionalIncome;
    return {
      type: 'social-security',
      priority: 'medium',
      title: 'Social Security Taxation Threshold',
      description: `You're $${roomToTier1.toLocaleString()} away from 50% of Social Security becoming taxable.`,
      recommendation: `Consider strategies to keep provisional income below $${ssThresholds.tier1.toLocaleString()}.`,
      potentialSavings: parseFloat((ssAmount * 0.5 * currentCalc.federalMarginalRate).toFixed(2)),
      actionItems: [
        'Consider Roth conversions in lower-income years',
        'Manage timing of retirement account withdrawals',
        'Consider tax-free municipal bonds'
      ]
    };
  }
  
  return null;
}

// IRMAA Optimization Analysis
function analyzeIrmaaOptimization(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalc) {
  const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
  const currentIncome = currentCalc.totalIncome;
  
  // Only relevant for Medicare-eligible individuals
  if (taxpayer.age < 65 && (!spouse || spouse.age < 65)) return null;
  
  const nextThreshold = irmaaThresholds.find(threshold => currentIncome < threshold.income);
  
  if (nextThreshold) {
    const roomToNextLevel = nextThreshold.income - currentIncome;
    const currentLevel = getCurrentIrmaaLevel(currentIncome, irmaaThresholds);
    const annualPremiumIncrease = (nextThreshold.premium - currentLevel.premium) * 12;
    
    if (roomToNextLevel < 25000 && annualPremiumIncrease > 1000) {
      return {
        type: 'irmaa',
        priority: 'high',
        title: 'Medicare IRMAA Threshold Management',
        description: `You're $${roomToNextLevel.toLocaleString()} away from higher Medicare premiums.`,
        recommendation: `Consider strategies to keep income below $${nextThreshold.income.toLocaleString()} to avoid $${annualPremiumIncrease.toLocaleString()} in additional Medicare premiums.`,
        potentialSavings: parseFloat(annualPremiumIncrease.toFixed(2)),
        actionItems: [
          'Time retirement account withdrawals carefully',
          'Consider charitable giving strategies',
          'Evaluate Roth conversion timing'
        ]
      };
    }
  }
  
  return null;
}

// Enhanced Roth Conversion Analysis with IRMAA and Opportunity Cost Considerations
function analyzeRothConversions(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalc) {
  if (!Array.isArray(incomeSources)) {
    incomeSources = [];
  }
  const currentAge = taxpayer.age;
  const currentIncome = currentCalc.totalIncome;
  const currentMarginalRate = currentCalc.federalMarginalRate;
  
  // Get traditional IRA/401k sources
  const traditionalSources = incomeSources.filter(source => 
    (source.type === 'traditional-ira' || source.type === 'traditional-401k') && source.enabled
  );
  
  if (traditionalSources.length === 0) return null;
  
  const totalTraditionalBalance = traditionalSources.reduce((sum, source) => sum + (source.balance || source.amount * 10), 0);
  
  // Enhanced analysis with IRMAA and opportunity cost considerations
  const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
  const currentIrmaaLevel = getCurrentIrmaaLevel(currentIncome, irmaaThresholds);
  
  // Calculate optimal conversion amount considering multiple factors
  const optimalConversionAmount = calculateOptimalRothConversionEnhanced(
    currentIncome, 
    currentMarginalRate, 
    taxpayer.filingStatus,
    irmaaThresholds,
    currentAge
  );
  
  if (optimalConversionAmount <= 0) return null;
  
  // Calculate comprehensive costs and benefits
  const analysis = calculateRothConversionAnalysis(
    optimalConversionAmount,
    currentMarginalRate,
    currentAge,
    currentIncome,
    irmaaThresholds
  );
  
  if (analysis.netBenefit <= 0) return null;
  
  let recommendation = `Consider converting $${optimalConversionAmount.toLocaleString()} from Traditional to Roth IRA. `;
  recommendation += `Current tax cost: $${analysis.immediateTaxCost.toLocaleString()}. `;
  
  // Add IRMAA warnings
  if (analysis.irmaaImpact > 0) {
    recommendation += `⚠️ WARNING: This conversion would increase Medicare premiums by approximately $${analysis.irmaaImpact.toLocaleString()} due to IRMAA brackets. `;
  }
  
  // Add opportunity cost warning
  recommendation += `Note: This analysis assumes tax payment funds would otherwise earn ${(analysis.opportunityRate * 100).toFixed(1)}% annually. `;
  recommendation += `Actual benefit depends on investment performance and future tax rates.`;
  
  const actionItems = [
    'Verify sufficient non-retirement funds for tax payments',
    'Consider IRMAA impact on Medicare premiums',
    'Evaluate multi-year conversion strategy',
    'Consult with tax professional for personalized analysis'
  ];
  
  // Add age-specific warnings
  if (currentAge >= 70) {
    actionItems.unshift('Consider whether current income levels will continue');
    recommendation += ` At age ${currentAge}, consider if current high income is sustainable.`;
  }
  
  return {
    type: 'roth-conversion',
    priority: analysis.irmaaImpact > 0 ? 'low' : 'medium',
    title: 'Roth Conversion Analysis',
    description: `Potential conversion opportunity with comprehensive impact analysis.`,
    recommendation: recommendation,
    potentialSavings: parseFloat(analysis.netBenefit.toFixed(2)), // Fixed decimal formatting
    actionItems: actionItems,
    details: {
      conversionAmount: optimalConversionAmount,
      immediateTaxCost: analysis.immediateTaxCost,
      irmaaImpact: analysis.irmaaImpact,
      opportunityCost: analysis.opportunityCost,
      projectedBenefit: analysis.projectedBenefit,
      netBenefit: analysis.netBenefit,
      assumptions: [
        `${(analysis.growthRate * 100).toFixed(1)}% annual growth rate`,
        `${analysis.yearsToGrow} year analysis period`,
        `${(analysis.opportunityRate * 100).toFixed(1)}% opportunity cost rate`,
        'Current tax rates for future withdrawals'
      ]
    }
  };
}

// Enhanced optimal conversion calculation
function calculateOptimalRothConversionEnhanced(currentIncome, currentMarginalRate, filingStatus, irmaaThresholds, age) {
  // Conservative approach - stay within current tax bracket and avoid IRMAA jumps
  const brackets = filingStatus === 'single' 
    ? [11600, 47150, 100525, 191950, 243725]
    : [23200, 94300, 201050, 383900, 487450];
  
  const nextTaxBracket = brackets.find(bracket => currentIncome < bracket);
  const nextIrmaaThreshold = irmaaThresholds.find(threshold => currentIncome < threshold.income);
  
  let maxConversion = 0;
  
  // Limit by tax bracket
  if (nextTaxBracket) {
    maxConversion = nextTaxBracket - currentIncome;
  }
  
  // Further limit by IRMAA threshold (more conservative)
  if (nextIrmaaThreshold && nextIrmaaThreshold.income - currentIncome < maxConversion) {
    maxConversion = Math.max(0, nextIrmaaThreshold.income - currentIncome - 5000); // 5k buffer
  }
  
  // Age-based limitations
  if (age >= 70) {
    maxConversion = Math.min(maxConversion, 25000); // More conservative for older taxpayers
  } else {
    maxConversion = Math.min(maxConversion, 50000); // Cap at reasonable amount
  }
  
  return Math.max(0, maxConversion);
}

// Comprehensive Roth conversion analysis
function calculateRothConversionAnalysis(conversionAmount, marginalRate, age, currentIncome, irmaaThresholds) {
  const growthRate = 0.07; // 7% growth assumption
  const opportunityRate = 0.05; // 5% opportunity cost for tax payment funds
  const yearsToGrow = Math.max(10, 85 - age);
  
  // Immediate tax cost
  const immediateTaxCost = conversionAmount * marginalRate;
  
  // IRMAA impact calculation
  const newIncome = currentIncome + conversionAmount;
  const currentIrmaaLevel = getCurrentIrmaaLevel(currentIncome, irmaaThresholds);
  const newIrmaaLevel = getCurrentIrmaaLevel(newIncome, irmaaThresholds);
  const irmaaImpact = (newIrmaaLevel.premium - currentIrmaaLevel.premium) * 12; // Annual impact
  
  // Future value calculations
  const rothFutureValue = conversionAmount * Math.pow(1 + growthRate, yearsToGrow);
  const traditionalFutureValue = conversionAmount * Math.pow(1 + growthRate, yearsToGrow) * (1 - marginalRate);
  
  // Opportunity cost of tax payment
  const opportunityCost = immediateTaxCost * Math.pow(1 + opportunityRate, yearsToGrow);
  
  // Net benefit calculation
  const projectedBenefit = rothFutureValue - traditionalFutureValue;
  const netBenefit = projectedBenefit - opportunityCost - (irmaaImpact * 2); // 2 years of IRMAA impact
  
  return {
    immediateTaxCost,
    irmaaImpact,
    opportunityCost,
    projectedBenefit,
    netBenefit,
    growthRate,
    opportunityRate,
    yearsToGrow
  };
}

// Helper function to get current IRMAA level
function getCurrentIrmaaLevel(income, irmaaThresholds) {
  for (let i = irmaaThresholds.length - 1; i >= 0; i--) {
    if (income >= irmaaThresholds[i].income) {
      return irmaaThresholds[i];
    }
  }
  return irmaaThresholds[0]; // Base level
}

// Income Timing Strategies
function analyzeIncomeTimingStrategies(incomeSources, taxpayer, spouse, deductions, appSettings, currentCalc) {
  const currentYear = new Date().getFullYear();
  const isNearYearEnd = new Date().getMonth() >= 9; // October or later
  
  if (!isNearYearEnd) return null; // Only relevant near year-end
  
  const discretionaryIncome = incomeSources.filter(source => 
    source.type === 'traditional-ira' || source.type === 'wages' || source.type === 'other'
  );
  
  if (discretionaryIncome.length === 0) return null;
  
  return {
    type: 'income-timing',
    priority: 'low',
    title: 'Year-End Income Timing',
    description: 'Consider timing discretionary income for tax optimization.',
    recommendation: 'Evaluate whether to accelerate or defer income based on current tax situation.',
    potentialSavings: 'Variable based on timing decisions',
    actionItems: [
      'Review year-to-date tax situation',
      'Consider deferring bonuses or consulting income',
      'Accelerate deductible expenses if beneficial'
    ]
  };
}

// Multi-year strategy analysis
export function generateMultiYearStrategy(incomeSources, taxpayer, spouse, deductions, appSettings) {
  const strategies = [];
  const currentAge = taxpayer.age;
  const yearsToAnalyze = Math.min(10, 85 - currentAge); // Analyze up to 10 years or age 85
  
  for (let year = 0; year < yearsToAnalyze; year++) {
    const futureAge = currentAge + year;
    const yearStrategy = analyzeYearStrategy(incomeSources, futureAge, taxpayer.filingStatus, year);
    strategies.push(yearStrategy);
  }
  
  return strategies;
}

function analyzeYearStrategy(incomeSources, age, filingStatus, yearOffset) {
  return {
    year: new Date().getFullYear() + yearOffset,
    age: age,
    recommendations: [
      'Continue monitoring tax bracket thresholds',
      'Evaluate Roth conversion opportunities',
      'Consider IRMAA impact timing'
    ]
  };
}

