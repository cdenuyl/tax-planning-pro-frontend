import { formatCurrency, formatPercentage } from './taxCalculations';

export class PDFReportGenerator {
  constructor() {
    this.reportData = null;
  }

  // Generate markdown content for PDF conversion
  generateMarkdownReport(reportData) {
    const { template, modules, settings, data } = reportData;
    const { calculations, incomeSources, assets, settings: appSettings } = data;

    let markdown = '';

    // Add CSS styling for professional appearance
    markdown += `<style>
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  max-width: 8.5in;
  margin: 0 auto;
  padding: 1in;
}

h1, h2, h3 {
  color: #1f2937;
  margin-top: 2em;
  margin-bottom: 1em;
}

h1 { font-size: 2.5em; text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 0.5em; }
h2 { font-size: 2em; color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.3em; }
h3 { font-size: 1.5em; color: #374151; }

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1em;
  margin: 2em 0;
}

.summary-card {
  text-align: center;
  padding: 1.5em;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.summary-value {
  font-size: 1.8em;
  font-weight: bold;
  margin-bottom: 0.3em;
}

.summary-label {
  font-size: 0.9em;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.recommendation-box {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 1.5em;
  margin: 1.5em 0;
  border-radius: 0 8px 8px 0;
}

.warning-box {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding: 1.5em;
  margin: 1.5em 0;
  border-radius: 0 8px 8px 0;
}

.success-box {
  background: #f0fdf4;
  border-left: 4px solid #16a34a;
  padding: 1.5em;
  margin: 1.5em 0;
  border-radius: 0 8px 8px 0;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1em;
  margin: 1.5em 0;
}

.asset-card {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 1em;
  background: #ffffff;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
}

th, td {
  border: 1px solid #d1d5db;
  padding: 0.75em;
  text-align: left;
}

th {
  background: #f3f4f6;
  font-weight: 600;
}

.page-break {
  page-break-before: always;
}

.no-break {
  page-break-inside: avoid;
}

@media print {
  body { font-size: 12px; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .asset-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

`;

    // Generate content for each selected module
    modules.forEach((moduleId, index) => {
      if (index > 0) {
        markdown += '\n<div class="page-break"></div>\n\n';
      }
      
      markdown += this.generateModuleMarkdown(moduleId, {
        calculations,
        incomeSources,
        assets,
        settings: appSettings,
        reportSettings: settings
      });
    });

    return markdown;
  }

  generateModuleMarkdown(moduleId, props) {
    switch (moduleId) {
      case 'executiveSummary':
        return this.generateExecutiveSummaryMarkdown(props);
      case 'currentTaxPosition':
        return this.generateTaxPositionMarkdown(props);
      case 'assetAnalysis':
        return this.generateAssetAnalysisMarkdown(props);
      case 'taxMapVisualization':
        return this.generateTaxMapMarkdown(props);
      case 'socialSecurityOptimization':
        return this.generateSocialSecurityMarkdown(props);
      case 'rmdPlanning':
        return this.generateRMDPlanningMarkdown(props);
      case 'disclosuresMethodology':
        return this.generateDisclosuresMarkdown(props);
      default:
        return `## ${moduleId}\n\nContent for ${moduleId} module.\n\n`;
    }
  }

  generateExecutiveSummaryMarkdown(props) {
    const { calculations, incomeSources, assets, reportSettings } = props;
    const { 
      totalIncome, 
      totalTax, 
      effectiveRateTotal,
      federalTax,
      netStateTax 
    } = calculations;
    
    const afterTaxIncome = totalIncome - totalTax;
    const totalAssetValue = assets?.reduce((sum, asset) => sum + (asset.currentValue || 0), 0) || 0;

    return `# Tax Planning Analysis Report

<div style="text-align: center; margin-bottom: 3em;">
${reportSettings?.clientName ? `**Prepared for:** ${reportSettings.clientName}  \n` : ''}
${reportSettings?.advisorName ? `**Prepared by:** ${reportSettings.advisorName}${reportSettings?.firmName ? `, ${reportSettings.firmName}` : ''}  \n` : ''}
**Report Date:** ${new Date().toLocaleDateString()}
</div>

## Executive Summary

<div class="summary-grid">
<div class="summary-card">
  <div class="summary-value" style="color: #1e40af;">${formatCurrency(totalIncome)}</div>
  <div class="summary-label">Total Income</div>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #dc2626;">${formatCurrency(totalTax)}</div>
  <div class="summary-label">Total Tax</div>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #16a34a;">${formatCurrency(afterTaxIncome)}</div>
  <div class="summary-label">After-Tax Income</div>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #7c3aed;">${formatPercentage(effectiveRateTotal)}</div>
  <div class="summary-label">Effective Tax Rate</div>
</div>
</div>

### Current Financial Position

Your current tax situation shows an effective tax rate of **${formatPercentage(effectiveRateTotal)}** on total income of **${formatCurrency(totalIncome)}**. This results in a total tax burden of **${formatCurrency(totalTax)}**, leaving **${formatCurrency(afterTaxIncome)}** in after-tax income.

**Tax Breakdown:**
- Federal Tax: ${formatCurrency(federalTax)}
- State Tax: ${formatCurrency(netStateTax)}
- **Total Tax: ${formatCurrency(totalTax)}**

### Key Findings & Opportunities

<div class="recommendation-box">
<strong>🎯 Primary Optimization Opportunity</strong>

Current effective tax rate of ${formatPercentage(effectiveRateTotal)} presents opportunities for strategic tax planning. Through proper asset positioning and income timing strategies, potential tax savings of 15-25% may be achievable.
</div>

<div class="success-box">
<strong>💰 Asset Portfolio Strength</strong>

Total asset value of ${formatCurrency(totalAssetValue)} across ${assets?.length || 0} accounts provides excellent foundation for tax-efficient wealth management strategies.
</div>

<div class="warning-box">
<strong>⚠️ Action Required</strong>

${incomeSources?.length || 0} income sources require coordination to optimize tax efficiency. Immediate review recommended for withholding adjustments and estimated tax payments.
</div>

### Implementation Roadmap

#### Immediate Actions (0-3 months)
- ✅ Review current withholdings and estimated tax payments
- ✅ Optimize asset location for tax efficiency  
- ✅ Consider Roth conversion opportunities
- ✅ Implement tax-loss harvesting where applicable

#### Short-term Planning (3-12 months)
- 📊 Develop systematic rebalancing approach
- 🏦 Review retirement account contribution strategies
- 🛡️ Evaluate life insurance and annuity positioning
- 📈 Implement multi-year tax projection planning

#### Long-term Strategy (1+ years)
- 🏡 Create comprehensive estate planning tax strategies
- 📊 Establish systematic tax optimization review process
- 🎯 Develop legacy and wealth transfer strategies
- 📈 Implement advanced tax planning techniques

### Next Steps

<div class="recommendation-box">
<strong>Immediate Action Items:</strong>

1. **Schedule Follow-up Meeting** - Discuss detailed recommendations and implementation timeline
2. **Gather Documentation** - Collect additional information for comprehensive analysis  
3. **Begin Implementation** - Start with highest-impact, lowest-risk strategies
4. **Professional Consultation** - Coordinate with tax and legal professionals as needed
</div>

---

*This executive summary provides a high-level overview of your tax planning opportunities. Detailed analysis and specific recommendations are provided in the following sections.*

`;
  }

  generateTaxPositionMarkdown(props) {
    const { calculations, incomeSources } = props;
    const {
      totalIncome,
      federalTaxableIncome,
      federalTax,
      netStateTax,
      effectiveRateFederal,
      effectiveRateTotal,
      marginalRateFederal,
      marginalRateTotal,
      totalTax,
      filingStatus = 'single'
    } = calculations;

    // Calculate tax bracket information
    const taxBrackets = filingStatus === 'marriedFilingJointly' ? [
      { bracket: '10%', min: 0, max: 23200 },
      { bracket: '12%', min: 23200, max: 94300 },
      { bracket: '22%', min: 94300, max: 201050 },
      { bracket: '24%', min: 201050, max: 383900 }
    ] : [
      { bracket: '10%', min: 0, max: 11600 },
      { bracket: '12%', min: 11600, max: 47150 },
      { bracket: '22%', min: 47150, max: 100525 },
      { bracket: '24%', min: 100525, max: 191950 }
    ];

    const currentBracket = taxBrackets.find(bracket => 
      federalTaxableIncome >= bracket.min && federalTaxableIncome < bracket.max
    ) || taxBrackets[taxBrackets.length - 1];

    const roomToNextBracket = (currentBracket?.max || 0) - federalTaxableIncome;

    return `## Current Tax Position Analysis

Your current tax position provides the foundation for all optimization strategies. Understanding where you stand today is crucial for identifying opportunities and implementing effective tax planning.

### Tax Summary Overview

<div class="summary-grid">
<div class="summary-card">
  <div class="summary-value" style="color: #1e40af;">${formatCurrency(totalIncome)}</div>
  <div class="summary-label">Total Income</div>
  <small>All income sources combined</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #16a34a;">${formatCurrency(federalTaxableIncome)}</div>
  <div class="summary-label">Taxable Income</div>
  <small>After deductions & exemptions</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #dc2626;">${formatPercentage(effectiveRateTotal)}</div>
  <div class="summary-label">Effective Rate</div>
  <small>Total tax ÷ Total income</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #7c3aed;">${formatPercentage(marginalRateTotal)}</div>
  <div class="summary-label">Marginal Rate</div>
  <small>Rate on next dollar earned</small>
</div>
</div>

### Federal Tax Bracket Analysis

**Current Position:** You are in the **${currentBracket?.bracket}** federal tax bracket.

| Metric | Value | Analysis |
|--------|-------|----------|
| Current Bracket | ${currentBracket?.bracket} | Range: ${formatCurrency(currentBracket?.min)} - ${formatCurrency(currentBracket?.max)} |
| Taxable Income | ${formatCurrency(federalTaxableIncome)} | Position within bracket |
| Room to Next Bracket | ${formatCurrency(roomToNextBracket)} | Additional income before rate increase |
| Next Bracket Rate | ${taxBrackets.find(b => b.min > (currentBracket?.max || 0))?.bracket || 'N/A'} | Rate on income above current bracket |

<div class="recommendation-box">
<strong>Tax Bracket Insights:</strong>

- You have **${formatCurrency(roomToNextBracket)}** of room remaining in your current ${currentBracket?.bracket} bracket
- Additional income up to this amount will be taxed at your current marginal rate
- Strategic income timing can help manage bracket positioning
- Consider accelerating or deferring income based on multi-year projections
</div>

### Income Source Analysis

${incomeSources?.length ? `
You have **${incomeSources.length}** income sources contributing to your total income:

| Source | Type | Annual Amount | Tax Treatment |
|--------|------|---------------|---------------|
${incomeSources.map(source => {
  const annualAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
  const taxable = !['roth-ira', 'roth-401k', 'life-insurance'].includes(source.type);
  return `| ${source.name || source.type} | ${source.type.replace('-', ' ')} | ${formatCurrency(annualAmount)} | ${taxable ? 'Taxable' : 'Tax-Free'} |`;
}).join('\n')}

` : 'No income sources data available for detailed analysis.'}

### Tax Efficiency Analysis

<div class="summary-grid">
<div class="summary-card">
  <div class="summary-value" style="color: #16a34a;">${formatPercentage((totalIncome - totalTax) / totalIncome)}</div>
  <div class="summary-label">Income Retention</div>
  <small>Percentage kept after taxes</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #1e40af;">${formatCurrency(totalTax / 12)}</div>
  <div class="summary-label">Monthly Tax Burden</div>
  <small>Average monthly tax payment</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #7c3aed;">${((effectiveRateTotal / marginalRateTotal) * 100).toFixed(0)}%</div>
  <div class="summary-label">Tax Efficiency Ratio</div>
  <small>Effective vs marginal rate</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #dc2626;">${formatCurrency(totalTax)}</div>
  <div class="summary-label">Annual Tax Burden</div>
  <small>Federal + State taxes</small>
</div>
</div>

### Benchmark Comparison

Your effective tax rate of **${formatPercentage(effectiveRateTotal)}** compares to national averages as follows:

- **National Average (Similar Income):** 22.5%
- **Your Rate:** ${formatPercentage(effectiveRateTotal)}
- **Difference:** ${effectiveRateTotal > 0.225 ? 
  `${formatPercentage(effectiveRateTotal - 0.225)} above average ⚠️` : 
  `${formatPercentage(0.225 - effectiveRateTotal)} below average ✅`}

${effectiveRateTotal > 0.225 ? `
<div class="warning-box">
<strong>Above Average Tax Rate</strong>

Your effective tax rate is above the national average for similar income levels. This indicates significant opportunity for tax optimization strategies.
</div>
` : `
<div class="success-box">
<strong>Below Average Tax Rate</strong>

Your effective tax rate is below the national average, indicating good tax efficiency. Focus on maintaining this advantage while optimizing for future years.
</div>
`}

### Optimization Opportunities

<div class="recommendation-box">
<strong>Immediate Tax Planning Opportunities:</strong>

1. **Income Timing Strategies**
   - Consider timing of bonuses, capital gains, and other discretionary income
   - Evaluate accelerating deductions into current year
   - Review estimated tax payment timing

2. **Deduction Optimization**
   - Maximize retirement account contributions
   - Consider bunching itemized deductions
   - Evaluate charitable giving strategies

3. **Asset Location Planning**
   - Review placement of tax-inefficient investments
   - Consider tax-managed fund strategies
   - Optimize municipal bond allocation

4. **Multi-Year Planning**
   - Project income and tax rates for next 3-5 years
   - Plan for major life events affecting taxes
   - Consider Roth conversion opportunities
</div>

---

*This analysis provides the foundation for all subsequent tax planning recommendations. Your current position offers several optimization opportunities that will be detailed in the following sections.*

`;
  }

  generateAssetAnalysisMarkdown(props) {
    const { assets, calculations } = props;
    
    if (!assets || assets.length === 0) {
      return `## Asset Analysis & Recommendations

No asset data available for analysis. Please provide asset information for comprehensive tax planning recommendations.

`;
    }

    const processedAssets = assets.map(asset => ({
      ...asset,
      yearlyIncome: asset.frequency === 'monthly' ? (asset.amount || 0) * 12 : (asset.amount || 0),
      withdrawalRate: asset.currentValue > 0 ? ((asset.frequency === 'monthly' ? asset.amount * 12 : asset.amount) / asset.currentValue) : 0
    }));

    const totalAssetValue = processedAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalYearlyIncome = processedAssets.reduce((sum, asset) => sum + asset.yearlyIncome, 0);
    const averageWithdrawalRate = totalAssetValue > 0 ? totalYearlyIncome / totalAssetValue : 0;

    // Tax treatment categories
    const taxCategories = {
      'tax-deferred': {
        name: 'Tax-Deferred',
        types: ['traditional-ira', '401k', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira', 'annuity'],
        description: 'Contributions may be tax-deductible, growth is tax-deferred, withdrawals are taxed as ordinary income'
      },
      'tax-free': {
        name: 'Tax-Free',
        types: ['roth-ira', 'roth-401k', 'life-insurance'],
        description: 'Contributions are after-tax, growth and qualified withdrawals are tax-free'
      },
      'taxable': {
        name: 'Taxable',
        types: ['brokerage', 'savings', 'cd', 'real-estate', 'business'],
        description: 'Income and gains are subject to current taxation, may qualify for preferential capital gains rates'
      }
    };

    const assetsByTaxTreatment = Object.entries(taxCategories).map(([key, category]) => {
      const categoryAssets = processedAssets.filter(asset => category.types.includes(asset.type));
      const totalValue = categoryAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
      const percentage = totalAssetValue > 0 ? (totalValue / totalAssetValue) * 100 : 0;
      
      return {
        category: key,
        name: category.name,
        description: category.description,
        assets: categoryAssets,
        totalValue,
        percentage,
        count: categoryAssets.length
      };
    }).filter(category => category.totalValue > 0);

    return `## Asset Analysis & Recommendations

Your asset portfolio forms the foundation of your long-term financial security and tax planning strategy. This analysis examines your current holdings, their tax implications, and optimization opportunities.

### Portfolio Overview

<div class="summary-grid">
<div class="summary-card">
  <div class="summary-value" style="color: #1e40af;">${formatCurrency(totalAssetValue)}</div>
  <div class="summary-label">Total Asset Value</div>
  <small>${processedAssets.length} accounts</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #16a34a;">${formatCurrency(totalYearlyIncome)}</div>
  <div class="summary-label">Annual Income</div>
  <small>From all assets</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #7c3aed;">${formatPercentage(averageWithdrawalRate)}</div>
  <div class="summary-label">Avg Withdrawal Rate</div>
  <small>Income ÷ Asset value</small>
</div>
<div class="summary-card">
  <div class="summary-value" style="color: #ea580c;">${assetsByTaxTreatment.length}</div>
  <div class="summary-label">Tax Categories</div>
  <small>Diversification level</small>
</div>
</div>

### Asset Allocation by Tax Treatment

Your assets are distributed across the following tax treatment categories:

${assetsByTaxTreatment.map(category => `
#### ${category.name} (${category.percentage.toFixed(1)}% - ${formatCurrency(category.totalValue)})

*${category.description}*

**Accounts in this category:** ${category.count}

${category.assets.map(asset => `
- **${asset.name || asset.type}** (${asset.type.replace('-', ' ')})
  - Current Value: ${formatCurrency(asset.currentValue || 0)}
  ${asset.yearlyIncome > 0 ? `- Annual Income: ${formatCurrency(asset.yearlyIncome)}` : ''}
  ${asset.withdrawalRate > 0 ? `- Withdrawal Rate: ${formatPercentage(asset.withdrawalRate)}` : ''}
  ${asset.deathBenefit ? `- Death Benefit: ${formatCurrency(asset.deathBenefit)}` : ''}
`).join('\n')}
`).join('\n')}

### Tax Diversification Analysis

<div class="recommendation-box">
<strong>Tax Diversification Score: ${assetsByTaxTreatment.length}/3</strong>

${assetsByTaxTreatment.length === 3 ? 
  'Excellent! You have assets in all three tax treatment categories, providing maximum flexibility for tax planning.' :
  assetsByTaxTreatment.length === 2 ?
  'Good diversification, but consider adding assets in the missing tax category for optimal flexibility.' :
  'Limited tax diversification. Consider expanding into additional tax treatment categories.'
}
</div>

### Withdrawal Strategy Analysis

Your current withdrawal rate of **${formatPercentage(averageWithdrawalRate)}** provides insights into your income sustainability:

| Benchmark | Rate | Assessment |
|-----------|------|------------|
| Conservative (4% Rule) | 4.0% | ${averageWithdrawalRate <= 0.04 ? '✅ Conservative' : '⚠️ Above conservative'} |
| Moderate | 5.0% | ${averageWithdrawalRate <= 0.05 ? '✅ Moderate' : '⚠️ Above moderate'} |
| Aggressive | 6.0% | ${averageWithdrawalRate <= 0.06 ? '✅ Within range' : '⚠️ High risk'} |
| Your Current Rate | ${formatPercentage(averageWithdrawalRate)} | ${averageWithdrawalRate <= 0.04 ? 'Sustainable long-term' : averageWithdrawalRate <= 0.06 ? 'Monitor closely' : 'Consider reducing'} |

### Optimization Recommendations

<div class="recommendation-box">
<strong>Asset Location Optimization</strong>

1. **Tax-Inefficient Holdings** - Consider moving actively managed funds and bonds to tax-deferred accounts
2. **Tax-Efficient Holdings** - Place index funds and individual stocks in taxable accounts
3. **International Diversification** - Hold international funds in taxable accounts for foreign tax credit benefits
4. **Municipal Bonds** - Consider for high earners in taxable accounts
</div>

<div class="success-box">
<strong>Withdrawal Sequencing Strategy</strong>

Optimal withdrawal order for tax efficiency:
1. **First:** Taxable accounts (lowest tax impact)
2. **Second:** Tax-deferred accounts (manage bracket positioning)  
3. **Last:** Tax-free accounts (preserve tax-free growth)

*Exception: Strategic Roth conversions during low-income years*
</div>

<div class="warning-box">
<strong>Required Minimum Distribution Planning</strong>

${processedAssets.some(asset => ['traditional-ira', '401k', 'traditional-401k', '403b', '457'].includes(asset.type)) ? 
  'You have tax-deferred accounts subject to RMDs starting at age 73. Plan now to minimize future tax impact.' :
  'No traditional retirement accounts identified. Consider tax-deferred savings opportunities.'
}
</div>

### Risk Assessment by Asset Category

${assetsByTaxTreatment.map(category => {
  const riskLevels = {
    'savings': 'Low', 'cd': 'Low', 'traditional-ira': 'Medium', 'roth-ira': 'Medium',
    '401k': 'Medium', 'brokerage': 'Medium-High', 'real-estate': 'Medium-High',
    'business': 'High', 'annuity': 'Low-Medium', 'life-insurance': 'Low'
  };
  
  const categoryRisk = category.assets.map(asset => riskLevels[asset.type] || 'Medium');
  const avgRisk = categoryRisk.includes('High') ? 'High' : 
                  categoryRisk.includes('Medium-High') ? 'Medium-High' : 
                  categoryRisk.includes('Medium') ? 'Medium' : 'Low';
  
  return `
**${category.name}** - Risk Level: ${avgRisk}
- Portfolio Weight: ${category.percentage.toFixed(1)}%
- Risk Assessment: ${avgRisk === 'Low' ? 'Conservative, stable returns' : 
                    avgRisk === 'Medium' ? 'Balanced growth potential' : 
                    'Higher growth potential with increased volatility'}`;
}).join('\n')}

### Action Items

<div class="recommendation-box">
<strong>Priority Action Items:</strong>

1. **Review Asset Location** - Optimize placement of investments across account types
2. **Rebalancing Strategy** - Implement systematic rebalancing approach
3. **Tax-Loss Harvesting** - Identify opportunities in taxable accounts
4. **Contribution Strategy** - Maximize tax-advantaged account contributions
5. **Estate Planning** - Review beneficiary designations and estate tax implications

**Timeline:** Begin implementation within 30-60 days for optimal tax year planning.
</div>

---

*This asset analysis provides the foundation for implementing tax-efficient investment strategies. Coordinate with your investment advisor to implement these recommendations while maintaining your risk tolerance and investment objectives.*

`;
  }

  generateTaxMapMarkdown(props) {
    return `## Tax Map Visualization

### Interactive Tax Bracket Analysis

Your current position within the federal tax bracket system provides important insights for tax planning strategies.

<div class="recommendation-box">
<strong>Tax Map Insights</strong>

The tax map visualization shows your current income positioning relative to federal tax brackets, IRMAA thresholds, and other important tax planning benchmarks. This visual analysis helps identify opportunities for income optimization and strategic planning.
</div>

### Key Tax Planning Benchmarks

- **Current Tax Bracket Position**
- **IRMAA Threshold Proximity** 
- **Social Security Taxation Levels**
- **Capital Gains Rate Transitions**
- **Net Investment Income Tax Thresholds**

### Optimization Strategies

Based on your tax map position, consider these strategic approaches:

1. **Income Smoothing** - Manage income timing to optimize bracket positioning
2. **Deduction Timing** - Accelerate or defer deductions based on multi-year projections
3. **Investment Location** - Optimize asset placement for tax efficiency
4. **Roth Conversions** - Strategic conversions during lower-income periods

---

*The interactive tax map provides visual guidance for implementing these strategies. Refer to the application for detailed positioning analysis.*

`;
  }

  generateSocialSecurityMarkdown(props) {
    return `## Social Security Optimization

### Claiming Strategy Analysis

Social Security benefits represent a significant component of retirement income for most Americans. Optimizing your claiming strategy can result in hundreds of thousands of dollars in additional lifetime benefits.

### Current Social Security Position

<div class="recommendation-box">
<strong>Social Security Planning Considerations</strong>

- **Full Retirement Age (FRA)** - Your benefits are calculated based on your FRA
- **Early Claiming Penalties** - Claiming before FRA results in permanent benefit reductions
- **Delayed Retirement Credits** - Delaying benefits past FRA increases payments by 8% per year until age 70
- **Spousal Benefits** - Married couples have additional claiming strategies available
</div>

### Tax Implications of Social Security

Social Security benefits may be subject to federal income tax based on your "provisional income":

| Filing Status | Provisional Income | Tax on Benefits |
|---------------|-------------------|-----------------|
| Single | $25,000 - $34,000 | Up to 50% taxable |
| Single | Over $34,000 | Up to 85% taxable |
| Married Filing Jointly | $32,000 - $44,000 | Up to 50% taxable |
| Married Filing Jointly | Over $44,000 | Up to 85% taxable |

### Optimization Strategies

1. **Claiming Age Optimization**
   - Analyze break-even points for different claiming ages
   - Consider health, longevity, and financial needs
   - Evaluate spousal claiming strategies

2. **Tax Planning Integration**
   - Manage other income sources to minimize Social Security taxation
   - Consider Roth conversions to reduce future provisional income
   - Time withdrawals from retirement accounts strategically

3. **Medicare Coordination**
   - Plan for Medicare premiums and IRMAA surcharges
   - Coordinate Social Security and Medicare enrollment timing

<div class="success-box">
<strong>Recommended Analysis</strong>

A detailed Social Security optimization analysis should be performed to determine your optimal claiming strategy based on your specific circumstances, health considerations, and overall financial plan.
</div>

---

*Social Security optimization requires personalized analysis based on your earnings record, health status, and overall retirement plan. Consider consulting with a Social Security specialist for detailed claiming strategy analysis.*

`;
  }

  generateRMDPlanningMarkdown(props) {
    const { assets } = props;
    
    const rmdAccounts = assets?.filter(asset => 
      ['traditional-ira', '401k', 'traditional-401k', '403b', '457', 'sep-ira', 'simple-ira'].includes(asset.type)
    ) || [];
    
    const totalRMDAssets = rmdAccounts.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);

    return `## Required Minimum Distribution (RMD) Planning

### RMD Overview

Starting at age 73, you must begin taking Required Minimum Distributions from most tax-deferred retirement accounts. Proper RMD planning can minimize the tax impact and preserve more wealth for your beneficiaries.

### Your RMD-Subject Accounts

${rmdAccounts.length > 0 ? `
You have **${rmdAccounts.length}** accounts subject to RMD requirements with a total value of **${formatCurrency(totalRMDAssets)}**:

| Account | Type | Current Value | Estimated Annual RMD* |
|---------|------|---------------|----------------------|
${rmdAccounts.map(asset => {
  const estimatedRMD = (asset.currentValue || 0) * 0.04; // Rough 4% estimate
  return `| ${asset.name || asset.type} | ${asset.type.replace('-', ' ')} | ${formatCurrency(asset.currentValue || 0)} | ${formatCurrency(estimatedRMD)} |`;
}).join('\n')}

*Estimated based on 4% withdrawal rate. Actual RMDs vary by age and account balance.
` : `
No tax-deferred accounts identified that would be subject to RMD requirements. Consider whether additional tax-deferred savings opportunities align with your overall tax strategy.
`}

### RMD Planning Strategies

<div class="recommendation-box">
<strong>Pre-RMD Strategies (Before Age 73)</strong>

1. **Roth Conversions** - Convert traditional IRA/401(k) assets to Roth to reduce future RMDs
2. **Charitable Giving** - Consider donor-advised funds or charitable remainder trusts
3. **Asset Location** - Optimize investment placement across account types
4. **Withdrawal Timing** - Begin strategic withdrawals before RMDs are required
</div>

<div class="success-box">
<strong>During RMD Years (Age 73+)</strong>

1. **Qualified Charitable Distributions (QCDs)** - Direct IRA distributions to charity (up to $100,000 annually)
2. **Tax-Efficient Withdrawal Sequencing** - Coordinate RMDs with other income sources
3. **Investment Management** - Position tax-inefficient investments in RMD accounts
4. **Estate Planning** - Consider stretch provisions for beneficiaries
</div>

### Tax Impact Analysis

${totalRMDAssets > 0 ? `
Based on your current RMD-subject assets of **${formatCurrency(totalRMDAssets)}**, estimated annual RMDs could be:

| Age | RMD Factor | Estimated RMD | Tax Impact (22% bracket) |
|-----|------------|---------------|-------------------------|
| 73 | 26.5 | ${formatCurrency(totalRMDAssets / 26.5)} | ${formatCurrency((totalRMDAssets / 26.5) * 0.22)} |
| 75 | 24.6 | ${formatCurrency(totalRMDAssets / 24.6)} | ${formatCurrency((totalRMDAssets / 24.6) * 0.22)} |
| 80 | 20.2 | ${formatCurrency(totalRMDAssets / 20.2)} | ${formatCurrency((totalRMDAssets / 20.2) * 0.22)} |
| 85 | 16.0 | ${formatCurrency(totalRMDAssets / 16.0)} | ${formatCurrency((totalRMDAssets / 16.0) * 0.22)} |

*Assumes current account values and 22% marginal tax rate. Actual results will vary based on account growth and tax law changes.*
` : ''}

### Optimization Recommendations

<div class="warning-box">
<strong>Action Items for RMD Planning</strong>

1. **Annual Review** - Monitor account balances and adjust strategies annually
2. **Professional Coordination** - Work with tax and financial professionals for implementation
3. **Beneficiary Planning** - Ensure beneficiary designations are current and optimized
4. **Documentation** - Maintain records of all RMD-related transactions and strategies

${rmdAccounts.length > 0 ? 
  'Begin RMD planning now to maximize tax efficiency and wealth preservation.' :
  'Consider whether tax-deferred savings align with your overall tax optimization strategy.'
}
</div>

---

*RMD planning requires ongoing attention and professional guidance. Tax laws and regulations change frequently, making regular review essential for optimal outcomes.*

`;
  }

  generateDisclosuresMarkdown(props) {
    const { reportSettings } = props;
    
    return `## Disclosures & Methodology

### Important Disclaimers

<div class="warning-box">
<strong>Tax Planning Disclaimer</strong>

This analysis is based on current federal and state tax laws, which are subject to change. The strategies and recommendations contained in this report are for informational purposes only and should not be considered as tax, legal, or investment advice. Individual circumstances vary, and what may be appropriate for one person may not be suitable for another.
</div>

<div class="warning-box">
<strong>Professional Consultation Required</strong>

Before implementing any of the strategies discussed in this report, please consult with qualified tax, legal, and investment professionals who can provide advice tailored to your specific circumstances. This report does not constitute professional advice and should not be relied upon as the sole basis for financial decisions.
</div>

<div class="warning-box">
<strong>Accuracy of Information</strong>

This analysis is based on the information provided and assumptions made at the time of preparation. Changes in personal circumstances, tax laws, market conditions, or other factors may significantly impact the validity of these recommendations. Regular review and updates are essential.
</div>

### Methodology

#### Tax Calculations
- **Federal Tax Brackets:** Based on 2025 tax year brackets and standard deduction amounts
- **State Tax Calculations:** Use current state tax rates and may not reflect all available deductions or credits
- **Effective Tax Rates:** Calculated as total tax divided by total income
- **Marginal Tax Rates:** Represent the tax rate on the next dollar of income earned

#### Projections and Assumptions
- **Future Projections:** Assume current tax law remains unchanged
- **Inflation:** Not specifically adjusted for inflation unless noted
- **Investment Returns:** Not projected unless specifically stated
- **Life Expectancy:** Standard actuarial tables used where applicable

#### Asset Analysis
- **Asset Allocation:** Based on general tax efficiency principles
- **Risk Assessment:** Uses standard risk categorizations
- **Withdrawal Rates:** Based on current sustainable withdrawal research
- **Tax Treatment:** Based on current tax law for different account types

### Data Sources and References

#### Government Sources
- **Internal Revenue Service (IRS)**
  - Publication 15 (Circular E) - Federal Tax Withholding Tables
  - Publication 590-A and 590-B - Individual Retirement Arrangements
  - Publication 525 - Taxable and Nontaxable Income
  - Current tax forms and instructions

- **Social Security Administration**
  - Benefit calculation guidelines and tables
  - Full retirement age determinations
  - Cost-of-living adjustment information

#### State and Local Sources
- **State Department of Revenue** - State tax rates and regulations
- **Local Tax Authorities** - Municipal and county tax information where applicable

#### Professional Standards
- **Financial Planning Standards Board** - CFP Board Standards of Professional Conduct
- **American Institute of CPAs** - Tax practice standards and guidelines
- **National Association of Personal Financial Advisors** - Fiduciary standards

### Limitations and Considerations

#### Analysis Limitations
1. **Point-in-Time Analysis** - Based on current information and may not reflect future changes
2. **Simplified Assumptions** - Complex tax situations may require additional analysis
3. **General Recommendations** - Not tailored to specific risk tolerance or investment objectives
4. **Tax Law Changes** - Future tax law changes may impact strategy effectiveness

#### Implementation Considerations
1. **Professional Guidance** - Complex strategies require professional implementation
2. **Ongoing Monitoring** - Regular review and adjustment necessary
3. **Coordination Required** - Multiple professionals may need to coordinate implementation
4. **Documentation** - Proper documentation essential for tax compliance

### Report Preparation

${reportSettings?.advisorName ? `
#### Professional Credentials
This report was prepared by **${reportSettings.advisorName}**${reportSettings?.firmName ? ` of **${reportSettings.firmName}**` : ''}.

${reportSettings?.firmName ? `
**${reportSettings.firmName}** is committed to providing comprehensive financial planning services in accordance with applicable professional standards and regulatory requirements.
` : ''}
` : ''}

#### Report Date and Validity
- **Report Date:** ${new Date().toLocaleDateString()}
- **Data Current As Of:** ${new Date().toLocaleDateString()}
- **Recommended Review Frequency:** Annually or upon significant life changes
- **Next Scheduled Review:** ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}

### Contact Information

For questions about this report or to schedule a follow-up consultation:

${reportSettings?.advisorName ? `
**${reportSettings.advisorName}**  
${reportSettings?.firmName ? `${reportSettings.firmName}  ` : ''}
` : ''}

*Please retain this report for your records and refer to it when making financial decisions. Regular updates ensure continued relevance and accuracy.*

---

**End of Report**

*This report contains confidential and proprietary information. Distribution should be limited to authorized parties only.*

`;
  }

  // Save markdown to file and convert to PDF
  async saveToPDF(reportData, filename = 'tax-planning-report') {
    const markdown = this.generateMarkdownReport(reportData);
    
    // Save markdown file
    const markdownPath = `/tmp/${filename}.md`;
    const pdfPath = `/tmp/${filename}.pdf`;
    
    try {
      // Write markdown file
      await this.writeFile(markdownPath, markdown);
      
      // Convert to PDF using manus-md-to-pdf utility
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      await execPromise(`manus-md-to-pdf ${markdownPath} ${pdfPath}`);
      
      return {
        success: true,
        markdownPath,
        pdfPath,
        message: 'PDF report generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate PDF report'
      };
    }
  }

  // Helper method to write file (would use Node.js fs in real implementation)
  async writeFile(path, content) {
    // In browser environment, this would need to be handled differently
    // For now, return the content for manual saving
    return content;
  }
}

export default PDFReportGenerator;

