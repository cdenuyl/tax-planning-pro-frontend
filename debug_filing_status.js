import { calculateComprehensiveTaxes } from './src/utils/taxCalculations.js';

console.log('=== Filing Status Debug ===');

// Test scenario from the screenshot
const testSources = [
  { type: 'traditional-ira', amount: 94000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25000, enabled: true, owner: 'Darla' },
  { type: 'social-security', amount: 25600, enabled: true, owner: 'Charles' }
];

const testSettings = {
  medicare: { partB: { enabled: false }, partD: { enabled: false } }
};

// Test different filing status values
const filingStatusOptions = ['marriedJoint', 'marriedFilingJointly', 'married-filing-jointly', 'joint'];

filingStatusOptions.forEach(status => {
  console.log(`\n=== Testing Filing Status: "${status}" ===`);
  
  try {
    const calculations = calculateComprehensiveTaxes(
      testSources, 
      67, 
      65, 
      status, 
      null, 
      testSettings
    );
    
    console.log('Filing Status in calculations:', calculations.filingStatus);
    console.log('Total Income:', calculations.totalIncome);
    console.log('Federal AGI:', calculations.federalAGI);
    
    // Test threshold lookup
    const seniorDeductionThresholds = {
      single: { start: 75000, end: 175000 },
      marriedJoint: { start: 150000, end: 250000 },
      marriedSeparate: { start: 75000, end: 125000 },
      headOfHousehold: { start: 112500, end: 212500 }
    };
    
    const thresholds = seniorDeductionThresholds[status] || seniorDeductionThresholds.single;
    console.log('Thresholds found:', thresholds);
    console.log('Using default (single)?', !seniorDeductionThresholds[status]);
    
  } catch (error) {
    console.log('Error:', error.message);
  }
});

console.log('\n=== Threshold Object Keys ===');
const seniorDeductionThresholds = {
  single: { start: 75000, end: 175000 },
  marriedJoint: { start: 150000, end: 250000 },
  marriedSeparate: { start: 75000, end: 125000 },
  headOfHousehold: { start: 112500, end: 212500 }
};

console.log('Available keys:', Object.keys(seniorDeductionThresholds));

