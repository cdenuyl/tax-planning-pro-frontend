import React from 'react';
import { 
  SideBySideComparisonTable, 
  DeltaAnalysisTable, 
  ComparisonSummaryCard, 
  ComparisonReportLayout 
} from './ComparisonReportTemplates.jsx';
import { ComparisonDashboard } from '../charts/MultiScenarioCharts';
import { TaxMapOverlay } from '../charts/TaxMapOverlay';
import StrategicRecommendationsModule from './StrategicRecommendationsModule';
import { 
  aggregateScenarioData, 
  calculateScenarioDifferences, 
  generateComparisonSummary 
} from '../../utils/scenarioComparison.js';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

const MultiScenarioReportGenerator = ({ 
  scenarios, 
  selectedModules, 
  template = {},
  clientName = 'Tax Planning Client'
}) => {
  console.log('MultiScenarioReportGenerator received scenarios:', scenarios);
  
  // Add comprehensive error handling
  if (!scenarios) {
    console.error('MultiScenarioReportGenerator: scenarios is null/undefined');
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: No scenario data provided</p>
      </div>
    );
  }

  if (!Array.isArray(scenarios)) {
    console.error('MultiScenarioReportGenerator: scenarios is not an array:', typeof scenarios);
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error: Invalid scenario data format</p>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No scenarios selected for comparison</p>
      </div>
    );
  }

  try {
    // Aggregate scenario data for comparison
    const aggregatedScenarios = aggregateScenarioData(scenarios);
    
    if (!aggregatedScenarios || aggregatedScenarios.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No scenarios available for comparison</p>
        </div>
      );
    }

    // Calculate differences vs base scenario (first scenario)
    const baseScenario = aggregatedScenarios[0];
    const compareScenarios = aggregatedScenarios.slice(1);
    const differences = calculateScenarioDifferences(baseScenario, compareScenarios);
    const summary = generateComparisonSummary(aggregatedScenarios, differences);

  return (
    <ComparisonReportLayout template={template} clientName={clientName}>
      {/* Executive Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Executive Summary</h2>
        <ComparisonSummaryCard 
          scenarios={aggregatedScenarios}
          summary={summary}
          template={template}
        />
      </section>

      {/* Visual Comparison Dashboard */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Visual Analysis</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ComparisonDashboard 
            scenarios={aggregatedScenarios}
            baseScenario={baseScenario}
            differences={differences}
          />
        </div>
      </section>

      {/* Tax Map Overlay */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Scenario Positioning</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <TaxMapOverlay 
            scenarios={aggregatedScenarios}
            mapWidth={800}
            mapHeight={400}
            showConnections={true}
            showLegend={true}
          />
        </div>
      </section>

      {/* Side-by-Side Comparison */}
      {selectedModules && selectedModules.includes('sideBySideComparison') && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Side-by-Side Comparison</h2>
          <SideBySideComparisonTable 
            scenarios={aggregatedScenarios}
            template={template}
          />
        </section>
      )}

      {/* Delta Analysis */}
      {selectedModules && selectedModules.includes('deltaAnalysis') && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Change Analysis</h2>
          <DeltaAnalysisTable 
            baseScenario={baseScenario}
            compareScenarios={compareScenarios}
            differences={differences}
            template={template}
          />
        </section>
      )}

      {/* Income Analysis */}
      {selectedModules && selectedModules.includes('incomeAnalysis') && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Income Analysis</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aggregatedScenarios.map((scenario, index) => (
                <div key={scenario.id} className="space-y-4">
                  <h3 className="font-medium text-gray-800">
                    {scenario.name || `Scenario ${index + 1}`}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ordinary Income:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.ordinaryIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capital Gains:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.capitalGains)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Social Security:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.socialSecurityIncome)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700 font-medium">Total Income:</span>
                      <span className="font-bold">{formatCurrencyForReports(scenario.metrics.totalIncome)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tax Analysis */}
      {selectedModules && selectedModules.includes('taxAnalysis') && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tax Analysis</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aggregatedScenarios.map((scenario, index) => (
                <div key={scenario.id} className="space-y-4">
                  <h3 className="font-medium text-gray-800">
                    {scenario.name || `Scenario ${index + 1}`}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Federal Tax:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.federalTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">State Tax:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.stateTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">FICA Tax:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.ficaTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IRMAA:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.irmaaAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700 font-medium">Total Tax:</span>
                      <span className="font-bold text-red-600">{formatCurrencyForReports(scenario.metrics.totalTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Rate:</span>
                      <span className="font-medium">{formatPercentageForReports(scenario.metrics.effectiveRate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* After-Tax Analysis */}
      {selectedModules && selectedModules.includes('afterTaxAnalysis') && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">After-Tax Analysis</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aggregatedScenarios.map((scenario, index) => (
                <div key={scenario.id} className="space-y-4">
                  <h3 className="font-medium text-gray-800">
                    {scenario.name || `Scenario ${index + 1}`}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Income:</span>
                      <span className="font-medium">{formatCurrencyForReports(scenario.metrics.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tax:</span>
                      <span className="font-medium text-red-600">-{formatCurrencyForReports(scenario.metrics.totalTax)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700 font-medium">After-Tax Income:</span>
                      <span className="font-bold text-green-600">{formatCurrencyForReports(scenario.metrics.afterTaxIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax Efficiency:</span>
                      <span className="font-medium">
                        {formatPercentageForReports((scenario.metrics.afterTaxIncome / scenario.metrics.totalIncome) * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Strategic Recommendations */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Strategic Recommendations</h2>
        <StrategicRecommendationsModule 
          scenarios={aggregatedScenarios}
          differences={differences}
          summary={summary}
          template={template}
        />
      </section>
    </ComparisonReportLayout>
  );
  } catch (error) {
    console.error('Error in MultiScenarioReportGenerator:', error);
    return (
      <div className="text-center py-8 text-red-500">
        <p>Error generating comparison report</p>
        <p className="text-sm mt-2">Please check the console for details</p>
      </div>
    );
  }
};

export default MultiScenarioReportGenerator;

