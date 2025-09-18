import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { formatCurrency, formatPercentage } from '../utils/taxCalculations.js';

/**
 * Enhanced Tax Map Visualization with improved interactivity
 * Features: Real-time updates, enhanced tooltips, hover effects, and animations
 */
export const EnhancedTaxMapVisualization = ({ 
  calculations, 
  incomeSources, 
  settings, 
  appSettings,
  onIncomeHover,
  onIncomeClick,
  className = ""
}) => {
  const [hoveredIncome, setHoveredIncome] = useState(null);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [animationEnabled, setAnimationEnabled] = useState(true);

  // Generate enhanced tax map data with more granular income levels
  const taxMapData = useMemo(() => {
    if (!calculations || !incomeSources) return [];

    const currentIncome = calculations.totalIncome;
    const maxIncome = Math.max(currentIncome * 2, 150000);
    const dataPoints = [];
    
    // Generate data points with higher resolution around current income
    const generateIncomePoints = () => {
      const points = [];
      
      // Fine-grained points around current income (±20%)
      const currentRange = currentIncome * 0.4; // 40% range around current
      const currentStart = Math.max(0, currentIncome - currentRange / 2);
      const currentEnd = currentIncome + currentRange / 2;
      
      // Add fine points around current income
      for (let i = 0; i <= 20; i++) {
        const income = currentStart + (currentEnd - currentStart) * (i / 20);
        if (income >= 0) points.push(income);
      }
      
      // Add broader points for the full range
      for (let i = 0; i <= 50; i++) {
        const income = (maxIncome * i) / 50;
        if (!points.some(p => Math.abs(p - income) < 1000)) {
          points.push(income);
        }
      }
      
      return points.sort((a, b) => a - b);
    };

    const incomePoints = generateIncomePoints();
    
    incomePoints.forEach(income => {
      // Calculate taxes for this income level
      const scaledSources = incomeSources.map(source => ({
        ...source,
        amount: source.amount * (income / currentIncome)
      }));
      
      // Simplified tax calculation for visualization
      const federalTax = calculateFederalTaxForIncome(income, calculations.filingStatus);
      const stateTax = income * 0.0425; // Michigan rate
      const totalTax = federalTax + stateTax;
      const effectiveRate = income > 0 ? totalTax / income : 0;
      const marginalRate = calculateMarginalRateForIncome(income, calculations.filingStatus);
      
      dataPoints.push({
        income: Math.round(income),
        federalTax: Math.round(federalTax),
        stateTax: Math.round(stateTax),
        totalTax: Math.round(totalTax),
        effectiveRate: effectiveRate,
        marginalRate: marginalRate,
        afterTaxIncome: Math.round(income - totalTax),
        isCurrentIncome: Math.abs(income - currentIncome) < 1000
      });
    });

    return dataPoints;
  }, [calculations, incomeSources]);

  // Simplified federal tax calculation for visualization
  const calculateFederalTaxForIncome = useCallback((income, filingStatus) => {
    const brackets = {
      single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
      ],
      marriedFilingJointly: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 }
      ]
    };

    const taxBrackets = brackets[filingStatus] || brackets.single;
    const standardDeduction = filingStatus === 'marriedFilingJointly' ? 29200 : 14600;
    const taxableIncome = Math.max(0, income - standardDeduction);
    
    let tax = 0;
    for (const bracket of taxBrackets) {
      if (taxableIncome <= bracket.min) break;
      const taxableInThisBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      tax += taxableInThisBracket * bracket.rate;
    }
    
    return tax;
  }, []);

  // Calculate marginal rate for a given income
  const calculateMarginalRateForIncome = useCallback((income, filingStatus) => {
    const brackets = {
      single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 609350, rate: 0.35 },
        { min: 609350, max: Infinity, rate: 0.37 }
      ],
      marriedFilingJointly: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 731200, rate: 0.35 },
        { min: 731200, max: Infinity, rate: 0.37 }
      ]
    };

    const taxBrackets = brackets[filingStatus] || brackets.single;
    const standardDeduction = filingStatus === 'marriedFilingJointly' ? 29200 : 14600;
    const taxableIncome = Math.max(0, income - standardDeduction);
    
    for (const bracket of taxBrackets) {
      if (taxableIncome >= bracket.min && taxableIncome < bracket.max) {
        return bracket.rate;
      }
    }
    
    return taxBrackets[taxBrackets.length - 1].rate;
  }, []);

  // Enhanced tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-xs">
        <div className="font-semibold text-gray-900 mb-2">
          Income: {formatCurrency(data.income)}
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Federal Tax:</span>
            <span className="font-medium text-blue-600">{formatCurrency(data.federalTax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">State Tax:</span>
            <span className="font-medium text-green-600">{formatCurrency(data.stateTax)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="text-gray-600">Total Tax:</span>
            <span className="font-semibold text-red-600">{formatCurrency(data.totalTax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">After-Tax:</span>
            <span className="font-semibold text-green-700">{formatCurrency(data.afterTaxIncome)}</span>
          </div>
        </div>
        
        <div className="border-t mt-2 pt-2 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Effective Rate:</span>
            <span className="font-medium">{formatPercentage(data.effectiveRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Marginal Rate:</span>
            <span className="font-medium">{formatPercentage(data.marginalRate)}</span>
          </div>
        </div>
        
        {data.isCurrentIncome && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              📍 Current Position
            </div>
          </div>
        )}
      </div>
    );
  };

  // Handle mouse events
  const handleMouseEnter = useCallback((data, index) => {
    setHoveredIncome(data);
    if (onIncomeHover) {
      onIncomeHover(data);
    }
  }, [onIncomeHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIncome(null);
    if (onIncomeHover) {
      onIncomeHover(null);
    }
  }, [onIncomeHover]);

  const handleClick = useCallback((data) => {
    setSelectedIncome(data);
    if (onIncomeClick) {
      onIncomeClick(data);
    }
  }, [onIncomeClick]);

  // Get bar color based on state
  const getBarColor = useCallback((data, index) => {
    if (data.isCurrentIncome) return '#3B82F6'; // Blue for current
    if (selectedIncome && selectedIncome.income === data.income) return '#10B981'; // Green for selected
    if (hoveredIncome && hoveredIncome.income === data.income) return '#F59E0B'; // Amber for hovered
    return '#6B7280'; // Gray for default
  }, [hoveredIncome, selectedIncome]);

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Enhanced Tax Map Visualization</h3>
            <p className="text-blue-100 text-sm">Interactive tax analysis across income levels</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAnimationEnabled(!animationEnabled)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                animationEnabled 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-200 text-blue-800'
              }`}
            >
              {animationEnabled ? '🎬 Animated' : '📊 Static'}
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={taxMapData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="income"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line for current income */}
              {calculations && (
                <ReferenceLine 
                  x={calculations.totalIncome} 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: "Current", position: "top" }}
                />
              )}
              
              <Bar 
                dataKey="totalTax" 
                radius={[2, 2, 0, 0]}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                animationDuration={animationEnabled ? 1000 : 0}
                animationBegin={0}
              >
                {taxMapData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry, index)}
                    style={{ 
                      cursor: 'pointer',
                      transition: 'fill 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Information Panel */}
      {(hoveredIncome || selectedIncome) && (
        <div className="border-t bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            {hoveredIncome && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-yellow-800 mb-2">📍 Hovered Position</h4>
                <div className="text-sm space-y-1">
                  <div>Income: <span className="font-medium">{formatCurrency(hoveredIncome.income)}</span></div>
                  <div>Total Tax: <span className="font-medium">{formatCurrency(hoveredIncome.totalTax)}</span></div>
                  <div>Effective Rate: <span className="font-medium">{formatPercentage(hoveredIncome.effectiveRate)}</span></div>
                </div>
              </div>
            )}
            
            {selectedIncome && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 mb-2">🎯 Selected Position</h4>
                <div className="text-sm space-y-1">
                  <div>Income: <span className="font-medium">{formatCurrency(selectedIncome.income)}</span></div>
                  <div>Total Tax: <span className="font-medium">{formatCurrency(selectedIncome.totalTax)}</span></div>
                  <div>Marginal Rate: <span className="font-medium">{formatPercentage(selectedIncome.marginalRate)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
              <span>Current Position</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
              <span>Hovered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
              <span>Selected</span>
            </div>
          </div>
          <div>
            Click bars to select • Hover for details • Toggle animation
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTaxMapVisualization;

