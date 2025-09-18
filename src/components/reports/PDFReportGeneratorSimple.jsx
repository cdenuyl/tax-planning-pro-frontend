import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { formatCurrencyForReports, formatPercentageForReports } from '../../utils/reportFormatting';

// Simple PDF Styles using built-in fonts
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.4
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #000000',
    paddingBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10
  },
  section: {
    marginBottom: 15,
    padding: 10,
    border: '1 solid #CCCCCC'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  text: {
    marginBottom: 4
  }
});

// Simple Executive Summary PDF
const ExecutiveSummaryPDF = ({ calculations, clientName }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Executive Summary</Text>
      <Text style={styles.subtitle}>Client: {clientName}</Text>
      <Text style={styles.subtitle}>Date: {new Date().toLocaleDateString()}</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Financial Overview</Text>
      <Text style={styles.text}>Total Income: {formatCurrencyForReports(calculations?.totalIncome || 0)}</Text>
      <Text style={styles.text}>Federal Tax: {formatCurrencyForReports(calculations?.federalTax || 0)}</Text>
      <Text style={styles.text}>State Tax: {formatCurrencyForReports(calculations?.netStateTax || 0)}</Text>
      <Text style={styles.text}>Effective Rate: {formatPercentageForReports(calculations?.effectiveRateTotal || 0)}</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Recommendations</Text>
      <Text style={styles.text}>- Optimize withdrawal strategies</Text>
      <Text style={styles.text}>- Consider Roth conversions</Text>
      <Text style={styles.text}>- Review asset allocation</Text>
      <Text style={styles.text}>- Plan for tax efficiency</Text>
    </View>
  </Page>
);

// Simple Tax Position PDF
const TaxPositionPDF = ({ calculations, clientName }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Current Tax Position</Text>
      <Text style={styles.subtitle}>Client: {clientName}</Text>
      <Text style={styles.subtitle}>Tax Year: {new Date().getFullYear()}</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tax Summary</Text>
      <Text style={styles.text}>Adjusted Gross Income: {formatCurrencyForReports(calculations?.federalAGI || 0)}</Text>
      <Text style={styles.text}>Taxable Income: {formatCurrencyForReports(calculations?.federalTaxableIncome || 0)}</Text>
      <Text style={styles.text}>Federal Tax: {formatCurrencyForReports(calculations?.federalTax || 0)}</Text>
      <Text style={styles.text}>State Tax: {formatCurrencyForReports(calculations?.netStateTax || 0)}</Text>
      <Text style={styles.text}>Total Tax: {formatCurrencyForReports((calculations?.federalTax || 0) + (calculations?.netStateTax || 0))}</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tax Rates</Text>
      <Text style={styles.text}>Marginal Rate: {formatPercentageForReports(calculations?.marginalRateTotal || 0)}</Text>
      <Text style={styles.text}>Effective Rate: {formatPercentageForReports(calculations?.effectiveRateTotal || 0)}</Text>
    </View>
  </Page>
);

// Simple PDF Document
const SimplePDFReport = ({ calculations, clientName, selectedModules }) => (
  <Document>
    {selectedModules.executiveSummary && (
      <ExecutiveSummaryPDF 
        calculations={calculations}
        clientName={clientName}
      />
    )}
    {selectedModules.currentTaxPosition && (
      <TaxPositionPDF 
        calculations={calculations}
        clientName={clientName}
      />
    )}
  </Document>
);

// Main Component
const PDFReportGeneratorSimple = ({ 
  calculations, 
  incomeSources, 
  assets, 
  settings, 
  taxpayer, 
  spouse 
}) => {
  const [selectedModules, setSelectedModules] = useState({
    executiveSummary: true,
    currentTaxPosition: true
  });

  // Generate client name
  const generateClientName = () => {
    if (!taxpayer?.firstName && !spouse?.firstName) {
      return 'Tax Planning Client';
    }
    
    const taxpayerName = taxpayer?.firstName ? 
      `${taxpayer.firstName} ${taxpayer.lastName || ''}`.trim() : '';
    const spouseName = spouse?.firstName ? 
      `${spouse.firstName} ${spouse.lastName || ''}`.trim() : '';
    
    if (taxpayerName && spouseName) {
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Simple PDF Report Generator</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedModules.executiveSummary}
              onChange={(e) => setSelectedModules(prev => ({
                ...prev,
                executiveSummary: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Executive Summary</span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={selectedModules.currentTaxPosition}
              onChange={(e) => setSelectedModules(prev => ({
                ...prev,
                currentTaxPosition: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Current Tax Position</span>
          </label>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
          <div className="text-sm text-gray-600">
            <div>Client: {clientName}</div>
            <div>Modules Selected: {selectedCount}</div>
            <div>Total Income: {formatCurrencyForReports(calculations?.totalIncome || 0)}</div>
            <div>Effective Rate: {formatPercentageForReports(calculations?.effectiveRateTotal || 0)}</div>
          </div>
        </div>

        <div className="flex justify-center">
          <PDFDownloadLink
            document={
              <SimplePDFReport
                calculations={calculations}
                clientName={clientName}
                selectedModules={selectedModules}
              />
            }
            fileName={`Tax_Report_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {({ blob, url, loading, error }) => {
              if (loading) return 'Generating PDF...';
              if (error) {
                console.error('PDF Generation Error:', error);
                return 'Error - Try Again';
              }
              return `Download PDF (${selectedCount} modules)`;
            }}
          </PDFDownloadLink>
        </div>

        {selectedCount === 0 && (
          <div className="text-center py-4">
            <div className="text-gray-500">Please select at least one module to generate a report.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFReportGeneratorSimple;

