// Michigan Homestead Property Tax Credit calculations
// Based on Michigan Department of Treasury guidelines

export function calculateMichiganHomesteadCredit(taxpayer, spouse, totalIncome, filingStatus) {
  // Check if eligible for Homestead Credit
  if (!taxpayer.housing || taxpayer.housing.ownership !== 'own') {
    return {
      eligible: false,
      credit: 0,
      reason: 'Must own primary residence'
    };
  }
  
  if (!taxpayer.housing.michiganResident6Months) {
    return {
      eligible: false,
      credit: 0,
      reason: 'Must be Michigan resident for 6+ months'
    };
  }
  
  const propertyTaxesPaid = taxpayer.housing.propertyTaxesPaid || 0;
  const propertyTaxValue = taxpayer.housing.propertyTaxValue || 0;
  
  if (propertyTaxesPaid === 0 || propertyTaxValue === 0) {
    return {
      eligible: false,
      credit: 0,
      reason: 'Property tax information required'
    };
  }
  
  // 2025 Michigan Homestead Credit calculation
  // Income thresholds and credit percentages
  const incomeThresholds = [
    { max: 21000, creditRate: 1.00 },
    { max: 23000, creditRate: 0.90 },
    { max: 25000, creditRate: 0.80 },
    { max: 27000, creditRate: 0.70 },
    { max: 29000, creditRate: 0.60 },
    { max: 31000, creditRate: 0.50 },
    { max: 33000, creditRate: 0.40 },
    { max: 35000, creditRate: 0.30 },
    { max: 37000, creditRate: 0.20 },
    { max: 39000, creditRate: 0.10 },
    { max: Infinity, creditRate: 0.00 }
  ];
  
  // Find applicable credit rate based on income
  const applicableThreshold = incomeThresholds.find(threshold => totalIncome <= threshold.max);
  const creditRate = applicableThreshold ? applicableThreshold.creditRate : 0;
  
  if (creditRate === 0) {
    return {
      eligible: false,
      credit: 0,
      reason: `Income too high (over $39,000)`
    };
  }
  
  // Calculate base credit amount
  // Michigan Homestead Credit is based on property taxes paid vs. property value
  const maxCreditablePropertyTax = Math.min(propertyTaxesPaid, propertyTaxValue * 0.035); // 3.5% cap
  
  // Calculate credit amount
  let creditAmount = 0;
  
  // Standard calculation: percentage of property taxes paid
  if (propertyTaxesPaid > totalIncome * 0.035) {
    // If property taxes exceed 3.5% of income, credit applies to excess
    const excessPropertyTax = propertyTaxesPaid - (totalIncome * 0.035);
    creditAmount = Math.min(excessPropertyTax * creditRate, maxCreditablePropertyTax);
  }
  
  // Minimum credit for very low income
  if (totalIncome <= 21000 && creditAmount < 1200) {
    creditAmount = Math.min(1200, propertyTaxesPaid);
  }
  
  // Maximum credit cap
  const maxCredit = 1500; // 2025 maximum
  creditAmount = Math.min(creditAmount, maxCredit);
  
  return {
    eligible: true,
    credit: Math.round(creditAmount),
    creditRate: creditRate,
    propertyTaxesPaid: propertyTaxesPaid,
    propertyTaxValue: propertyTaxValue,
    incomeThreshold: applicableThreshold.max === Infinity ? 'Over $39,000' : `Under $${applicableThreshold.max.toLocaleString()}`,
    calculation: {
      maxCreditablePropertyTax: Math.round(maxCreditablePropertyTax),
      incomeThresholdForPropertyTax: Math.round(totalIncome * 0.035),
      excessPropertyTax: Math.max(0, Math.round(propertyTaxesPaid - (totalIncome * 0.035)))
    }
  };
}

// Michigan property tax exemptions and additional credits
export function calculateMichiganPropertyTaxExemptions(taxpayer, spouse, age) {
  const exemptions = [];
  
  // Senior exemption (age 65+)
  if (age >= 65) {
    exemptions.push({
      type: 'senior',
      name: 'Senior Property Tax Exemption',
      description: 'Available for homeowners 65+ with income limitations',
      potentialSaving: 'Up to $1,200 annually',
      requirements: [
        'Age 65 or older',
        'Own and occupy primary residence',
        'Meet income requirements',
        'Apply with local assessor'
      ]
    });
  }
  
  // Disabled veteran exemption
  exemptions.push({
    type: 'veteran',
    name: 'Disabled Veteran Property Tax Exemption',
    description: 'For qualifying disabled veterans',
    potentialSaving: 'Varies by disability rating',
    requirements: [
      'Honorably discharged veteran',
      'Service-connected disability',
      'Own and occupy primary residence',
      'Apply with local assessor'
    ]
  });
  
  return exemptions;
}

