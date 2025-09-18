// Debug script to check reference line positioning calculation

// From the screenshots:
const totalIncome = 145479;
const socialSecurityBenefits = 50996; // From the right panel

// Our calculation for non-SS income:
const nonSSIncome = totalIncome - socialSecurityBenefits;

console.log('=== Reference Line Position Debug ===');
console.log('Total Income:', totalIncome);
console.log('Social Security Benefits:', socialSecurityBenefits);
console.log('Calculated Non-SS Income:', nonSSIncome);
console.log('Expected position on X-axis:', nonSSIncome);

// Check if this matches what we see in the chart (~$94k)
const expectedPosition = 94483; // Approximate from the chart
console.log('\nExpected from chart:', expectedPosition);
console.log('Difference:', Math.abs(nonSSIncome - expectedPosition));

if (Math.abs(nonSSIncome - expectedPosition) < 1000) {
  console.log('✅ Reference line positioning appears correct');
} else {
  console.log('❌ Reference line positioning discrepancy detected');
}

