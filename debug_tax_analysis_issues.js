import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';

console.log('=== Tax Analysis Issues Debug ===');

// Test scenario from the screenshot
const testSources = [
  { type: 'traditional-ira', amount: 94000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25600, enabled: true, owner: 'Charles' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

// Calculate with ages to trigger OBBB eligibility
const calculations = calculateComprehensiveTaxes(
  testSources, 
  67, // taxpayer age (65+)
  65, // spouse age (65+)
  'marriedJoint', 
  null, 
  testSettings
);

console.log('\n=== Current Calculations ===');
console.log('Total Income:', calculations.totalIncome);
console.log('Federal AGI:', calculations.federalAGI);
console.log('Federal Taxable Income:', calculations.federalTaxableIncome);
console.log('Standard Deduction:', calculations.standardDeduction);

console.log('\n=== Issue 1: OBBB Phase-Out Positioning ===');
console.log('Current MAGI:', calculations.federalAGI);
console.log('MFJ OBBB Start Threshold: 150,000');
console.log('Should OBBB show?', calculations.federalAGI > 150000);
console.log('Problem: OBBB showing in chart around 90k when it should start at 150k');

console.log('\n=== Issue 2: Marginal Tax Bracket Analysis ===');
console.log('Total Income:', calculations.totalIncome);
console.log('Taxable Income:', calculations.federalTaxableIncome);
console.log('Difference (Deductions):', calculations.totalIncome - calculations.federalTaxableIncome);

// Calculate marginal rates for both total and taxable income
console.log('\n--- Marginal Rate Based on Total Income (WRONG) ---');
const totalIncomeRate = getTaxBracketRate(calculations.totalIncome, 'marriedJoint');
console.log('Rate based on Total Income:', totalIncomeRate + '%');

console.log('\n--- Marginal Rate Based on Taxable Income (CORRECT) ---');
const taxableIncomeRate = getTaxBracketRate(calculations.federalTaxableIncome, 'marriedJoint');
console.log('Rate based on Taxable Income:', taxableIncomeRate + '%');

console.log('\n=== Issue 3: Distance to Next Bracket ===');
console.log('Current calculation likely using Total Income');
console.log('Should use Taxable Income for bracket calculations');

// Helper function to get tax bracket rate
function getTaxBracketRate(income, filingStatus) {
  // 2025 tax brackets for MFJ
  const brackets = [
    { min: 0, max: 23200, rate: 10 },
    { min: 23200, max: 94300, rate: 12 },
    { min: 94300, max: 201050, rate: 22 },
    { min: 201050, max: 383900, rate: 24 },
    { min: 383900, max: 487450, rate: 32 },
    { min: 487450, max: 731200, rate: 35 },
    { min: 731200, max: Infinity, rate: 37 }
  ];
  
  for (const bracket of brackets) {
    if (income >= bracket.min && income < bracket.max) {
      return bracket.rate;
    }
  }
  return 37; // Top bracket
}

console.log('\n=== Issue 4: IRMAA Calculations ===');
console.log('Current MAGI:', calculations.federalAGI);
console.log('IRMAA Tier 1 Threshold (MFJ): 106,000');
console.log('Should be in IRMAA?', calculations.federalAGI > 106000);
console.log('Problem: Showing IRMAA Tier 3 when should be lower tier or none');

