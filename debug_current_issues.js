import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';

console.log('=== Debugging Current Issues ===');

// Test scenario from user's screenshots
const testSources1 = [
  { type: 'traditional-ira', amount: 97000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
];

const testSources2 = [
  { type: 'traditional-ira', amount: 98000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

console.log('\n=== Scenario 1: $97,000 IRA (should show $187 to next hike) ===');
const calc1 = calculateComprehensiveTaxes(
  testSources1, 
  67, 
  65, 
  'marriedFilingJointly', 
  null, 
  testSettings
);

console.log('Total Income:', calc1.totalIncome);
console.log('Taxable Income:', calc1.federalTaxableIncome);
console.log('Federal Tax:', calc1.federalTax);
console.log('Total Tax:', calc1.totalTax);
console.log('Raw Federal Marginal Rate:', (calc1.federalMarginalRate * 100).toFixed(2) + '%');
console.log('Effective Marginal Rate:', (calc1.effectiveMarginalRate * 100).toFixed(2) + '%');
console.log('Amount to Next Rate Hike:', calc1.amountToNextRateHike);
console.log('Next Effective Marginal Rate:', (calc1.nextEffectiveMarginalRate * 100).toFixed(2) + '%');

console.log('\n=== Scenario 2: $98,000 IRA (after adding $1k) ===');
const calc2 = calculateComprehensiveTaxes(
  testSources2, 
  67, 
  65, 
  'marriedFilingJointly', 
  null, 
  testSettings
);

console.log('Total Income:', calc2.totalIncome);
console.log('Taxable Income:', calc2.federalTaxableIncome);
console.log('Federal Tax:', calc2.federalTax);
console.log('Total Tax:', calc2.totalTax);
console.log('Raw Federal Marginal Rate:', (calc2.federalMarginalRate * 100).toFixed(2) + '%');
console.log('Effective Marginal Rate:', (calc2.effectiveMarginalRate * 100).toFixed(2) + '%');
console.log('Amount to Next Rate Hike:', calc2.amountToNextRateHike);
console.log('Next Effective Marginal Rate:', (calc2.nextEffectiveMarginalRate * 100).toFixed(2) + '%');

console.log('\n=== Manual Tax Difference Calculation ===');
const taxDifference = calc2.totalTax - calc1.totalTax;
const incomeDifference = calc2.totalIncome - calc1.totalIncome;
const actualMarginalRate = taxDifference / incomeDifference;

console.log('Tax Difference:', taxDifference);
console.log('Income Difference:', incomeDifference);
console.log('Actual Marginal Rate:', (actualMarginalRate * 100).toFixed(2) + '%');

console.log('\n=== Issues Identified ===');
console.log('1. Expected: $187 to next hike, Got:', calc1.amountToNextRateHike);
console.log('2. Expected: Small rate increase, Got:', (calc1.effectiveMarginalRate * 100).toFixed(2) + '% → ' + (calc2.effectiveMarginalRate * 100).toFixed(2) + '%');
console.log('3. Actual marginal rate from $1k increase:', (actualMarginalRate * 100).toFixed(2) + '%');

console.log('\n=== OBBB Phase-out Check ===');
console.log('Ages:', calc1.taxpayerAge, calc1.spouseAge);
console.log('Filing Status:', calc1.filingStatus);
console.log('MAGI (approx):', calc1.federalAGI);
console.log('Should OBBB phase-out show? Ages 65+ and MFJ with MAGI < 150k = YES');

