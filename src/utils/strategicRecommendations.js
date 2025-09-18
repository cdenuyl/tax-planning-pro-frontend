import { formatCurrencyForReports, formatPercentageForReports } from './reportFormatting';

// Strategic recommendation categories
export const RECOMMENDATION_CATEGORIES = {
  TAX_OPTIMIZATION: 'Tax Optimization',
  INCOME_TIMING: 'Income Timing',
  DEDUCTION_STRATEGY: 'Deduction Strategy',
  RETIREMENT_PLANNING: 'Retirement Planning',
  MEDICARE_PLANNING: 'Medicare Planning',
  CAPITAL_GAINS: 'Capital Gains Strategy',
  ROTH_CONVERSION: 'Roth Conversion',
  ESTATE_PLANNING: 'Estate Planning'
};

// Recommendation priority levels
export const PRIORITY_LEVELS = {
  HIGH: { level: 'high', label: 'High Priority', color: '#ef4444' },
  MEDIUM: { level: 'medium', label: 'Medium Priority', color: '#f59e0b' },
  LOW: { level: 'low', label: 'Low Priority', color: '#10b981' }
};

// Generate strategic recommendations based on scenario analysis
export const generateStrategicRecommendations = (scenarios, differences, summary) => {
  const recommendations = [];
  
  if (!scenarios || scenarios.length === 0) return recommendations;

  const baseScenario = scenarios[0];
  const bestScenario = summary.bestScenario || scenarios[0];
  
  // Tax optimization recommendations
  recommendations.push(...generateTaxOptimizationRecommendations(scenarios, differences, summary));
  
  // Income timing recommendations
  recommendations.push(...generateIncomeTimingRecommendations(scenarios, differences));
  
  // Medicare planning recommendations
  recommendations.push(...generateMedicarePlanningRecommendations(scenarios, differences));
  
  // Capital gains recommendations
  recommendations.push(...generateCapitalGainsRecommendations(scenarios, differences));
  
  // Retirement planning recommendations
  recommendations.push(...generateRetirementPlanningRecommendations(scenarios, differences));
  
  // Roth conversion recommendations
  recommendations.push(...generateRothConversionRecommendations(scenarios, differences));

  // Sort by priority and potential impact
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority] || 0;
    const bPriority = priorityOrder[b.priority] || 0;
    
    if (aPriority !== bPriority) return bPriority - aPriority;
    return (b.potentialSavings || 0) - (a.potentialSavings || 0);
  });
};

// Tax optimization recommendations
const generateTaxOptimizationRecommendations = (scenarios, differences, summary) => {
  const recommendations = [];
  
  // Find scenarios with significant tax savings
  const significantSavings = differences.filter(diff => 
    diff.differences.totalTax?.absolute < -1000 // $1000+ tax savings
  );
  
  if (significantSavings.length > 0) {
    const bestSaving = significantSavings.reduce((best, current) => 
      current.differences.totalTax.absolute < best.differences.totalTax.absolute ? current : best
    );
    
    recommendations.push({
      id: 'tax-optimization-primary',
      category: RECOMMENDATION_CATEGORIES.TAX_OPTIMIZATION,
      priority: PRIORITY_LEVELS.HIGH.level,
      title: 'Significant Tax Savings Opportunity',
      description: `${bestSaving.scenarioName} could save ${formatCurrencyForReports(Math.abs(bestSaving.differences.totalTax.absolute))} in total taxes (${formatPercentageForReports(Math.abs(bestSaving.differences.totalTax.percent))} reduction).`,
      action: `Consider implementing the strategies in ${bestSaving.scenarioName} to optimize your tax position.`,
      potentialSavings: Math.abs(bestSaving.differences.totalTax.absolute),
      impact: 'High',
      timeframe: 'Current tax year',
      considerations: [
        'Review implementation complexity and requirements',
        'Consider timing of strategy implementation',
        'Evaluate long-term vs short-term benefits'
      ]
    });
  }
  
  // Effective rate optimization
  const lowRateScenarios = scenarios.filter(s => s.metrics.effectiveRate < 15); // Under 15% effective rate
  if (lowRateScenarios.length > 0) {
    const bestRate = lowRateScenarios.reduce((best, current) => 
      current.metrics.effectiveRate < best.metrics.effectiveRate ? current : best
    );
    
    recommendations.push({
      id: 'effective-rate-optimization',
      category: RECOMMENDATION_CATEGORIES.TAX_OPTIMIZATION,
      priority: PRIORITY_LEVELS.MEDIUM.level,
      title: 'Low Effective Tax Rate Opportunity',
      description: `${bestRate.name} achieves a ${formatPercentageForReports(bestRate.metrics.effectiveRate)} effective tax rate, which is excellent for tax efficiency.`,
      action: 'Consider strategies that maintain or achieve this low effective rate.',
      impact: 'Medium',
      timeframe: 'Ongoing',
      considerations: [
        'Monitor changes in tax law that might affect this rate',
        'Plan for future income changes',
        'Consider multi-year tax planning'
      ]
    });
  }
  
  return recommendations;
};

// Income timing recommendations
const generateIncomeTimingRecommendations = (scenarios, differences) => {
  const recommendations = [];
  
  // Look for scenarios with different income timing
  const incomeVariations = differences.filter(diff => 
    Math.abs(diff.differences.totalIncome?.absolute || 0) > 5000
  );
  
  if (incomeVariations.length > 0) {
    recommendations.push({
      id: 'income-timing-strategy',
      category: RECOMMENDATION_CATEGORIES.INCOME_TIMING,
      priority: PRIORITY_LEVELS.MEDIUM.level,
      title: 'Income Timing Optimization',
      description: 'Different income timing strategies show varying tax impacts across scenarios.',
      action: 'Consider timing income recognition to optimize tax brackets and rates.',
      impact: 'Medium',
      timeframe: 'Current and next tax year',
      considerations: [
        'Evaluate cash flow needs and timing',
        'Consider impact on other tax benefits',
        'Plan for multi-year tax optimization'
      ]
    });
  }
  
  return recommendations;
};

// Medicare planning recommendations
const generateMedicarePlanningRecommendations = (scenarios, differences) => {
  const recommendations = [];
  
  // Check for IRMAA impacts
  const irmaaScenarios = scenarios.filter(s => s.metrics.irmaaAmount > 0);
  const noIrmaaScenarios = scenarios.filter(s => s.metrics.irmaaAmount === 0);
  
  if (irmaaScenarios.length > 0 && noIrmaaScenarios.length > 0) {
    const irmaaAmount = irmaaScenarios[0].metrics.irmaaAmount;
    
    recommendations.push({
      id: 'irmaa-avoidance',
      category: RECOMMENDATION_CATEGORIES.MEDICARE_PLANNING,
      priority: PRIORITY_LEVELS.HIGH.level,
      title: 'Medicare IRMAA Surcharge Avoidance',
      description: `Some scenarios trigger ${formatCurrencyForReports(irmaaAmount)} in Medicare IRMAA surcharges, while others avoid them entirely.`,
      action: 'Consider income management strategies to stay below IRMAA thresholds.',
      potentialSavings: irmaaAmount,
      impact: 'High',
      timeframe: '2 years prior to Medicare enrollment',
      considerations: [
        'IRMAA is based on income from 2 years prior',
        'Consider Roth conversions in low-income years',
        'Plan retirement income timing carefully'
      ]
    });
  }
  
  return recommendations;
};

// Capital gains recommendations
const generateCapitalGainsRecommendations = (scenarios, differences) => {
  const recommendations = [];
  
  // Look for capital gains variations
  const cgVariations = differences.filter(diff => 
    Math.abs(diff.differences.capitalGains?.absolute || 0) > 2000
  );
  
  if (cgVariations.length > 0) {
    recommendations.push({
      id: 'capital-gains-timing',
      category: RECOMMENDATION_CATEGORIES.CAPITAL_GAINS,
      priority: PRIORITY_LEVELS.MEDIUM.level,
      title: 'Capital Gains Timing Strategy',
      description: 'Different capital gains realization timing shows varying tax impacts.',
      action: 'Consider timing capital gains to optimize tax rates and utilize lower brackets.',
      impact: 'Medium',
      timeframe: 'Current tax year',
      considerations: [
        'Evaluate 0% capital gains bracket opportunities',
        'Consider tax-loss harvesting strategies',
        'Plan for asset location optimization'
      ]
    });
  }
  
  return recommendations;
};

// Retirement planning recommendations
const generateRetirementPlanningRecommendations = (scenarios, differences) => {
  const recommendations = [];
  
  // Look for retirement income variations
  const retirementIncomeVariations = scenarios.some(s => 
    (s.metrics.ordinaryIncome || 0) > 50000 // Significant retirement income
  );
  
  if (retirementIncomeVariations) {
    recommendations.push({
      id: 'retirement-income-optimization',
      category: RECOMMENDATION_CATEGORIES.RETIREMENT_PLANNING,
      priority: PRIORITY_LEVELS.MEDIUM.level,
      title: 'Retirement Income Optimization',
      description: 'Different retirement income strategies show varying tax efficiency.',
      action: 'Consider optimizing the mix of taxable, tax-deferred, and tax-free retirement income.',
      impact: 'Medium to High',
      timeframe: 'Long-term retirement planning',
      considerations: [
        'Balance current tax savings with future tax costs',
        'Consider Roth conversion opportunities',
        'Plan for Required Minimum Distributions'
      ]
    });
  }
  
  return recommendations;
};

// Roth conversion recommendations
const generateRothConversionRecommendations = (scenarios, differences) => {
  const recommendations = [];
  
  // Look for scenarios that might benefit from Roth conversions
  const lowTaxScenarios = scenarios.filter(s => s.metrics.effectiveRate < 20);
  
  if (lowTaxScenarios.length > 0) {
    recommendations.push({
      id: 'roth-conversion-opportunity',
      category: RECOMMENDATION_CATEGORIES.ROTH_CONVERSION,
      priority: PRIORITY_LEVELS.MEDIUM.level,
      title: 'Roth Conversion Opportunity',
      description: 'Low effective tax rates in some scenarios suggest potential Roth conversion opportunities.',
      action: 'Consider Roth conversions during years with lower tax rates to optimize long-term tax efficiency.',
      impact: 'High (long-term)',
      timeframe: 'Multi-year strategy',
      considerations: [
        'Evaluate current vs future tax rate expectations',
        'Consider impact on Medicare IRMAA thresholds',
        'Plan conversion amounts to optimize tax brackets'
      ]
    });
  }
  
  return recommendations;
};

// Generate implementation timeline for recommendations
export const generateImplementationTimeline = (recommendations) => {
  const timeline = {
    immediate: [], // Within 30 days
    shortTerm: [], // 1-6 months
    mediumTerm: [], // 6-18 months
    longTerm: [] // 18+ months
  };
  
  recommendations.forEach(rec => {
    switch (rec.timeframe) {
      case 'Current tax year':
      case 'Immediate':
        timeline.immediate.push(rec);
        break;
      case 'Current and next tax year':
      case '1-6 months':
        timeline.shortTerm.push(rec);
        break;
      case '2 years prior to Medicare enrollment':
      case '6-18 months':
        timeline.mediumTerm.push(rec);
        break;
      case 'Long-term retirement planning':
      case 'Multi-year strategy':
      case 'Ongoing':
      default:
        timeline.longTerm.push(rec);
        break;
    }
  });
  
  return timeline;
};

// Calculate total potential savings from all recommendations
export const calculateTotalPotentialSavings = (recommendations) => {
  return recommendations.reduce((total, rec) => {
    return total + (rec.potentialSavings || 0);
  }, 0);
};

// Generate executive summary of recommendations
export const generateRecommendationSummary = (recommendations) => {
  const totalSavings = calculateTotalPotentialSavings(recommendations);
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const categories = [...new Set(recommendations.map(r => r.category))];
  
  return {
    totalRecommendations: recommendations.length,
    highPriorityCount: highPriority.length,
    totalPotentialSavings: totalSavings,
    categoriesCount: categories.length,
    categories: categories,
    topRecommendation: recommendations[0] || null,
    summary: `${recommendations.length} strategic recommendations identified with potential savings of ${formatCurrencyForReports(totalSavings)}. ${highPriority.length} high-priority actions require immediate attention.`
  };
};

export default {
  generateStrategicRecommendations,
  generateImplementationTimeline,
  calculateTotalPotentialSavings,
  generateRecommendationSummary,
  RECOMMENDATION_CATEGORIES,
  PRIORITY_LEVELS
};

