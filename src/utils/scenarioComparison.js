// Utility functions for scenario comparison and analysis

export const aggregateScenarioData = (scenarios) => {
  if (!scenarios || scenarios.length === 0) return null;

  return scenarios.map(scenario => {
    const data = scenario.data || {};
    const calculations = data.calculations || {};
    
    return {
      id: scenario.id,
      name: scenario.name || `Scenario ${scenario.id}`,
      description: scenario.description || '',
      isActive: scenario.isActive || false,
      metrics: {
        // Income metrics
        totalIncome: calculations.totalIncome || 0,
        ordinaryIncome: calculations.ordinaryIncome || 0,
        capitalGains: calculations.capitalGains || 0,
        socialSecurityIncome: calculations.socialSecurityIncome || 0,
        
        // Tax metrics
        federalTax: calculations.federalTax || 0,
        stateTax: calculations.stateTax || 0,
        ficaTax: calculations.ficaTax || 0,
        totalTax: calculations.totalTax || 0,
        
        // Rate metrics
        marginalRate: calculations.marginalRate || 0,
        effectiveRate: calculations.totalIncome > 0 ? 
          (calculations.totalTax / calculations.totalIncome * 100) : 0,
        
        // After-tax metrics
        afterTaxIncome: (calculations.totalIncome || 0) - (calculations.totalTax || 0),
        
        // Deductions
        standardDeduction: calculations.standardDeduction || 0,
        itemizedDeductions: calculations.itemizedDeductions || 0,
        totalDeductions: calculations.totalDeductions || 0,
        
        // Taxable income
        taxableIncome: calculations.taxableIncome || 0,
        
        // IRMAA and Medicare
        irmaaAmount: calculations.irmaaAmount || 0,
        medicarePartB: calculations.medicarePartB || 0,
        medicarePartD: calculations.medicarePartD || 0
      }
    };
  });
};

export const calculateScenarioDifferences = (baseScenario, compareScenarios) => {
  if (!baseScenario || !compareScenarios || compareScenarios.length === 0) {
    return [];
  }

  const baseMetrics = baseScenario.metrics;
  
  return compareScenarios.map(scenario => {
    const compareMetrics = scenario.metrics;
    const differences = {};    // Calculate absolute and percentage differences for each metric
    if (baseMetrics && typeof baseMetrics === 'object') {
      Object.keys(baseMetrics).forEach(key => {
        const baseValue = baseMetrics[key] || 0;
        const compareValue = compareMetrics[key] || 0;
        const absoluteDiff = compareValue - baseValue;
        const percentDiff = baseValue !== 0 ? (absoluteDiff / baseValue * 100) : 0;
        
        differences[key] = {
          base: baseValue,
          compare: compareValue,
          absolute: absoluteDiff,
          percent: percentDiff,
          trend: absoluteDiff > 0 ? 'increase' : absoluteDiff < 0 ? 'decrease' : 'unchanged'
        };
      });
    }
    
    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      differences
    };
  });
};

export const generateComparisonInsights = (scenarioComparisons) => {
  if (!scenarioComparisons || scenarioComparisons.length === 0) {
    return [];
  }

  const insights = [];
  
  scenarioComparisons.forEach(comparison => {
    const { scenarioName, differences } = comparison;
    const scenarioInsights = [];
    
    // Add null checks for differences properties
    if (!differences || typeof differences !== 'object') {
      return;
    }
    
    // Tax efficiency insights
    if (differences.totalTax && differences.totalTax.absolute < -1000) {
      scenarioInsights.push({
        type: 'positive',
        category: 'Tax Savings',
        message: `${scenarioName} saves $${Math.abs(differences.totalTax.absolute).toLocaleString()} in total taxes (${Math.abs(differences.totalTax.percent).toFixed(1)}% reduction)`
      });
    } else if (differences.totalTax && differences.totalTax.absolute > 1000) {
      scenarioInsights.push({
        type: 'negative',
        category: 'Tax Increase',
        message: `${scenarioName} increases total taxes by $${differences.totalTax.absolute.toLocaleString()} (${differences.totalTax.percent.toFixed(1)}% increase)`
      });
    }
    
    // Income insights
    if (differences.afterTaxIncome && differences.afterTaxIncome.absolute > 5000) {
      scenarioInsights.push({
        type: 'positive',
        category: 'Income Improvement',
        message: `${scenarioName} increases after-tax income by $${differences.afterTaxIncome.absolute.toLocaleString()}`
      });
    }
    
    // Rate insights
    if (differences.effectiveRate && differences.effectiveRate.absolute < -1) {
      scenarioInsights.push({
        type: 'positive',
        category: 'Rate Efficiency',
        message: `${scenarioName} reduces effective tax rate by ${Math.abs(differences.effectiveRate.absolute).toFixed(1)} percentage points`
      });
    }
    
    // IRMAA insights
    if (differences.irmaaAmount && differences.irmaaAmount.absolute < -500) {
      scenarioInsights.push({
        type: 'positive',
        category: 'Medicare Savings',
        message: `${scenarioName} avoids $${Math.abs(differences.irmaaAmount.absolute).toLocaleString()} in IRMAA surcharges`
      });
    } else if (differences.irmaaAmount.absolute > 500) {
      scenarioInsights.push({
        type: 'warning',
        category: 'Medicare Impact',
        message: `${scenarioName} triggers $${differences.irmaaAmount.absolute.toLocaleString()} in additional IRMAA surcharges`
      });
    }
    
    insights.push({
      scenarioId: comparison.scenarioId,
      scenarioName,
      insights: scenarioInsights
    });
  });
  
  return insights;
};

export const rankScenarios = (aggregatedScenarios, criteria = 'afterTaxIncome') => {
  if (!aggregatedScenarios || aggregatedScenarios.length === 0) {
    return [];
  }

  const ranked = [...aggregatedScenarios].sort((a, b) => {
    const aValue = a.metrics[criteria] || 0;
    const bValue = b.metrics[criteria] || 0;
    
    // For tax metrics, lower is better; for income metrics, higher is better
    const taxMetrics = ['totalTax', 'federalTax', 'stateTax', 'ficaTax', 'irmaaAmount'];
    const isLowerBetter = taxMetrics.includes(criteria);
    
    return isLowerBetter ? aValue - bValue : bValue - aValue;
  });

  return ranked.map((scenario, index) => ({
    ...scenario,
    rank: index + 1,
    isBest: index === 0,
    isWorst: index === ranked.length - 1
  }));
};

export const formatComparisonValue = (value, type = 'currency') => {
  if (value === null || value === undefined) return 'N/A';
  
  switch (type) {
    case 'currency':
      return `$${Math.abs(value).toLocaleString()}`;
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'number':
      return value.toLocaleString();
    default:
      return value.toString();
  }
};

export const getComparisonColor = (difference, isInverse = false) => {
  if (difference === 0) return 'text-gray-600';
  
  const isPositive = difference > 0;
  const shouldBeGreen = isInverse ? !isPositive : isPositive;
  
  return shouldBeGreen ? 'text-green-600' : 'text-red-600';
};

export const generateComparisonSummary = (baseScenario, compareScenarios) => {
  if (!baseScenario || !compareScenarios || compareScenarios.length === 0) {
    return null;
  }

  const differences = calculateScenarioDifferences(baseScenario, compareScenarios);
  const insights = generateComparisonInsights(differences);
  
  // Find the best scenario for key metrics
  const allScenarios = [baseScenario, ...compareScenarios];
  const bestAfterTax = rankScenarios(allScenarios, 'afterTaxIncome')[0];
  const lowestTax = rankScenarios(allScenarios, 'totalTax')[0];
  const bestRate = rankScenarios(allScenarios, 'effectiveRate')[0];

  return {
    baseScenario: baseScenario.name,
    compareScenarios: compareScenarios.map(s => s.name),
    totalComparisons: compareScenarios.length,
    differences,
    insights,
    recommendations: {
      bestAfterTaxIncome: bestAfterTax.name,
      lowestTotalTax: lowestTax.name,
      bestEffectiveRate: bestRate.name
    }
  };
};

