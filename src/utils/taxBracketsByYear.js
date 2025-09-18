// Tax brackets and thresholds by year
export const TAX_BRACKETS_BY_YEAR = {
  2024: {
    federal: {
      single: [
        { min: 0, max: 11000, rate: 0.10 },
        { min: 11000, max: 44725, rate: 0.12 },
        { min: 44725, max: 95375, rate: 0.22 },
        { min: 95375, max: 182050, rate: 0.24 },
        { min: 182050, max: 231250, rate: 0.32 },
        { min: 231250, max: 578125, rate: 0.35 },
        { min: 578125, max: Infinity, rate: 0.37 }
      ],
      marriedFilingJointly: [
        { min: 0, max: 22000, rate: 0.10 },
        { min: 22000, max: 89450, rate: 0.12 },
        { min: 89450, max: 190750, rate: 0.22 },
        { min: 190750, max: 364200, rate: 0.24 },
        { min: 364200, max: 462500, rate: 0.32 },
        { min: 462500, max: 693750, rate: 0.35 },
        { min: 693750, max: Infinity, rate: 0.37 }
      ],
      headOfHousehold: [
        { min: 0, max: 15700, rate: 0.10 },
        { min: 15700, max: 59850, rate: 0.12 },
        { min: 59850, max: 95350, rate: 0.22 },
        { min: 95350, max: 182050, rate: 0.24 },
        { min: 182050, max: 231250, rate: 0.32 },
        { min: 231250, max: 578100, rate: 0.35 },
        { min: 578100, max: Infinity, rate: 0.37 }
      ]
    },
    standardDeductions: {
      single: 14600,
      marriedFilingJointly: 29200,
      headOfHousehold: 21900
    }
  },
  2025: {
    federal: {
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
    },
    standardDeductions: {
      single: 15000,
      marriedFilingJointly: 30000,
      headOfHousehold: 22500
    }
  },
  2026: {
    // TCJA expires - revert to pre-TCJA brackets (adjusted for inflation)
    federal: {
      single: [
        { min: 0, max: 12000, rate: 0.10 },
        { min: 12000, max: 48000, rate: 0.15 },
        { min: 48000, max: 116000, rate: 0.25 },
        { min: 116000, max: 200000, rate: 0.28 },
        { min: 200000, max: 250000, rate: 0.33 },
        { min: 250000, max: 500000, rate: 0.35 },
        { min: 500000, max: Infinity, rate: 0.396 }
      ],
      marriedFilingJointly: [
        { min: 0, max: 24000, rate: 0.10 },
        { min: 24000, max: 96000, rate: 0.15 },
        { min: 96000, max: 195000, rate: 0.25 },
        { min: 195000, max: 250000, rate: 0.28 },
        { min: 250000, max: 300000, rate: 0.33 },
        { min: 300000, max: 500000, rate: 0.35 },
        { min: 500000, max: Infinity, rate: 0.396 }
      ],
      headOfHousehold: [
        { min: 0, max: 17000, rate: 0.10 },
        { min: 17000, max: 65000, rate: 0.15 },
        { min: 65000, max: 116000, rate: 0.25 },
        { min: 116000, max: 200000, rate: 0.28 },
        { min: 200000, max: 250000, rate: 0.33 },
        { min: 250000, max: 500000, rate: 0.35 },
        { min: 500000, max: Infinity, rate: 0.396 }
      ]
    },
    standardDeductions: {
      single: 8000,
      marriedFilingJointly: 16000,
      headOfHousehold: 12000
    }
  }
};

// Function to get tax brackets based on year and TCJA setting
export function getTaxBrackets(filingStatus, taxYear = 2025, tcjaSunsetting = true) {
  if (taxYear >= 2026 && tcjaSunsetting) {
    return TAX_BRACKETS_BY_YEAR[2026].federal[filingStatus];
  }
  
  const yearData = TAX_BRACKETS_BY_YEAR[taxYear];
  if (!yearData) {
    // Default to 2025 if year not found
    return TAX_BRACKETS_BY_YEAR[2025].federal[filingStatus];
  }
  
  return yearData.federal[filingStatus];
}

// Function to get standard deduction based on year and TCJA setting
export function getStandardDeduction(filingStatus, taxYear = 2025, tcjaSunsetting = true) {
  if (taxYear >= 2026 && tcjaSunsetting) {
    return TAX_BRACKETS_BY_YEAR[2026].standardDeductions[filingStatus];
  }
  
  const yearData = TAX_BRACKETS_BY_YEAR[taxYear];
  if (!yearData) {
    // Default to 2025 if year not found
    return TAX_BRACKETS_BY_YEAR[2025].standardDeductions[filingStatus];
  }
  
  return yearData.standardDeductions[filingStatus];
}

