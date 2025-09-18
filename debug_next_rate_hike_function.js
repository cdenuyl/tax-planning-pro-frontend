import { findNextRateHike } from './src/utils/nextRateHike.js';

console.log('=== Debugging nextRateHike Function ===');

// Test scenario from user's screenshots
const testSources = [
  { type: 'traditional-ira', amount: 97000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25500, enabled: true, owner: 'Charles' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

console.log('\n=== Calling findNextRateHike Function ===');
try {
  const nextRateHike = findNextRateHike(testSources, 67, 'marriedFilingJointly');
  
  console.log('nextRateHike result:', nextRateHike);
  
  if (nextRateHike.amountToHike) {
    console.log('\n=== Found Rate Hike ===');
    console.log('Amount to hike:', nextRateHike.amountToHike);
    console.log('Current rate:', nextRateHike.currentRate ? (nextRateHike.currentRate * 100).toFixed(2) + '%' : 'undefined');
    console.log('New rate:', nextRateHike.newRate ? (nextRateHike.newRate * 100).toFixed(2) + '%' : 'undefined');
    console.log('Cause:', nextRateHike.cause);
    
    console.log('\n=== Checking if this matches UI ===');
    console.log('Expected from UI: $187, 12% → 13.12%');
    console.log('Actual from function: $' + nextRateHike.amountToHike + ', ' + 
                (nextRateHike.currentRate ? (nextRateHike.currentRate * 100).toFixed(2) + '%' : 'undefined') + ' → ' + 
                (nextRateHike.newRate ? (nextRateHike.newRate * 100).toFixed(2) + '%' : 'undefined'));
    
    if (Math.abs(nextRateHike.amountToHike - 187) < 10) {
      console.log('*** FOUND THE SOURCE OF $187! ***');
    }
    
    if (nextRateHike.newRate && Math.abs(nextRateHike.newRate * 100 - 13.12) < 0.1) {
      console.log('*** FOUND THE SOURCE OF 13.12%! ***');
    }
  } else {
    console.log('No rate hike found');
  }
  
} catch (error) {
  console.error('Error calling findNextRateHike:', error.message);
  console.log('\nThis explains why the UI might be showing different values');
  console.log('The nextRateHike function might be failing and falling back to default values');
}

console.log('\n=== Analysis ===');
console.log('If this function returns the $187 and 13.12%, then we need to:');
console.log('1. Fix this function to be consistent with the main tax calculations');
console.log('2. Or update the UI to use the main tax calculation results');
console.log('3. Or ensure both calculations use the same methodology');

