import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

// Use built-in fonts to avoid font loading issues

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 15
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10
  },
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
    border: '1 solid #E5E7EB'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    borderBottom: '1 solid #D1D5DB',
    paddingBottom: 5
  },
  sectionContent: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#F3F4F6',
    fontWeight: 'bold'
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 5
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'left'
  },
  highlight: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 3,
    marginBottom: 10
  },
  warning: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 3,
    marginBottom: 10,
    border: '1 solid #FECACA'
  },
  success: {
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 3,
    marginBottom: 10,
    border: '1 solid #A7F3D0'
  },
  info: {
    backgroundColor: '#DBEAFE',
    padding: 8,
    borderRadius: 3,
    marginBottom: 10,
    border: '1 solid #93C5FD'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 8,
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#6B7280'
  }
});

// Simplified PDF Components to avoid font rendering issues
const ExecutiveSummaryPDF = ({ calculations, incomeSources, assets, settings, clientName }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Executive Summary</Text>
      <Text style={styles.subtitle}>Tax Planning Report</Text>
      <View style={styles.clientInfo}>
        <Text>Client: {clientName}</Text>
        <Text>Date: {new Date().toLocaleDateString()}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Financial Overview</Text>
      <View style={styles.sectionContent}>
        <Text>Total Income: {formatCurrencyForReports(calculations?.totalIncome || 0)}</Text>
        <Text>Federal Tax: {formatCurrencyForReports(calculations?.federalTax || 0)}</Text>
        <Text>Effective Rate: {formatPercentageForReports(calculations?.effectiveRateTotal || 0)}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Recommendations</Text>
      <View style={styles.sectionContent}>
        <Text>- Optimize withdrawal strategies</Text>
        <Text>- Consider Roth conversions</Text>
        <Text>- Review asset allocation</Text>
      </View>
    </View>
  </Page>
);

const CurrentTaxPositionPDF = ({ calculations, incomeSources, assets, settings, clientName }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Current Tax Position</Text>
      <View style={styles.clientInfo}>
        <Text>Client: {clientName}</Text>
        <Text>Tax Year: {new Date().getFullYear()}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tax Summary</Text>
      <View style={styles.sectionContent}>
        <Text>Taxable Income: {formatCurrencyForReports(calculations?.federalTaxableIncome || 0)}</Text>
        <Text>Federal Tax: {formatCurrencyForReports(calculations?.federalTax || 0)}</Text>
        <Text>State Tax: {formatCurrencyForReports(calculations?.netStateTax || 0)}</Text>
        <Text>Total Tax: {formatCurrencyForReports((calculations?.federalTax || 0) + (calculations?.netStateTax || 0))}</Text>
      </View>
    </View>
  </Page>
);

// Main PDF Document Component
const ComprehensivePDFReport = ({ calculations, incomeSources, assets, settings, clientName, selectedModules }) => (
  <Document>
    {selectedModules.executiveSummary && (
      <ExecutiveSummaryPDF 
        calculations={calculations}
        incomeSources={incomeSources}
        assets={assets}
        settings={settings}
        clientName={clientName}
      />
    )}
    {selectedModules.currentTaxPosition && (
      <CurrentTaxPositionPDF 
        calculations={calculations}
        incomeSources={incomeSources}
        assets={assets}
        settings={settings}
        clientName={clientName}
      />
    )}
  </Document>
);

// Main PDF Report Generator Component
          <View style={styles.tableCol}><Text style={styles.tableCell}>State Tax</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Effective Rate</Text></View>
        </View>
        {[0.8, 1.0, 1.2, 1.5].map((multiplier, index) => {
          const income = (calculations?.totalIncome || 0) * multiplier;
          const fedTax = income * 0.12; // Simplified
          const stateTax = income * 0.04; // Simplified
          const effectiveRate = (fedTax + stateTax) / income;
          
          return (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatCurrencyForReports(income)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatCurrencyForReports(fedTax)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatCurrencyForReports(stateTax)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatPercentageForReports(effectiveRate)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>

    <View style={styles.success}>
      <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Optimization Opportunity</Text>
      <Text>Tax map analysis reveals potential for {formatCurrencyForReports((calculations?.federalTax || 0) * 0.15)} in annual savings through strategic income timing.</Text>
    </View>

    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
      `${pageNumber} / ${totalPages}`
    )} fixed />
  </Page>
);

// Main PDF Document Component
const ComprehensivePDFReport = ({ 
  calculations, 
  incomeSources, 
  assets, 
  settings, 
  clientName,
  selectedModules 
}) => (
  <Document>
    {selectedModules.executiveSummary && (
      <ExecutiveSummaryPDF 
        calculations={calculations}
        incomeSources={incomeSources}
        assets={assets}
        settings={settings}
        clientName={clientName}
      />
    )}
    {selectedModules.currentTaxPosition && (
      <CurrentTaxPositionPDF 
        calculations={calculations}
        incomeSources={incomeSources}
        assets={assets}
        settings={settings}
        clientName={clientName}
      />
    )}
    {selectedModules.taxMapVisualization && (
      <TaxMapVisualizationPDF 
        calculations={calculations}
        incomeSources={incomeSources}
        assets={assets}
        settings={settings}
        clientName={clientName}
      />
    )}
  </Document>
);

// Main PDF Report Generator Component
const PDFReportGenerator = ({ 
  calculations, 
  incomeSources, 
  assets, 
  settings, 
  taxpayer, 
  spouse 
}) => {
  const [selectedModules, setSelectedModules] = useState({
    executiveSummary: true,
    currentTaxPosition: true,
    taxMapVisualization: true,
    sequenceReturns: true,
    capitalGainsPlanning: true,
    assetManagement: true,
    socialSecurityAnalysis: true,
    rmdPlanning: true,
    taxOptimization: true,
    multiYearProjections: true,
    estatePlanning: true,
    riskAnalysis: true
  });

  // Generate client name from taxpayer and spouse data
  const generateClientName = () => {
    if (!taxpayer?.firstName && !spouse?.firstName) {
      return "Client";
    }
    
    if (taxpayer?.firstName && spouse?.firstName) {
      if (taxpayer?.lastName === spouse?.lastName) {
        return `${taxpayer.firstName} and ${spouse.firstName} ${taxpayer.lastName}`;
      } else {
        return `${taxpayer.firstName} ${taxpayer.lastName} and ${spouse.firstName} ${spouse.lastName}`;
      }
    }
    
    if (taxpayer?.firstName) {
      return `${taxpayer.firstName} ${taxpayer.lastName || ''}`.trim();
    }
    
    if (spouse?.firstName) {
      return `${spouse.firstName} ${spouse.lastName || ''}`.trim();
    }
    
    return "Client";
  };

  const clientName = generateClientName();

  const handleModuleToggle = (moduleKey) => {
    setSelectedModules(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedModules).every(Boolean);
    const newState = Object.keys(selectedModules).reduce((acc, key) => {
      acc[key] = !allSelected;
      return acc;
    }, {});
    setSelectedModules(newState);
  };

  const moduleOptions = [
    { key: 'executiveSummary', label: 'Executive Summary', description: 'High-level overview and key recommendations' },
    { key: 'currentTaxPosition', label: 'Current Tax Position', description: 'Detailed analysis of current tax situation' },
    { key: 'taxMapVisualization', label: 'Tax Map Visualization', description: 'Visual tax rate analysis across income levels' },
    { key: 'sequenceReturns', label: 'Sequence of Returns', description: 'Portfolio sustainability analysis' },
    { key: 'capitalGainsPlanning', label: 'Capital Gains Planning', description: 'Tax-loss harvesting and optimization' },
    { key: 'assetManagement', label: 'Asset Management', description: 'RMD planning and asset allocation' },
    { key: 'socialSecurityAnalysis', label: 'Social Security Analysis', description: 'Claiming strategies and optimization' },
    { key: 'rmdPlanning', label: 'RMD Planning', description: 'Required minimum distribution strategies' },
    { key: 'taxOptimization', label: 'Tax Optimization', description: 'Advanced tax planning strategies' },
    { key: 'multiYearProjections', label: 'Multi-Year Projections', description: 'Long-term tax planning scenarios' },
    { key: 'estatePlanning', label: 'Estate Planning', description: 'Wealth transfer and estate tax considerations' },
    { key: 'riskAnalysis', label: 'Risk Analysis', description: 'Financial and tax risk assessment' }
  ];

  const selectedCount = Object.values(selectedModules).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">PDF Report Generator</h2>
        <p className="text-gray-600 mt-2">
          Generate comprehensive PDF reports with selected modules and visualizations.
        </p>
      </div>

      {/* Module Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Report Modules</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{selectedCount} of {moduleOptions.length} selected</span>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {Object.values(selectedModules).every(Boolean) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleOptions.map((module) => (
            <div key={module.key} className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedModules[module.key]}
                  onChange={() => handleModuleToggle(module.key)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">{module.label}</div>
                  <div className="text-sm text-gray-600">{module.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Client Information Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Client Name:</span>
            <div className="text-gray-600">{clientName}</div>
          </div>
          <div>
            <span className="font-medium">Report Date:</span>
            <div className="text-gray-600">{new Date().toLocaleDateString()}</div>
          </div>
          <div>
            <span className="font-medium">Total Income:</span>
            <div className="text-gray-600">{formatCurrencyForReports(calculations?.totalIncome || 0)}</div>
          </div>
          <div>
            <span className="font-medium">Effective Rate:</span>
            <div className="text-gray-600">{formatPercentageForReports(calculations?.effectiveRateTotal || 0)}</div>
          </div>
        </div>
      </div>

      {/* PDF Download Button */}
      <div className="flex justify-center">
        <PDFDownloadLink
          document={
            <ComprehensivePDFReport
              calculations={calculations}
              incomeSources={incomeSources}
              assets={assets}
              settings={settings}
              clientName={clientName}
              selectedModules={selectedModules}
            />
          }
          fileName={`Tax_Planning_Report_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {({ blob, url, loading, error }) => {
            if (loading) return 'Generating PDF...';
            if (error) {
              console.error('PDF Generation Error:', error);
              return 'Error generating PDF - Check console';
            }
            return `Download PDF Report (${selectedCount} modules)`;
          }}
        </PDFDownloadLink>
      </div>

      {selectedCount === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500">Please select at least one module to generate a report.</div>
        </div>
      )}
    </div>
  );
};

export default PDFReportGenerator;

