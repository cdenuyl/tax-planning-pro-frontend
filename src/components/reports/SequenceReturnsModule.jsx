import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

const SequenceReturnsModule = ({ 
  calculations, 
  incomeSources, 
  assets,
  settings, 
  reportSettings 
}) => {
  // Calculate total portfolio value
  const totalPortfolio = assets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 500000;
  const annualWithdrawal = calculations?.totalIncome || 60000;
  const withdrawalRate = annualWithdrawal / totalPortfolio;

  // Generate sequence of returns scenarios
  const generateScenarios = () => {
    const years = 30;
    const scenarios = [];
    
    // Scenario 1: Good early returns (7%, 8%, 9%, then average 6%)
    const goodEarly = [];
    let balance1 = totalPortfolio;
    for (let year = 1; year <= years; year++) {
      const returnRate = year <= 3 ? [0.07, 0.08, 0.09][year - 1] : 0.06;
      balance1 = balance1 * (1 + returnRate) - annualWithdrawal;
      goodEarly.push({
        year,
        goodEarly: Math.max(0, balance1),
        return: returnRate
      });
    }
    
    // Scenario 2: Poor early returns (-10%, -5%, 2%, then average 6%)
    const poorEarly = [];
    let balance2 = totalPortfolio;
    for (let year = 1; year <= years; year++) {
      const returnRate = year <= 3 ? [-0.10, -0.05, 0.02][year - 1] : 0.06;
      balance2 = balance2 * (1 + returnRate) - annualWithdrawal;
      poorEarly.push({
        year,
        poorEarly: Math.max(0, balance2),
        return: returnRate
      });
    }
    
    // Scenario 3: Average returns throughout (6%)
    const average = [];
    let balance3 = totalPortfolio;
    for (let year = 1; year <= years; year++) {
      const returnRate = 0.06;
      balance3 = balance3 * (1 + returnRate) - annualWithdrawal;
      average.push({
        year,
        average: Math.max(0, balance3),
        return: returnRate
      });
    }
    
    // Combine scenarios
    for (let year = 1; year <= years; year++) {
      scenarios.push({
        year,
        goodEarly: goodEarly[year - 1].goodEarly,
        poorEarly: poorEarly[year - 1].poorEarly,
        average: average[year - 1].average
      });
    }
    
    return scenarios;
  };

  const scenarioData = generateScenarios();

  // Calculate key metrics
  const portfolioDepletion = {
    goodEarly: scenarioData.findIndex(s => s.goodEarly <= 0) + 1 || 30,
    poorEarly: scenarioData.findIndex(s => s.poorEarly <= 0) + 1 || 30,
    average: scenarioData.findIndex(s => s.average <= 0) + 1 || 30
  };

  // Risk mitigation strategies
  const riskMitigationStrategies = [
    {
      strategy: "Bond Tent Strategy",
      description: "Gradually increase bond allocation as you approach and enter retirement",
      implementation: "Start at 30% bonds, increase to 50% by retirement",
      benefit: "Reduces portfolio volatility during critical early retirement years"
    },
    {
      strategy: "Cash Buffer",
      description: "Maintain 1-2 years of expenses in cash/short-term bonds",
      implementation: `Keep ${formatCurrencyForReports(annualWithdrawal * 1.5)} in liquid assets`,
      benefit: "Avoid selling investments during market downturns"
    },
    {
      strategy: "Flexible Withdrawal Strategy",
      description: "Adjust withdrawal amounts based on portfolio performance",
      implementation: "Reduce withdrawals by 10-20% during poor market years",
      benefit: "Extends portfolio longevity significantly"
    },
    {
      strategy: "Asset Location Optimization",
      description: "Place tax-inefficient investments in tax-advantaged accounts",
      implementation: "Bonds in IRA, stocks in taxable accounts",
      benefit: "Improves after-tax returns and withdrawal flexibility"
    }
  ];

  // Generate annual return scenarios for chart
  const returnScenarios = [
    { year: 1, goodEarly: 7, poorEarly: -10, average: 6 },
    { year: 2, goodEarly: 8, poorEarly: -5, average: 6 },
    { year: 3, goodEarly: 9, poorEarly: 2, average: 6 },
    { year: 4, goodEarly: 6, poorEarly: 6, average: 6 },
    { year: 5, goodEarly: 6, poorEarly: 6, average: 6 },
    { year: 6, goodEarly: 6, poorEarly: 6, average: 6 },
    { year: 7, goodEarly: 6, poorEarly: 6, average: 6 },
    { year: 8, goodEarly: 6, poorEarly: 6, average: 6 },
    { year: 9, goodEarly: 6, poorEarly: 6, average: 6 },
    { year: 10, goodEarly: 6, poorEarly: 6, average: 6 }
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Sequence of Returns Analysis</h2>
        <p className="text-gray-600 mt-2">
          Analysis of how the timing of investment returns affects portfolio sustainability during retirement.
        </p>
      </div>

      {/* Current Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrencyForReports(totalPortfolio)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Total Portfolio</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrencyForReports(annualWithdrawal)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Annual Withdrawal</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatPercentageForReports(withdrawalRate)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Withdrawal Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {portfolioDepletion.average > 30 ? "30+" : portfolioDepletion.average}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Years (Average)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Return Sequence Scenarios Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Return Sequence Scenarios (First 10 Years)</CardTitle>
          <p className="text-sm text-gray-600">
            Comparison of different return sequences and their impact on early retirement years.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={returnScenarios}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Bar dataKey="goodEarly" fill="#10B981" name="Good Early Returns" />
                <Bar dataKey="poorEarly" fill="#EF4444" name="Poor Early Returns" />
                <Bar dataKey="average" fill="#6B7280" name="Average Returns" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Value Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value Projections (30 Years)</CardTitle>
          <p className="text-sm text-gray-600">
            How different return sequences affect portfolio longevity over time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => [formatCurrencyForReports(value), '']} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="goodEarly" 
                  stackId="1" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  name="Good Early Returns"
                />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stackId="2" 
                  stroke="#6B7280" 
                  fill="#6B7280" 
                  fillOpacity={0.3}
                  name="Average Returns"
                />
                <Area 
                  type="monotone" 
                  dataKey="poorEarly" 
                  stackId="3" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.3}
                  name="Poor Early Returns"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Outcomes Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Scenario</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Portfolio Depletion</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Value at Year 10</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Value at Year 20</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">Good Early Returns</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {portfolioDepletion.goodEarly > 30 ? "Never (30+ years)" : `Year ${portfolioDepletion.goodEarly}`}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatCurrencyForReports(scenarioData[9]?.goodEarly || 0)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatCurrencyForReports(scenarioData[19]?.goodEarly || 0)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-green-600">Low</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2 font-medium">Average Returns</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {portfolioDepletion.average > 30 ? "Never (30+ years)" : `Year ${portfolioDepletion.average}`}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatCurrencyForReports(scenarioData[9]?.average || 0)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatCurrencyForReports(scenarioData[19]?.average || 0)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-yellow-600">Moderate</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">Poor Early Returns</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {portfolioDepletion.poorEarly > 30 ? "Never (30+ years)" : `Year ${portfolioDepletion.poorEarly}`}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatCurrencyForReports(scenarioData[9]?.poorEarly || 0)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatCurrencyForReports(scenarioData[19]?.poorEarly || 0)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-red-600">High</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Risk Mitigation Strategies */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Mitigation Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskMitigationStrategies.map((strategy, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{strategy.strategy}</h4>
                <p className="text-gray-600 text-sm mb-2">{strategy.description}</p>
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">Implementation:</div>
                    <div className="text-blue-800">{strategy.implementation}</div>
                  </div>
                  <div className="text-sm mt-2">
                    <div className="font-medium text-green-900">Benefit:</div>
                    <div className="text-green-800">{strategy.benefit}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Sequence Risk Alert</h4>
              <p className="text-red-800 text-sm">
                Poor early returns could reduce portfolio longevity by {portfolioDepletion.average - portfolioDepletion.poorEarly} years. 
                Your current {formatPercentageForReports(withdrawalRate)} withdrawal rate requires careful monitoring.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Optimization Opportunity</h4>
              <p className="text-blue-800 text-sm">
                Implementing a flexible withdrawal strategy could extend portfolio life by 3-5 years even in poor return scenarios.
                Consider reducing withdrawals by 10% during market downturns.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">✅ Action Items</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Establish a cash buffer of {formatCurrencyForReports(annualWithdrawal * 1.5)} for market volatility</li>
                <li>• Consider increasing bond allocation to 40-50% to reduce early retirement risk</li>
                <li>• Implement a flexible spending plan that can adjust to market conditions</li>
                <li>• Review withdrawal strategy annually and adjust based on portfolio performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SequenceReturnsModule;

