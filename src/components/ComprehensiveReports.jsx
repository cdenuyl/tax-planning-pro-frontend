import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import PrintableReportGenerator from './reports/PrintableReportGenerator';
import { ExecutiveSummaryModule } from './reports/ExecutiveSummaryModule';
import { CurrentTaxPositionModule } from './reports/CurrentTaxPositionModule';
import SocialSecurityAnalysisModule from './reports/SocialSecurityAnalysisModule';
import RMDPlanningModule from './reports/RMDPlanningModule';
import TaxMapVisualizationModule from './reports/TaxMapVisualizationModule';
import SequenceReturnsModule from './reports/SequenceReturnsModule';
import CapitalGainsPlanningModule from './reports/CapitalGainsPlanningModule';
import AssetManagementModule from './reports/AssetManagementModule';
import MultiYearProjectionsModule from './reports/MultiYearProjectionsModule';

const ComprehensiveReports = ({ 
  calculations, 
  incomeSources, 
  assets, 
  settings, 
  taxpayer, 
  spouse, 
  scenarios = [],
  onGenerateReport 
}) => {
  const [activeTab, setActiveTab] = useState('pdf-generator');

  const tabs = [
    { id: 'pdf-generator', label: 'PDF Report Generator', icon: '📄' },
    { id: 'executive-summary', label: 'Executive Summary', icon: '📊' },
    { id: 'current-tax', label: 'Current Tax Position', icon: '💰' },
    { id: 'tax-map', label: 'Tax Map Visualization', icon: '🗺️' },
    { id: 'sequence-returns', label: 'Sequence of Returns', icon: '📈' },
    { id: 'capital-gains', label: 'Capital Gains Planning', icon: '💹' },
    { id: 'asset-management', label: 'Asset Management', icon: '🏦' },
    { id: 'social-security', label: 'Social Security Analysis', icon: '🏛️' },
    { id: 'rmd-planning', label: 'RMD Planning', icon: '📅' },
    { id: 'multi-year-projections', label: 'Multi-Year Projections', icon: '📊' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pdf-generator':
        return (
          <PrintableReportGenerator
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
            taxpayer={taxpayer}
            spouse={spouse}
            scenarios={scenarios}
          />
        );
      case 'executive-summary':
        return (
          <ExecutiveSummaryModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'current-tax':
        return (
          <CurrentTaxPositionModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'tax-map':
        return (
          <TaxMapVisualizationModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'sequence-returns':
        return (
          <SequenceReturnsModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'capital-gains':
        return (
          <CapitalGainsPlanningModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'asset-management':
        return (
          <AssetManagementModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'social-security':
        return (
          <SocialSecurityAnalysisModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'rmd-planning':
        return (
          <RMDPlanningModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      case 'multi-year-projections':
        return (
          <MultiYearProjectionsModule
            calculations={calculations}
            incomeSources={incomeSources}
            assets={assets}
            settings={settings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex space-x-6">
      {/* Left Sidebar - Tab Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Sections</h3>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen">
        {renderTabContent()}
      </div>
    </div>
  );
};
export default ComprehensiveReports;
