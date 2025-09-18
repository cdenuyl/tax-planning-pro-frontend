import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatCurrency, formatPercentage } from '../../utils/taxCalculations.js';

/**
 * ExcelExportGenerator component for creating Excel workbooks from report data
 */
export const ExcelExportGenerator = ({ 
  selectedModules, 
  calculations, 
  appSettings, 
  taxpayer, 
  spouse, 
  incomeSourcesData,
  comparisonMode = false,
  scenarios = null,
  onExportComplete 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generateExcelWorkbook = async () => {
    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = comparisonMode && scenarios ? [
        ['Multi-Scenario Tax Analysis'],
        [''],
        ['Client Information'],
        ['Taxpayer Name', `${taxpayer.firstName} ${taxpayer.lastName}`],
        ['Spouse Name', spouse.firstName ? `${spouse.firstName} ${spouse.lastName}` : 'N/A'],
        ['Filing Status', taxpayer.filingStatus],
        ['Report Date', new Date().toLocaleDateString()],
        [''],
        ['Scenario Comparison'],
        ['Total Scenarios', scenarios.length],
        ['Scenarios', scenarios.map(s => s.name).join(', ')],
        [''],
        ['Scenario Details'],
        ...scenarios.flatMap((scenario, index) => {
          const totalIncome = scenario.data?.incomeSources?.reduce((sum, source) => sum + (source.amount || 0), 0) || 0;
          return [
            [`${scenario.name}`],
            ['Status', scenario.isActive ? 'Active' : 'Inactive'],
            ['Income Sources', scenario.data?.incomeSources?.length || 0],
            ['Total Income', totalIncome],
            ...(scenario.data?.incomeSources?.map(source => [
              `  ${source.type}`, source.amount || 0
            ]) || []),
            ['']
          ];
        })
      ] : [
        ['Tax Planning Report Summary'],
        [''],
        ['Client Information'],
        ['Taxpayer Name', `${taxpayer.firstName} ${taxpayer.lastName}`],
        ['Spouse Name', spouse.firstName ? `${spouse.firstName} ${spouse.lastName}` : 'N/A'],
        ['Filing Status', taxpayer.filingStatus],
        ['Report Date', new Date().toLocaleDateString()],
        [''],
        ['Financial Summary'],
        ['Total Income', calculations.totalIncome],
        ['Federal AGI', calculations.federalAGI],
        ['Taxable Income', calculations.federalTaxableIncome],
        ['Federal Tax', calculations.federalTax],
        ['State Tax', calculations.stateTax],
        ['FICA Tax', calculations.ficaTax || 0],
        ['Total Tax', calculations.totalTax],
        ['After-Tax Income', calculations.totalIncome - calculations.totalTax],
        ['Effective Tax Rate', (calculations.totalTax / calculations.totalIncome) * 100],
        [''],
        ['Key Metrics'],
        ['Federal Effective Rate', (calculations.federalTax / calculations.totalIncome) * 100],
        ['State Effective Rate', (calculations.stateTax / calculations.totalIncome) * 100],
        ['FICA Rate', ((calculations.ficaTax || 0) / calculations.totalIncome) * 100],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Format currency columns
      const currencyFormat = '"$"#,##0';
      const percentFormat = '0.00%';
      
      if (comparisonMode && scenarios) {
        // For comparison mode, we need to format the income amounts dynamically
        // Find all cells that contain income amounts and format them as currency
        const range = XLSX.utils.decode_range(summarySheet['!ref']);
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = summarySheet[cellAddress];
            if (cell && typeof cell.v === 'number' && cell.v > 100) {
              // If it's a number greater than 100, likely an income amount
              const cellValue = summaryData[row] && summaryData[row][col];
              if (typeof cellValue === 'number' && cellValue > 100) {
                cell.z = currencyFormat;
              }
            }
          }
        }
      } else {
        // Apply formatting to specific cells for regular mode
        if (summarySheet['B10']) summarySheet['B10'].z = currencyFormat;
        if (summarySheet['B11']) summarySheet['B11'].z = currencyFormat;
        if (summarySheet['B12']) summarySheet['B12'].z = currencyFormat;
        if (summarySheet['B13']) summarySheet['B13'].z = currencyFormat;
        if (summarySheet['B14']) summarySheet['B14'].z = currencyFormat;
        if (summarySheet['B15']) summarySheet['B15'].z = currencyFormat;
        if (summarySheet['B16']) summarySheet['B16'].z = currencyFormat;
        if (summarySheet['B17']) summarySheet['B17'].z = currencyFormat;
        if (summarySheet['B18']) summarySheet['B18'].z = percentFormat;
        if (summarySheet['B21']) summarySheet['B21'].z = percentFormat;
        if (summarySheet['B22']) summarySheet['B22'].z = percentFormat;
        if (summarySheet['B23']) summarySheet['B23'].z = percentFormat;
      }

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Income Sources Sheet
      if (incomeSourcesData && incomeSourcesData.length > 0) {
        const incomeData = [
          ['Income Sources Analysis'],
          [''],
          ['Source', 'Type', 'Amount', 'Tax Treatment', 'Annual Amount']
        ];

        incomeSourcesData.forEach(source => {
          const annualAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
          incomeData.push([
            source.description || source.type,
            source.type,
            source.amount,
            source.taxTreatment || 'Taxable',
            annualAmount
          ]);
        });

        const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(workbook, incomeSheet, 'Income Sources');
      }

      // Tax Brackets Sheet
      if (selectedModules.includes('currentTaxPosition')) {
        const bracketsData = [
          ['Federal Tax Brackets 2025 (Single)'],
          [''],
          ['Rate', 'Income Range Start', 'Income Range End', 'Tax on Range'],
          ['10%', 0, 11600, 1160],
          ['12%', 11601, 47150, 4266],
          ['22%', 47151, 100525, 11742.5],
          ['24%', 100526, 191050, 21726],
          ['32%', 191051, 243725, 16856],
          ['35%', 243726, 609350, 127968.5],
          ['37%', 609351, 'No Limit', 'Variable'],
          [''],
          ['Federal Tax Brackets 2025 (Married Filing Jointly)'],
          [''],
          ['Rate', 'Income Range Start', 'Income Range End', 'Tax on Range'],
          ['10%', 0, 23200, 2320],
          ['12%', 23201, 94300, 8532],
          ['22%', 94301, 201050, 23485],
          ['24%', 201051, 383900, 43884],
          ['32%', 383901, 487450, 33136],
          ['35%', 487451, 731200, 85312.5],
          ['37%', 731201, 'No Limit', 'Variable'],
        ];

        const bracketsSheet = XLSX.utils.aoa_to_sheet(bracketsData);
        XLSX.utils.book_append_sheet(workbook, bracketsSheet, 'Tax Brackets');
      }

      // Capital Gains Sheet
      if (selectedModules.includes('capitalGainsPlanning')) {
        const cgData = [
          ['Capital Gains Tax Rates 2025'],
          [''],
          ['Filing Status', 'Income Range', 'Long-Term CG Rate', 'Strategy'],
          ['Single', '$0 - $47,025', '0%', 'Harvest gains tax-free'],
          ['Single', '$47,026 - $518,900', '15%', 'Moderate tax planning'],
          ['Single', '$518,901+', '20%', 'Consider tax-loss harvesting'],
          [''],
          ['Married Filing Jointly', '$0 - $94,050', '0%', 'Harvest gains tax-free'],
          ['Married Filing Jointly', '$94,051 - $583,750', '15%', 'Moderate tax planning'],
          ['Married Filing Jointly', '$583,751+', '20%', 'Consider tax-loss harvesting'],
          [''],
          ['Additional Considerations'],
          ['Net Investment Income Tax (NIIT)', '3.8%', 'Applies to investment income over thresholds'],
          ['NIIT Threshold (Single)', '$200,000', ''],
          ['NIIT Threshold (MFJ)', '$250,000', ''],
        ];

        const cgSheet = XLSX.utils.aoa_to_sheet(cgData);
        XLSX.utils.book_append_sheet(workbook, cgSheet, 'Capital Gains');
      }

      // Social Security Sheet
      if (selectedModules.includes('socialSecurityAnalysis')) {
        const ssData = [
          ['Social Security Taxation Analysis'],
          [''],
          ['Filing Status', 'Income Threshold', 'Taxation Level'],
          ['Single', '$25,000', '50% of benefits taxable'],
          ['Single', '$34,000', '85% of benefits taxable'],
          ['Married Filing Jointly', '$32,000', '50% of benefits taxable'],
          ['Married Filing Jointly', '$44,000', '85% of benefits taxable'],
          [''],
          ['Medicare IRMAA Thresholds 2025'],
          [''],
          ['Filing Status', 'MAGI Threshold', 'Part B Increase', 'Part D Increase'],
          ['Single', '$103,000', '$69.90', '$12.90'],
          ['Single', '$129,000', '$174.70', '$33.30'],
          ['Single', '$161,000', '$279.50', '$53.80'],
          ['Single', '$193,000', '$384.30', '$74.20'],
          ['Single', '$500,000', '$489.10', '$81.00'],
          [''],
          ['Married Filing Jointly', '$206,000', '$69.90', '$12.90'],
          ['Married Filing Jointly', '$258,000', '$174.70', '$33.30'],
          ['Married Filing Jointly', '$322,000', '$279.50', '$53.80'],
          ['Married Filing Jointly', '$386,000', '$384.30', '$74.20'],
          ['Married Filing Jointly', '$750,000', '$489.10', '$81.00'],
        ];

        const ssSheet = XLSX.utils.aoa_to_sheet(ssData);
        XLSX.utils.book_append_sheet(workbook, ssSheet, 'Social Security');
      }

      // Tax Planning Strategies Sheet
      const strategiesData = [
        ['Tax Planning Strategies'],
        [''],
        ['Strategy', 'Description', 'Potential Benefit', 'Considerations'],
        ['Roth Conversion', 'Convert traditional IRA to Roth IRA', 'Tax-free growth', 'Pay taxes now'],
        ['Tax-Loss Harvesting', 'Realize losses to offset gains', 'Reduce current taxes', 'Wash sale rules'],
        ['Asset Location', 'Place investments in optimal accounts', 'Improve efficiency', 'Account limitations'],
        ['Charitable Giving', 'Donate appreciated assets', 'Avoid capital gains', 'Must itemize'],
        ['Retirement Contributions', 'Maximize 401k/IRA contributions', 'Reduce current income', 'Contribution limits'],
        ['HSA Maximization', 'Use HSA for retirement planning', 'Triple tax advantage', 'High-deductible plan required'],
        ['Timing Income', 'Control when income is recognized', 'Manage tax brackets', 'Limited flexibility'],
        ['Estate Planning', 'Gift assets to reduce estate', 'Transfer wealth', 'Annual/lifetime limits'],
      ];

      const strategiesSheet = XLSX.utils.aoa_to_sheet(strategiesData);
      XLSX.utils.book_append_sheet(workbook, strategiesSheet, 'Strategies');

      // Generate and save the workbook
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `Tax_Analysis_${taxpayer.firstName}_${taxpayer.lastName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      if (onExportComplete) {
        onExportComplete(fileName);
      }

    } catch (error) {
      console.error('Error generating Excel workbook:', error);
      alert('Error generating Excel workbook. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="excel-export-generator">
      <button
        onClick={generateExcelWorkbook}
        disabled={isExporting || selectedModules.length === 0}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isExporting || selectedModules.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isExporting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Excel Workbook...
          </span>
        ) : (
          'Export to Excel'
        )}
      </button>
      
      {selectedModules.length === 0 && (
        <p className="text-sm text-gray-500 mt-2">
          Please select at least one module to export
        </p>
      )}
    </div>
  );
};

export default ExcelExportGenerator;

