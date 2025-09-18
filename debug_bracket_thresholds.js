import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';

console.log('=== Tax Bracket Threshold Debug ===');

// Test scenario from user's screenshots
const testSources = [
  { type: 'traditional-ira', amount: 97000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

const calc = calculateComprehensiveTaxes(
  testSources, 
  67, 
  65, 
  'marriedFilingJointly', 
  null, 
  testSettings
);

console.log('\n=== Current Calculation Results ===');
console.log('Total Income:', calc.totalIncome);
console.log('Federal AGI:', calc.federalAGI);
console.log('Taxable Income:', calc.federalTaxableIncome);
console.log('Current Bracket:', calc.currentBracket);
console.log('Next Bracket:', calc.nextBracket);
console.log('Amount to Next Bracket:', calc.amountToNextBracket);

console.log('\n=== Expected vs Actual ===');
console.log('Expected Amount to Next Rate Hike: $187');
console.log('Actual Amount to Next Rate Hike:', calc.amountToNextBracket);

console.log('\n=== Manual Calculation ===');
// MFJ 2025 tax brackets
const mfjBrackets = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 }
];

const taxableIncome = calc.federalTaxableIncome;
console.log('Taxable Income:', taxableIncome);

// Find current bracket
const currentBracket = mfjBrackets.find(bracket => 
  taxableIncome >= bracket.min && taxableIncome < bracket.max
);

console.log('Current Bracket (manual):', currentBracket);

if (currentBracket) {
  const distanceToNext = currentBracket.max - taxableIncome;
  console.log('Distance to next bracket (manual):', distanceToNext);
  console.log('Next bracket starts at:', currentBracket.max);
}

console.log('\n=== Analysis ===');
console.log('If taxable income is', taxableIncome);
console.log('And next bracket starts at 94,300');
console.log('Then distance should be:', 94300 - taxableIncome);
console.log('But we\'re getting:', calc.amountToNextBracket);

console.log('\n=== Possible Issue ===');
console.log('The UI might be showing distance based on a different income measure');
console.log('Or there might be a different threshold being used');
console.log('Expected $187 suggests the threshold is around:', taxableIncome + 187);

