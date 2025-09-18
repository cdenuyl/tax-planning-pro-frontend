import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercentage } from '../utils/taxCalculations.js';

/**
 * Enhanced Interactive Chart Tooltips
 * Provides rich, contextual tooltips with animations and detailed information
 */

export const EnhancedTooltip = ({ 
  active, 
  payload, 
  label, 
  coordinate,
  viewBox,
  tooltipType = 'default',
  showComparison = false,
  comparisonData = null,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (active && payload && payload.length > 0) {
      setIsVisible(true);
      
      // Calculate optimal tooltip position
      if (coordinate && viewBox) {
        const tooltipWidth = 300; // Estimated width
        const tooltipHeight = 200; // Estimated height
        
        let x = coordinate.x + 10;
        let y = coordinate.y - 10;
        
        // Adjust if tooltip would go off-screen
        if (x + tooltipWidth > viewBox.width) {
          x = coordinate.x - tooltipWidth - 10;
        }
        if (y - tooltipHeight < 0) {
          y = coordinate.y + 20;
        }
        
        setPosition({ x, y });
      }
    } else {
      setIsVisible(false);
    }
  }, [active, payload, coordinate, viewBox]);

  if (!isVisible || !payload || !payload.length) return null;

  const data = payload[0].payload;
  
  const renderDefaultTooltip = () => (
    <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm">
      <div className="font-semibold text-gray-900 mb-3 border-b pb-2">
        {typeof label === 'number' ? formatCurrency(label) : label}
      </div>
      
      <div className="space-y-2">
        {payload.map((entry, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 capitalize">
                {entry.dataKey.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
            </div>
            <span className="font-medium text-gray-900">
              {typeof entry.value === 'number' && entry.value > 1 
                ? formatCurrency(entry.value)
                : formatPercentage(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTaxMapTooltip = () => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-xl p-5 max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold text-blue-900 text-lg">
          Tax Analysis
        </div>
        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
          {typeof label === 'number' ? formatCurrency(label) : label}
        </div>
      </div>
      
      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Tax</div>
          <div className="text-lg font-bold text-red-600">
            {formatCurrency(data.totalTax || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-gray-500 uppercase tracking-wide">After Tax</div>
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(data.afterTaxIncome || 0)}
          </div>
        </div>
      </div>
      
      {/* Tax breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Federal Tax:</span>
          <span className="font-medium text-blue-600">{formatCurrency(data.federalTax || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">State Tax:</span>
          <span className="font-medium text-green-600">{formatCurrency(data.stateTax || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">FICA:</span>
          <span className="font-medium text-purple-600">{formatCurrency(data.ficaTax || 0)}</span>
        </div>
      </div>
      
      {/* Rates */}
      <div className="border-t border-blue-200 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Effective Rate:</span>
          <span className="font-bold text-gray-900">{formatPercentage(data.effectiveRate || 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Marginal Rate:</span>
          <span className="font-bold text-gray-900">{formatPercentage(data.marginalRate || 0)}</span>
        </div>
      </div>
      
      {/* Current position indicator */}
      {data.isCurrentIncome && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-center text-xs font-medium text-blue-700 bg-blue-100 px-3 py-2 rounded-full">
            📍 Your Current Position
          </div>
        </div>
      )}
    </div>
  );

  const renderCapitalGainsTooltip = () => (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-xl p-5 max-w-md">
      <div className="font-bold text-green-900 text-lg mb-4">
        Capital Gains Analysis
      </div>
      
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-green-100">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Long-Term Gains</div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-medium">{formatCurrency(data.longTermGains || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tax:</span>
            <span className="font-medium text-green-600">{formatCurrency(data.longTermTax || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Rate:</span>
            <span className="font-bold">{formatPercentage(data.longTermRate || 0)}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-green-100">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Short-Term Gains</div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-medium">{formatCurrency(data.shortTermGains || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Tax:</span>
            <span className="font-medium text-red-600">{formatCurrency(data.shortTermTax || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Rate:</span>
            <span className="font-bold">{formatPercentage(data.shortTermRate || 0)}</span>
          </div>
        </div>
      </div>
      
      {/* Strategy suggestions */}
      {data.strategySuggestion && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-xs font-medium text-yellow-800 mb-1">💡 Strategy Tip</div>
          <div className="text-sm text-yellow-700">{data.strategySuggestion}</div>
        </div>
      )}
    </div>
  );

  const renderComparisonTooltip = () => (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-xl p-5 max-w-lg">
      <div className="font-bold text-purple-900 text-lg mb-4">
        Scenario Comparison
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-3 border border-purple-100">
          <div className="text-xs text-purple-600 uppercase tracking-wide mb-2">Current</div>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{entry.dataKey}:</span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
        
        {comparisonData && (
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="text-xs text-purple-600 uppercase tracking-wide mb-2">Alternative</div>
            {Object.entries(comparisonData).map(([key, value], index) => (
              <div key={index} className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{key}:</span>
                <span className="font-medium">{formatCurrency(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Difference calculation */}
      <div className="mt-4 pt-3 border-t border-purple-200">
        <div className="text-xs text-purple-600 uppercase tracking-wide mb-2">Difference</div>
        <div className="text-lg font-bold text-purple-900">
          {comparisonData && payload[0] ? 
            formatCurrency(Math.abs(payload[0].value - Object.values(comparisonData)[0])) : 
            'N/A'
          }
        </div>
      </div>
    </div>
  );

  const renderTooltipContent = () => {
    switch (tooltipType) {
      case 'taxMap':
        return renderTaxMapTooltip();
      case 'capitalGains':
        return renderCapitalGainsTooltip();
      case 'comparison':
        return renderComparisonTooltip();
      default:
        return renderDefaultTooltip();
    }
  };

  return (
    <div 
      ref={tooltipRef}
      className={`absolute z-50 pointer-events-none transition-all duration-200 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${className}`}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(0, -100%)'
      }}
    >
      {renderTooltipContent()}
    </div>
  );
};

/**
 * Hover Effect Manager for Charts
 */
export const useChartHoverEffects = () => {
  const [hoveredElement, setHoveredElement] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverData, setHoverData] = useState(null);

  const handleMouseEnter = (data, event) => {
    setHoveredElement(data);
    setHoverData(data);
    if (event) {
      setHoverPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredElement(null);
    setHoverData(null);
  };

  const handleMouseMove = (event) => {
    if (hoveredElement) {
      setHoverPosition({ x: event.clientX, y: event.clientY });
    }
  };

  return {
    hoveredElement,
    hoverPosition,
    hoverData,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    isHovering: !!hoveredElement
  };
};

/**
 * Animation Controller for Charts
 */
export const useChartAnimations = (enabled = true) => {
  const [animationState, setAnimationState] = useState('idle');
  const [animationProgress, setAnimationProgress] = useState(0);

  const startAnimation = (duration = 1000) => {
    if (!enabled) return;
    
    setAnimationState('running');
    setAnimationProgress(0);
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimationState('completed');
      }
    };
    
    requestAnimationFrame(animate);
  };

  const resetAnimation = () => {
    setAnimationState('idle');
    setAnimationProgress(0);
  };

  return {
    animationState,
    animationProgress,
    startAnimation,
    resetAnimation,
    isAnimating: animationState === 'running',
    animationDuration: enabled ? 1000 : 0
  };
};

export default EnhancedTooltip;

