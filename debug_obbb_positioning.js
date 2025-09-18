import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';

// Test scenario from the screenshot
const testSources = [
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25996, enabled: true, owner: 'Charles' },
  { type: 'traditional-ira', amount: 94483, enabled: true, owner: 'Darla' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

console.log('=== OBBB Phase-Out Debug ===');

// Calculate with ages to trigger OBBB
const calculations = calculateComprehensiveTaxes(
  testSources, 
  67, // taxpayer age (65+)
  65, // spouse age (65+)
  'marriedJoint', 
  null, 
  testSettings
);

console.log('Total Income:', calculations.totalIncome);
console.log('Federal AGI (MAGI):', calculations.federalAGI);
console.log('Taxpayer Age:', calculations.taxpayerAge);
console.log('Spouse Age:', calculations.spouseAge);

// Calculate non-SS income for reference line
const socialSecurityTotal = testSources
  .filter(s => s.type === 'social-security' && s.enabled)
  .reduce((sum, s) => sum + s.amount, 0);

const nonSSIncome = calculations.totalIncome - socialSecurityTotal;

console.log('\n=== Reference Line Debug ===');
console.log('Social Security Total:', socialSecurityTotal);
console.log('Non-SS Income (should be reference line position):', nonSSIncome);
console.log('Expected Reference Line Position: ~94,483');

console.log('\n=== OBBB Phase-Out Thresholds ===');
console.log('MFJ Phase-out should start at: $150,000 MAGI');
console.log('MFJ Phase-out should end at: $250,000 MAGI');
console.log('Current MAGI:', calculations.federalAGI);
console.log('Should OBBB show? MAGI > 150k:', calculations.federalAGI > 150000);

