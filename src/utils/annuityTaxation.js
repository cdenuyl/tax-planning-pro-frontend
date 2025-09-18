// Annuity Taxation Calculations (Pre/Post-TEFRA)
// Based on IRS rules for annuity distributions

export function calculateAnnuityTaxation(annuityData, taxpayerAge, distributionAmount) {
  const {
    purchaseDate,
    basisAmount,
    currentValue,
    annuityType = 'immediate', // 'immediate', 'deferred'
    isQualified = false, // Qualified vs. Non-qualified annuity
    expectedReturn = null // For immediate annuities
  } = annuityData;

  // Determine if Pre-TEFRA or Post-TEFRA
  const tefraDate = new Date('1982-08-14');
  const purchaseDateObj = new Date(purchaseDate);
  const isPreTEFRA = purchaseDateObj < tefraDate;

  // Age-based penalty considerations
  const isUnder59Half = taxpayerAge < 59.5;
  const earlyWithdrawalPenalty = isUnder59Half && !isQualified ? 0.10 : 0; // 10% penalty

  let taxableAmount = 0;
  let nonTaxableAmount = 0;
  let penaltyAmount = 0;
  let basisRemaining = basisAmount;

  if (isQualified) {
    // Qualified annuities (401k, IRA, etc.) - fully taxable
    taxableAmount = distributionAmount;
    nonTaxableAmount = 0;
  } else if (isPreTEFRA) {
    // Pre-TEFRA: Tax-free until basis recovered (FIFO)
    if (basisRemaining > 0) {
      nonTaxableAmount = Math.min(distributionAmount, basisRemaining);
      taxableAmount = Math.max(0, distributionAmount - basisRemaining);
      basisRemaining = Math.max(0, basisRemaining - distributionAmount);
    } else {
      // Basis fully recovered, all distributions taxable
      taxableAmount = distributionAmount;
      nonTaxableAmount = 0;
    }
  } else {
    // Post-TEFRA: Pro-rata taxation
    if (annuityType === 'immediate' && expectedReturn) {
      // Immediate annuity with expected return calculation
      const exclusionRatio = basisAmount / expectedReturn;
      nonTaxableAmount = distributionAmount * exclusionRatio;
      taxableAmount = distributionAmount - nonTaxableAmount;
    } else {
      // Deferred annuity or immediate without expected return
      const exclusionRatio = basisAmount / currentValue;
      nonTaxableAmount = distributionAmount * exclusionRatio;
      taxableAmount = distributionAmount - nonTaxableAmount;
    }
  }

  // Calculate early withdrawal penalty on taxable portion
  if (earlyWithdrawalPenalty > 0) {
    penaltyAmount = taxableAmount * earlyWithdrawalPenalty;
  }

  return {
    isPreTEFRA,
    taxableAmount: Math.round(taxableAmount),
    nonTaxableAmount: Math.round(nonTaxableAmount),
    penaltyAmount: Math.round(penaltyAmount),
    basisRemaining: Math.round(basisRemaining),
    exclusionRatio: isPreTEFRA ? null : (nonTaxableAmount / distributionAmount),
    earlyWithdrawalPenalty: earlyWithdrawalPenalty,
    calculation: {
      originalBasis: basisAmount,
      currentValue: currentValue,
      distributionAmount: distributionAmount,
      taxpayerAge: taxpayerAge,
      isQualified: isQualified,
      annuityType: annuityType
    }
  };
}

// Calculate Required Minimum Distributions for annuities
export function calculateAnnuityRMD(annuityData, taxpayerAge, spouseAge = null) {
  const {
    currentValue,
    isQualified = false,
    annuityType = 'deferred'
  } = annuityData;

  // RMDs only apply to qualified annuities and start at age 73
  if (!isQualified || taxpayerAge < 73 || annuityType === 'immediate') {
    return {
      rmdRequired: false,
      rmdAmount: 0,
      reason: !isQualified ? 'Non-qualified annuity' : 
              taxpayerAge < 73 ? 'Under age 73' : 
              'Immediate annuity (payments already started)'
    };
  }

  // Use IRS Uniform Lifetime Table (simplified)
  const lifetimeFactors = {
    73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
    80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2,
    87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1,
    94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.3
  };

  // Special rule: If spouse is more than 10 years younger and sole beneficiary
  const useJointLifeTable = spouseAge && (taxpayerAge - spouseAge) > 10;
  
  let lifetimeFactor;
  if (useJointLifeTable) {
    // Simplified joint life expectancy (would need full IRS table for precision)
    lifetimeFactor = lifetimeFactors[taxpayerAge] + 2; // Approximate adjustment
  } else {
    lifetimeFactor = lifetimeFactors[taxpayerAge] || lifetimeFactors[100];
  }

  const rmdAmount = currentValue / lifetimeFactor;

  return {
    rmdRequired: true,
    rmdAmount: Math.round(rmdAmount),
    lifetimeFactor: lifetimeFactor,
    tableUsed: useJointLifeTable ? 'Joint Life Expectancy' : 'Uniform Lifetime',
    calculation: {
      currentValue: currentValue,
      lifetimeFactor: lifetimeFactor,
      taxpayerAge: taxpayerAge,
      spouseAge: spouseAge
    }
  };
}

// Annuity strategy recommendations
export function getAnnuityTaxStrategies(annuityData, taxpayerAge, currentTaxRate) {
  const strategies = [];
  const {
    isPreTEFRA,
    basisAmount,
    currentValue,
    isQualified = false,
    annuityType = 'deferred'
  } = annuityData;

  // Strategy 1: Timing of distributions
  if (!isQualified && taxpayerAge < 59.5) {
    strategies.push({
      type: 'timing',
      title: 'Delay Distributions Until Age 59½',
      description: 'Avoid 10% early withdrawal penalty on earnings',
      potentialSaving: `10% penalty avoidance on taxable portion`,
      priority: 'high'
    });
  }

  // Strategy 2: Pre-TEFRA basis recovery
  if (isPreTEFRA && basisAmount > 0) {
    strategies.push({
      type: 'basis-recovery',
      title: 'Maximize Tax-Free Basis Recovery',
      description: 'Distribute basis amount first to minimize current taxes',
      potentialSaving: `Tax-free recovery of $${basisAmount.toLocaleString()}`,
      priority: 'medium'
    });
  }

  // Strategy 3: Post-TEFRA pro-rata planning
  if (!isPreTEFRA && !isQualified) {
    const exclusionRatio = basisAmount / currentValue;
    strategies.push({
      type: 'pro-rata',
      title: 'Pro-Rata Distribution Planning',
      description: `${(exclusionRatio * 100).toFixed(1)}% of each distribution is tax-free`,
      potentialSaving: `Predictable tax treatment for planning`,
      priority: 'low'
    });
  }

  // Strategy 4: RMD planning for qualified annuities
  if (isQualified && taxpayerAge >= 70 && taxpayerAge < 73) {
    strategies.push({
      type: 'rmd-planning',
      title: 'Prepare for Required Minimum Distributions',
      description: 'RMDs begin at age 73 for qualified annuities',
      potentialSaving: `Plan distributions to manage tax brackets`,
      priority: 'medium'
    });
  }

  // Strategy 5: 1035 exchanges
  if (!isQualified && annuityType === 'deferred') {
    strategies.push({
      type: 'exchange',
      title: 'Consider 1035 Exchange',
      description: 'Tax-free exchange to better annuity products',
      potentialSaving: `Improve features without tax consequences`,
      priority: 'low'
    });
  }

  return strategies;
}

// Helper function to determine annuity classification
export function classifyAnnuity(purchaseDate) {
  const tefraDate = new Date('1982-08-14');
  const purchaseDateObj = new Date(purchaseDate);
  
  return {
    isPreTEFRA: purchaseDateObj < tefraDate,
    tefraClassification: purchaseDateObj < tefraDate ? 'Pre-TEFRA' : 'Post-TEFRA',
    taxationMethod: purchaseDateObj < tefraDate ? 'FIFO (First In, First Out)' : 'Pro-Rata'
  };
}

