import React, { useState } from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { formatCurrency, formatPercentage } from '../../utils/taxCalculations.js';

/**
 * WordExportGenerator component for creating Word documents from report data
 */
export const WordExportGenerator = ({ 
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

  const generateWordDocument = async () => {
    setIsExporting(true);
    
    try {
      const sections = [];

      // Title page
      sections.push(
        new Paragraph({
          text: comparisonMode ? "Multi-Scenario Tax Analysis" : "Tax Planning Report",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          text: `Prepared for: ${taxpayer.firstName} ${taxpayer.lastName}${spouse.firstName ? ` and ${spouse.firstName} ${spouse.lastName}` : ''}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        ...(comparisonMode && scenarios ? [
          new Paragraph({
            text: `Comparing ${scenarios.length} scenarios: ${scenarios.map(s => s.name).join(', ')}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          })
        ] : []),
        new Paragraph({
          text: `Report Date: ${new Date().toLocaleDateString()}`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 }
        })
      );

      // Multi-Scenario Comparison (if in comparison mode)
      if (comparisonMode && scenarios && scenarios.length > 1) {
        sections.push(
          new Paragraph({
            text: "Multi-Scenario Comparison Report",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          })
        );

        // Scenario Overview
        scenarios.forEach((scenario, index) => {
          const totalIncome = scenario.data?.incomeSources?.reduce((sum, source) => sum + (source.amount || 0), 0) || 0;
          
          sections.push(
            new Paragraph({
              text: scenario.name,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Status: ", bold: true }),
                new TextRun({ text: scenario.isActive ? "Active" : "Inactive" })
              ],
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Income Sources: ", bold: true }),
                new TextRun({ text: `${scenario.data?.incomeSources?.length || 0}` })
              ],
              spacing: { after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "Total Income: ", bold: true }),
                new TextRun({ text: formatCurrency(totalIncome) })
              ],
              spacing: { after: 100 }
            })
          );

          // Income source details
          if (scenario.data?.incomeSources?.length > 0) {
            sections.push(
              new Paragraph({
                text: "Income Details:",
                spacing: { after: 50 }
              })
            );
            
            scenario.data.incomeSources.forEach(source => {
              sections.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `• ${source.type}: `, bold: true }),
                    new TextRun({ text: formatCurrency(source.amount || 0) })
                  ],
                  spacing: { after: 25 }
                })
              );
            });
          }
        });

        // Comparison Analysis
        sections.push(
          new Paragraph({
            text: "Comparison Analysis",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Total Scenarios: ", bold: true }),
              new TextRun({ text: `${scenarios.length}` })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: "Tax calculations will be computed based on the income sources and tax strategies defined in each scenario.",
            spacing: { after: 200 }
          })
        );
      }

      // Executive Summary
      if (selectedModules.includes('executiveSummary')) {
        sections.push(
          new Paragraph({
            text: "Executive Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Total Income: ",
                bold: true
              }),
              new TextRun({
                text: formatCurrency(calculations.totalIncome)
              })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Total Tax: ",
                bold: true
              }),
              new TextRun({
                text: formatCurrency(calculations.totalTax)
              })
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Effective Tax Rate: ",
                bold: true
              }),
              new TextRun({
                text: formatPercentage((calculations.totalTax / calculations.totalIncome) * 100)
              })
            ],
            spacing: { after: 200 }
          })
        );

        // Financial metrics table
        const metricsTable = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "Metric", bold: true })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Amount", bold: true })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Status", bold: true })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("Federal AGI")],
                }),
                new TableCell({
                  children: [new Paragraph(formatCurrency(calculations.federalAGI))],
                }),
                new TableCell({
                  children: [new Paragraph("Current")],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("Taxable Income")],
                }),
                new TableCell({
                  children: [new Paragraph(formatCurrency(calculations.federalTaxableIncome))],
                }),
                new TableCell({
                  children: [new Paragraph("Current")],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("After-Tax Income")],
                }),
                new TableCell({
                  children: [new Paragraph(formatCurrency(calculations.totalIncome - calculations.totalTax))],
                }),
                new TableCell({
                  children: [new Paragraph("Current")],
                }),
              ],
            }),
          ],
        });

        sections.push(metricsTable);
      }

      // Current Tax Position
      if (selectedModules.includes('currentTaxPosition')) {
        sections.push(
          new Paragraph({
            text: "Current Tax Position",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: "This section provides a detailed breakdown of your current tax situation based on the income and deduction information provided.",
            spacing: { after: 200 }
          })
        );

        // Tax breakdown table
        const taxTable = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "Tax Component", bold: true })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Amount", bold: true })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Rate", bold: true })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("Federal Income Tax")],
                }),
                new TableCell({
                  children: [new Paragraph(formatCurrency(calculations.federalTax))],
                }),
                new TableCell({
                  children: [new Paragraph(formatPercentage((calculations.federalTax / calculations.totalIncome) * 100))],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("State Income Tax")],
                }),
                new TableCell({
                  children: [new Paragraph(formatCurrency(calculations.stateTax))],
                }),
                new TableCell({
                  children: [new Paragraph(formatPercentage((calculations.stateTax / calculations.totalIncome) * 100))],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("FICA Taxes")],
                }),
                new TableCell({
                  children: [new Paragraph(formatCurrency(calculations.ficaTax || 0))],
                }),
                new TableCell({
                  children: [new Paragraph(formatPercentage(((calculations.ficaTax || 0) / calculations.totalIncome) * 100))],
                }),
              ],
            }),
          ],
        });

        sections.push(taxTable);
      }

      // Tax Map Visualization
      if (selectedModules.includes('taxMapVisualization')) {
        sections.push(
          new Paragraph({
            text: "Tax Map Analysis",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: "The tax map visualization shows how your marginal tax rates change across different income levels, helping identify optimal strategies for tax planning.",
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: "Key Insights:",
            bold: true,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: "• Current marginal rate represents the tax on your next dollar of income",
            spacing: { after: 50 }
          }),
          new Paragraph({
            text: "• Rate changes indicate tax bracket transitions and benefit phase-outs",
            spacing: { after: 50 }
          }),
          new Paragraph({
            text: "• IRMAA cliffs show Medicare premium surcharge thresholds",
            spacing: { after: 200 }
          })
        );
      }

      // Capital Gains Planning
      if (selectedModules.includes('capitalGainsPlanning')) {
        sections.push(
          new Paragraph({
            text: "Capital Gains Planning",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: "Strategic management of capital gains can significantly reduce your overall tax burden. This analysis examines your current position and opportunities for optimization.",
            spacing: { after: 200 }
          })
        );

        // Capital gains brackets table
        const cgTable = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: "Income Range", bold: true })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Capital Gains Rate", bold: true })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: "Strategy", bold: true })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("$0 - $47,025 (Single)")],
                }),
                new TableCell({
                  children: [new Paragraph("0%")],
                }),
                new TableCell({
                  children: [new Paragraph("Harvest gains tax-free")],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("$47,026 - $518,900 (Single)")],
                }),
                new TableCell({
                  children: [new Paragraph("15%")],
                }),
                new TableCell({
                  children: [new Paragraph("Moderate tax impact")],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph("$518,901+ (Single)")],
                }),
                new TableCell({
                  children: [new Paragraph("20%")],
                }),
                new TableCell({
                  children: [new Paragraph("Consider tax-loss harvesting")],
                }),
              ],
            }),
          ],
        });

        sections.push(cgTable);
      }

      // Social Security Analysis
      if (selectedModules.includes('socialSecurityAnalysis')) {
        sections.push(
          new Paragraph({
            text: "Social Security Analysis",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: "Social Security benefits may be subject to federal income tax depending on your total income. This analysis examines the taxation of your benefits and strategies to minimize the impact.",
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: "Taxation Thresholds:",
            bold: true,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: "• Single filers: 50% taxation begins at $25,000, 85% at $34,000",
            spacing: { after: 50 }
          }),
          new Paragraph({
            text: "• Married filing jointly: 50% taxation begins at $32,000, 85% at $44,000",
            spacing: { after: 200 }
          })
        );
      }

      // Create the document
      const doc = new Document({
        sections: [{
          properties: {},
          children: sections,
        }],
      });

      // Generate and save the document using browser-compatible method
      const buffer = await Packer.toBlob(doc);
      
      const fileName = `Tax_Report_${taxpayer.firstName}_${taxpayer.lastName}_${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(buffer, fileName);

      if (onExportComplete) {
        onExportComplete(fileName);
      }

    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('Error generating Word document. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="word-export-generator">
      <button
        onClick={generateWordDocument}
        disabled={isExporting || selectedModules.length === 0}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isExporting || selectedModules.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isExporting ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Word Document...
          </span>
        ) : (
          'Export to Word'
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

export default WordExportGenerator;

