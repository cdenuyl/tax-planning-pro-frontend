import React from 'react';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

// Side-by-side comparison table template
export const SideBySideComparisonTable = ({ scenarios, metrics, title }) => {
  if (!scenarios || scenarios.length === 0) return null;

  const metricDefinitions = {
    totalIncome: { label: 'Total Income', type: 'currency' },
    ordinaryIncome: { label: 'Ordinary Income', type: 'currency' },
    capitalGains: { label: 'Capital Gains', type: 'currency' },
    socialSecurityIncome: { label: 'Social Security Income', type: 'currency' },
    federalTax: { label: 'Federal Tax', type: 'currency' },
    stateTax: { label: 'State Tax', type: 'currency' },
    ficaTax: { label: 'FICA Tax', type: 'currency' },
    totalTax: { label: 'Total Tax', type: 'currency' },
    marginalRate: { label: 'Marginal Rate', type: 'percentage' },
    effectiveRate: { label: 'Effective Rate', type: 'percentage' },
    afterTaxIncome: { label: 'After-Tax Income', type: 'currency' },
    standardDeduction: { label: 'Standard Deduction', type: 'currency' },
    taxableIncome: { label: 'Taxable Income', type: 'currency' },
    irmaaAmount: { label: 'IRMAA Surcharges', type: 'currency' }
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return 'N/A';
    switch (type) {
      case 'currency':
        return formatCurrencyForReports(value);
      case 'percentage':
        return formatPercentageForReports(value);
      default:
        return value.toString();
    }
  };

  return (
    <div className="comparison-table mb-8">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Metric</th>
              {scenarios.map((scenario, index) => (
                <th key={scenario.id} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {scenario.name}
                  {scenario.isActive && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metricKey) => {
              const metricDef = metricDefinitions[metricKey];
              if (!metricDef) return null;

              return (
                <tr key={metricKey} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    {metricDef.label}
                  </td>
                  {scenarios.map((scenario) => (
                    <td key={scenario.id} className="border border-gray-300 px-4 py-2 text-center">
                      {formatValue(scenario.metrics[metricKey], metricDef.type)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Delta analysis table template
export const DeltaAnalysisTable = ({ baseScenario, compareScenarios, differences, title }) => {
  if (!baseScenario || !compareScenarios || !differences) return null;

  const metricDefinitions = {
    totalIncome: { label: 'Total Income', type: 'currency', inverse: false },
    totalTax: { label: 'Total Tax', type: 'currency', inverse: true },
    effectiveRate: { label: 'Effective Rate', type: 'percentage', inverse: true },
    afterTaxIncome: { label: 'After-Tax Income', type: 'currency', inverse: false },
    federalTax: { label: 'Federal Tax', type: 'currency', inverse: true },
    stateTax: { label: 'State Tax', type: 'currency', inverse: true },
    irmaaAmount: { label: 'IRMAA Surcharges', type: 'currency', inverse: true }
  };

  const formatDifference = (diff, type) => {
    if (!diff || diff.absolute === 0) return '—';
    
    const sign = diff.absolute > 0 ? '+' : '';
    const absValue = Math.abs(diff.absolute);
    const percentValue = Math.abs(diff.percent);
    
    switch (type) {
      case 'currency':
        return `${sign}${formatCurrencyForReports(absValue)} (${sign}${percentValue.toFixed(1)}%)`;
      case 'percentage':
        return `${sign}${percentValue.toFixed(2)}pp`;
      default:
        return `${sign}${absValue.toLocaleString()}`;
    }
  };

  const getDifferenceColor = (diff, inverse = false) => {
    if (!diff || diff.absolute === 0) return 'text-gray-600';
    
    const isPositive = diff.absolute > 0;
    const shouldBeGreen = inverse ? !isPositive : isPositive;
    
    return shouldBeGreen ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="delta-analysis-table mb-8">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          <strong>Base Scenario:</strong> {baseScenario.name} | 
          <strong className="ml-2">Comparing:</strong> {compareScenarios.map(s => s.name).join(', ')}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Metric</th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                {baseScenario.name}
              </th>
              {differences.map((diff) => (
                <th key={diff.scenarioId} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                  {diff.scenarioName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(metricDefinitions).map((metricKey) => {
              const metricDef = metricDefinitions[metricKey];
              
              return (
                <tr key={metricKey} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    {metricDef.label}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {metricDef.type === 'currency' 
                      ? formatCurrencyForReports(baseScenario.metrics[metricKey] || 0)
                      : formatPercentageForReports(baseScenario.metrics[metricKey] || 0)
                    }
                  </td>
                  {differences.map((diff) => {
                    const metricDiff = diff.differences[metricKey];
                    return (
                      <td 
                        key={diff.scenarioId} 
                        className={`border border-gray-300 px-4 py-2 text-center font-medium ${getDifferenceColor(metricDiff, metricDef.inverse)}`}
                      >
                        {formatDifference(metricDiff, metricDef.type)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Summary comparison card template
export const ComparisonSummaryCard = ({ summary, className = '' }) => {
  if (!summary) return null;

  return (
    <div className={`comparison-summary-card bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Comparison Summary</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Best After-Tax Income</h4>
          <p className="text-green-700">{summary.recommendations.bestAfterTaxIncome}</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Lowest Total Tax</h4>
          <p className="text-blue-700">{summary.recommendations.lowestTotalTax}</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-800 mb-2">Best Effective Rate</h4>
          <p className="text-purple-700">{summary.recommendations.bestEffectiveRate}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Key Insights</h4>
        {summary.insights.map((scenarioInsight, index) => (
          <div key={index} className="border-l-4 border-gray-200 pl-4">
            <h5 className="font-medium text-gray-700 mb-2">{scenarioInsight.scenarioName}</h5>
            <div className="space-y-1">
              {scenarioInsight.insights.map((insight, insightIndex) => (
                <div 
                  key={insightIndex}
                  className={`text-sm p-2 rounded ${
                    insight.type === 'positive' ? 'bg-green-50 text-green-700' :
                    insight.type === 'negative' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  <span className="font-medium">{insight.category}:</span> {insight.message}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Responsive comparison layout wrapper
export const ComparisonReportLayout = ({ children, title, scenarios }) => {
  return (
    <div className="comparison-report-layout max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <div className="text-sm text-gray-600">
          Comparing {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}: {scenarios.map(s => s.name).join(', ')}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div className="space-y-8">
        {children}
      </div>
      
      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
        Tax Planning Analysis - Multi-Scenario Comparison Report
      </div>
    </div>
  );
};

// Export all templates
export default {
  SideBySideComparisonTable,
  DeltaAnalysisTable,
  ComparisonSummaryCard,
  ComparisonReportLayout
};

