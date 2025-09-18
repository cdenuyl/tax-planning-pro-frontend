import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

const AssetManagementModule = ({ 
  calculations, 
  incomeSources, 
  assets,
  settings, 
  reportSettings 
}) => {
  // Helper function to convert asset type to display name
  const getAccountTypeDisplayName = (assetType) => {
    const typeMapping = {
      'traditional-ira': 'Traditional IRA',
      'roth-ira': 'Roth IRA',
      'traditional-401k': 'Traditional 401k',
      'roth-401k': 'Roth 401k',
      '403b': '403(b)',
      '457': '457 Plan',
      'sep-ira': 'SEP-IRA',
      'simple-ira': 'SIMPLE IRA',
      'annuity': 'Annuity',
      'life-insurance': 'Life Insurance',
      'brokerage': 'Brokerage Account',
      'savings': 'Savings Account',
      'cd': 'Certificate of Deposit',
      'real-estate': 'Real Estate',
      'business': 'Business Interest',
      'other': 'Other'
    };
    return typeMapping[assetType] || assetType || 'Unknown';
  };

  // Helper function to determine if asset is qualified for RMD
  const isQualifiedForRMD = (assetType) => {
    const qualifiedTypes = [
      'traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'
    ];
    return qualifiedTypes.includes(assetType);
  };

  // Process assets data
  const processedAssets = assets?.map(asset => ({
    ...asset,
    currentValue: asset.currentValue || 0,
    accountType: getAccountTypeDisplayName(asset.type || asset.accountType),
    originalType: asset.type || asset.accountType,
    owner: asset.owner || 'Taxpayer',
    isQualified: isQualifiedForRMD(asset.type || asset.accountType)
  })) || [];

  // Calculate asset allocation
  const totalAssets = processedAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  
  const assetsByType = processedAssets.reduce((acc, asset) => {
    const type = asset.accountType;
    if (!acc[type]) {
      acc[type] = { value: 0, count: 0 };
    }
    acc[type].value += asset.currentValue;
    acc[type].count += 1;
    return acc;
  }, {});

  const assetAllocationData = Object.entries(assetsByType).map(([type, data]) => ({
    name: type,
    value: data.value,
    percentage: (data.value / totalAssets) * 100,
    count: data.count
  }));

  // RMD Analysis
  const currentAge = settings?.currentAge || 65;
  const rmdAge = 73; // Current RMD age
  const yearsToRMD = Math.max(0, rmdAge - currentAge);
  
  // Calculate RMDs for qualified accounts
  const qualifiedAccounts = processedAssets.filter(asset => asset.isQualified);
  
  const totalQualifiedAssets = qualifiedAccounts.reduce((sum, asset) => sum + asset.currentValue, 0);
  
  // RMD calculation (simplified)
  const rmdFactors = {
    73: 27.4, 74: 26.5, 75: 25.5, 76: 24.6, 77: 23.7, 78: 22.9, 79: 22.0, 80: 21.2
  };
  
  const generateRMDProjections = () => {
    const projections = [];
    let balance = totalQualifiedAssets;
    const growthRate = 0.06; // Assumed 6% growth
    
    for (let age = currentAge; age <= currentAge + 15; age++) {
      const year = new Date().getFullYear() + (age - currentAge);
      
      if (age >= rmdAge) {
        const factor = rmdFactors[age] || (20.0 - (age - 80) * 0.5); // Declining factor for ages beyond table
        const rmd = balance / factor;
        balance = Math.max(0, (balance - rmd) * (1 + growthRate));
        
        projections.push({
          age,
          year,
          balance: Math.max(0, balance),
          rmd,
          rmdPercentage: balance > 0 ? (rmd / (balance + rmd)) * 100 : 0
        });
      } else {
        // Before RMD age - show projected growth
        balance = balance * (1 + growthRate);
        projections.push({
          age,
          year,
          balance,
          rmd: 0,
          rmdPercentage: 0,
          isProjected: true // Flag to indicate this is pre-RMD projection
        });
      }
    }
    
    return projections;
  };

  const rmdProjections = generateRMDProjections();

  // Asset diversification analysis
  const diversificationData = [
    { 
      category: 'Tax-Deferred', 
      value: processedAssets
        .filter(asset => ['traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'].includes(asset.originalType))
        .reduce((sum, asset) => sum + asset.currentValue, 0), 
      color: '#EF4444' 
    },
    { 
      category: 'Tax-Free', 
      value: processedAssets
        .filter(asset => ['roth-ira', 'roth-401k'].includes(asset.originalType))
        .reduce((sum, asset) => sum + asset.currentValue, 0), 
      color: '#10B981' 
    },
    { 
      category: 'Taxable', 
      value: processedAssets
        .filter(asset => ['brokerage', 'savings', 'cd'].includes(asset.originalType))
        .reduce((sum, asset) => sum + asset.currentValue, 0), 
      color: '#3B82F6' 
    },
    { 
      category: 'Other', 
      value: processedAssets
        .filter(asset => !['traditional-ira', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira', 'roth-ira', 'roth-401k', 'brokerage', 'savings', 'cd'].includes(asset.originalType))
        .reduce((sum, asset) => sum + asset.currentValue, 0), 
      color: '#6B7280' 
    }
  ].filter(item => item.value > 0);

  const COLORS = ['#EF4444', '#10B981', '#3B82F6', '#6B7280', '#F59E0B', '#8B5CF6'];

  // Withdrawal strategy analysis
  const withdrawalStrategyData = [
    {
      strategy: "Tax-Efficient Sequence",
      description: "Taxable → Traditional → Roth",
      taxImpact: "Minimize lifetime taxes",
      flexibility: "High",
      complexity: "Medium"
    },
    {
      strategy: "Roth Conversion Ladder",
      description: "Convert Traditional to Roth during low-income years",
      taxImpact: "Reduce future RMDs",
      flexibility: "Medium",
      complexity: "High"
    },
    {
      strategy: "Proportional Withdrawal",
      description: "Withdraw proportionally from all accounts",
      taxImpact: "Steady tax burden",
      flexibility: "Low",
      complexity: "Low"
    }
  ];

  // Asset rebalancing recommendations
  const rebalancingData = processedAssets.map(asset => ({
    name: asset.accountType,
    current: asset.currentValue,
    target: totalAssets * 0.25, // Simplified target allocation
    difference: asset.currentValue - (totalAssets * 0.25),
    action: asset.currentValue > (totalAssets * 0.25) ? 'Reduce' : 'Increase'
  }));

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Asset Management Analysis</h2>
        <p className="text-gray-600 mt-2">
          Comprehensive analysis of asset allocation, RMD planning, and withdrawal strategies.
        </p>
      </div>

      {/* Asset Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Portfolio Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrencyForReports(totalAssets)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Total Assets</div>
              <div className="text-xs text-gray-600 mt-1">All accounts</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrencyForReports(totalQualifiedAssets)}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Qualified Assets</div>
              <div className="text-xs text-gray-600 mt-1">Subject to RMD</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {yearsToRMD}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Years to RMD</div>
              <div className="text-xs text-gray-600 mt-1">Age {rmdAge}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {processedAssets.length}
              </div>
              <div className="text-sm font-medium text-gray-900 mt-1">Total Accounts</div>
              <div className="text-xs text-gray-600 mt-1">All types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation by Account Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrencyForReports(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3">
              {assetAllocationData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.count} account{item.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrencyForReports(item.value)}</div>
                    <div className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RMD Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Required Minimum Distribution (RMD) Projections</CardTitle>
          <p className="text-sm text-gray-600">
            Projected RMDs from qualified retirement accounts over the next 15 years.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rmdProjections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'RMD Percentage') return [`${value.toFixed(2)}%`, name];
                    return [formatCurrencyForReports(value), name];
                  }}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="balance" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  name="Account Balance"
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="rmd" 
                  stackId="2" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.6}
                  name="Annual RMD"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="rmdPercentage" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="RMD Percentage"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tax Diversification Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Diversification Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diversificationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, value }) => `${category}: ${formatCurrencyForReports(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {diversificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrencyForReports(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Tax Diversification Score</h4>
              <div className="space-y-3">
                {diversificationData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.category}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {((item.value / totalAssets) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Diversification Recommendation</h4>
                <p className="text-blue-800 text-sm">
                  Optimal tax diversification: 40% tax-deferred, 30% tax-free, 30% taxable. 
                  Consider Roth conversions to improve tax diversification.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Strategy Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Strategy Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Strategy</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tax Impact</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Flexibility</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Complexity</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalStrategyData.map((strategy, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{strategy.strategy}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{strategy.description}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{strategy.taxImpact}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        strategy.flexibility === 'High' ? 'bg-green-100 text-green-800' :
                        strategy.flexibility === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {strategy.flexibility}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        strategy.complexity === 'Low' ? 'bg-green-100 text-green-800' :
                        strategy.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {strategy.complexity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Asset Rebalancing Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Rebalancing Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rebalancingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatCurrencyForReports(value)} />
                <Legend />
                <Bar dataKey="current" fill="#3B82F6" name="Current Allocation" />
                <Bar dataKey="target" fill="#10B981" name="Target Allocation" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 space-y-3">
            {rebalancingData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    Current: {formatCurrencyForReports(item.current)} | 
                    Target: {formatCurrencyForReports(item.target)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${item.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.action} {formatCurrencyForReports(Math.abs(item.difference))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Key Recommendations & Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">🚨 RMD Planning Alert</h4>
              <p className="text-red-800 text-sm">
                {yearsToRMD > 0 ? 
                  `You have ${yearsToRMD} years before RMDs begin. Consider Roth conversions during lower-income years.` :
                  `RMDs are currently required. Your estimated annual RMD is ${formatCurrencyForReports(rmdProjections[0]?.rmd || 0)}.`
                }
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Tax Diversification Opportunity</h4>
              <p className="text-blue-800 text-sm">
                Your current tax diversification could be improved. Consider increasing Roth contributions 
                or conversions to achieve better balance across tax-deferred, tax-free, and taxable accounts.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">✅ Immediate Action Items</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Review and rebalance asset allocation quarterly</li>
                <li>• Consider Roth conversion opportunities during low-income years</li>
                <li>• Implement tax-efficient withdrawal sequence strategy</li>
                <li>• Monitor RMD projections and plan accordingly</li>
                <li>• Optimize asset location across account types</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetManagementModule;

