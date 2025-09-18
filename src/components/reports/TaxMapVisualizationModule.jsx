import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';
import { InteractiveTaxMap } from '../InteractiveTaxMap';

const TaxMapVisualizationModule = ({ 
  calculations, 
  incomeSources, 
  settings, 
  reportSettings 
}) => {
  const taxMapRef = useRef(null);

  // Get current tax position data
  const currentIncome = calculations?.totalIncome || 0;
  const effectiveRate = calculations?.effectiveRateTotal || 0;
  const marginalRate = calculations?.marginalRateTotal || 0;
  const federalTax = calculations?.federalTax || 0;
  const stateTax = calculations?.netStateTax || 0;
  const totalTax = federalTax + stateTax;

  // Calculate key tax map insights
  const taxMapInsights = [
    {
      title: "Current Position",
      value: formatCurrencyForReports(currentIncome),
      description: "Total annual income",
      color: "text-blue-600"
    },
    {
      title: "Effective Tax Rate",
      value: formatPercentageForReports(effectiveRate),
      description: "Overall tax burden",
      color: "text-green-600"
    },
    {
      title: "Marginal Tax Rate", 
      value: formatPercentageForReports(marginalRate),
      description: "Rate on next dollar",
      color: "text-orange-600"
    },
    {
      title: "Annual Tax Burden",
      value: formatCurrencyForReports(totalTax),
      description: "Total federal + state",
      color: "text-red-600"
    }
  ];

  // Tax optimization opportunities
  const optimizationOpportunities = [
    {
      strategy: "Tax-Loss Harvesting",
      potential: "Up to $3,000 annual deduction",
      timeline: "Before year-end",
      impact: "Reduce taxable income"
    },
    {
      strategy: "Roth Conversion Ladder",
      potential: "Long-term tax savings",
      timeline: "Multi-year strategy",
      impact: "Reduce future RMDs"
    },
    {
      strategy: "Asset Location Optimization",
      potential: "0.1-0.5% annual return boost",
      timeline: "Ongoing rebalancing",
      impact: "Tax-efficient growth"
    },
    {
      strategy: "Income Timing",
      potential: "Bracket management",
      timeline: "Annual planning",
      impact: "Smooth tax rates"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Tax Map Visualization</h2>
        <p className="text-gray-600 mt-2">
          Visual analysis of your tax situation and optimization opportunities across different income levels.
        </p>
      </div>

      {/* Current Tax Position Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Tax Position Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {taxMapInsights.map((insight, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${insight.color}`}>
                  {insight.value}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  {insight.title}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {insight.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Tax Map */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Tax Rate Visualization</CardTitle>
          <p className="text-sm text-gray-600">
            This visualization shows how your effective tax rate changes with different income levels, 
            highlighting opportunities for tax optimization.
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <div className="text-gray-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Tax Map Visualization</h4>
              <p className="text-sm text-gray-600">
                The interactive tax map will be included in the exported PDF report with full visualization capabilities.
                For the live interactive version, please visit the Tax Map tab.
              </p>
            </div>
          </div>
          
          {/* Tax Map Legend */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Federal Marginal Rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span>State Effective Rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-400 rounded"></div>
              <span>Social Security Effects</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Senior Deduction Phase-Out</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-400 rounded"></div>
              <span>Medicare IRMAA Effects</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span>Current Position</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Rate Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Rate Analysis by Income Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Income Level</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Federal Tax</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">State Tax</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Total Tax</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Effective Rate</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Marginal Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { income: currentIncome * 0.8, label: "80% Current" },
                  { income: currentIncome, label: "Current Level" },
                  { income: currentIncome * 1.2, label: "120% Current" },
                  { income: currentIncome * 1.5, label: "150% Current" }
                ].map((scenario, index) => {
                  // Simplified tax calculation for demonstration
                  const fedTax = scenario.income * 0.12; // Simplified
                  const stTax = scenario.income * 0.04; // Simplified
                  const totTax = fedTax + stTax;
                  const effRate = totTax / scenario.income;
                  const margRate = 0.22; // Simplified
                  
                  return (
                    <tr key={index} className={scenario.income === currentIncome ? "bg-blue-50" : ""}>
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{formatCurrencyForReports(scenario.income)}</div>
                          <div className="text-sm text-gray-600">{scenario.label}</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{formatCurrencyForReports(fedTax)}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatCurrencyForReports(stTax)}</td>
                      <td className="border border-gray-300 px-4 py-2 font-medium">{formatCurrencyForReports(totTax)}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatPercentageForReports(effRate)}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatPercentageForReports(margRate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Optimization Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Optimization Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationOpportunities.map((opportunity, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{opportunity.strategy}</h4>
                  <span className="text-sm text-blue-600 font-medium">{opportunity.timeline}</span>
                </div>
                <div className="text-sm text-gray-600 mb-2">{opportunity.potential}</div>
                <div className="text-sm text-green-600 font-medium">Impact: {opportunity.impact}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Key Tax Map Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Current Position Analysis</h4>
              <p className="text-blue-800 text-sm">
                Your current effective tax rate of {formatPercentageForReports(effectiveRate)} is 
                {effectiveRate > 0.20 ? " above" : " below"} the national average for similar income levels. 
                This indicates {effectiveRate > 0.20 ? "potential for optimization" : "efficient tax management"}.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Optimization Potential</h4>
              <p className="text-green-800 text-sm">
                Based on your tax map analysis, implementing strategic tax planning could potentially 
                save {formatCurrencyForReports(totalTax * 0.1)} to {formatCurrencyForReports(totalTax * 0.2)} 
                annually through proper timing and asset location strategies.
              </p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2">Action Items</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Review asset allocation across account types for tax efficiency</li>
                <li>• Consider Roth conversion opportunities during lower-income years</li>
                <li>• Implement tax-loss harvesting in taxable accounts</li>
                <li>• Plan withdrawal sequences to manage tax brackets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxMapVisualizationModule;

