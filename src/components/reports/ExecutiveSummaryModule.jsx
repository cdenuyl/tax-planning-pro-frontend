import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/taxCalculations';

export function ExecutiveSummaryModule({ calculations, incomeSources, assets, settings, reportSettings }) {
  const { 
    totalIncome, 
    federalTax, 
    netStateTax, 
    effectiveRateFederal, 
    effectiveRateTotal,
    totalTax 
  } = calculations;

  // Calculate key metrics
  const afterTaxIncome = totalIncome - totalTax;
  const totalAssetValue = assets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;
  
  // Generate key findings
  const keyFindings = [
    {
      type: 'opportunity',
      title: 'Tax Optimization Potential',
      description: `Current effective tax rate of ${formatPercentage(effectiveRateTotal)} may be reduced through strategic planning`,
      impact: 'High',
      priority: 1
    },
    {
      type: 'insight',
      title: 'Asset Allocation Review',
      description: `${formatCurrency(totalAssetValue)} in assets could benefit from tax-efficient positioning`,
      impact: 'Medium',
      priority: 2
    },
    {
      type: 'action',
      title: 'Income Stream Optimization',
      description: `${incomeSources?.length || 0} income sources present opportunities for tax planning`,
      impact: 'Medium',
      priority: 3
    }
  ];

  // Generate recommendations
  const recommendations = [
    {
      title: 'Immediate Actions (0-3 months)',
      items: [
        'Review current withholdings and estimated tax payments',
        'Optimize asset location for tax efficiency',
        'Consider Roth conversion opportunities'
      ]
    },
    {
      title: 'Short-term Planning (3-12 months)',
      items: [
        'Implement tax-loss harvesting strategies',
        'Review retirement account contribution strategies',
        'Evaluate life insurance and annuity positioning'
      ]
    },
    {
      title: 'Long-term Strategy (1+ years)',
      items: [
        'Develop multi-year tax projection plan',
        'Implement estate planning tax strategies',
        'Create systematic rebalancing approach'
      ]
    }
  ];

  const getImpactColor = (impact) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'insight': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'action': return <CheckCircle className="h-4 w-4 text-orange-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="text-center border-b pb-6 print:pb-4">
        <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
          Tax Planning Analysis Report
        </h1>
        <div className="mt-2 space-y-1">
          {reportSettings?.clientName && (
            <p className="text-lg text-gray-700">Prepared for: {reportSettings.clientName}</p>
          )}
          {reportSettings?.advisorName && (
            <p className="text-sm text-gray-600">
              Prepared by: {reportSettings.advisorName}
              {reportSettings?.firmName && `, ${reportSettings.firmName}`}
            </p>
          )}
          <p className="text-sm text-gray-500">Report Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Current Situation Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Current Tax Situation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(totalIncome)}
              </div>
              <div className="text-sm text-blue-700">Total Income</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-900">
                {formatCurrency(totalTax)}
              </div>
              <div className="text-sm text-red-700">Total Tax</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(afterTaxIncome)}
              </div>
              <div className="text-sm text-green-700">After-Tax Income</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {formatPercentage(effectiveRateTotal)}
              </div>
              <div className="text-sm text-purple-700">Effective Tax Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Findings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Key Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keyFindings.map((finding, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(finding.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{finding.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(finding.impact)}>
                        {finding.impact} Impact
                      </Badge>
                      <Badge variant="outline">Priority {finding.priority}</Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{finding.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Implementation Roadmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recommendations.map((timeframe, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-red-500' : index === 1 ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  {timeframe.title}
                </h3>
                <div className="ml-6 space-y-2">
                  {timeframe.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                {index < recommendations.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Immediate Actions Required:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Schedule follow-up meeting to discuss detailed recommendations</li>
              <li>• Gather additional documentation for comprehensive analysis</li>
              <li>• Begin implementation of immediate optimization opportunities</li>
              <li>• Review and update beneficiary designations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 border-t pt-4 print:text-xs">
        <p className="mb-2">
          <strong>Important Disclaimer:</strong> This analysis is based on current tax laws and the information provided. 
          Tax laws are subject to change, and individual circumstances may vary. This report is for informational 
          purposes only and should not be considered as tax, legal, or investment advice.
        </p>
        <p>
          Please consult with qualified tax and legal professionals before implementing any strategies discussed in this report.
        </p>
      </div>
    </div>
  );
}

