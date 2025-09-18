// Debug script to understand deduction components and the $2,500 difference
import { getStandardDeductionWrapper } from './src/utils/tax/compatibilityWrapper.js';
import { calculateSeniorDeductionEnhanced } from './src/utils/tax/compatibilityWrapper.js';

console.log('Debugging Deduction Components');
console.log('='.repeat(40));

const filingStatus = 'marriedFilingJointly';
const taxpayerAge = 65;
const spouseAge = 65;
const magi = 340000;
const taxYear = 2025;

console.log('Test scenario:');
console.log(`- Filing Status: ${filingStatus}`);
console.log(`- Taxpayer Age: ${taxpayerAge}`);
console.log(`- Spouse Age: ${spouseAge}`);
console.log(`- MAGI: $${magi.toLocaleString()}`);
console.log('');

// Test the enhanced wrapper directly
const totalDeduction = getStandardDeductionWrapper(filingStatus, taxpayerAge, spouseAge, magi, taxYear);
console.log(`Total Deduction (Enhanced): $${totalDeduction.toLocaleString()}`);

// Test the senior deduction component separately
const seniorDeduction = calculateSeniorDeductionEnhanced(filingStatus, taxpayerAge, spouseAge, magi, taxYear);
console.log(`Senior Deduction Component: $${seniorDeduction.toLocaleString()}`);

// Calculate expected components manually
console.log('');
console.log('Expected component breakdown:');
console.log('- Base standard deduction (MFJ 2025): $31,500');
console.log('- Additional for taxpayer age 65+: $1,600');
console.log('- Additional for spouse age 65+: $1,600');
console.log('- Senior deduction (before phase-out): $12,000');
console.log('- Total before phase-out: $46,700');
console.log('');

// Phase-out calculation
const phaseOutThreshold = 150000;
const excessIncome = magi - phaseOutThreshold;
const phaseOutRate = 0.05;
const maxReduction = 12000; // $6,000 × 2 people
const reduction = Math.min(maxReduction, excessIncome * phaseOutRate);

console.log('Phase-out calculation:');
console.log(`- Phase-out threshold: $${phaseOutThreshold.toLocaleString()}`);
console.log(`- Excess income: $${excessIncome.toLocaleString()}`);
console.log(`- Phase-out rate: ${phaseOutRate * 100}%`);
console.log(`- Calculated reduction: $${(excessIncome * phaseOutRate).toLocaleString()}`);
console.log(`- Max possible reduction: $${maxReduction.toLocaleString()}`);
console.log(`- Actual reduction: $${reduction.toLocaleString()}`);
console.log('');

const expectedFinal = 46700 - reduction;
console.log(`Expected final deduction: $${expectedFinal.toLocaleString()}`);
console.log(`Actual result: $${totalDeduction.toLocaleString()}`);
console.log(`Difference: $${Math.abs(expectedFinal - totalDeduction).toLocaleString()}`);

console.log('');
console.log('Comparison system shows: $34,700');
console.log(`Our result: $${totalDeduction.toLocaleString()}`);
console.log(`Difference from comparison: $${Math.abs(34700 - totalDeduction).toLocaleString()}`);

// Check if there might be another phase-out affecting the additional deductions
console.log('');
console.log('Investigating if additional age 65+ deductions also phase out...');

