import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/taxCalculations';
import { 
  formatCurrencyForReports, 
  formatPercentageForReports, 
  getIncomeSourceTaxAnalysis,
  truncateText 
} from '../../utils/reportFormatting';

export function CurrentTaxPositionModule({ calculations, incomeSources, settings, reportSettings }) {
  const {
    totalIncome,
    federalTaxableIncome,
    federalTax,
    netStateTax,
    effectiveRateFederal,
    effectiveRateTotal,
    marginalRateFederal,
    marginalRateTotal,
    totalTax,
    filingStatus = 'single'
  } = calculations;

  // Prepare income breakdown data with proper tax analysis
  const incomeBreakdown = incomeSources?.map(source => {
    const taxAnalysis = getIncomeSourceTaxAnalysis(source, calculations);
    return {
      name: truncateText(source.name || source.type, 25),
      amount: source.frequency === 'monthly' ? source.amount * 12 : source.amount,
      type: source.type,
      taxStatus: taxAnalysis.status,
      taxDescription: taxAnalysis.description,
      estimatedTax: taxAnalysis.estimatedTax,
      afterTaxAmount: taxAnalysis.afterTaxAmount,
      color: taxAnalysis.color,
      bgColor: taxAnalysis.bgColor
    };
  }) || [];

  // Tax breakdown for pie chart
  const taxBreakdown = [
    { name: 'Federal Tax', value: federalTax, color: '#dc2626' },
    { name: 'State Tax', value: netStateTax, color: '#ea580c' },
    { name: 'After-Tax Income', value: totalIncome - totalTax, color: '#16a34a' }
  ];

  // Tax bracket analysis
  const taxBrackets = [
    { bracket: '10%', min: 0, max: filingStatus === 'marriedFilingJointly' ? 23200 : 11600 },
    { bracket: '12%', min: filingStatus === 'marriedFilingJointly' ? 23200 : 11600, max: filingStatus === 'marriedFilingJointly' ? 94300 : 47150 },
    { bracket: '22%', min: filingStatus === 'marriedFilingJointly' ? 94300 : 47150, max: filingStatus === 'marriedFilingJointly' ? 201050 : 100525 },
    { bracket: '24%', min: filingStatus === 'marriedFilingJointly' ? 201050 : 100525, max: filingStatus === 'marriedFilingJointly' ? 383900 : 191950 }
  ];

  const currentBracket = taxBrackets.find(bracket => 
    federalTaxableIncome >= bracket.min && federalTaxableIncome < bracket.max
  ) || taxBrackets[taxBrackets.length - 1];

  // Calculate position within current bracket
  const bracketProgress = currentBracket ? 
    ((federalTaxableIncome - currentBracket.min) / (currentBracket.max - currentBracket.min)) * 100 : 0;

  const COLORS = ['#dc2626', '#ea580c', '#16a34a'];

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Section Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Current Tax Position Analysis</h2>
        <p className="text-gray-600 mt-2">
          Detailed breakdown of your current tax situation and positioning within federal tax brackets
        </p>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrencyForReports(totalIncome)}
              </div>
              <div className="text-sm text-blue-700">Total Income</div>
              <div className="text-xs text-gray-500 mt-1">
                All income sources combined
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrencyForReports(federalTaxableIncome)}
              </div>
              <div className="text-sm text-green-700">Taxable Income</div>
              <div className="text-xs text-gray-500 mt-1">
                After deductions & exemptions
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-900">
                {formatPercentageForReports(effectiveRateTotal)}
              </div>
              <div className="text-sm text-red-700">Effective Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Total tax ÷ Total income
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">
                {formatPercentageForReports(marginalRateTotal)}
              </div>
              <div className="text-sm text-purple-700">Marginal Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Rate on next dollar earned
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Bracket Position */}
      <Card>
        <CardHeader>
          <CardTitle>Federal Tax Bracket Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Current Bracket: {currentBracket?.bracket}</div>
                <div className="text-sm text-gray-600">
                  Range: {formatCurrencyForReports(currentBracket?.min)} - {formatCurrencyForReports(currentBracket?.max)}
                </div>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {currentBracket?.bracket}
              </Badge>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Position in Bracket</span>
                <span>{bracketProgress.toFixed(1)}%</span>
              </div>
              <Progress value={bracketProgress} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatCurrencyForReports(currentBracket?.min)}</span>
                <span className="font-semibold">{formatCurrencyForReports(federalTaxableIncome)}</span>
                <span>{formatCurrencyForReports(currentBracket?.max)}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Tax Bracket Insights:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Room to next bracket: {formatCurrencyForReports((currentBracket?.max || 0) - federalTaxableIncome)}</li>
                <li>• Additional income taxed at: {currentBracket?.bracket}</li>
                <li>• Next bracket rate would be: {
                  taxBrackets.find(b => b.min > (currentBracket?.max || 0))?.bracket || 'N/A'
                }</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Sources Tax Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Income Sources Tax Analysis</CardTitle>
          <p className="text-sm text-gray-600">
            Detailed breakdown of tax treatment for each income source
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Income Source</th>
                  <th className="text-right py-2 font-medium">Annual Amount</th>
                  <th className="text-center py-2 font-medium">Tax Status</th>
                  <th className="text-right py-2 font-medium">Est. Tax Impact</th>
                  <th className="text-right py-2 font-medium">After-Tax Amount</th>
                </tr>
              </thead>
              <tbody>
                {incomeBreakdown.map((source, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{source.name}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {source.type.replace('-', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 font-medium">
                      {formatCurrencyForReports(source.amount)}
                    </td>
                    <td className="text-center py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${source.bgColor} ${source.color}`}>
                        {source.taxStatus}
                      </span>
                    </td>
                    <td className="text-right py-3 text-red-600 font-medium">
                      {formatCurrencyForReports(source.estimatedTax)}
                    </td>
                    <td className="text-right py-3 text-green-600 font-medium">
                      {formatCurrencyForReports(source.afterTaxAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-semibold">
                  <td className="py-3">Total</td>
                  <td className="text-right py-3">
                    {formatCurrencyForReports(incomeBreakdown.reduce((sum, source) => sum + source.amount, 0))}
                  </td>
                  <td className="text-center py-3">-</td>
                  <td className="text-right py-3 text-red-600">
                    {formatCurrencyForReports(incomeBreakdown.reduce((sum, source) => sum + source.estimatedTax, 0))}
                  </td>
                  <td className="text-right py-3 text-green-600">
                    {formatCurrencyForReports(incomeBreakdown.reduce((sum, source) => sum + source.afterTaxAmount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Tax Status Legend */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Tax Status Definitions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div><span className="font-medium text-green-600">Tax Free:</span> No federal income tax</div>
              <div><span className="font-medium text-orange-600">Tax Deferred:</span> Taxed when withdrawn</div>
              <div><span className="font-medium text-blue-600">After-Tax:</span> Principal after-tax, earnings taxable</div>
              <div><span className="font-medium text-purple-600">Capital Gains:</span> Preferential tax rates</div>
              <div><span className="font-medium text-gray-600">Ordinary Income:</span> Standard tax rates</div>
              <div><span className="font-medium text-indigo-600">Partially Taxable:</span> Portion may be taxable</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taxBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taxBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrencyForReports(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Federal Tax:</span>
              <span className="font-semibold">{formatCurrencyForReports(federalTax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">State Tax:</span>
              <span className="font-semibold">{formatCurrencyForReports(netStateTax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-semibold">Total Tax:</span>
              <span className="font-bold">{formatCurrencyForReports(totalTax)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Efficiency Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Efficiency Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-900">
                {formatPercentageForReports((totalIncome - totalTax) / totalIncome)}
              </div>
              <div className="text-sm text-green-700">Income Retention Rate</div>
              <div className="text-xs text-gray-600 mt-1">
                Percentage of income kept after taxes
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-900">
                {formatCurrencyForReports(totalTax / 12)}
              </div>
              <div className="text-sm text-blue-700">Monthly Tax Burden</div>
              <div className="text-xs text-gray-600 mt-1">
                Average monthly tax payment
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-900">
                {((effectiveRateTotal * 100) / (marginalRateTotal * 100) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-purple-700">Tax Efficiency Ratio</div>
              <div className="text-xs text-gray-600 mt-1">
                Effective rate vs marginal rate
              </div>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Optimization Opportunities:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Consider tax-deferred retirement contributions to reduce current taxable income</li>
              <li>• Evaluate Roth conversion opportunities during lower-income years</li>
              <li>• Review asset location strategies for tax-efficient investing</li>
              <li>• Assess timing of income recognition and deduction strategies</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Benchmark Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Your Effective Tax Rate</span>
                <span className="font-semibold">{formatPercentageForReports(effectiveRateTotal)}</span>
              </div>
              <Progress value={effectiveRateTotal * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">National Average (Similar Income)</span>
                <span className="font-semibold">22.50%</span>
              </div>
              <Progress value={22.5} className="h-2 opacity-50" />
            </div>

            <div className="text-sm text-gray-600">
              {effectiveRateTotal > 0.225 ? (
                <span className="text-red-600">
                  ⚠️ Your effective tax rate is above the national average for similar income levels
                </span>
              ) : (
                <span className="text-green-600">
                  ✅ Your effective tax rate is below the national average for similar income levels
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
