// Simple debug to check reference line calculation
console.log('=== Reference Line Debug ===');

// Values from the screenshot
const totalIncome = 145479;
const ssAmount = 50996; // 25000 + 25996
const expectedNonSSIncome = 94483;

const calculatedNonSSIncome = totalIncome - ssAmount;

console.log('Total Income:', totalIncome);
console.log('SS Amount:', ssAmount);
console.log('Calculated Non-SS Income:', calculatedNonSSIncome);
console.log('Expected Non-SS Income:', expectedNonSSIncome);
console.log('Difference:', calculatedNonSSIncome - expectedNonSSIncome);
console.log('Match?', calculatedNonSSIncome === expectedNonSSIncome);

// Check if the issue is in the values being passed
console.log('\n=== Potential Issues ===');
if (calculatedNonSSIncome !== expectedNonSSIncome) {
  console.log('❌ Values don\'t match - issue with totalIncome or ssAmount');
} else {
  console.log('✅ Math is correct - issue must be elsewhere');
}

