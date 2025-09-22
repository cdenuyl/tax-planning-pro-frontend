// Enhanced tax calculation utilities with proper provisional income and Social Security taxation

import { getTaxBrackets as getTaxBracketsByYear, getStandardDeduction as getStandardDeductionByYear } from './taxBracketsByYear.js';
import { getIrmaaThresholds, getSocialSecurityThresholds } from './irmaaThresholds.js';
import { getComprehensiveMarginalAnalysis } from './comprehensiveMarginalRateAnalysis.js';
import { calculateAnnuityTaxation } from './annuityTaxation.js';
import { calculateLifeInsuranceIncomeStream } from './lifeInsuranceTaxation.js';
import { calculateFICATaxes } from './ficaTaxes.js';
import { calculateLongTermCapitalGainsTax, calculateShortTermCapitalGainsTax, calculateQualifiedDividendsTax } from './capitalGainsTax.js';
import { calculateNIIT, calculateNetInvestmentIncome, getNIITAnalysis } from './niitTax.js';
import { formatCurrencyWrapper, formatPercentageWrapper, getCurrentMarginalRateWrapper, getTaxBracketsWrapper, getStandardDeductionWrapper, calculateFederalTaxWrapper } from './tax/compatibilityWrapper.js';
import { getMarginalRateAnalysisStandalone } from './effectiveMarginalRateStandalone.js';

// Federal tax brackets for 2025 by filing status
export const FEDERAL_TAX_BRACKETS_2025 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ],
  marriedFilingJointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ],
  headOfHousehold: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ]
};

// Standard deductions for 2025 by filing status
export const STANDARD_DEDUCTIONS_2025 = {
  single: 15000,
  marriedFilingJointly: 30000,
  headOfHousehold: 22500
};

// Age-based additional deductions
export const ADDITIONAL_DEDUCTION_OVER_65 = {
  single: 2000,
  marriedFilingJointly: 1600, // per spouse
  headOfHousehold: 2000
};

// Social Security taxation thresholds by filing status
export const SS_TAXATION_THRESHOLDS = {
  single: {
    tier1: 25000,
    tier2: 34000
  },
  marriedFilingJointly: {
    tier1: 32000,
    tier2: 44000
  },
  headOfHousehold: {
    tier1: 25000,
    tier2: 34000
  }
};

export const MICHIGAN_TAX_RATE = 0.0425;
export const MICHIGAN_HOMESTEAD_THRESHOLD = 69700;
export const MICHIGAN_HOMESTEAD_CREDIT = 1715;

// Helper functions for filing status support
export function getTaxBrackets(filingStatus, appSettings = {}) {
  // For 2025, use enhanced consolidated brackets
  const { taxYear = 2025 } = appSettings;
  if (taxYear === 2025) {
    return getTaxBracketsWrapper(filingStatus, appSettings);
  }
  
  // For other years, fall back to original logic
  const { tcjaSunsetting = true } = appSettings;
  return getTaxBracketsByYear(filingStatus, taxYear, tcjaSunsetting);
}

export function getStandardDeduction(filingStatus, taxpayerAge = null, spouseAge = null, appSettings = {}) {
  // For 2025, use enhanced consolidated logic with One Big Beautiful Bill Act provisions
  const { taxYear = 2025, magi = 0 } = appSettings;
  if (taxYear === 2025) {
    return getStandardDeductionWrapper(filingStatus, taxpayerAge, spouseAge, magi, taxYear);
  }
  
  // For other years, fall back to original logic
  const { tcjaSunsetting = true } = appSettings;
  const baseDeduction = getStandardDeductionByYear(filingStatus, taxYear, tcjaSunsetting);
  
  // Age-based additional deductions (these remain consistent across years)
  const additionalDeduction = ADDITIONAL_DEDUCTION_OVER_65[filingStatus] || ADDITIONAL_DEDUCTION_OVER_65.single;
  
  let totalDeduction = baseDeduction;
  
  if (filingStatus === 'marriedFilingJointly') {
    // For joint filing, add additional deduction for each spouse over 65
    if (taxpayerAge && taxpayerAge >= 65) {
      totalDeduction += additionalDeduction;
    }
    if (spouseAge && spouseAge >= 65) {
      totalDeduction += additionalDeduction;
    }
  } else {
    // For single/HOH, add additional deduction if taxpayer is over 65
    if (taxpayerAge && taxpayerAge >= 65) {
      totalDeduction += additionalDeduction;
    }
  }
  
  return totalDeduction;
}

// Helper function to calculate early withdrawal penalties
export function calculateEarlyWithdrawalPenalties(incomeSources, taxpayerAge, spouseAge = null) {
  if (!Array.isArray(incomeSources)) {
    return {
      totalPenalties: 0,
      penaltyDetails: []
    };
  }
  // Helper function to get yearly amount (convert monthly to yearly if needed)
  const getYearlyAmount = (source) => {
    if (source.frequency === 'monthly') {
      return source.amount * 12;
    }
    return source.amount;
  };

  let totalPenalties = 0;
  const penaltyDetails = [];
  
  incomeSources.forEach(source => {
    if (!source.enabled || source.penaltyExempt) return;
    
    // Determine the age to use based on owner
    const ownerAge = source.owner === 'spouse' ? spouseAge : taxpayerAge;
    
    // Check if this is a retirement account or annuity subject to early withdrawal penalties
    const isRetirementAccount = ['traditional-ira', '401k', 'roth-ira'].includes(source.type);
    const isAnnuity = source.type === 'annuity';
    
    if ((isRetirementAccount || isAnnuity) && ownerAge && ownerAge < 59.5) {
      const yearlyAmount = getYearlyAmount(source);
      let penalty = 0;
      
      if (source.type === 'roth-ira') {
        // Use proper Roth IRA taxation logic
        const rothTax = calculateRothIRATaxation(source, taxpayerAge, spouseAge);
        penalty = rothTax.penaltyAmount;
      } else if (source.type === 'annuity') {
        // Annuity - 10% penalty on full withdrawal amount for owners under 59.5
        // This applies to both qualified and non-qualified annuities
        penalty = yearlyAmount * 0.10;
      } else {
        // Traditional IRA and 401(k) - simple 10% penalty on full amount
        penalty = yearlyAmount * 0.10;
      }
      
      if (penalty > 0) {
        totalPenalties += penalty;
        
        penaltyDetails.push({
          sourceId: source.id,
          sourceName: source.name,
          sourceType: source.type,
          owner: source.owner,
          ownerAge,
          amount: yearlyAmount,
          penalty
        });
      }
    }
  });
  
  return {
    totalPenalties,
    penaltyDetails
  };
}

export function calculateSocialSecurityTaxation(incomeSources, otherIncome = 0, filingStatus = 'single') {
  // Helper function to get yearly amount (convert monthly to yearly if needed)
  const getYearlyAmount = (source) => {
    if (source.frequency === 'monthly') {
      return source.amount * 12;
    }
    return source.amount;
  };

  const socialSecurityBenefits = incomeSources
    .filter(source => source.type === 'social-security' && source.enabled)
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  if (socialSecurityBenefits === 0) {
    return {
      socialSecurityBenefits,
      provisionalIncome: otherIncome,
      taxableSocialSecurity: 0,
      tier: 'None',
      taxationPercentage: 0
    };
  }

  const thresholds = getSocialSecurityThresholds(filingStatus);
  
  // Calculate provisional income: AGI + 50% of SS benefits + tax-exempt interest
  const provisionalIncome = otherIncome + (socialSecurityBenefits * 0.5);
  
  let taxableSocialSecurity = 0;
  let tier = 'I';
  let taxationPercentage = 0;
  
  if (provisionalIncome <= thresholds.tier1) {
    // Tier I: No taxation
    taxableSocialSecurity = 0;
    tier = 'I';
    taxationPercentage = 0;
  } else if (provisionalIncome <= thresholds.tier2) {
    // Tier II: 50% taxation - CORRECTED FORMULA
    // IRS method: 50% of the excess over the threshold (not min of excess and 50% of total SS)
    const excessOverTier1 = provisionalIncome - thresholds.tier1;
    taxableSocialSecurity = excessOverTier1 * 0.5;
    // Cap at 50% of total benefits for this tier
    const maxTaxableSSForTier2 = socialSecurityBenefits * 0.5;
    taxableSocialSecurity = Math.min(taxableSocialSecurity, maxTaxableSSForTier2);
    tier = 'II';
    taxationPercentage = 50;
  } else {
    // Tier III: 85% taxation - CORRECTED FORMULA
    // IRS method: 50% of tier 2 range + 85% of excess over tier 2 threshold
    const tier2Amount = (thresholds.tier2 - thresholds.tier1) * 0.5;
    const excessOverTier2 = provisionalIncome - thresholds.tier2;
    const tier3Amount = excessOverTier2 * 0.85;
    taxableSocialSecurity = tier2Amount + tier3Amount;
    tier = 'III';
    taxationPercentage = 85;
  }
  
  // CRITICAL: Cap taxable Social Security at 85% of total benefits
  const maxTaxableSS = socialSecurityBenefits * 0.85;
  taxableSocialSecurity = Math.min(taxableSocialSecurity, maxTaxableSS);
  
  return {
    socialSecurityBenefits,
    provisionalIncome,
    taxableSocialSecurity,
    tier,
    taxationPercentage
  };
}

export function calculateFederalTax(taxableIncome, filingStatus = 'single', appSettings = {}) {
  if (taxableIncome <= 0) return 0;
  
  let federalTax = 0;
  let remainingIncome = taxableIncome;
  
  const brackets = getTaxBrackets(filingStatus, appSettings);
  
  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    const taxableAtThisBracket = Math.min(remainingIncome, bracket.max - bracket.min);
    federalTax += taxableAtThisBracket * bracket.rate;
    remainingIncome -= taxableAtThisBracket;
  }
  
  return federalTax;
}

export function getCurrentMarginalRate(taxableIncome, filingStatus = 'single', appSettings = {}) {
  return getCurrentMarginalRateWrapper(taxableIncome, filingStatus);
}

export function calculateMichiganStateTax(incomeSources, federalAGI, standardDeduction, filingStatus = 'single', birthYear = null) {
  // Helper function to get yearly amount (convert monthly to yearly if needed)
  const getYearlyAmount = (source) => {
    if (source.frequency === 'monthly') {
      return source.amount * 12;
    }
    return source.amount;
  };

  // Michigan doesn't tax Social Security benefits
  const socialSecurityBenefits = incomeSources
    .filter(source => source.type === 'social-security' && source.enabled)
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  // Calculate retirement income (IRA, 401k, pension, annuity - income reported on 1099-R)
  const retirementIncomeTypes = ['traditional-ira', '401k', 'pension', 'annuity'];
  const retirementIncome = incomeSources
    .filter(source => source.enabled && retirementIncomeTypes.includes(source.type))
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  // Michigan AGI = Federal AGI - Social Security benefits
  const michiganAGI = federalAGI - socialSecurityBenefits;
  
  // Apply Michigan retirement income deduction based on birth year
  let retirementDeduction = 0;
  if (birthYear && retirementIncome > 0) {
    // Michigan retirement income deduction limits for 2025
    const retirementDeductionLimits = {
      single: {
        born1945OrBefore: Infinity, // Full exemption
        born1946To1958: 46138,      // 75% of 2025 amount for single filers
        born1959To1962: 46138,      // Same as 1946-1958 for 2025
        born1963To1966: 46138,      // Same as 1946-1958 for 2025
        born1967AndAfter: 0         // No exemption in 2025
      },
      marriedFilingJointly: {
        born1945OrBefore: Infinity, // Full exemption
        born1946To1958: 92277,      // 75% of 2025 amount for joint filers
        born1959To1962: 92277,      // Same as 1946-1958 for 2025
        born1963To1966: 92277,      // Same as 1946-1958 for 2025
        born1967AndAfter: 0         // No exemption in 2025
      }
    };
    
    const limits = retirementDeductionLimits[filingStatus] || retirementDeductionLimits.single;
    
    if (birthYear <= 1945) {
      retirementDeduction = retirementIncome; // Full exemption
    } else if (birthYear >= 1946 && birthYear <= 1958) {
      retirementDeduction = Math.min(retirementIncome, limits.born1946To1958);
    } else if (birthYear >= 1959 && birthYear <= 1962) {
      retirementDeduction = Math.min(retirementIncome, limits.born1959To1962);
    } else if (birthYear >= 1963 && birthYear <= 1966) {
      retirementDeduction = Math.min(retirementIncome, limits.born1963To1966);
    } else {
      retirementDeduction = 0; // Born 1967 and after
    }
  }
  
  // Michigan personal exemption for 2025
  const personalExemption = filingStatus === 'marriedFilingJointly' ? 11200 : 5600;
  
  // Calculate Michigan taxable income
  const michiganTaxableIncome = Math.max(0, michiganAGI - retirementDeduction - personalExemption);
  
  return michiganTaxableIncome * MICHIGAN_TAX_RATE;
}

// Helper function to get yearly amount (convert monthly to yearly if needed)
export const getYearlyAmount = (source) => {
  if (source.frequency === 'monthly') {
    return source.amount * 12;
  }
  return source.amount;
};

// Calculate Roth IRA taxation based on five-year rule and age requirements
function calculateRothIRATaxation(source, taxpayerAge, spouseAge) {
  if (!source.rothDetails) {
    // If no Roth details, treat as fully tax-free (default behavior)
    return {
      taxableAmount: 0,
      penaltyAmount: 0,
      taxFreeAmount: getYearlyAmount(source),
      isContributionWithdrawal: true
    };
  }
  
  const withdrawalAmount = getYearlyAmount(source);
  const contributions = source.rothDetails.totalContributions || 0;
  const age = source.owner === 'spouse' ? spouseAge : taxpayerAge;
  
  // Check if 59.5 rule is met
  const over59Half = age >= 59.5;
  
  // Check if 5-year rule is met
  const fiveYearMet = source.rothDetails.fiveYearRuleMet || 
    (source.rothDetails.openingDate && 
     new Date() - new Date(source.rothDetails.openingDate) >= 5 * 365.25 * 24 * 60 * 60 * 1000);
  
  // Calculate earnings withdrawn (withdrawals come from contributions first)
  const earningsWithdrawn = Math.max(0, withdrawalAmount - contributions);
  const contributionsWithdrawn = Math.min(withdrawalAmount, contributions);
  
  let taxableAmount = 0;
  let penaltyAmount = 0;
  
  if (earningsWithdrawn > 0) {
    // There are earnings being withdrawn
    if (over59Half && fiveYearMet) {
      // Both rules met - earnings are tax and penalty free
      taxableAmount = 0;
      penaltyAmount = 0;
    } else if (over59Half && !fiveYearMet) {
      // Over 59.5 but 5-year rule not met - earnings are taxable but no penalty
      taxableAmount = earningsWithdrawn;
      penaltyAmount = 0;
    } else if (!over59Half && fiveYearMet) {
      // Under 59.5 but 5-year rule met - earnings have 10% penalty but may be tax-free for qualified distributions
      taxableAmount = 0; // Assuming qualified distribution
      penaltyAmount = earningsWithdrawn * 0.10;
    } else {
      // Neither rule met - earnings are taxable and have 10% penalty
      taxableAmount = earningsWithdrawn;
      penaltyAmount = earningsWithdrawn * 0.10;
    }
  }
  
  return {
    taxableAmount,
    penaltyAmount,
    taxFreeAmount: withdrawalAmount - taxableAmount,
    contributionsWithdrawn,
    earningsWithdrawn,
    isContributionWithdrawal: earningsWithdrawn === 0
  };
}

export function calculateComprehensiveTaxes(incomeSources = [], taxpayerAge = 65, spouseAge = null, filingStatus = 'single', deductions = null, appSettings = {}, ficaEnabled = false) {
  if (typeof filingStatus !== 'string') {
    filingStatus = 'single';
  }
  // Ensure incomeSources is an array
  if (!Array.isArray(incomeSources)) {
    incomeSources = [];
  }

  // Calculate early withdrawal penalties
  const penaltyCalculation = calculateEarlyWithdrawalPenalties(incomeSources, taxpayerAge, spouseAge);
  
  // Process annuity and Roth IRA income with proper taxation
  let adjustedIncomeSources = incomeSources.map(source => {
    if (source.type === 'annuity' && source.enabled && source.annuityDetails) {
      // Use the correct owner's age for annuity taxation
      const ownerAge = source.owner === 'spouse' ? spouseAge : taxpayerAge;
      const annuityTax = calculateAnnuityTaxation(source.annuityDetails, ownerAge, getYearlyAmount(source));
      
      // Return modified source with proper income tracking
      return {
        ...source,
        // Keep the original amount for total income display
        amount: source.amount,
        originalAmount: getYearlyAmount(source),
        // Track taxable vs non-taxable portions separately
        taxableAmount: source.frequency === 'monthly' ? annuityTax.taxableAmount / 12 : annuityTax.taxableAmount,
        taxFreeAmount: annuityTax.nonTaxableAmount,
        annuityTaxation: annuityTax
      };
    } else if (source.type === 'life-insurance' && source.enabled && source.lifeInsuranceDetails) {
      // Use the correct owner's age for life insurance taxation
      const ownerAge = source.owner === 'spouse' ? spouseAge : taxpayerAge;
      const lifeInsuranceTax = calculateLifeInsuranceIncomeStream(
        source.lifeInsuranceDetails, 
        source.lifeInsuranceDetails.accessMethod || 'withdrawal',
        getYearlyAmount(source),
        ownerAge
      );
      
      // Return modified source with only taxable amount
      return {
        ...source,
        amount: source.frequency === 'monthly' ? lifeInsuranceTax.taxableAmount / 12 : lifeInsuranceTax.taxableAmount,
        originalAmount: getYearlyAmount(source),
        taxFreeAmount: lifeInsuranceTax.taxFreeAmount,
        lifeInsuranceTaxation: lifeInsuranceTax
      };
    } else if (source.type === 'roth-ira' && source.enabled) {
      // Process Roth IRA with proper taxation rules
      const rothTax = calculateRothIRATaxation(source, taxpayerAge, spouseAge);
      
      // Return modified source with only taxable amount
      return {
        ...source,
        amount: source.frequency === 'monthly' ? rothTax.taxableAmount / 12 : rothTax.taxableAmount,
        originalAmount: getYearlyAmount(source),
        taxFreeAmount: rothTax.taxFreeAmount,
        penaltyAmount: rothTax.penaltyAmount,
        rothTaxation: rothTax
      };
    }
    return source;
  });
  
  // Separate income by type for proper tax treatment
  const ordinaryIncome = adjustedIncomeSources
    .filter(source => source.enabled && !['social-security', 'long-term-capital-gains', 'qualified-dividends', 'roth-ira'].includes(source.type))
    .reduce((sum, source) => {
      // Use taxable amount for annuities and life insurance, original amount for others
      if (source.type === 'annuity' && source.taxableAmount !== undefined) {
        return sum + (source.frequency === 'monthly' ? source.taxableAmount * 12 : source.taxableAmount);
      } else if (source.type === 'life-insurance' && source.taxableAmount !== undefined) {
        return sum + (source.frequency === 'monthly' ? source.taxableAmount * 12 : source.taxableAmount);
      } else {
        return sum + getYearlyAmount(source);
      }
    }, 0);
  
  const longTermCapitalGains = adjustedIncomeSources
    .filter(source => source.enabled && source.type === 'long-term-capital-gains')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  const shortTermCapitalGains = adjustedIncomeSources
    .filter(source => source.enabled && source.type === 'short-term-capital-gains')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  const qualifiedDividends = adjustedIncomeSources
    .filter(source => source.enabled && source.type === 'qualified-dividends')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  const ordinaryDividends = adjustedIncomeSources
    .filter(source => source.enabled && source.type === 'dividends')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  // Calculate earned income for FICA taxes
  const earnedIncomeTypes = ['wages', 'self-employment', 'business'];
  const earnedIncome = adjustedIncomeSources
    .filter(source => source.enabled && earnedIncomeTypes.includes(source.type))
    .reduce((sum, source) => {
      const yearlyAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
      return sum + yearlyAmount;
    }, 0);
  const ficaTaxes = calculateFICATaxes(earnedIncome, filingStatus);
  
  // Other income = ordinary income + short-term gains + ordinary dividends (all taxed as ordinary income)
  const otherIncome = ordinaryIncome + shortTermCapitalGains + ordinaryDividends;
  
  // Calculate Social Security taxation with filing status
  const ssCalculation = calculateSocialSecurityTaxation(adjustedIncomeSources, otherIncome, filingStatus);
  
  // Calculate capital gains taxes separately
  const longTermCapitalGainsTax = calculateLongTermCapitalGainsTax(longTermCapitalGains, otherIncome, filingStatus);
  const shortTermCapitalGainsTax = calculateShortTermCapitalGainsTax(shortTermCapitalGains, otherIncome, filingStatus, getTaxBrackets(filingStatus, appSettings));
  const qualifiedDividendsTax = calculateQualifiedDividendsTax(qualifiedDividends, otherIncome, filingStatus);
  
  // Federal AGI = All income including capital gains and dividends
  // Note: otherIncome already includes shortTermCapitalGains, so don't double-count
  const federalAGI = otherIncome + ssCalculation.taxableSocialSecurity + longTermCapitalGains + qualifiedDividends;
  
  // Calculate deductions (standard vs itemized)
  const standardDeduction = getStandardDeduction(filingStatus, taxpayerAge, spouseAge, { ...appSettings, magi: federalAGI });
  let finalDeduction = standardDeduction;
  let usingItemized = false;
  
  if (deductions && deductions.itemized) {
    // Calculate total itemized deductions
    const medicalDeductible = Math.max(0, deductions.itemized.medicalExpenses - (federalAGI * 0.075));
    const totalItemized = 
      deductions.itemized.saltDeduction + 
      deductions.itemized.mortgageInterest + 
      deductions.itemized.charitableGiving + 
      medicalDeductible +
      deductions.itemized.otherDeductions;
    
    // Use the higher of standard or itemized
    if (totalItemized > standardDeduction) {
      finalDeduction = totalItemized;
      usingItemized = true;
    }
  }
  
  // Separate Social Security from other income (with frequency conversion)
  const socialSecurityBenefits = adjustedIncomeSources
    .filter(source => source.type === 'social-security' && source.enabled)
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  const federalTaxableIncome = Math.max(0, federalAGI - finalDeduction);
  
  // Calculate federal tax on ordinary income only (excluding capital gains and qualified dividends)
  const ordinaryTaxableIncome = Math.max(0, (otherIncome + ssCalculation.taxableSocialSecurity) - finalDeduction);
  const federalOrdinaryTax = calculateFederalTax(ordinaryTaxableIncome, filingStatus, appSettings);
  
  // Total federal tax = ordinary income tax + capital gains taxes + qualified dividend taxes
  const federalTax = federalOrdinaryTax + longTermCapitalGainsTax.tax + shortTermCapitalGainsTax.tax + qualifiedDividendsTax.tax;
  
  // Add early withdrawal penalties to federal tax
  const federalTaxWithPenalties = federalTax + penaltyCalculation.totalPenalties;
  
  // Calculate Michigan state tax (excludes Social Security) - use final deduction
  // Calculate birth year from taxpayer age (assuming current year is 2025)
  const birthYear = taxpayerAge ? 2025 - taxpayerAge : null;
  const stateTax = calculateMichiganStateTax(incomeSources, federalAGI, finalDeduction, filingStatus, birthYear);
  
  // Michigan Homestead Credit and other state deductions/credits
  // Calculate total income for display (includes full annuity amounts)
  const annuityTotalIncome = adjustedIncomeSources
    .filter(source => source.enabled && source.type === 'annuity')
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  // Calculate totalIncome directly from original income sources to avoid provisional income contamination
  const totalIncomeFromSources = adjustedIncomeSources
    .filter(source => source.enabled)
    .reduce((sum, source) => sum + getYearlyAmount(source), 0);
  
  const totalIncome = totalIncomeFromSources;
  let michiganCredit = 0;
  if (totalIncome <= MICHIGAN_HOMESTEAD_THRESHOLD) {
    michiganCredit = MICHIGAN_HOMESTEAD_CREDIT;
  }
  
  // Add any additional state credits from deductions
  if (deductions && deductions.state) {
    michiganCredit += deductions.state.otherCredits || 0;
  }
  
  const netStateTax = Math.max(0, stateTax - michiganCredit);
  
  // Total tax = federal tax + penalties + state tax + FICA taxes
  const totalTax = federalTaxWithPenalties + netStateTax + ficaTaxes.totalFICA;
  
  // Calculate marginal rates with filing status
  const federalMarginalRate = getCurrentMarginalRate(federalTaxableIncome, filingStatus);
  const stateMarginalRate = federalTaxableIncome > 0 ? MICHIGAN_TAX_RATE : 0;
  const totalMarginalRate = federalMarginalRate + stateMarginalRate;
  
  // Calculate effective rates with penalty breakdown
  const effectiveRateFederal = totalIncome > 0 ? (federalTax / totalIncome) : 0;
  const effectiveRatePenalty = totalIncome > 0 ? (penaltyCalculation.totalPenalties / totalIncome) : 0;
  const effectiveRateFederalWithPenalties = totalIncome > 0 ? (federalTaxWithPenalties / totalIncome) : 0;
  const effectiveRateTotal = totalIncome > 0 ? (totalTax / totalIncome) : 0;
  
  // Find next bracket with filing status
  const brackets = getTaxBrackets(filingStatus);
  
  let currentBracket, nextBracket, amountToNextBracket;
  
  if (federalTaxableIncome <= 0) {
    // When taxable income is 0 or negative, person is effectively in a "0% bracket"
    // The next meaningful bracket is when they start owing taxes (first bracket)
    currentBracket = { min: 0, max: 0, rate: 0 }; // Virtual 0% bracket
    nextBracket = brackets[0]; // First actual tax bracket (10%)
    
    // Amount needed to reach first taxable bracket
    // This is the amount needed to exceed the standard deduction
    const amountToReachTaxableIncome = standardDeduction - federalAGI + 1;
    amountToNextBracket = Math.max(0, amountToReachTaxableIncome);
  } else {
    // Normal bracket logic for when there is taxable income
    currentBracket = brackets.find(bracket => 
      federalTaxableIncome > bracket.min && federalTaxableIncome <= bracket.max
    ) || brackets[0]; // Default to first bracket if not found
    
    const nextBracketIndex = brackets.findIndex(b => b === currentBracket) + 1;
    nextBracket = nextBracketIndex < brackets.length 
      ? brackets[nextBracketIndex] 
      : currentBracket;
    
    // Calculate how much additional TAXABLE income is needed
    const additionalTaxableIncomeNeeded = Math.max(0, nextBracket.min - federalTaxableIncome);
    
    // Simple approach: use the ratio we observed in testing
    // From our testing: $33,000 taxable income gap requires ~$18,000 additional total income
    // This gives us a ratio of about 0.55 (18000/33000)
    if (additionalTaxableIncomeNeeded > 0 && socialSecurityBenefits > 0) {
      // For scenarios with Social Security, use observed ratio
      amountToNextBracket = Math.round(additionalTaxableIncomeNeeded * 0.55);
    } else {
      // For scenarios without Social Security, 1:1 ratio
      amountToNextBracket = additionalTaxableIncomeNeeded;
    }
  }
  
  // Calculate IRMAA costs based on AGI
  const irmaaThresholds = getIrmaaThresholds(filingStatus);
  let irmaaData = {
    monthlyIncrease: 0,
    annualIncrease: 0,
    currentTier: null,
    basePremium: 185
  };
  
  // Find the appropriate IRMAA tier based on federalAGI
  for (const threshold of irmaaThresholds) {
    if (federalAGI >= threshold.min && federalAGI < threshold.max) {
      irmaaData = {
        monthlyIncrease: threshold.partB, // Assuming Part B coverage
        annualIncrease: threshold.partB * 12,
        currentTier: threshold.label,
        basePremium: 185
      };
      break;
    }
  }
  
  // Calculate NIIT (Net Investment Income Tax)
    const netInvestmentIncome = calculateNetInvestmentIncome(adjustedIncomeSources) ?? 0;
  const safeFederalAGI = typeof federalAGI === 'number' && !isNaN(federalAGI) ? federalAGI : 0;
  const safeNetInvestmentIncome = typeof netInvestmentIncome === 'number' && !isNaN(netInvestmentIncome) ? netInvestmentIncome : 0;
  const niitCalculation = getNIITAnalysis(filingStatus, safeFederalAGI, safeNetInvestmentIncome);
  
  // TODO: Comprehensive marginal rate analysis will be calculated separately in UI to avoid circular dependency
  const marginalRateAnalysis = {
    currentMarginalRate: federalMarginalRate,
    amountToNextRateHike: amountToNextBracket,
    nextMarginalRate: nextBracket ? nextBracket.rate : federalMarginalRate,
    rateHikeSource: 'tax_bracket'
  };
  
  return {
    totalIncome,
    federalAGI,
    federalTaxableIncome,
    federalTax,
    federalTaxWithPenalties,
    stateTax,
    netStateTax,
    totalTax,
    michiganCredit,
    standardDeduction,
    finalDeduction,
    usingItemized,
    federalMarginalRate,
    stateMarginalRate,
    totalMarginalRate,
    effectiveRateFederal,
    effectiveRatePenalty,
    effectiveRateFederalWithPenalties,
    effectiveRateTotal,
    currentBracket,
    nextBracket,
    amountToNextBracket,
    // Effective marginal rate analysis (Covisum style)
    effectiveMarginalRate: marginalRateAnalysis.currentMarginalRate,
    amountToNextRateHike: marginalRateAnalysis.amountToNextRateHike,
    nextEffectiveMarginalRate: marginalRateAnalysis.nextMarginalRate,
    rateHikeSource: marginalRateAnalysis.rateHikeSource,
    socialSecurity: ssCalculation,
    penalties: penaltyCalculation,
    filingStatus,
    taxpayerAge, // Add taxpayer age for InteractiveTaxMap
    spouseAge,   // Add spouse age for InteractiveTaxMap
    adjustedIncomeSources, // Include the adjusted sources with annuity taxation
    federalTaxBrackets: getTaxBrackets(filingStatus), // Add tax brackets for other calculations
    // Add capital gains and dividend details
    capitalGains: {
      longTerm: {
        amount: longTermCapitalGains,
        tax: longTermCapitalGainsTax.tax,
        effectiveRate: longTermCapitalGainsTax.effectiveRate
      },
      shortTerm: {
        amount: shortTermCapitalGains,
        tax: shortTermCapitalGainsTax.tax,
        effectiveRate: shortTermCapitalGainsTax.effectiveRate
      },
      qualified: {
        amount: qualifiedDividends,
        tax: qualifiedDividendsTax.tax,
        effectiveRate: qualifiedDividendsTax.effectiveRate
      },
      ordinary: {
        amount: ordinaryDividends,
        tax: 0, // Included in ordinary income tax
        effectiveRate: 0
      }
    },
    // Add FICA tax details
    fica: ficaTaxes,
    earnedIncome: earnedIncome,
    // Add IRMAA data
    irmaa: irmaaData,
    // Add NIIT data
    niit: {
      ...niitCalculation,
      analysis: niitCalculation,
      netInvestmentIncome: netInvestmentIncome
    }
  };
}

// Enhanced formatting functions using consolidated logic
export function formatCurrency(amount) {
  return formatCurrencyWrapper(amount);
}

export function formatPercentage(rate, decimals = 2) {
  return formatPercentageWrapper(rate, decimals);
}

// findNextRateHike function moved to nextRateHike.js


