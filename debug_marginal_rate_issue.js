import { calculateComprehensiveTaxes, getCurrentMarginalRate } from './src/utils/taxCalculations.js';

console.log('=== Marginal Rate Issue Debug ===');

// Test scenario from the screenshot
const testSources = [
  { type: 'traditional-ira', amount: 94000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25600, enabled: true, owner: 'Charles' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

const calculations = calculateComprehensiveTaxes(
  testSources, 
  67, 
  65, 
  'marriedFilingJointly', 
  null, 
  testSettings
);

console.log('\n=== Income Analysis ===');
console.log('Total Income:', calculations.totalIncome);
console.log('Federal AGI:', calculations.federalAGI);
console.log('Federal Taxable Income:', calculations.federalTaxableIncome);
console.log('Standard Deduction:', calculations.standardDeduction);

console.log('\n=== Marginal Rate Analysis ===');
console.log('federalMarginalRate from calculations:', calculations.federalMarginalRate);
console.log('marginalRateFederal from calculations:', calculations.marginalRateFederal);
console.log('All calculation properties:', Object.keys(calculations).filter(k => k.includes('marginal')));
console.log('Current Bracket from calculations:', calculations.currentBracket);
console.log('Next Bracket from calculations:', calculations.nextBracket);
console.log('Amount to Next Bracket:', calculations.amountToNextBracket);

// Test direct marginal rate calculation
const directMarginalRate = getCurrentMarginalRate(calculations.federalTaxableIncome, 'marriedFilingJointly');
console.log('\n=== Direct Marginal Rate Test ===');
console.log('Direct calculation with taxable income:', directMarginalRate);

// Test with total income (wrong way)
const wrongMarginalRate = getCurrentMarginalRate(calculations.totalIncome, 'marriedFilingJointly');
console.log('Direct calculation with total income (WRONG):', wrongMarginalRate);

console.log('\n=== Tax Bracket Analysis ===');
console.log('Taxable Income:', calculations.federalTaxableIncome);

// 2025 MFJ brackets
const brackets = [
  { min: 0, max: 23200, rate: 10 },
  { min: 23200, max: 94300, rate: 12 },
  { min: 94300, max: 201050, rate: 22 },
  { min: 201050, max: 383900, rate: 24 }
];

const correctBracket = brackets.find(b => 
  calculations.federalTaxableIncome > b.min && calculations.federalTaxableIncome <= b.max
);

console.log('Correct bracket based on taxable income:', correctBracket);
console.log('Expected marginal rate: 12%');

// Check what bracket total income would be in
const wrongBracket = brackets.find(b => 
  calculations.totalIncome > b.min && calculations.totalIncome <= b.max
);

console.log('Wrong bracket based on total income:', wrongBracket);
console.log('This would give: 22% (which matches the bug!)');

console.log('\n=== Issue Identification ===');
if (calculations.marginalRateFederal === 0.22) {
  console.log('❌ BUG CONFIRMED: Marginal rate is 22% (based on total income)');
  console.log('✅ SHOULD BE: 12% (based on taxable income)');
} else if (calculations.marginalRateFederal === 0.12) {
  console.log('✅ Marginal rate calculation is correct');
} else {
  console.log('? Unexpected marginal rate:', calculations.marginalRateFederal);
}

