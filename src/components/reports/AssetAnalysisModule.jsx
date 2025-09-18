import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/taxCalculations';

export function AssetAnalysisModule({ assets, incomeSources, calculations, reportSettings }) {
  // Process asset data
  const processedAssets = assets?.map(asset => ({
    ...asset,
    yearlyIncome: asset.frequency === 'monthly' ? (asset.amount || 0) * 12 : (asset.amount || 0),
    withdrawalRate: asset.currentValue > 0 ? ((asset.frequency === 'monthly' ? asset.amount * 12 : asset.amount) / asset.currentValue) : 0
  })) || [];

  // Calculate totals
  const totalAssetValue = processedAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
  const totalYearlyIncome = processedAssets.reduce((sum, asset) => sum + asset.yearlyIncome, 0);
  const averageWithdrawalRate = totalAssetValue > 0 ? totalYearlyIncome / totalAssetValue : 0;

  // Group assets by type for analysis
  const assetsByType = processedAssets.reduce((acc, asset) => {
    const type = asset.type || 'other';
    if (!acc[type]) {
      acc[type] = {
        type,
        assets: [],
        totalValue: 0,
        totalIncome: 0,
        count: 0
      };
    }
    acc[type].assets.push(asset);
    acc[type].totalValue += asset.currentValue || 0;
    acc[type].totalIncome += asset.yearlyIncome;
    acc[type].count += 1;
    return acc;
  }, {});

  // Tax treatment categories
  const taxTreatmentCategories = {
    'tax-deferred': {
      name: 'Tax-Deferred',
      types: ['traditional-ira', '401k', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira', 'annuity'],
      color: '#dc2626',
      description: 'Contributions may be tax-deductible, growth is tax-deferred, withdrawals are taxed as ordinary income'
    },
    'tax-free': {
      name: 'Tax-Free',
      types: ['roth-ira', 'roth-401k', 'life-insurance'],
      color: '#16a34a',
      description: 'Contributions are after-tax, growth and qualified withdrawals are tax-free'
    },
    'taxable': {
      name: 'Taxable',
      types: ['brokerage', 'savings', 'cd', 'real-estate', 'business'],
      color: '#ea580c',
      description: 'Income and gains are subject to current taxation, may qualify for preferential capital gains rates'
    }
  };

  // Categorize assets by tax treatment
  const assetsByTaxTreatment = Object.entries(taxTreatmentCategories).map(([key, category]) => {
    const categoryAssets = processedAssets.filter(asset => category.types.includes(asset.type));
    const totalValue = categoryAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalIncome = categoryAssets.reduce((sum, asset) => sum + asset.yearlyIncome, 0);
    
    return {
      category: key,
      name: category.name,
      color: category.color,
      description: category.description,
      assets: categoryAssets,
      totalValue,
      totalIncome,
      percentage: totalAssetValue > 0 ? (totalValue / totalAssetValue) * 100 : 0,
      count: categoryAssets.length
    };
  }).filter(category => category.totalValue > 0);

  // Asset allocation pie chart data
  const allocationData = assetsByTaxTreatment.map(category => ({
    name: category.name,
    value: category.totalValue,
    color: category.color,
    percentage: category.percentage
  }));

  // Income generation analysis
  const incomeGenerationData = processedAssets
    .filter(asset => asset.yearlyIncome > 0)
    .sort((a, b) => b.yearlyIncome - a.yearlyIncome)
    .slice(0, 10)
    .map(asset => ({
      name: asset.name || `${asset.type} Account`,
      income: asset.yearlyIncome,
      withdrawalRate: asset.withdrawalRate * 100
    }));

  // Risk assessment
  const getRiskLevel = (type) => {
    const riskLevels = {
      'savings': 'Low',
      'cd': 'Low',
      'traditional-ira': 'Medium',
      'roth-ira': 'Medium',
      '401k': 'Medium',
      'brokerage': 'Medium-High',
      'real-estate': 'Medium-High',
      'business': 'High',
      'annuity': 'Low-Medium',
      'life-insurance': 'Low'
    };
    return riskLevels[type] || 'Medium';
  };

  const COLORS = ['#dc2626', '#16a34a', '#ea580c', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Section Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Asset Analysis & Recommendations</h2>
        <p className="text-gray-600 mt-2">
          Comprehensive review of your asset portfolio with tax implications and optimization opportunities
        </p>
      </div>

      {/* Asset Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalAssetValue)}
              </div>
              <div className="text-sm text-blue-700">Total Asset Value</div>
              <div className="text-xs text-gray-500 mt-1">
                {processedAssets.length} accounts
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(totalYearlyIncome)}
              </div>
              <div className="text-sm text-green-700">Annual Income</div>
              <div className="text-xs text-gray-500 mt-1">
                From all assets
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-900">
                {formatPercentage(averageWithdrawalRate)}
              </div>
              <div className="text-sm text-purple-700">Avg Withdrawal Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Income ÷ Asset value
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-900">
                {assetsByTaxTreatment.length}
              </div>
              <div className="text-sm text-orange-700">Tax Categories</div>
              <div className="text-xs text-gray-500 mt-1">
                Diversification level
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Allocation by Tax Treatment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation by Tax Treatment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {assetsByTaxTreatment.map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(category.totalValue)}</div>
                    <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Generation Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeGenerationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={10}
                  />
                  <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      formatCurrency(value), 
                      name === 'income' ? 'Annual Income' : 'Withdrawal Rate'
                    ]}
                  />
                  <Bar dataKey="income" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Asset Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Asset Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {assetsByTaxTreatment.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <Badge variant="outline">{category.count} accounts</Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(category.totalValue)}</div>
                    <div className="text-sm text-gray-600">{category.percentage.toFixed(1)}% of total</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">{category.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.assets.map((asset, assetIndex) => (
                    <div key={assetIndex} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{asset.name || `${asset.type} Account`}</h4>
                          <p className="text-sm text-gray-600 capitalize">
                            {asset.type.replace('-', ' ')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getRiskLevel(asset.type)} Risk
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Value:</span>
                          <span className="font-semibold">{formatCurrency(asset.currentValue || 0)}</span>
                        </div>
                        
                        {asset.yearlyIncome > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Annual Income:</span>
                              <span className="font-semibold text-green-600">
                                {formatCurrency(asset.yearlyIncome)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Withdrawal Rate:</span>
                              <span className="font-semibold">
                                {formatPercentage(asset.withdrawalRate)}
                              </span>
                            </div>
                          </>
                        )}

                        {asset.deathBenefit && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Death Benefit:</span>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(asset.deathBenefit)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Asset Location Optimization:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Consider holding tax-inefficient investments in tax-deferred accounts</li>
                <li>• Place tax-efficient investments in taxable accounts for better after-tax returns</li>
                <li>• Review bond allocation - consider holding in tax-deferred accounts</li>
                <li>• Evaluate international funds for foreign tax credit opportunities</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Withdrawal Strategy Optimization:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Current average withdrawal rate: {formatPercentage(averageWithdrawalRate)}</li>
                <li>• Consider tax-efficient withdrawal sequencing</li>
                <li>• Evaluate Roth conversion opportunities during low-income years</li>
                <li>• Plan for required minimum distributions (RMDs) starting at age 73</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Diversification Considerations:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Tax diversification: {assetsByTaxTreatment.length} of 3 tax categories represented</li>
                <li>• Consider balancing tax-deferred, tax-free, and taxable accounts</li>
                <li>• Evaluate geographic and sector diversification within tax-advantaged accounts</li>
                <li>• Review correlation between different asset classes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Low', 'Medium', 'High'].map((riskLevel, index) => {
              const riskAssets = processedAssets.filter(asset => 
                getRiskLevel(asset.type).includes(riskLevel)
              );
              const riskValue = riskAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
              const riskPercentage = totalAssetValue > 0 ? (riskValue / totalAssetValue) * 100 : 0;

              return (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold text-gray-900">
                    {formatPercentage(riskPercentage / 100)}
                  </div>
                  <div className="text-sm text-gray-700">{riskLevel} Risk Assets</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(riskValue)}
                  </div>
                  <Progress value={riskPercentage} className="mt-2 h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

