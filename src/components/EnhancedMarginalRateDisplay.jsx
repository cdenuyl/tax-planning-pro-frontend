import React, { useMemo } from 'react';
import { getEnhancedMarginalRateAnalysis } from '../utils/marginalRateAnalysisStandalone.js';
import { formatCurrency, formatPercentage } from '../utils/taxCalculations.js';

/**
 * Enhanced Marginal Rate Display Component
 * Shows comprehensive marginal rate analysis without circular dependencies
 */
export const EnhancedMarginalRateDisplay = ({ 
  incomeSources, 
  taxpayerAge, 
  spouseAge, 
  filingStatus, 
  appSettings,
  className = ""
}) => {
  const analysis = useMemo(() => {
    if (!incomeSources || incomeSources.length === 0) return null;
    
    return getEnhancedMarginalRateAnalysis(
      incomeSources, 
      taxpayerAge, 
      spouseAge, 
      filingStatus, 
      appSettings
    );
  }, [incomeSources, taxpayerAge, spouseAge, filingStatus, appSettings]);

  if (!analysis) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <p className="text-gray-600 text-sm">No income sources available for marginal rate analysis</p>
      </div>
    );
  }

  const { currentMarginalRate, effectiveRate, nextRateChanges, recommendations } = analysis;

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold">Enhanced Marginal Rate Analysis</h3>
        <p className="text-blue-100 text-sm">Comprehensive rate change detection and optimization insights</p>
      </div>

      {/* Current Rates */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-700">Current Marginal Rate</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatPercentage(currentMarginalRate)}
            </div>
            <div className="text-xs text-blue-600">On next dollar earned</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm font-medium text-green-700">Effective Rate</div>
            <div className="text-2xl font-bold text-green-900">
              {formatPercentage(effectiveRate)}
            </div>
            <div className="text-xs text-green-600">Overall tax burden</div>
          </div>
        </div>
      </div>

      {/* Next Rate Changes */}
      {nextRateChanges && nextRateChanges.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="font-semibold text-gray-900 mb-3">Upcoming Rate Changes</h4>
          <div className="space-y-3">
            {nextRateChanges.slice(0, 3).map((change, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(change.additionalIncomeNeeded)} additional income
                    </div>
                    <div className="text-sm text-gray-600">
                      Rate changes from {formatPercentage(change.oldRate)} to {formatPercentage(change.newRate)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Source: {change.source}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    change.rateChange > 0 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {change.rateChange > 0 ? '+' : ''}{formatPercentage(change.rateChange)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Optimization Recommendations</h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className={`border rounded-lg p-3 ${
                rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`font-medium ${
                      rec.priority === 'high' ? 'text-red-900' :
                      rec.priority === 'medium' ? 'text-yellow-900' :
                      'text-blue-900'
                    }`}>
                      {rec.title}
                    </div>
                    <div className={`text-sm mt-1 ${
                      rec.priority === 'high' ? 'text-red-700' :
                      rec.priority === 'medium' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {rec.description}
                    </div>
                    {rec.actions && rec.actions.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-600 mb-1">Suggested Actions:</div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {rec.actions.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start">
                              <span className="text-gray-400 mr-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ml-3 ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 rounded-b-lg">
        <p className="text-xs text-gray-600">
          Analysis includes federal taxes, state taxes, Social Security taxation, and IRMAA thresholds.
          Recommendations are based on current tax law and should be reviewed with a tax professional.
        </p>
      </div>
    </div>
  );
};

export default EnhancedMarginalRateDisplay;

