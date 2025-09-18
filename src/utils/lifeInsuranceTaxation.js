/**
 * Life Insurance Taxation Utilities
 * 
 * This module handles the complex taxation rules for life insurance policies,
 * including cash value withdrawals, policy loans, and Modified Endowment Contracts (MECs).
 */

/**
 * Calculate taxation for life insurance cash value withdrawals
 * @param {Object} policyDetails - Life insurance policy details
 * @param {number} withdrawalAmount - Amount being withdrawn
 * @returns {Object} Taxation details
 */
export function calculateLifeInsuranceWithdrawalTaxation(policyDetails, withdrawalAmount) {
  const {
    totalPremiumsPaid = 0,        // Adjusted Cost Basis (ACB)
    currentCashValue = 0,
    isMEC = false,                // Modified Endowment Contract
    policyType = 'whole-life',    // 'whole-life', 'universal-life', 'term'
    yearsInForce = 0
  } = policyDetails;

  // Term life insurance has no cash value
  if (policyType === 'term') {
    return {
      taxableAmount: 0,
      taxFreeAmount: 0,
      withdrawalType: 'none',
      notes: 'Term life insurance has no cash value to withdraw'
    };
  }

  // Calculate gains in the policy
  const totalGains = Math.max(0, currentCashValue - totalPremiumsPaid);
  const adjustedCostBasis = totalPremiumsPaid;

  let taxableAmount = 0;
  let taxFreeAmount = 0;
  let withdrawalType = '';
  let notes = '';

  if (isMEC) {
    // Modified Endowment Contract - LIFO taxation (gains come out first)
    if (withdrawalAmount <= totalGains) {
      // Withdrawal is entirely from gains
      taxableAmount = withdrawalAmount;
      taxFreeAmount = 0;
      withdrawalType = 'mec-gains';
      notes = 'MEC withdrawal - gains taxed as ordinary income';
    } else {
      // Withdrawal exceeds gains - some from gains, some from basis
      taxableAmount = totalGains;
      taxFreeAmount = withdrawalAmount - totalGains;
      withdrawalType = 'mec-mixed';
      notes = 'MEC withdrawal - gains portion taxed as ordinary income';
    }
  } else {
    // Regular life insurance - FIFO taxation (basis comes out first)
    if (withdrawalAmount <= adjustedCostBasis) {
      // Withdrawal is entirely from basis (premiums paid)
      taxableAmount = 0;
      taxFreeAmount = withdrawalAmount;
      withdrawalType = 'basis-only';
      notes = 'Withdrawal from basis - tax-free return of premiums';
    } else {
      // Withdrawal exceeds basis - some from basis, some from gains
      taxableAmount = withdrawalAmount - adjustedCostBasis;
      taxFreeAmount = adjustedCostBasis;
      withdrawalType = 'mixed';
      notes = 'Withdrawal exceeds basis - gains portion taxed as ordinary income';
    }
  }

  return {
    taxableAmount,
    taxFreeAmount,
    withdrawalType,
    notes,
    adjustedCostBasis,
    totalGains,
    isMEC
  };
}

/**
 * Calculate taxation for life insurance policy loans
 * @param {Object} policyDetails - Life insurance policy details
 * @param {number} loanAmount - Amount of policy loan
 * @param {boolean} policyLapsed - Whether the policy has lapsed
 * @returns {Object} Taxation details
 */
export function calculateLifeInsuranceLoanTaxation(policyDetails, loanAmount, policyLapsed = false) {
  const {
    totalPremiumsPaid = 0,
    currentCashValue = 0,
    isMEC = false,
    existingLoans = 0
  } = policyDetails;

  const adjustedCostBasis = totalPremiumsPaid;
  const totalLoanAmount = existingLoans + loanAmount;

  if (!policyLapsed) {
    // Policy is still in force - loans are generally not taxable
    return {
      taxableAmount: 0,
      taxFreeAmount: loanAmount,
      loanType: 'active-policy',
      notes: 'Policy loan while policy is in force - generally not taxable',
      totalOutstandingLoans: totalLoanAmount
    };
  } else {
    // Policy has lapsed - loan forgiveness may be taxable
    const taxableAmount = Math.max(0, totalLoanAmount - adjustedCostBasis);
    const taxFreeAmount = Math.min(totalLoanAmount, adjustedCostBasis);

    return {
      taxableAmount,
      taxFreeAmount,
      loanType: 'lapsed-policy',
      notes: 'Policy lapsed with outstanding loans - loan forgiveness may be taxable income',
      totalOutstandingLoans: totalLoanAmount
    };
  }
}

/**
 * Calculate life insurance death benefit taxation
 * @param {Object} policyDetails - Life insurance policy details
 * @param {number} deathBenefit - Death benefit amount
 * @param {string} paymentMethod - 'lump-sum' or 'installments'
 * @returns {Object} Taxation details
 */
export function calculateLifeInsuranceDeathBenefitTaxation(policyDetails, deathBenefit, paymentMethod = 'lump-sum') {
  if (paymentMethod === 'lump-sum') {
    // Lump sum death benefits are generally tax-free
    return {
      taxableAmount: 0,
      taxFreeAmount: deathBenefit,
      benefitType: 'lump-sum',
      notes: 'Death benefit paid as lump sum - generally tax-free to beneficiary'
    };
  } else {
    // Installment payments - interest portion may be taxable
    return {
      taxableAmount: 0, // Would need to calculate interest portion
      taxFreeAmount: deathBenefit,
      benefitType: 'installments',
      notes: 'Death benefit paid in installments - principal tax-free, interest may be taxable'
    };
  }
}

/**
 * Determine if a policy qualifies as a Modified Endowment Contract (MEC)
 * @param {Object} policyDetails - Life insurance policy details
 * @returns {Object} MEC status and details
 */
export function determineMECStatus(policyDetails) {
  const {
    totalPremiumsPaid = 0,
    policyFaceAmount = 0,
    yearsInForce = 0,
    premiumPayments = [] // Array of {year, amount} objects
  } = policyDetails;

  // Simplified 7-pay test calculation
  // In reality, this would require complex actuarial calculations
  const sevenPayLimit = policyFaceAmount * 0.1; // Simplified approximation
  
  // Check if cumulative premiums in first 7 years exceed the limit
  let cumulativePremiums = 0;
  let failedSevenPayTest = false;
  
  for (let i = 0; i < Math.min(7, premiumPayments.length); i++) {
    cumulativePremiums += premiumPayments[i]?.amount || 0;
    if (cumulativePremiums > sevenPayLimit) {
      failedSevenPayTest = true;
      break;
    }
  }

  return {
    isMEC: failedSevenPayTest,
    sevenPayLimit,
    cumulativePremiums,
    notes: failedSevenPayTest 
      ? 'Policy failed 7-pay test and is classified as MEC'
      : 'Policy passes 7-pay test and maintains life insurance tax benefits'
  };
}

/**
 * Calculate life insurance as an income stream (for cash value access strategies)
 * @param {Object} policyDetails - Life insurance policy details
 * @param {string} accessMethod - 'withdrawal', 'loan', 'combination'
 * @param {number} annualAmount - Annual amount needed
 * @param {number} ownerAge - Age of policy owner
 * @returns {Object} Income stream taxation details
 */
export function calculateLifeInsuranceIncomeStream(policyDetails, accessMethod, annualAmount, ownerAge) {
  const {
    currentCashValue = 0,
    totalPremiumsPaid = 0,
    isMEC = false,
    projectedGrowthRate = 0.04
  } = policyDetails;

  let taxableAmount = 0;
  let taxFreeAmount = 0;
  let strategy = '';
  let notes = '';

  switch (accessMethod) {
    case 'withdrawal':
      const withdrawalTax = calculateLifeInsuranceWithdrawalTaxation(policyDetails, annualAmount);
      taxableAmount = withdrawalTax.taxableAmount;
      taxFreeAmount = withdrawalTax.taxFreeAmount;
      strategy = 'Direct withdrawal from cash value';
      notes = withdrawalTax.notes;
      break;

    case 'loan':
      const loanTax = calculateLifeInsuranceLoanTaxation(policyDetails, annualAmount);
      taxableAmount = loanTax.taxableAmount;
      taxFreeAmount = loanTax.taxFreeAmount;
      strategy = 'Policy loan against cash value';
      notes = loanTax.notes;
      break;

    case 'combination':
      // Use loans up to basis, then withdrawals
      const basisRemaining = Math.max(0, totalPremiumsPaid - (policyDetails.existingLoans || 0));
      const loanPortion = Math.min(annualAmount, basisRemaining);
      const withdrawalPortion = annualAmount - loanPortion;

      if (withdrawalPortion > 0) {
        const withdrawalTax = calculateLifeInsuranceWithdrawalTaxation(policyDetails, withdrawalPortion);
        taxableAmount = withdrawalTax.taxableAmount;
      }
      
      taxFreeAmount = loanPortion + (annualAmount - taxableAmount);
      strategy = 'Combination of loans and withdrawals';
      notes = 'Optimized to minimize taxable income';
      break;

    default:
      strategy = 'Unknown access method';
      notes = 'Please specify withdrawal, loan, or combination';
  }

  return {
    taxableAmount,
    taxFreeAmount,
    strategy,
    notes,
    accessMethod,
    effectiveTaxRate: taxableAmount > 0 ? (taxableAmount / annualAmount) : 0
  };
}

/**
 * Get life insurance tax strategies and recommendations
 * @param {Object} policyDetails - Life insurance policy details
 * @param {number} ownerAge - Age of policy owner
 * @param {number} marginalTaxRate - Current marginal tax rate
 * @returns {Array} Array of strategy recommendations
 */
export function getLifeInsuranceTaxStrategies(policyDetails, ownerAge, marginalTaxRate) {
  const strategies = [];
  const {
    currentCashValue = 0,
    totalPremiumsPaid = 0,
    isMEC = false,
    policyType = 'whole-life'
  } = policyDetails;

  const totalGains = Math.max(0, currentCashValue - totalPremiumsPaid);

  // Strategy 1: Tax-free access to basis
  if (totalPremiumsPaid > 0 && !isMEC) {
    strategies.push({
      strategy: 'Access Basis First',
      description: `Withdraw up to $${totalPremiumsPaid.toLocaleString()} tax-free (return of premiums)`,
      taxImplication: 'Tax-free',
      priority: 'High'
    });
  }

  // Strategy 2: Policy loans for tax-free access
  if (currentCashValue > 0 && !isMEC) {
    strategies.push({
      strategy: 'Policy Loans',
      description: 'Use policy loans for tax-free access to cash value',
      taxImplication: 'Tax-free (as long as policy remains in force)',
      priority: 'High'
    });
  }

  // Strategy 3: MEC considerations
  if (isMEC) {
    strategies.push({
      strategy: 'MEC Management',
      description: 'Consider timing of withdrawals due to LIFO taxation',
      taxImplication: 'Gains taxed first as ordinary income',
      priority: 'Medium'
    });
  }

  // Strategy 4: Death benefit optimization
  strategies.push({
    strategy: 'Death Benefit Planning',
    description: 'Maintain policy for tax-free death benefit to beneficiaries',
    taxImplication: 'Tax-free to beneficiaries',
    priority: 'High'
  });

  // Strategy 5: 1035 Exchange
  if (totalGains > 0) {
    strategies.push({
      strategy: '1035 Exchange',
      description: 'Consider tax-free exchange to another life insurance or annuity product',
      taxImplication: 'Tax-deferred exchange',
      priority: 'Medium'
    });
  }

  return strategies;
}

/**
 * Classify life insurance policy type for tax purposes
 * @param {string} policyType - Type of life insurance policy
 * @param {Object} policyDetails - Additional policy details
 * @returns {Object} Classification details
 */
export function classifyLifeInsurancePolicy(policyType, policyDetails = {}) {
  const classifications = {
    'term': {
      taxCharacteristics: 'No cash value, premiums not deductible, death benefit tax-free',
      cashValueTreatment: 'N/A - No cash value',
      commonUses: 'Pure insurance protection'
    },
    'whole-life': {
      taxCharacteristics: 'Tax-deferred cash value growth, tax-free loans and basis withdrawals',
      cashValueTreatment: 'FIFO taxation (basis first, then gains)',
      commonUses: 'Permanent protection with cash accumulation'
    },
    'universal-life': {
      taxCharacteristics: 'Tax-deferred cash value growth, flexible premiums and death benefit',
      cashValueTreatment: 'FIFO taxation (basis first, then gains)',
      commonUses: 'Flexible permanent protection with investment component'
    },
    'variable-life': {
      taxCharacteristics: 'Tax-deferred investment growth, investment risk on policyholder',
      cashValueTreatment: 'FIFO taxation (basis first, then gains)',
      commonUses: 'Investment-oriented permanent protection'
    }
  };

  const classification = classifications[policyType] || classifications['whole-life'];
  
  return {
    policyType,
    ...classification,
    isMEC: policyDetails.isMEC || false,
    mecImpact: policyDetails.isMEC ? 'LIFO taxation applies (gains first)' : 'Standard FIFO taxation'
  };
}

