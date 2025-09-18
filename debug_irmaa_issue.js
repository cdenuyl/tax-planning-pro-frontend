import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';
import { getIrmaaThresholds } from './src/utils/irmaaThresholds.js';

console.log('=== IRMAA Issue Debug ===');

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
console.log('Federal AGI (MAGI):', calculations.federalAGI);
console.log('Filing Status:', calculations.filingStatus);

console.log('\n=== IRMAA Thresholds ===');
const irmaaThresholds = getIrmaaThresholds('marriedFilingJointly');
console.log('IRMAA thresholds for MFJ:');
irmaaThresholds.forEach((threshold, index) => {
  console.log(`  ${threshold.label}: $${threshold.min.toLocaleString()} - $${threshold.max === Infinity ? 'Infinity' : threshold.max.toLocaleString()}`);
  console.log(`    Part B: +$${threshold.partB}, Part D: +$${threshold.partD}`);
});

console.log('\n=== IRMAA Analysis ===');
const currentMAGI = calculations.federalAGI;
console.log('Current MAGI:', currentMAGI);

// Find which tier the user is in
let currentTier = null;

for (let i = 0; i < irmaaThresholds.length; i++) {
  const threshold = irmaaThresholds[i];
  if (currentMAGI > threshold.min && currentMAGI <= threshold.max) {
    currentTier = {
      tier: i,
      label: threshold.label,
      min: threshold.min,
      max: threshold.max,
      partB: threshold.partB,
      partD: threshold.partD
    };
    break;
  }
}

if (currentTier) {
  console.log(`✅ User IS in IRMAA - ${currentTier.label}`);
  console.log(`   Range: $${currentTier.min.toLocaleString()} - $${currentTier.max === Infinity ? 'Infinity' : currentTier.max.toLocaleString()}`);
  console.log(`   Part B increase: $${currentTier.partB}`);
  console.log(`   Part D increase: $${currentTier.partD}`);
} else {
  console.log('❌ User is NOT in IRMAA (MAGI below first threshold)');
}

console.log('\n=== Expected vs Reported ===');
console.log('First IRMAA threshold (MFJ): $212,000');
console.log('Current MAGI:', currentMAGI);
console.log('Should be in IRMAA?', currentMAGI >= 212000);

if (currentMAGI >= 212000) {
  console.log('Expected tier: 1 (first tier)');
  console.log('User reports seeing: Tier III');
  console.log('❌ ISSUE: Wrong tier being displayed');
} else {
  console.log('Expected: No IRMAA');
  console.log('User reports seeing: IRMAA Tier III');
  console.log('❌ ISSUE: IRMAA showing when it shouldn\'t');
}

console.log('\n=== Distance Calculation Check ===');
console.log('Amount to Next Rate Hike from calculations:', calculations.amountToNextBracket);
console.log('This should be distance to next TAX bracket, not IRMAA tier');

// Check if there's confusion between tax brackets and IRMAA tiers
const nextTaxBracket = calculations.nextBracket;
const distanceToNextTaxBracket = nextTaxBracket.min - calculations.federalTaxableIncome;
console.log('Distance to next tax bracket (22%):', distanceToNextTaxBracket);

const nextIrmaaThreshold = irmaaThresholds.find(t => t.magiThreshold > currentMAGI);
if (nextIrmaaThreshold) {
  const distanceToNextIrmaa = nextIrmaaThreshold.magiThreshold - currentMAGI;
  console.log('Distance to next IRMAA tier:', distanceToNextIrmaa);
  
  if (Math.abs(distanceToNextIrmaa - 17000) < 1000) {
    console.log('❌ ISSUE: UI might be showing IRMAA distance instead of tax bracket distance');
  }
}

