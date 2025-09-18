import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

const CapitalGainsPlanningModule = ({ 
  calculations, 
  incomeSources, 
  assets,
  settings, 
  reportSettings 
}) => {
  // Calculate current capital gains situation
  const currentIncome = calculations?.totalIncome || 0;
  const filingStatus = settings?.filingStatus || 'single';
  
  // 2024 Capital Gains Tax Brackets
  const capitalGainsBrackets = {
    single: [
      { min: 0, max: 47025, rate: 0 },
      { min: 47025, max: 518900, rate: 0.15 },
      { min: 518900, max: Infinity, rate: 0.20 }
    ],
    marriedJoint: [
      { min: 0, max: 94050, rate: 0 },
      { min: 94050, max: 583750, rate: 0.15 },
      { min: 583750, max: Infinity, rate: 0.20 }
    ]
  };

  const brackets = capitalGainsBrackets[filingStatus] || capitalGainsBrackets.single;
  
  // Find current capital gains rate
  const getCurrentCGRate = (income) => {
    for (const bracket of brackets) {
      if (income >= bracket.min && income < bracket.max) {
        return bracket.rate;
      }
    }
    return 0.20;
  };

  const currentCGRate = getCurrentCGRate(currentIncome);

  // Calculate tax-loss harvesting opportunities
  const taxLossHarvestingData = [
    {
      strategy: "Short-term Loss Harvesting",
      potential: 3000,
      taxSavings: 3000 * 0.22, // At marginal rate
      description: "Harvest short-term losses to offset ordinary income"
    },
    {
      strategy: "Long-term Loss Harvesting", 
      potential: 10000,
      taxSavings: 10000 * currentCGRate,
      description: "Harvest long-term losses to offset capital gains"
    },
    {
      strategy: "Wash Sale Avoidance",
      potential: 5000,
      taxSavings: 5000 * currentCGRate,
      description: "Avoid wash sale rules while maintaining exposure"
    }
  ];

  // Asset location optimization
  const assetLocationData = [
    {
      account: "Taxable",
      current: "Mixed Assets",
      optimal: "Tax-Efficient Index Funds",
      benefit: "Minimize taxable distributions",
      annualSavings: 1200
    },
    {
      account: "Traditional IRA",
      current: "Index Funds",
      optimal: "Bonds & REITs",
      benefit: "Shield tax-inefficient assets",
      annualSavings: 800
    },
    {
      account: "Roth IRA",
      current: "Conservative",
      optimal: "High-Growth Stocks",
      benefit: "Tax-free growth on best performers",
      annualSavings: 1500
    }
  ];

  // Capital gains realization timing
  const realizationTimingData = [
    { year: 2024, income: currentIncome, cgRate: currentCGRate, gains: 0, tax: 0 },
    { year: 2025, income: currentIncome * 0.8, cgRate: getCurrentCGRate(currentIncome * 0.8), gains: 20000, tax: 20000 * getCurrentCGRate(currentIncome * 0.8) },
    { year: 2026, income: currentIncome * 0.9, cgRate: getCurrentCGRate(currentIncome * 0.9), gains: 15000, tax: 15000 * getCurrentCGRate(currentIncome * 0.9) },
    { year: 2027, income: currentIncome, cgRate: currentCGRate, gains: 25000, tax: 25000 * currentCGRate },
    { year: 2028, income: currentIncome * 1.1, cgRate: getCurrentCGRate(currentIncome * 1.1), gains: 30000, tax: 30000 * getCurrentCGRate(currentIncome * 1.1) }
  ];

  // Portfolio tax efficiency analysis
  const portfolioEfficiencyData = [
    { category: "Tax-Efficient", value: 60, color: "#10B981" },
    { category: "Tax-Inefficient", value: 25, color: "#EF4444" },
    { category: "Tax-Neutral", value: 15, color: "#6B7280" }
  ];

  const COLORS = ['#10B981', '#EF4444', '#6B7280'];

  // Calculate potential tax savings
  const totalTaxSavings = taxLossHarvestingData.reduce((sum, item) => sum + item.taxSavings, 0) +
                         assetLocationData.reduce((sum, item) => sum + item.annualSavings, 0);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Capital Gains Planning</h2>
        <p className="text-gray-600 mt-2">
          Strategic planning for capital gains realization, tax-loss harvesting, and asset location optimization.
        </p>
      </div>

      {/* Current Capital Gains Position */}
      <Card>
        <CardHeader>
          <CardTitle>Current Capital Gains Tax Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPercentageForReports(currentCGRate)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Current CG Rate</div>
              <div className="text-xs text-gray-600 mt-1">Long-term gains</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrencyForReports(brackets.find(b => currentIncome >= b.min && currentIncome < b.max)?.max - currentIncome || 0)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Room in Bracket</div>
              <div className="text-xs text-gray-600 mt-1">Before rate increase</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrencyForReports(totalTaxSavings)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Potential Savings</div>
              <div className="text-xs text-gray-600 mt-1">Annual optimization</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                3.8%
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">NIIT Rate</div>
              <div className="text-xs text-gray-600 mt-1">If income &gt; $200K</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capital Gains Rate by Income Level */}
      <Card>
        <CardHeader>
          <CardTitle>Capital Gains Rate by Income Level</CardTitle>
          <p className="text-sm text-gray-600">
            How your capital gains tax rate changes with different income levels.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={realizationTimingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Capital Gains Rate') return [`${(value * 100).toFixed(1)}%`, name];
                    return [formatCurrencyForReports(value), name];
                  }}
                />
                <Legend />
                <Bar yAxisId="right" dataKey="income" fill="#3B82F6" name="Income Level" />
                <Bar yAxisId="left" dataKey="cgRate" fill="#10B981" name="Capital Gains Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tax-Loss Harvesting Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Tax-Loss Harvesting Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taxLossHarvestingData.map((opportunity, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{opportunity.strategy}</h4>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrencyForReports(opportunity.taxSavings)}
                    </div>
                    <div className="text-sm text-gray-600">Tax Savings</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">{opportunity.description}</p>
                <div className="bg-green-50 p-3 rounded-md">
                  <div className="text-sm text-green-800">
                    Potential Loss Harvest: {formatCurrencyForReports(opportunity.potential)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Total Annual Tax Savings Potential</h4>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrencyForReports(taxLossHarvestingData.reduce((sum, item) => sum + item.taxSavings, 0))}
            </div>
            <p className="text-blue-800 text-sm mt-1">
              Through strategic tax-loss harvesting across all account types
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Asset Location Optimization */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Location Optimization</CardTitle>
          <p className="text-sm text-gray-600">
            Optimize which investments to hold in which account types for maximum tax efficiency.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Account Type</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Current Allocation</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Optimal Allocation</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Benefit</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Annual Savings</th>
                </tr>
              </thead>
              <tbody>
                {assetLocationData.map((location, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{location.account}</td>
                    <td className="border border-gray-300 px-4 py-2">{location.current}</td>
                    <td className="border border-gray-300 px-4 py-2 text-green-600 font-medium">{location.optimal}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{location.benefit}</td>
                    <td className="border border-gray-300 px-4 py-2 font-bold text-green-600">
                      {formatCurrencyForReports(location.annualSavings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Tax Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle>Current Portfolio Tax Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioEfficiencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {portfolioEfficiencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <div>
                  <div className="font-medium">Tax-Efficient (60%)</div>
                  <div className="text-sm text-gray-600">Index funds, tax-managed funds</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <div>
                  <div className="font-medium">Tax-Inefficient (25%)</div>
                  <div className="text-sm text-gray-600">Actively managed funds, REITs</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <div>
                  <div className="font-medium">Tax-Neutral (15%)</div>
                  <div className="text-sm text-gray-600">Municipal bonds, cash</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">Optimization Target</h4>
                <p className="text-yellow-800 text-sm">
                  Move tax-inefficient holdings to tax-advantaged accounts to improve overall efficiency to 80%+
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capital Gains Realization Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Capital Gains Realization</CardTitle>
          <p className="text-sm text-gray-600">
            Optimal timing for realizing capital gains based on projected income levels.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={realizationTimingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip 
                  formatter={(value, name) => [formatCurrencyForReports(value), name]}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="income" stroke="#3B82F6" strokeWidth={2} name="Projected Income" />
                <Line yAxisId="right" type="monotone" dataKey="gains" stroke="#10B981" strokeWidth={2} name="Planned Gains Realization" />
                <Line yAxisId="right" type="monotone" dataKey="tax" stroke="#EF4444" strokeWidth={2} name="Capital Gains Tax" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">2025 Opportunity</h4>
              <p className="text-green-800 text-sm">
                Lower income year - realize {formatCurrencyForReports(20000)} in gains at {formatPercentageForReports(getCurrentCGRate(currentIncome * 0.8))} rate
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">2026-2027 Strategy</h4>
              <p className="text-blue-800 text-sm">
                Moderate realization to stay within {formatPercentageForReports(currentCGRate)} bracket
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2">2028+ Planning</h4>
              <p className="text-yellow-800 text-sm">
                Higher income - minimize gains realization or consider tax-loss harvesting
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Action Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Action Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Immediate Actions (Next 30 Days)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">1.</span>
                  <span>Review current taxable account holdings for tax-loss harvesting opportunities</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">2.</span>
                  <span>Identify underperforming positions with unrealized losses</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">3.</span>
                  <span>Plan year-end tax-loss harvesting strategy before December 31st</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Short-term Actions (Next 3 Months)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-orange-500 font-bold">1.</span>
                  <span>Implement asset location optimization across account types</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-500 font-bold">2.</span>
                  <span>Move tax-inefficient investments to tax-advantaged accounts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-orange-500 font-bold">3.</span>
                  <span>Establish systematic rebalancing process using new contributions</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Long-term Strategy (Ongoing)</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">1.</span>
                  <span>Monitor income levels annually to optimize capital gains realization timing</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">2.</span>
                  <span>Coordinate capital gains with other income sources for bracket management</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 font-bold">3.</span>
                  <span>Review and update asset location strategy as portfolio grows</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary and Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary & Key Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Potential Annual Tax Savings</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Tax-Loss Harvesting:</span>
                  <span className="font-medium">{formatCurrencyForReports(taxLossHarvestingData.reduce((sum, item) => sum + item.taxSavings, 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Asset Location Optimization:</span>
                  <span className="font-medium">{formatCurrencyForReports(assetLocationData.reduce((sum, item) => sum + item.annualSavings, 0))}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total Annual Savings:</span>
                  <span className="font-bold text-green-600">{formatCurrencyForReports(totalTaxSavings)}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Key Recommendations</h4>
              <ul className="space-y-2 text-sm">
                <li>• Harvest {formatCurrencyForReports(18000)} in tax losses annually</li>
                <li>• Optimize asset location for {formatCurrencyForReports(3500)} annual savings</li>
                <li>• Time capital gains realization during lower-income years</li>
                <li>• Maintain tax-efficient portfolio allocation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapitalGainsPlanningModule;

