/**
 * Report Formatting Utilities
 * 
 * Provides consistent formatting functions for reports with proper rounding
 * and tax status analysis.
 */

/**
 * Format currency for reports - rounds to nearest dollar
 */
export function formatCurrencyForReports(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  
  const roundedAmount = Math.round(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(roundedAmount);
}

/**
 * Format percentage for reports - rounds to 2 decimal places
 */
export function formatPercentageForReports(rate) {
  if (rate === null || rate === undefined || isNaN(rate)) {
    return '0.00%';
  }
  
  const percentage = rate * 100;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Get tax status for income source
 */
export function getIncomeSourceTaxStatus(source) {
  const type = source.type || source.accountType;
  
  switch (type) {
    // Tax-Free Sources
    case 'roth-ira':
    case 'roth-401k':
    case 'roth-403b':
    case 'life-insurance':
      return {
        status: 'Tax Free',
        description: 'No federal income tax on distributions',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    
    // Tax-Deferred Sources
    case 'traditional-ira':
    case 'traditional-401k':
    case 'traditional-403b':
    case '457-plan':
    case 'annuity':
    case 'pension':
      return {
        status: 'Tax Deferred',
        description: 'Taxed as ordinary income when withdrawn',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
      };
    
    // After-Tax Sources (Non-Qualified)
    case 'non-qualified-annuity':
    case 'non-qualified-account':
    case 'savings':
    case 'cd':
    case 'money-market':
      return {
        status: 'After-Tax',
        description: 'Principal is after-tax, earnings are taxable',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    
    // Capital Gains
    case 'long-term-capital-gains':
      return {
        status: 'Capital Gains',
        description: 'Taxed at preferential capital gains rates (0%, 15%, 20%)',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      };
    
    case 'short-term-capital-gains':
      return {
        status: 'Short-Term Gains',
        description: 'Taxed as ordinary income',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    
    // Ordinary Income
    case 'wages':
    case 'salary':
    case 'self-employment':
    case 'business':
    case 'rental':
    case 'dividends':
      return {
        status: 'Ordinary Income',
        description: 'Taxed at ordinary income rates',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
      };
    
    // Social Security
    case 'social-security':
      return {
        status: 'Partially Taxable',
        description: 'Up to 85% may be taxable depending on income',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
      };
    
    // Default
    default:
      return {
        status: 'Ordinary Income',
        description: 'Taxed at ordinary income rates',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50'
      };
  }
}

/**
 * Get comprehensive tax analysis for income source
 */
export function getIncomeSourceTaxAnalysis(source, calculations) {
  const taxStatus = getIncomeSourceTaxStatus(source);
  const yearlyAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
  
  // Calculate estimated tax impact
  let estimatedTax = 0;
  let marginalRate = 0;
  
  if (calculations && calculations.marginalRateFederal !== undefined) {
    marginalRate = calculations.marginalRateFederal || 0;
    
    // If marginal rate is 0 but we have taxable income, calculate a basic rate
    if (marginalRate === 0 && calculations.federalTaxableIncome > 0) {
      // Use a basic 12% rate for middle income (simplified calculation)
      marginalRate = 0.12;
    }
    
    switch (taxStatus.status) {
      case 'Tax Free':
        estimatedTax = 0;
        break;
      case 'Tax Deferred':
      case 'Ordinary Income':
      case 'Short-Term Gains':
        estimatedTax = yearlyAmount * marginalRate;
        break;
      case 'Capital Gains':
        // Use capital gains rate (simplified - could be 0%, 15%, or 20%)
        const cgRate = calculations.federalTaxableIncome > 47150 ? 0.15 : 0; // Simplified
        estimatedTax = yearlyAmount * cgRate;
        break;
      case 'Partially Taxable':
        // Social Security - estimate 85% taxable
        estimatedTax = yearlyAmount * 0.85 * marginalRate;
        break;
      case 'After-Tax':
        // Only earnings portion is taxable - estimate 50% earnings
        estimatedTax = yearlyAmount * 0.5 * marginalRate;
        break;
    }
  } else {
    // Fallback calculation when calculations object is not available
    marginalRate = 0.12; // Use 12% as a reasonable default for middle income
    
    switch (taxStatus.status) {
      case 'Tax Free':
        estimatedTax = 0;
        break;
      case 'Tax Deferred':
      case 'Ordinary Income':
      case 'Short-Term Gains':
        estimatedTax = yearlyAmount * marginalRate;
        break;
      case 'Capital Gains':
        estimatedTax = yearlyAmount * 0.15; // 15% capital gains rate
        break;
      case 'Partially Taxable':
        estimatedTax = yearlyAmount * 0.85 * marginalRate; // 85% of Social Security taxable
        break;
      case 'After-Tax':
        estimatedTax = yearlyAmount * 0.5 * marginalRate; // 50% earnings taxable
        break;
    }
  }
  
  return {
    ...taxStatus,
    yearlyAmount,
    estimatedTax,
    marginalRate,
    afterTaxAmount: yearlyAmount - estimatedTax
  };
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 */
export function formatLargeNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1000000000) {
    return sign + (absNum / 1000000000).toFixed(1) + 'B';
  } else if (absNum >= 1000000) {
    return sign + (absNum / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    return sign + (absNum / 1000).toFixed(0) + 'K';
  } else {
    return sign + Math.round(absNum).toString();
  }
}

/**
 * Truncate text with ellipsis for table cells
 */
export function truncateText(text, maxLength = 30) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

