import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';

console.log('=== Debugging Calculations Object ===');

// Test scenario from user's screenshots
const testSources = [
  { type: 'traditional-ira', amount: 97000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
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

console.log('\n=== Full Calculations Object (Marginal Rate Fields) ===');
console.log('federalMarginalRate:', (calculations.federalMarginalRate * 100).toFixed(2) + '%');
console.log('effectiveMarginalRate:', calculations.effectiveMarginalRate ? (calculations.effectiveMarginalRate * 100).toFixed(2) + '%' : 'undefined');
console.log('amountToNextBracket:', calculations.amountToNextBracket);
console.log('amountToNextRateHike:', calculations.amountToNextRateHike);
console.log('nextEffectiveMarginalRate:', calculations.nextEffectiveMarginalRate ? (calculations.nextEffectiveMarginalRate * 100).toFixed(2) + '%' : 'undefined');
console.log('rateHikeSource:', calculations.rateHikeSource);

console.log('\n=== Current and Next Bracket Info ===');
console.log('currentBracket:', calculations.currentBracket);
console.log('nextBracket:', calculations.nextBracket);

console.log('\n=== What UI Should Display ===');
const displayedCurrentRate = calculations.effectiveMarginalRate || calculations.federalMarginalRate;
const displayedNextRate = calculations.nextEffectiveMarginalRate || calculations.nextBracket?.rate;
const displayedAmount = calculations.amountToNextRateHike || calculations.amountToNextBracket;

console.log('UI Current Rate:', (displayedCurrentRate * 100).toFixed(2) + '%');
console.log('UI Next Rate:', displayedNextRate ? (displayedNextRate * 100).toFixed(2) + '%' : 'undefined');
console.log('UI Amount:', displayedAmount);

console.log('\n=== Expected vs Actual ===');
console.log('Expected: Current 12.00% → Next 13.12%, Amount $187');
console.log('Actual: Current ' + (displayedCurrentRate * 100).toFixed(2) + '% → Next ' + (displayedNextRate ? (displayedNextRate * 100).toFixed(2) + '%' : 'undefined') + ', Amount $' + displayedAmount);

console.log('\n=== Checking for 13.12% Source ===');
// 13.12% = 0.1312
// This could be 12% + 1.12% from some effect
console.log('13.12% - 12% = 1.12% additional effect');
console.log('This could be from:');
console.log('- Social Security taxation phase-in');
console.log('- State tax effects');
console.log('- IRMAA effects');
console.log('- Senior deduction phase-out');

// Check if 13.12% appears anywhere in the calculation
const calcString = JSON.stringify(calculations, null, 2);
if (calcString.includes('0.1312') || calcString.includes('13.12')) {
  console.log('*** FOUND 13.12% in calculations object! ***');
} else {
  console.log('13.12% not found in calculations object - must be calculated in UI');
}

