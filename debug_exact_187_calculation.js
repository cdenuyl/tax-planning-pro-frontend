import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';

console.log('=== Finding the Exact Source of $187 and 13.12% ===');

// Test scenario from user's screenshots - exact values
const testSources = [
  { type: 'traditional-ira', amount: 97000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

console.log('\n=== Base Calculation ===');
const baseCalc = calculateComprehensiveTaxes(
  testSources, 
  67, 
  65, 
  'marriedFilingJointly', 
  null, 
  testSettings
);

console.log('Total Income:', baseCalc.totalIncome);
console.log('Federal AGI:', baseCalc.federalAGI);
console.log('Taxable Income:', baseCalc.federalTaxableIncome);
console.log('Federal Tax:', baseCalc.federalTax);
console.log('Total Tax:', baseCalc.totalTax);
console.log('Federal Marginal Rate:', (baseCalc.federalMarginalRate * 100).toFixed(2) + '%');

console.log('\n=== Testing Small Increments to Find 13.12% Rate ===');
// Test small increments to find where the rate changes to 13.12%
for (let increment = 100; increment <= 500; increment += 50) {
  const testSourcesIncremented = [
    { type: 'traditional-ira', amount: 97000 + increment, enabled: true, owner: 'Darla' },
    { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
    { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
  ];
  
  const incrementedCalc = calculateComprehensiveTaxes(
    testSourcesIncremented, 
    67, 
    65, 
    'marriedFilingJointly', 
    null, 
    testSettings
  );
  
  // Calculate actual marginal rate
  const taxDiff = incrementedCalc.totalTax - baseCalc.totalTax;
  const incomeDiff = increment;
  const actualMarginalRate = (taxDiff / incomeDiff) * 100;
  
  console.log(`+$${increment}: Tax diff: $${taxDiff.toFixed(2)}, Marginal rate: ${actualMarginalRate.toFixed(2)}%`);
  
  // Check if this matches 13.12%
  if (Math.abs(actualMarginalRate - 13.12) < 0.5) {
    console.log(`*** FOUND 13.12% RATE AT +$${increment} ***`);
    console.log('New Total Income:', incrementedCalc.totalIncome);
    console.log('New Taxable Income:', incrementedCalc.federalTaxableIncome);
    console.log('New Federal Tax:', incrementedCalc.federalTax);
    console.log('New Total Tax:', incrementedCalc.totalTax);
  }
}

console.log('\n=== Testing Exact $187 Increment ===');
const testSources187 = [
  { type: 'traditional-ira', amount: 97000 + 187, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
];

const calc187 = calculateComprehensiveTaxes(
  testSources187, 
  67, 
  65, 
  'marriedFilingJointly', 
  null, 
  testSettings
);

const taxDiff187 = calc187.totalTax - baseCalc.totalTax;
const marginalRate187 = (taxDiff187 / 187) * 100;

console.log('After adding $187:');
console.log('Tax difference:', taxDiff187.toFixed(2));
console.log('Marginal rate:', marginalRate187.toFixed(2) + '%');
console.log('New taxable income:', calc187.federalTaxableIncome);

console.log('\n=== Checking Social Security Taxation Effects ===');
console.log('Base SS taxation:', baseCalc.socialSecurity);
console.log('After $187 SS taxation:', calc187.socialSecurity);

console.log('\n=== Analysis ===');
console.log('The $187 and 13.12% might be coming from:');
console.log('1. Social Security taxation threshold changes');
console.log('2. A different income measure (AGI vs taxable income)');
console.log('3. State tax effects');
console.log('4. IRMAA threshold effects');
console.log('5. Senior deduction phase-out effects');

// Check if there's a threshold at current AGI + 187
const targetAGI = baseCalc.federalAGI + 187;
console.log('\nTarget AGI after $187:', targetAGI);
console.log('Checking if this hits any known thresholds...');

// Common thresholds to check
const thresholds = [
  { name: 'SS 50% threshold (MFJ)', value: 32000 },
  { name: 'SS 85% threshold (MFJ)', value: 44000 },
  { name: 'IRMAA Tier 1 (MFJ)', value: 212000 },
  { name: 'OBBB phase-out start (MFJ)', value: 150000 },
  { name: 'Tax bracket 12% to 22%', value: 94300 }
];

thresholds.forEach(threshold => {
  const distance = threshold.value - baseCalc.federalAGI;
  console.log(`${threshold.name}: ${distance > 0 ? '+' : ''}${distance.toFixed(0)} from current AGI`);
});

