import React, { useState, useMemo } from 'react';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

// Color palette for scenarios (matching MultiScenarioCharts)
const SCENARIO_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green  
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316'  // Orange
];

// Scenario position marker component
const ScenarioMarker = ({ scenario, index, x, y, isActive, onClick, onHover, onLeave }) => {
  const color = SCENARIO_COLORS[index % SCENARIO_COLORS.length];
  const size = isActive ? 12 : 8;
  const strokeWidth = isActive ? 3 : 2;

  return (
    <g>
      {/* Marker circle */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        stroke="white"
        strokeWidth={strokeWidth}
        className="cursor-pointer transition-all duration-200 hover:opacity-80"
        onClick={() => onClick && onClick(scenario)}
        onMouseEnter={() => onHover && onHover(scenario, index)}
        onMouseLeave={() => onLeave && onLeave()}
      />
      
      {/* Scenario label */}
      <text
        x={x}
        y={y - size - 8}
        textAnchor="middle"
        className="text-xs font-medium fill-gray-700 pointer-events-none"
        style={{ fontSize: '11px' }}
      >
        {scenario.name || `S${index + 1}`}
      </text>
      
      {/* Income label */}
      <text
        x={x}
        y={y + size + 16}
        textAnchor="middle"
        className="text-xs fill-gray-600 pointer-events-none"
        style={{ fontSize: '10px' }}
      >
        {formatCurrencyForReports(scenario.metrics.totalIncome)}
      </text>
    </g>
  );
};

// Tooltip component for scenario details
const ScenarioTooltip = ({ scenario, index, x, y, visible }) => {
  if (!visible || !scenario) return null;

  const color = SCENARIO_COLORS[index % SCENARIO_COLORS.length];
  
  // Position tooltip to avoid edges
  const tooltipX = x > 400 ? x - 200 : x + 20;
  const tooltipY = y > 200 ? y - 120 : y + 20;

  return (
    <div
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-48"
      style={{ 
        left: tooltipX, 
        top: tooltipY,
        borderLeftColor: color,
        borderLeftWidth: '4px'
      }}
    >
      <div className="font-medium text-gray-800 mb-2">
        {scenario.name || `Scenario ${index + 1}`}
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Income:</span>
          <span className="font-medium">{formatCurrencyForReports(scenario.metrics.totalIncome)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Federal Tax:</span>
          <span className="font-medium">{formatCurrencyForReports(scenario.metrics.federalTax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">State Tax:</span>
          <span className="font-medium">{formatCurrencyForReports(scenario.metrics.stateTax)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Effective Rate:</span>
          <span className="font-medium">{formatPercentageForReports(scenario.metrics.effectiveRate)}</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-gray-600">After-Tax:</span>
          <span className="font-medium text-green-600">{formatCurrencyForReports(scenario.metrics.afterTaxIncome)}</span>
        </div>
      </div>
    </div>
  );
};

// Connection lines between scenarios
const ScenarioConnections = ({ scenarios, positions, showConnections }) => {
  if (!showConnections || scenarios.length < 2) return null;

  const connections = [];
  for (let i = 0; i < scenarios.length - 1; i++) {
    const start = positions[i];
    const end = positions[i + 1];
    
    if (start && end) {
      connections.push(
        <line
          key={`connection-${i}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="5,5"
          className="opacity-60"
        />
      );
    }
  }

  return <g>{connections}</g>;
};

// Legend component
const ScenarioLegend = ({ scenarios, activeScenario, onScenarioClick }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h4 className="font-medium text-gray-800 mb-3">Scenarios</h4>
      <div className="space-y-2">
        {scenarios.map((scenario, index) => {
          const color = SCENARIO_COLORS[index % SCENARIO_COLORS.length];
          const isActive = activeScenario?.id === scenario.id;
          
          return (
            <div
              key={scenario.id}
              className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => onScenarioClick && onScenarioClick(scenario)}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">
                  {scenario.name || `Scenario ${index + 1}`}
                </div>
                <div className="text-xs text-gray-600">
                  {formatCurrencyForReports(scenario.metrics.totalIncome)} income
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatPercentageForReports(scenario.metrics.effectiveRate)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main tax map overlay component
export const TaxMapOverlay = ({ 
  scenarios = [], 
  mapWidth = 800, 
  mapHeight = 400,
  incomeRange = { min: 0, max: 200000 },
  onScenarioClick,
  showConnections = false,
  showLegend = true,
  className = ""
}) => {
  const [hoveredScenario, setHoveredScenario] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 });
  const [activeScenario, setActiveScenario] = useState(null);

  // Calculate positions for each scenario on the tax map
  const scenarioPositions = useMemo(() => {
    return scenarios.map((scenario) => {
      const income = scenario.metrics.totalIncome || 0;
      const effectiveRate = scenario.metrics.effectiveRate || 0;
      
      // Map income to x-axis (0 to mapWidth)
      const x = Math.max(20, Math.min(mapWidth - 20, 
        (income - incomeRange.min) / (incomeRange.max - incomeRange.min) * (mapWidth - 40) + 20
      ));
      
      // Map effective rate to y-axis (inverted, 0% at bottom)
      const maxRate = 50; // Assume max 50% rate for scaling
      const y = Math.max(20, Math.min(mapHeight - 20,
        mapHeight - 20 - (effectiveRate / maxRate) * (mapHeight - 40)
      ));
      
      return { x, y, income, effectiveRate };
    });
  }, [scenarios, mapWidth, mapHeight, incomeRange]);

  const handleScenarioHover = (scenario, index, event) => {
    setHoveredScenario(scenario);
    setHoveredIndex(index);
    
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  const handleScenarioLeave = () => {
    setHoveredScenario(null);
    setHoveredIndex(null);
  };

  const handleScenarioClick = (scenario) => {
    setActiveScenario(scenario);
    if (onScenarioClick) {
      onScenarioClick(scenario);
    }
  };

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg ${className}`} 
           style={{ width: mapWidth, height: mapHeight }}>
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No Scenarios Selected</div>
          <div className="text-sm">Select scenarios to see them on the tax map</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-4">
        {/* Tax map with scenario overlays */}
        <div className="relative">
          <svg 
            width={mapWidth} 
            height={mapHeight}
            className="border border-gray-200 rounded-lg bg-white"
            onMouseLeave={handleScenarioLeave}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Scenario connections */}
            <ScenarioConnections 
              scenarios={scenarios}
              positions={scenarioPositions}
              showConnections={showConnections}
            />
            
            {/* Scenario markers */}
            {scenarios.map((scenario, index) => {
              const position = scenarioPositions[index];
              if (!position) return null;
              
              return (
                <ScenarioMarker
                  key={scenario.id}
                  scenario={scenario}
                  index={index}
                  x={position.x}
                  y={position.y}
                  isActive={activeScenario?.id === scenario.id}
                  onClick={handleScenarioClick}
                  onHover={(s, i) => handleScenarioHover(s, i)}
                  onLeave={handleScenarioLeave}
                />
              );
            })}
            
            {/* Axis labels */}
            <text x={mapWidth / 2} y={mapHeight - 5} textAnchor="middle" className="text-xs fill-gray-600">
              Income →
            </text>
            <text 
              x="15" 
              y={mapHeight / 2} 
              textAnchor="middle" 
              className="text-xs fill-gray-600"
              transform={`rotate(-90, 15, ${mapHeight / 2})`}
            >
              ← Tax Rate
            </text>
          </svg>
          
          {/* Scenario tooltip */}
          <ScenarioTooltip
            scenario={hoveredScenario}
            index={hoveredIndex}
            x={hoveredPosition.x}
            y={hoveredPosition.y}
            visible={!!hoveredScenario}
          />
        </div>
        
        {/* Legend */}
        {showLegend && (
          <div className="flex-shrink-0 w-64">
            <ScenarioLegend
              scenarios={scenarios}
              activeScenario={activeScenario}
              onScenarioClick={handleScenarioClick}
            />
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showConnections}
              onChange={(e) => setShowConnections && setShowConnections(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Show connections</span>
          </label>
        </div>
        
        <div className="text-xs text-gray-500">
          {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''} displayed
        </div>
      </div>
    </div>
  );
};

export default TaxMapOverlay;

