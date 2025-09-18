import React, { useState, useEffect } from 'react';

const ScenarioSelector = ({ 
  scenarios = [], 
  selectedScenarios = [], 
  onScenarioSelectionChange,
  comparisonMode = false,
  onComparisonModeChange,
  maxSelections = 4 
}) => {
  console.log('ScenarioSelector received scenarios:', scenarios);
  console.log('ScenarioSelector scenarios length:', scenarios.length);
  
  const [localSelectedScenarios, setLocalSelectedScenarios] = useState(selectedScenarios);

  useEffect(() => {
    setLocalSelectedScenarios(selectedScenarios);
  }, [selectedScenarios]);

  const handleScenarioToggle = (scenarioId) => {
    let newSelection;
    
    if (localSelectedScenarios.includes(scenarioId)) {
      // Remove scenario
      newSelection = localSelectedScenarios.filter(id => id !== scenarioId);
    } else {
      // Add scenario (respect max selections)
      if (localSelectedScenarios.length < maxSelections) {
        newSelection = [...localSelectedScenarios, scenarioId];
      } else {
        // Replace the first selected scenario
        newSelection = [...localSelectedScenarios.slice(1), scenarioId];
      }
    }
    
    setLocalSelectedScenarios(newSelection);
    onScenarioSelectionChange(newSelection);
  };

  const handleComparisonModeToggle = () => {
    const newMode = !comparisonMode;
    onComparisonModeChange(newMode);
    
    // If switching to single mode, keep only the first selected scenario
    if (!newMode && localSelectedScenarios.length > 1) {
      const singleSelection = [localSelectedScenarios[0]];
      setLocalSelectedScenarios(singleSelection);
      onScenarioSelectionChange(singleSelection);
    }
  };

  const getScenarioDisplayName = (scenario) => {
    return scenario.name || `Scenario ${scenario.id}`;
  };

  const getScenarioSummary = (scenario) => {
    if (!scenario.data) return 'No data available';
    
    const income = scenario.data.totalIncome || 0;
    const tax = scenario.data.totalTax || 0;
    const effectiveRate = income > 0 ? (tax / income * 100) : 0;
    
    return `Income: $${income.toLocaleString()}, Tax: $${tax.toLocaleString()}, Rate: ${effectiveRate.toFixed(1)}%`;
  };

  return (
    <div className="scenario-selector bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Scenario Selection</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={comparisonMode}
              onChange={handleComparisonModeToggle}
              className="rounded border-gray-300"
            />
            <span>Comparison Mode</span>
          </label>
        </div>
      </div>

      {!comparisonMode && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <strong>Single Scenario Mode:</strong> Generate report for one scenario only.
        </div>
      )}

      {comparisonMode && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          <strong>Comparison Mode:</strong> Compare up to {maxSelections} scenarios side-by-side. 
          Select {localSelectedScenarios.length}/{maxSelections} scenarios.
        </div>
      )}

      <div className="space-y-3">
        {scenarios.map((scenario) => {
          const isSelected = localSelectedScenarios.includes(scenario.id);
          const isDisabled = !comparisonMode && localSelectedScenarios.length > 0 && !isSelected;
          
          return (
            <div
              key={scenario.id}
              className={`scenario-item border rounded-lg p-3 transition-all ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : isDisabled 
                    ? 'border-gray-200 bg-gray-50 opacity-50' 
                    : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleScenarioToggle(scenario.id)}
                  disabled={isDisabled}
                  className="mt-1 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">
                      {getScenarioDisplayName(scenario)}
                    </h4>
                    {scenario.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {getScenarioSummary(scenario)}
                  </p>
                  {scenario.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {scenario.description}
                    </p>
                  )}
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No scenarios available</p>
          <p className="text-sm mt-1">Create scenarios using the "Add Scenario" button</p>
        </div>
      )}

      {comparisonMode && localSelectedScenarios.length > 1 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">Comparison Preview:</h4>
          <div className="text-sm text-yellow-700">
            <p>Selected scenarios: {localSelectedScenarios.length}</p>
            <p>Report will include side-by-side comparison tables and delta analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioSelector;

