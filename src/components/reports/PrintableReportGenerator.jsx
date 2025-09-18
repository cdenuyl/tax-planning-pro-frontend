import React, { useState, useEffect } from 'react';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';
import { ExecutiveSummaryModule } from './ExecutiveSummaryModule';
import { CurrentTaxPositionModule } from './CurrentTaxPositionModule';
import SocialSecurityAnalysisModule from './SocialSecurityAnalysisModule';
import RMDPlanningModule from './RMDPlanningModule';
import TaxMapVisualizationModule from './TaxMapVisualizationModule';
import SequenceReturnsModule from './SequenceReturnsModule';
import CapitalGainsPlanningModule from './CapitalGainsPlanningModule';
import AssetManagementModule from './AssetManagementModule';
import MultiYearProjectionsModule from './MultiYearProjectionsModule';
import ChartRenderer from './ChartRenderer.jsx';
import WordExportGenerator from './WordExportGenerator.jsx';
import ExcelExportGenerator from './ExcelExportGenerator.jsx';
import TemplateCustomizer from './TemplateCustomizer.jsx';
import ScenarioSelector from '../ScenarioSelector.jsx';
import MultiScenarioReportGenerator from './MultiScenarioReportGenerator.jsx';
import { aggregateScenarioData, calculateScenarioDifferences, generateComparisonSummary } from '../../utils/scenarioComparison.js';

const PrintableReportGenerator = ({ 
  calculations, 
  incomeSources, 
  assets, 
  settings, 
  taxpayer, 
  spouse,
  scenarios = [] // Add scenarios prop
}) => {
  console.log('PrintableReportGenerator received scenarios:', scenarios);
  console.log('PrintableReportGenerator scenarios length:', scenarios.length);
  
  const [selectedModules, setSelectedModules] = useState({
    executiveSummary: true,
    currentTaxPosition: true,
    taxMapVisualization: true,
    socialSecurityAnalysis: true,
    rmdPlanning: true,
    sequenceReturns: true,
    capitalGainsPlanning: true,
    assetManagement: true,
    multiYearProjections: true
  });

  const [template, setTemplate] = useState({});
  const [chartImages, setChartImages] = useState({});
  
  // Scenario comparison state
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [scenarioData, setScenarioData] = useState([]);

  // Update scenarioData when scenarios prop changes
  useEffect(() => {
    console.log('PrintableReportGenerator useEffect - scenarios prop:', scenarios);
    setScenarioData(scenarios);
  }, [scenarios]);

  // Generate client name from taxpayer and spouse data
  const generateClientName = () => {
    if (!taxpayer?.firstName && !spouse?.firstName) {
      return 'Tax Planning Client';
    }
    
    const taxpayerName = taxpayer?.firstName ? 
      `${taxpayer.firstName} ${taxpayer.lastName || ''}`.trim() : '';
    const spouseName = spouse?.firstName ? 
      `${spouse.firstName} ${spouse.lastName || ''}`.trim() : '';
    
    if (taxpayerName && spouseName) {
      // Check if they have the same last name
      if (taxpayer.lastName && spouse.lastName && taxpayer.lastName === spouse.lastName) {
        return `${taxpayer.firstName} and ${spouse.firstName} ${taxpayer.lastName}`;
      } else {
        return `${taxpayerName} and ${spouseName}`;
      }
    }
    
    return taxpayerName || spouseName || 'Tax Planning Client';
  };

  const clientName = generateClientName();
  const selectedCount = Object.values(selectedModules).filter(Boolean).length;

  const moduleDefinitions = [
    {
      id: 'executiveSummary',
      label: 'Executive Summary',
      icon: '📊',
      component: ExecutiveSummaryModule
    },
    {
      id: 'currentTaxPosition',
      label: 'Current Tax Position',
      icon: '💰',
      component: CurrentTaxPositionModule
    },
    {
      id: 'taxMapVisualization',
      label: 'Tax Map Visualization',
      icon: '🗺️',
      component: TaxMapVisualizationModule
    },
    {
      id: 'socialSecurityAnalysis',
      label: 'Social Security Analysis',
      icon: '🏛️',
      component: SocialSecurityAnalysisModule
    },
    {
      id: 'rmdPlanning',
      label: 'RMD Planning',
      icon: '📅',
      component: RMDPlanningModule
    },
    {
      id: 'sequenceReturns',
      label: 'Sequence of Returns',
      icon: '📈',
      component: SequenceReturnsModule
    },
    {
      id: 'capitalGainsPlanning',
      label: 'Capital Gains Planning',
      icon: '💹',
      component: CapitalGainsPlanningModule
    },
    {
      id: 'assetManagement',
      label: 'Asset Management',
      icon: '🏦',
      component: AssetManagementModule
    },
    {
      id: 'multiYearProjections',
      label: 'Multi-Year Projections',
      icon: '📊',
      component: MultiYearProjectionsModule
    }
  ];

  // New React-based report generation that uses actual components
  const generateReactBasedReport = () => {
    // Get the live preview content that contains the actual rendered components
    const livePreviewElement = document.querySelector('.live-report-preview');
    
    if (!livePreviewElement) {
      alert('Live preview not found. Please ensure the report preview is loaded.');
      return;
    }
    
    // Create a new window for the report
    const reportWindow = window.open('', '_blank', 'width=1200,height=800');
    
    // Write the basic HTML structure
    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Planning Report - ${clientName}</title>
        <style>
          @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
            .no-print { display: none; }
            .print-button { display: none; }
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 11in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
          }
          
          .report-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            border-bottom: 3px solid #3b82f6;
          }
          
          .report-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          
          .report-subtitle {
            font-size: 20px;
            color: #374151;
            margin-bottom: 10px;
          }
          
          .client-info {
            font-size: 14px;
            color: #6b7280;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
          }
          
          .print-button:hover {
            background: #2563eb;
          }
          
          /* Preserve component styles */
          .bg-white {
            background: white !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            margin-bottom: 20px !important;
            padding: 24px !important;
            page-break-inside: avoid;
          }
          
          .bg-blue-50 { background: #eff6ff !important; }
          .bg-green-50 { background: #f0fdf4 !important; }
          .bg-orange-50 { background: #fff7ed !important; }
          .bg-red-50 { background: #fef2f2 !important; }
          .bg-gray-50 { background: #f9fafb !important; }
          .bg-yellow-50 { background: #fefce8 !important; }
          
          .text-blue-600 { color: #2563eb !important; }
          .text-green-600 { color: #16a34a !important; }
          .text-orange-600 { color: #ea580c !important; }
          .text-red-600 { color: #dc2626 !important; }
          .text-gray-900 { color: #111827 !important; }
          .text-gray-600 { color: #4b5563 !important; }
          
          .font-bold { font-weight: bold !important; }
          .font-semibold { font-weight: 600 !important; }
          .font-medium { font-weight: 500 !important; }
          
          .text-lg { font-size: 18px !important; }
          .text-2xl { font-size: 24px !important; }
          .text-sm { font-size: 14px !important; }
          
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .gap-4 { gap: 16px !important; }
          .gap-3 { gap: 12px !important; }
          
          .p-4 { padding: 16px !important; }
          .p-3 { padding: 12px !important; }
          .mb-2 { margin-bottom: 8px !important; }
          .mb-3 { margin-bottom: 12px !important; }
          .mb-4 { margin-bottom: 16px !important; }
          .mt-2 { margin-top: 8px !important; }
          
          .border-t { border-top: 1px solid #e5e7eb !important; }
          .pt-4 { padding-top: 16px !important; }
          
          .rounded-lg { border-radius: 8px !important; }
          
          .space-y-3 > * + * { margin-top: 12px !important; }
          .space-y-2 > * + * { margin-top: 8px !important; }
          .space-y-6 > * + * { margin-top: 24px !important; }
          
          .flex { display: flex !important; }
          .items-center { align-items: center !important; }
          .items-start { align-items: flex-start !important; }
          .space-x-3 > * + * { margin-left: 12px !important; }
          .space-x-2 > * + * { margin-left: 8px !important; }
          
          /* Chart containers */
          .recharts-wrapper {
            background: white !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            padding: 16px !important;
          }
          
          /* Tables */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 16px 0 !important;
          }
          
          th, td {
            border: 1px solid #e5e7eb !important;
            padding: 8px 12px !important;
            text-align: left !important;
          }
          
          th {
            background: #f9fafb !important;
            font-weight: 600 !important;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ Print to PDF</button>
        
        <div class="report-header">
          <div class="report-title">Comprehensive Tax Planning Report</div>
          <div class="report-subtitle">Client: ${clientName}</div>
          <div class="client-info">
            Report Date: ${new Date().toLocaleDateString()} | 
            Tax Year: ${new Date().getFullYear()} |
            Modules: ${selectedCount}
          </div>
        </div>
        
        <div id="report-content">
          <!-- Actual component content will be inserted here -->
        </div>
      </body>
      </html>
    `);
    
    reportWindow.document.close();
    
    // Clone the live preview content and insert it into the PDF
    const reportContent = reportWindow.document.getElementById('report-content');
    const clonedContent = livePreviewElement.cloneNode(true);
    
    // Clean up any interactive elements that shouldn't be in PDF
    const interactiveElements = clonedContent.querySelectorAll('button, input, select, textarea');
    interactiveElements.forEach(el => el.remove());
    
    // Remove any elements with specific classes that shouldn't be in PDF
    const elementsToRemove = clonedContent.querySelectorAll('.no-print, .print-only-hide');
    elementsToRemove.forEach(el => el.remove());
    
    // Ensure the content is properly styled for PDF
    clonedContent.style.maxWidth = 'none';
    clonedContent.style.margin = '0';
    clonedContent.style.padding = '0';
    
    // Insert the cloned content
    reportContent.appendChild(clonedContent);
    
    // Focus the new window
    setTimeout(() => {
      reportWindow.focus();
    }, 500);
  };

  const generatePrintableReport = generateReactBasedReport;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comprehensive Report Generator</h3>
        
        {/* Scenario Selection */}
        <ScenarioSelector
          scenarios={scenarioData}
          selectedScenarios={selectedScenarios}
          onScenarioSelectionChange={setSelectedScenarios}
          comparisonMode={comparisonMode}
          onComparisonModeChange={setComparisonMode}
          maxSelections={4}
        />
        
        {/* Module Selection Grid - Stacked Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {moduleDefinitions.map((module) => (
            <label key={module.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedModules[module.id]}
                onChange={(e) => setSelectedModules(prev => ({
                  ...prev,
                  [module.id]: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-lg">{module.icon}</span>
              <span className="text-sm font-medium text-gray-700">{module.label}</span>
            </label>
          ))}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Client: <span className="font-medium">{clientName}</span></div>
            <div>Modules Selected: <span className="font-medium">{selectedCount} of {moduleDefinitions.length}</span></div>
            <div>Total Income: <span className="font-medium">{formatCurrencyForReports(calculations?.totalIncome || 0)}</span></div>
            <div>Effective Rate: <span className="font-medium">{formatPercentageForReports(calculations?.effectiveRateTotal || 0)}</span></div>
          </div>
        </div>

        {/* Template Customization */}
        <TemplateCustomizer 
          onTemplateChange={setTemplate}
          currentTemplate={template}
          className="mb-6"
        />

        {/* Export Options */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generatePrintableReport}
              disabled={selectedCount === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🖨️ Generate PDF Report
            </button>
            
            <WordExportGenerator
              selectedModules={selectedModules ? Object.keys(selectedModules).filter(key => selectedModules[key]) : []}
              calculations={calculations}
              appSettings={settings}
              taxpayer={taxpayer}
              spouse={spouse}
              incomeSourcesData={incomeSources}
              comparisonMode={comparisonMode}
              scenarios={comparisonMode ? scenarioData.filter(s => selectedScenarios.includes(s.id)) : null}
              onExportComplete={(fileName) => console.log('Word export completed:', fileName)}
            />
            
            <ExcelExportGenerator
              selectedModules={selectedModules ? Object.keys(selectedModules).filter(key => selectedModules[key]) : []}
              calculations={calculations}
              appSettings={settings}
              taxpayer={taxpayer}
              spouse={spouse}
              incomeSourcesData={incomeSources}
              comparisonMode={comparisonMode}
              scenarios={comparisonMode ? scenarioData.filter(s => selectedScenarios.includes(s.id)) : null}
              onExportComplete={(fileName) => console.log('Excel export completed:', fileName)}
            />
          </div>
        </div>

        {selectedCount === 0 && (
          <div className="text-center py-4">
            <div className="text-gray-500">Please select at least one module to generate a report.</div>
          </div>
        )}

        {/* Live Report Preview with Actual Components */}
        {selectedCount > 0 && !comparisonMode && (
          <div className="mt-6 mb-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold mb-4">📋 Live Report Preview</h3>
              <div className="live-report-preview space-y-6">
                {selectedModules.executiveSummary && (
                  <ExecutiveSummaryModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.currentTaxPosition && (
                  <CurrentTaxPositionModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.taxMapVisualization && (
                  <TaxMapVisualizationModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.socialSecurityAnalysis && (
                  <SocialSecurityAnalysisModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    settings={settings}
                    taxpayer={taxpayer}
                    spouse={spouse}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.rmdPlanning && (
                  <RMDPlanningModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.sequenceReturns && (
                  <SequenceReturnsModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    assets={assets}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.capitalGainsPlanning && (
                  <CapitalGainsPlanningModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.assetManagement && (
                  <AssetManagementModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    assets={assets}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
                
                {selectedModules.multiYearProjections && (
                  <MultiYearProjectionsModule 
                    calculations={calculations}
                    incomeSources={incomeSources}
                    settings={settings}
                    reportSettings={{}}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Multi-Scenario Comparison Preview */}
        {comparisonMode && selectedScenarios.length > 1 && (
          <div className="mt-6 mb-6">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Multi-Scenario Comparison Preview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarioData.filter(s => selectedScenarios.includes(s.id)).map((scenario, index) => (
                  <div key={scenario.id || index} className="bg-gray-50 p-4 rounded">
                    <h4 className="font-medium mb-2">{scenario.name || `Scenario ${index + 1}`}</h4>
                    <div className="text-sm space-y-1">
                      <div>ID: {scenario.id}</div>
                      <div>Active: {scenario.isActive ? 'Yes' : 'No'}</div>
                      <div>Income Sources: {scenario.data?.incomeSources?.length || 0}</div>
                      
                      {scenario.data?.incomeSources?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="font-medium text-gray-700">Income Sources:</div>
                          {scenario.data.incomeSources.map((source, idx) => (
                            <div key={idx} className="text-xs bg-blue-50 p-1 rounded">
                              {source.type}: ${(source.amount || 0).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintableReportGenerator;

