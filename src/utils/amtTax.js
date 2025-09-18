// Alternative Minimum Tax (AMT) calculations for 2025
// AMT ensures high-income taxpayers pay a minimum amount of tax

// 2025 AMT exemption amounts
export const AMT_EXEMPTIONS_2025 = {
  single: 85700,
  marriedFilingJointly: 133300,
  marriedFilingSeparately: 66650,
  headOfHousehold: 85700
};

// 2025 AMT exemption phaseout thresholds
export const AMT_PHASEOUT_THRESHOLDS_2025 = {
  single: 609350,
  marriedFilingJointly: 1218700,
  marriedFilingSeparately: 609350,
  headOfHousehold: 609350
};

// AMT tax rates
export const AMT_TAX_RATES = {
  rate1: 0.26, // 26% on AMT income up to threshold
  rate2: 0.28, // 28% on AMT income above threshold
  threshold: {
    single: 220700,
    marriedFilingJointly: 220700,
    marriedFilingSeparately: 110350,
    headOfHousehold: 220700
  }
};

// Calculate Alternative Minimum Tax
export function calculateAMT(incomeSources, deductions, filingStatus) {
  const getYearlyAmount = (source) => {
    return source.frequency === 'monthly' ? source.amount * 12 : source.amount;
  };

  // Calculate regular AGI
  const totalIncome = incomeSources
    .filter(source => source.enabled)
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);

  // AMT adjustments and preferences
  const amtAdjustments = calculateAMTAdjustments(incomeSources, deductions, filingStatus);
  
  // Calculate AMT Income (AMTI)
  const amtIncome = totalIncome + amtAdjustments.totalAdjustments;
  
  // Calculate AMT exemption
  const exemption = calculateAMTExemption(amtIncome, filingStatus);
  
  // Calculate AMT taxable income
  const amtTaxableIncome = Math.max(0, amtIncome - exemption);
  
  // Calculate AMT tax
  const amtTax = calculateAMTTax(amtTaxableIncome, filingStatus);
  
  return {
    amtIncome,
    exemption,
    amtTaxableIncome,
    amtTax,
    adjustments: amtAdjustments,
    isAMTApplicable: amtTax > 0
  };
}

// Calculate AMT adjustments and preferences
function calculateAMTAdjustments(incomeSources, deductions, filingStatus) {
  let totalAdjustments = 0;
  const adjustmentDetails = [];

  // State and local tax deduction add-back (major AMT preference)
  const saltDeduction = deductions.stateAndLocalTaxes || 0;
  if (saltDeduction > 0) {
    totalAdjustments += saltDeduction;
    adjustmentDetails.push({
      description: 'State and Local Tax Deduction',
      amount: saltDeduction,
      type: 'addBack'
    });
  }

  // Miscellaneous itemized deductions (if any)
  const miscDeductions = deductions.miscellaneousItemized || 0;
  if (miscDeductions > 0) {
    totalAdjustments += miscDeductions;
    adjustmentDetails.push({
      description: 'Miscellaneous Itemized Deductions',
      amount: miscDeductions,
      type: 'addBack'
    });
  }

  // Personal exemptions (for years when applicable)
  // Note: Personal exemptions were suspended 2018-2025 under TCJA
  
  // Tax-exempt interest from private activity bonds
  const privateActivityBondInterest = incomeSources
    .filter(source => source.enabled && source.type === 'private-activity-bond-interest')
    .reduce((sum, source) => sum + (source.frequency === 'monthly' ? source.amount * 12 : source.amount), 0);
  
  if (privateActivityBondInterest > 0) {
    totalAdjustments += privateActivityBondInterest;
    adjustmentDetails.push({
      description: 'Private Activity Bond Interest',
      amount: privateActivityBondInterest,
      type: 'addBack'
    });
  }

  return {
    totalAdjustments,
    adjustmentDetails
  };
}

// Calculate AMT exemption with phaseout
function calculateAMTExemption(amtIncome, filingStatus) {
  const baseExemption = AMT_EXEMPTIONS_2025[filingStatus] || AMT_EXEMPTIONS_2025.single;
  const phaseoutThreshold = AMT_PHASEOUT_THRESHOLDS_2025[filingStatus] || AMT_PHASEOUT_THRESHOLDS_2025.single;
  
  if (amtIncome <= phaseoutThreshold) {
    return baseExemption;
  }
  
  // Exemption phases out at 25% of excess over threshold
  const phaseoutAmount = (amtIncome - phaseoutThreshold) * 0.25;
  const exemption = Math.max(0, baseExemption - phaseoutAmount);
  
  return exemption;
}

// Calculate AMT tax using graduated rates
function calculateAMTTax(amtTaxableIncome, filingStatus) {
  if (amtTaxableIncome <= 0) return 0;
  
  const threshold = AMT_TAX_RATES.threshold[filingStatus] || AMT_TAX_RATES.threshold.single;
  
  let amtTax = 0;
  
  if (amtTaxableIncome <= threshold) {
    // All income taxed at 26%
    amtTax = amtTaxableIncome * AMT_TAX_RATES.rate1;
  } else {
    // Income up to threshold taxed at 26%, excess at 28%
    amtTax = threshold * AMT_TAX_RATES.rate1 + 
             (amtTaxableIncome - threshold) * AMT_TAX_RATES.rate2;
  }
  
  return amtTax;
}

// Get comprehensive AMT analysis for display
export function getAMTAnalysis(incomeSources, deductions, regularTax, filingStatus) {
  const amtCalculation = calculateAMT(incomeSources, deductions, filingStatus);
  
  // Determine if AMT applies (AMT tax > regular tax)
  const amtApplies = amtCalculation.amtTax > regularTax;
  const additionalTax = amtApplies ? amtCalculation.amtTax - regularTax : 0;
  
  // Calculate effective AMT rate
  const effectiveAMTRate = amtCalculation.amtIncome > 0 ? 
    (amtCalculation.amtTax / amtCalculation.amtIncome) * 100 : 0;
  
  return {
    ...amtCalculation,
    regularTax,
    amtApplies,
    additionalTax,
    effectiveAMTRate,
    finalTax: Math.max(regularTax, amtCalculation.amtTax)
  };
}

// Format currency for AMT display
export function formatAMTCurrency(amount) {
  if (amount === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage for AMT display
export function formatAMTPercentage(rate) {
  return `${rate.toFixed(2)}%`;
}

