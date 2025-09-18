import { calculateComprehensiveTaxes, getTaxBrackets } from './src/utils/taxCalculations.js';

console.log('=== Bracket Calculation Debug ===');

// Test scenario
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

console.log('\n=== Key Values ===');
console.log('Total Income:', calculations.totalIncome);
console.log('Federal Taxable Income:', calculations.federalTaxableIncome);
console.log('Filing Status:', calculations.filingStatus);

console.log('\n=== Tax Brackets ===');
const brackets = getTaxBrackets('marriedFilingJointly');
console.log('Tax brackets for MFJ:');
brackets.forEach((bracket, index) => {
  console.log(`  ${index}: ${bracket.min} - ${bracket.max} = ${bracket.rate * 100}%`);
});

console.log('\n=== Bracket Finding Logic ===');
const taxableIncome = calculations.federalTaxableIncome;
console.log('Looking for bracket containing:', taxableIncome);

brackets.forEach((bracket, index) => {
  const inBracket = taxableIncome > bracket.min && taxableIncome <= bracket.max;
  console.log(`  Bracket ${index} (${bracket.min}-${bracket.max}, ${bracket.rate * 100}%): ${inBracket ? '✅ MATCH' : '❌'}`);
});

const foundBracket = brackets.find(bracket => 
  taxableIncome > bracket.min && taxableIncome <= bracket.max
);

console.log('\n=== Results ===');
console.log('Found bracket:', foundBracket);
console.log('Calculations currentBracket:', calculations.currentBracket);
console.log('Calculations nextBracket:', calculations.nextBracket);

console.log('\n=== Potential Issue Check ===');
// Check if it's using total income instead of taxable income
const wrongBracket = brackets.find(bracket => 
  calculations.totalIncome > bracket.min && calculations.totalIncome <= bracket.max
);
console.log('If using total income (WRONG):', wrongBracket);

console.log('\n=== Expected vs Actual ===');
console.log('Expected: 12% bracket (taxable income 90,310 is in 23,200-94,300 range)');
console.log('Actual from calculations:', calculations.currentBracket?.rate * 100 + '%');

