import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

// Color palette for scenarios
const SCENARIO_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green  
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316'  // Orange
];

// Custom tooltip for currency values
const CurrencyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-medium text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            <span className="font-medium">{entry.dataKey}:</span> {formatCurrencyForReports(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for percentage values
const PercentageTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
        <p className="font-medium text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            <span className="font-medium">{entry.dataKey}:</span> {formatPercentageForReports(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Income comparison bar chart
export const IncomeComparisonChart = ({ scenarios, height = 300 }) => {
  if (!scenarios || scenarios.length === 0) return null;

  const data = scenarios.map((scenario, index) => ({
    name: scenario.name,
    'Total Income': scenario.metrics.totalIncome,
    'Ordinary Income': scenario.metrics.ordinaryIncome,
    'Capital Gains': scenario.metrics.capitalGains,
    'Social Security': scenario.metrics.socialSecurityIncome,
    color: SCENARIO_COLORS[index % SCENARIO_COLORS.length]
  }));

  return (
    <div className="w-full">
      <h4 className="text-lg font-medium text-gray-800 mb-4">Income Sources Comparison</h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip content={<CurrencyTooltip />} />
          <Legend />
          <Bar dataKey="Ordinary Income" stackId="a" fill="#3b82f6" />
          <Bar dataKey="Capital Gains" stackId="a" fill="#10b981" />
          <Bar dataKey="Social Security" stackId="a" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Tax comparison bar chart
export const TaxComparisonChart = ({ scenarios, height = 300 }) => {
  if (!scenarios || scenarios.length === 0) return null;

  const data = scenarios.map((scenario, index) => ({
    name: scenario.name,
    'Federal Tax': scenario.metrics.federalTax,
    'State Tax': scenario.metrics.stateTax,
    'FICA Tax': scenario.metrics.ficaTax,
    'IRMAA': scenario.metrics.irmaaAmount,
    color: SCENARIO_COLORS[index % SCENARIO_COLORS.length]
  }));

  return (
    <div className="w-full">
      <h4 className="text-lg font-medium text-gray-800 mb-4">Tax Liability Comparison</h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip content={<CurrencyTooltip />} />
          <Legend />
          <Bar dataKey="Federal Tax" stackId="a" fill="#ef4444" />
          <Bar dataKey="State Tax" stackId="a" fill="#f97316" />
          <Bar dataKey="FICA Tax" stackId="a" fill="#8b5cf6" />
          <Bar dataKey="IRMAA" stackId="a" fill="#06b6d4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Effective rate comparison line chart
export const EffectiveRateComparisonChart = ({ scenarios, height = 300 }) => {
  if (!scenarios || scenarios.length === 0) return null;

  const data = scenarios.map((scenario, index) => ({
    name: scenario.name,
    'Effective Rate': scenario.metrics.effectiveRate,
    'Marginal Rate': scenario.metrics.marginalRate,
    color: SCENARIO_COLORS[index % SCENARIO_COLORS.length]
  }));

  return (
    <div className="w-full">
      <h4 className="text-lg font-medium text-gray-800 mb-4">Tax Rate Comparison</h4>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
          <Tooltip content={<PercentageTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Effective Rate" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="Marginal Rate" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// After-tax income comparison chart
export const AfterTaxIncomeChart = ({ scenarios, height = 300 }) => {
  if (!scenarios || scenarios.length === 0) return null;

  const data = scenarios.map((scenario, index) => ({
    name: scenario.name,
    'Total Income': scenario.metrics.totalIncome,
    'Total Tax': scenario.metrics.totalTax,
    'After-Tax Income': scenario.metrics.afterTaxIncome,
    color: SCENARIO_COLORS[index % SCENARIO_COLORS.length]
  }));

  return (
    <div className="w-full">
      <h4 className="text-lg font-medium text-gray-800 mb-4">After-Tax Income Analysis</h4>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip content={<CurrencyTooltip />} />
          <Legend />
          <Bar dataKey="Total Tax" fill="#ef4444" />
          <Bar dataKey="After-Tax Income" fill="#10b981" />
          <Line 
            type="monotone" 
            dataKey="Total Income" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Scenario ranking chart
export const ScenarioRankingChart = ({ scenarios, metric = 'afterTaxIncome', height = 300 }) => {
  if (!scenarios || scenarios.length === 0) return null;

  const metricLabels = {
    afterTaxIncome: 'After-Tax Income',
    totalTax: 'Total Tax',
    effectiveRate: 'Effective Rate',
    totalIncome: 'Total Income'
  };

  const isLowerBetter = ['totalTax', 'effectiveRate'].includes(metric);
  
  const sortedData = [...scenarios].sort((a, b) => {
    const aValue = a.metrics[metric] || 0;
    const bValue = b.metrics[metric] || 0;
    return isLowerBetter ? aValue - bValue : bValue - aValue;
  });

  const data = sortedData.map((scenario, index) => ({
    name: scenario.name,
    value: scenario.metrics[metric],
    rank: index + 1,
    color: SCENARIO_COLORS[index % SCENARIO_COLORS.length],
    isBest: index === 0,
    isWorst: index === sortedData.length - 1
  }));

  const formatValue = (value) => {
    if (metric === 'effectiveRate' || metric === 'marginalRate') {
      return formatPercentageForReports(value);
    }
    return formatCurrencyForReports(value);
  };

  return (
    <div className="w-full">
      <h4 className="text-lg font-medium text-gray-800 mb-4">
        Scenario Ranking by {metricLabels[metric]}
      </h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => 
              metric === 'effectiveRate' || metric === 'marginalRate' 
                ? `${value.toFixed(1)}%` 
                : `$${(value / 1000).toFixed(0)}k`
            } 
          />
          <YAxis type="category" dataKey="name" />
          <Tooltip 
            formatter={(value) => [formatValue(value), metricLabels[metric]]}
            labelFormatter={(label) => `Scenario: ${label}`}
          />
          <Bar 
            dataKey="value" 
            fill={(entry) => entry.isBest ? '#10b981' : entry.isWorst ? '#ef4444' : '#3b82f6'}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isBest ? '#10b981' : entry.isWorst ? '#ef4444' : '#3b82f6'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Delta comparison chart (shows changes vs base scenario)
export const DeltaComparisonChart = ({ baseScenario, compareScenarios, differences, metric = 'totalTax', height = 300 }) => {
  if (!differences || differences.length === 0) return null;

  const metricLabels = {
    totalTax: 'Total Tax Change',
    afterTaxIncome: 'After-Tax Income Change',
    effectiveRate: 'Effective Rate Change',
    federalTax: 'Federal Tax Change'
  };

  const data = differences.map((diff, index) => ({
    name: diff.scenarioName,
    absolute: diff.differences[metric]?.absolute || 0,
    percent: diff.differences[metric]?.percent || 0,
    color: SCENARIO_COLORS[(index + 1) % SCENARIO_COLORS.length]
  }));

  const isPercentageMetric = metric === 'effectiveRate' || metric === 'marginalRate';

  return (
    <div className="w-full">
      <h4 className="text-lg font-medium text-gray-800 mb-4">
        {metricLabels[metric]} vs {baseScenario.name}
      </h4>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            tickFormatter={(value) => 
              isPercentageMetric 
                ? `${value > 0 ? '+' : ''}${value.toFixed(1)}pp`
                : `${value > 0 ? '+' : ''}$${(Math.abs(value) / 1000).toFixed(0)}k`
            } 
          />
          <Tooltip 
            formatter={(value) => [
              isPercentageMetric 
                ? `${value > 0 ? '+' : ''}${value.toFixed(2)} percentage points`
                : `${value > 0 ? '+' : ''}${formatCurrencyForReports(Math.abs(value))}`,
              metricLabels[metric]
            ]}
          />
          <Bar dataKey="absolute">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.absolute > 0 ? '#ef4444' : '#10b981'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Comprehensive comparison dashboard
export const ComparisonDashboard = ({ scenarios, baseScenario, differences }) => {
  if (!scenarios || scenarios.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeComparisonChart scenarios={scenarios} />
        <TaxComparisonChart scenarios={scenarios} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EffectiveRateComparisonChart scenarios={scenarios} />
        <AfterTaxIncomeChart scenarios={scenarios} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScenarioRankingChart scenarios={scenarios} metric="afterTaxIncome" />
        <ScenarioRankingChart scenarios={scenarios} metric="totalTax" />
      </div>
      
      {differences && differences.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeltaComparisonChart 
            baseScenario={baseScenario} 
            compareScenarios={scenarios.filter(s => s.id !== baseScenario.id)} 
            differences={differences} 
            metric="totalTax" 
          />
          <DeltaComparisonChart 
            baseScenario={baseScenario} 
            compareScenarios={scenarios.filter(s => s.id !== baseScenario.id)} 
            differences={differences} 
            metric="afterTaxIncome" 
          />
        </div>
      )}
    </div>
  );
};

export default {
  IncomeComparisonChart,
  TaxComparisonChart,
  EffectiveRateComparisonChart,
  AfterTaxIncomeChart,
  ScenarioRankingChart,
  DeltaComparisonChart,
  ComparisonDashboard
};

