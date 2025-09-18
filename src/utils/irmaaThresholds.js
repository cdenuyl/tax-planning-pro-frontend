// IRMAA thresholds for 2025 by filing status
// Note: These are the official 2025 Medicare Part B and Part D IRMAA thresholds
export const IRMAA_THRESHOLDS_2025 = {
  single: [
    { min: 0, max: 106000, partB: 0, partD: 0, label: 'No IRMAA' },
    { min: 106000, max: 133000, partB: 74.00, partD: 13.70, label: 'Tier 1 (+$74.00 B, +$13.70 D)' },
    { min: 133000, max: 167000, partB: 185.00, partD: 35.40, label: 'Tier 2 (+$185.00 B, +$35.40 D)' },
    { min: 167000, max: 200000, partB: 296.00, partD: 57.20, label: 'Tier 3 (+$296.00 B, +$57.20 D)' },
    { min: 200000, max: 500000, partB: 407.00, partD: 78.90, label: 'Tier 4 (+$407.00 B, +$78.90 D)' },
    { min: 500000, max: Infinity, partB: 444.30, partD: 86.20, label: 'Tier 5 (+$444.30 B, +$86.20 D)' }
  ],
  marriedFilingJointly: [
    { min: 0, max: 212000, partB: 0, partD: 0, label: 'No IRMAA' },
    { min: 212000, max: 266000, partB: 74.00, partD: 13.70, label: 'Tier 1 (+$74.00 B, +$13.70 D)' },
    { min: 266000, max: 334000, partB: 185.00, partD: 35.40, label: 'Tier 2 (+$185.00 B, +$35.40 D)' },
    { min: 334000, max: 400000, partB: 296.00, partD: 57.20, label: 'Tier 3 (+$296.00 B, +$57.20 D)' },
    { min: 400000, max: 750000, partB: 407.00, partD: 78.90, label: 'Tier 4 (+$407.00 B, +$78.90 D)' },
    { min: 750000, max: Infinity, partB: 444.30, partD: 86.20, label: 'Tier 5 (+$444.30 B, +$86.20 D)' }
  ],
  headOfHousehold: [
    { min: 0, max: 106000, partB: 0, partD: 0, label: 'No IRMAA' },
    { min: 106000, max: 133000, partB: 74.00, partD: 13.70, label: 'Tier 1 (+$74.00 B, +$13.70 D)' },
    { min: 133000, max: 167000, partB: 185.00, partD: 35.40, label: 'Tier 2 (+$185.00 B, +$35.40 D)' },
    { min: 167000, max: 200000, partB: 296.00, partD: 57.20, label: 'Tier 3 (+$296.00 B, +$57.20 D)' },
    { min: 200000, max: 500000, partB: 407.00, partD: 78.90, label: 'Tier 4 (+$407.00 B, +$78.90 D)' },
    { min: 500000, max: Infinity, partB: 444.30, partD: 86.20, label: 'Tier 5 (+$444.30 B, +$86.20 D)' }
  ]
};

// 2025 Medicare base premiums
export const MEDICARE_BASE_PREMIUMS_2025 = {
  partB: 185.00,  // Standard Part B premium for 2025
  partD: 0        // Part D varies by plan, but we'll track IRMAA surcharges
};

// Social Security taxation thresholds by filing status
export const SS_TAXATION_THRESHOLDS = {
  single: {
    tier1: 25000,    // Up to $25,000: 0% taxable
    tier2: 34000     // $25,001-$34,000: 50% taxable, Over $34,000: 85% taxable
  },
  marriedFilingJointly: {
    tier1: 32000,    // Up to $32,000: 0% taxable
    tier2: 44000     // $32,001-$44,000: 50% taxable, Over $44,000: 85% taxable
  },
  headOfHousehold: {
    tier1: 25000,    // Up to $25,000: 0% taxable
    tier2: 34000     // $25,001-$34,000: 50% taxable, Over $34,000: 85% taxable
  }
};

// Function to get IRMAA thresholds based on filing status
export function getIrmaaThresholds(filingStatus = 'single') {
  return IRMAA_THRESHOLDS_2025[filingStatus] || IRMAA_THRESHOLDS_2025.single;
}

// Function to get Social Security taxation thresholds based on filing status
export function getSocialSecurityThresholds(filingStatus = 'single') {
  return SS_TAXATION_THRESHOLDS[filingStatus] || SS_TAXATION_THRESHOLDS.single;
}

// Function to calculate annual IRMAA cost based on income and filing status
export function calculateIrmaaCost(income, filingStatus = 'single') {
  const thresholds = getIrmaaThresholds(filingStatus);
  let premium = 0;
  
  for (const tier of thresholds) {
    if (income > tier.min) {
      premium = tier.premium;
    }
  }
  
  // Return monthly and annual costs
  return {
    monthlyPremium: premium,
    annualCost: premium * 12,
    tier: thresholds.findIndex(tier => income > tier.min && income <= tier.max)
  };
}

