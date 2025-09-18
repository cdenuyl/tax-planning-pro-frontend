import React from 'react';
import { createRoot } from 'react-dom/client';
import { ExecutiveSummaryModule } from '../components/reports/ExecutiveSummaryModule';
import { CurrentTaxPositionModule } from '../components/reports/CurrentTaxPositionModule';
import { AssetAnalysisModule } from '../components/reports/AssetAnalysisModule';

// Report module registry
const REPORT_MODULES = {
  executiveSummary: ExecutiveSummaryModule,
  currentTaxPosition: CurrentTaxPositionModule,
  assetAnalysis: AssetAnalysisModule,
  // Additional modules will be added here
  taxMapVisualization: ({ calculations, settings }) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tax Map Visualization</h2>
      <p>Interactive tax bracket analysis and optimization opportunities.</p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          This section would include the interactive tax map visualization with current positioning
          and optimization recommendations.
        </p>
      </div>
    </div>
  ),
  
  socialSecurityOptimization: ({ calculations, settings }) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Social Security Optimization</h2>
      <p>Social Security claiming strategies and benefit optimization analysis.</p>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-800">
          This section would include detailed Social Security analysis, claiming strategies,
          and spousal benefit optimization.
        </p>
      </div>
    </div>
  ),

  rmdPlanning: ({ calculations, assets }) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">RMD Planning Strategies</h2>
      <p>Required minimum distribution planning and tax optimization.</p>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-purple-800">
          This section would include RMD calculations, timing strategies, and tax minimization
          approaches for retirement accounts.
        </p>
      </div>
    </div>
  ),

  disclosuresMethodology: ({ reportSettings }) => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Disclosures & Methodology</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Important Disclaimers</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Tax Planning Disclaimer:</strong> This analysis is based on current federal and state tax laws, 
              which are subject to change. The strategies and recommendations contained in this report are for 
              informational purposes only and should not be considered as tax, legal, or investment advice.
            </p>
            <p>
              <strong>Professional Consultation Required:</strong> Before implementing any of the strategies 
              discussed in this report, please consult with qualified tax, legal, and investment professionals 
              who can provide advice tailored to your specific circumstances.
            </p>
            <p>
              <strong>Accuracy of Information:</strong> This analysis is based on the information provided and 
              assumptions made at the time of preparation. Changes in personal circumstances, tax laws, or 
              market conditions may significantly impact the validity of these recommendations.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Methodology</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Tax Calculations:</strong> All tax calculations are based on 2025 federal tax brackets 
              and standard deduction amounts. State tax calculations use current rates and may not reflect 
              all available deductions or credits.
            </p>
            <p>
              <strong>Projections:</strong> Future projections assume current tax law remains unchanged and 
              do not account for inflation adjustments, changes in income, or other variables that may 
              affect actual results.
            </p>
            <p>
              <strong>Asset Analysis:</strong> Asset allocation recommendations are based on general tax 
              efficiency principles and may not be suitable for all investors depending on risk tolerance, 
              time horizon, and other factors.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Data Sources</h3>
          <div className="text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>IRS Publication 15 (Circular E) - Federal Tax Withholding Tables</li>
              <li>IRS Publication 590-A and 590-B - Individual Retirement Arrangements</li>
              <li>Social Security Administration - Benefit Calculation Guidelines</li>
              <li>State Department of Revenue - State Tax Rates and Regulations</li>
            </ul>
          </div>
        </div>

        {reportSettings?.advisorName && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-2">Professional Credentials</h3>
            <div className="text-sm text-gray-700">
              <p>
                This report was prepared by {reportSettings.advisorName}
                {reportSettings.firmName && ` of ${reportSettings.firmName}`}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
};

// Professional report styles for PDF generation
const REPORT_STYLES = `
  @media print {
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: #1f2937;
    }
    
    .print\\:text-xs { font-size: 10px; }
    .print\\:text-sm { font-size: 11px; }
    .print\\:text-base { font-size: 12px; }
    .print\\:text-lg { font-size: 14px; }
    .print\\:text-xl { font-size: 16px; }
    .print\\:text-2xl { font-size: 20px; }
    
    .print\\:space-y-4 > * + * { margin-top: 16px; }
    .print\\:pb-4 { padding-bottom: 16px; }
    
    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
    
    h1, h2, h3 { 
      page-break-after: avoid;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    
    .chart-container {
      page-break-inside: avoid;
      margin: 16px 0;
    }
  }
  
  @page {
    margin: 1in;
    size: letter;
    
    @top-center {
      content: "Tax Planning Analysis Report";
      font-size: 10px;
      color: #6b7280;
    }
    
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 10px;
      color: #6b7280;
    }
  }
`;

export class ReportGenerator {
  constructor() {
    this.modules = REPORT_MODULES;
  }

  // Generate HTML content for the report
  generateReportHTML(reportData) {
    const { template, modules, settings, data } = reportData;
    const { calculations, incomeSources, assets, settings: appSettings } = data;

    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tax Planning Analysis Report</title>
        <style>
          ${REPORT_STYLES}
          
          /* Tailwind-like utility classes for print */
          .container { max-width: 8.5in; margin: 0 auto; padding: 0 1in; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .font-semibold { font-weight: 600; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-700 { color: #374151; }
          .text-gray-900 { color: #111827; }
          .text-blue-900 { color: #1e3a8a; }
          .text-green-900 { color: #14532d; }
          .text-red-900 { color: #7f1d1d; }
          .bg-blue-50 { background-color: #eff6ff; }
          .bg-green-50 { background-color: #f0fdf4; }
          .bg-red-50 { background-color: #fef2f2; }
          .border { border: 1px solid #d1d5db; }
          .border-b { border-bottom: 1px solid #d1d5db; }
          .rounded-lg { border-radius: 8px; }
          .p-4 { padding: 16px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-4 { margin-bottom: 16px; }
          .mt-2 { margin-top: 8px; }
          .space-y-4 > * + * { margin-top: 16px; }
          .space-y-6 > * + * { margin-top: 24px; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .gap-4 { gap: 16px; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
        </style>
      </head>
      <body>
        <div class="container">
    `;

    // Generate each selected module
    modules.forEach((moduleId, index) => {
      if (this.modules[moduleId]) {
        // Add page break before each module (except the first)
        if (index > 0) {
          htmlContent += '<div class="page-break"></div>';
        }
        
        // Generate module content
        const moduleContent = this.renderModuleToHTML(moduleId, {
          calculations,
          incomeSources,
          assets,
          settings: appSettings,
          reportSettings: settings
        });
        
        htmlContent += `<div class="no-break">${moduleContent}</div>`;
      }
    });

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  }

  // Render a specific module to HTML (simplified version for PDF)
  renderModuleToHTML(moduleId, props) {
    // This is a simplified version - in a real implementation,
    // you would use a server-side rendering solution or
    // convert React components to static HTML
    
    switch (moduleId) {
      case 'executiveSummary':
        return this.generateExecutiveSummaryHTML(props);
      case 'currentTaxPosition':
        return this.generateTaxPositionHTML(props);
      case 'assetAnalysis':
        return this.generateAssetAnalysisHTML(props);
      default:
        return `<div><h2>Module: ${moduleId}</h2><p>Content for ${moduleId} module would be generated here.</p></div>`;
    }
  }

  generateExecutiveSummaryHTML(props) {
    const { calculations, reportSettings } = props;
    const { totalIncome, totalTax, effectiveRateTotal } = calculations;
    const afterTaxIncome = totalIncome - totalTax;

    return `
      <div class="space-y-6">
        <div class="text-center border-b pb-4">
          <h1 class="text-2xl font-bold text-gray-900">Tax Planning Analysis Report</h1>
          ${reportSettings?.clientName ? `<p class="text-lg text-gray-700 mt-2">Prepared for: ${reportSettings.clientName}</p>` : ''}
          ${reportSettings?.advisorName ? `<p class="text-sm text-gray-600">Prepared by: ${reportSettings.advisorName}${reportSettings?.firmName ? `, ${reportSettings.firmName}` : ''}</p>` : ''}
          <p class="text-sm text-gray-500">Report Date: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-xl font-bold text-blue-900">$${totalIncome.toLocaleString()}</div>
            <div class="text-sm text-blue-700">Total Income</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-xl font-bold text-red-900">$${totalTax.toLocaleString()}</div>
            <div class="text-sm text-red-700">Total Tax</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-xl font-bold text-green-900">$${afterTaxIncome.toLocaleString()}</div>
            <div class="text-sm text-green-700">After-Tax Income</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <div class="text-xl font-bold text-purple-900">${(effectiveRateTotal * 100).toFixed(2)}%</div>
            <div class="text-sm text-purple-700">Effective Tax Rate</div>
          </div>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold text-blue-900 mb-2">Key Recommendations:</h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Review current withholdings and estimated tax payments</li>
            <li>• Optimize asset location for tax efficiency</li>
            <li>• Consider Roth conversion opportunities</li>
            <li>• Implement tax-loss harvesting strategies</li>
          </ul>
        </div>
      </div>
    `;
  }

  generateTaxPositionHTML(props) {
    const { calculations } = props;
    const { federalTaxableIncome, effectiveRateTotal, marginalRateTotal } = calculations;

    return `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-900">Current Tax Position Analysis</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 border rounded-lg">
            <div class="text-xl font-bold text-green-900">$${federalTaxableIncome.toLocaleString()}</div>
            <div class="text-sm text-green-700">Taxable Income</div>
          </div>
          <div class="text-center p-4 border rounded-lg">
            <div class="text-xl font-bold text-purple-900">${(marginalRateTotal * 100).toFixed(2)}%</div>
            <div class="text-sm text-purple-700">Marginal Rate</div>
          </div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg">
          <h4 class="font-semibold text-yellow-900 mb-2">Tax Optimization Opportunities:</h4>
          <ul class="text-sm text-yellow-800 space-y-1">
            <li>• Consider tax-deferred retirement contributions</li>
            <li>• Evaluate Roth conversion opportunities</li>
            <li>• Review asset location strategies</li>
            <li>• Assess timing of income and deductions</li>
          </ul>
        </div>
      </div>
    `;
  }

  generateAssetAnalysisHTML(props) {
    const { assets } = props;
    const totalAssetValue = assets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;

    return `
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-gray-900">Asset Analysis & Recommendations</h2>
        
        <div class="text-center p-4 border rounded-lg">
          <div class="text-2xl font-bold text-blue-900">$${totalAssetValue.toLocaleString()}</div>
          <div class="text-sm text-blue-700">Total Asset Value</div>
          <div class="text-xs text-gray-500 mt-1">${assets?.length || 0} accounts</div>
        </div>

        <div class="bg-green-50 p-4 rounded-lg">
          <h4 class="font-semibold text-green-900 mb-2">Asset Optimization Recommendations:</h4>
          <ul class="text-sm text-green-800 space-y-1">
            <li>• Consider asset location optimization for tax efficiency</li>
            <li>• Evaluate tax-efficient withdrawal sequencing</li>
            <li>• Review diversification across tax treatment categories</li>
            <li>• Plan for required minimum distributions</li>
          </ul>
        </div>
      </div>
    `;
  }

  // Generate PDF from HTML (would use a PDF generation library)
  async generatePDF(reportData) {
    const htmlContent = this.generateReportHTML(reportData);
    
    // In a real implementation, you would use a library like:
    // - Puppeteer for headless Chrome PDF generation
    // - jsPDF for client-side PDF generation
    // - PDFKit for Node.js PDF generation
    // - Or a service like HTML/CSS to PDF API
    
    return {
      success: true,
      html: htmlContent,
      message: 'PDF generation would be implemented with a PDF library'
    };
  }

  // Preview report in browser
  previewReport(reportData) {
    const htmlContent = this.generateReportHTML(reportData);
    const newWindow = window.open('', '_blank');
    newWindow.document.write(htmlContent);
    newWindow.document.close();
  }
}

export default ReportGenerator;

