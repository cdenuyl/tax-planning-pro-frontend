// Debug script to understand what values might be used in reference line calculation

// From the user's screenshot, let's analyze the income sources:
const incomeSource1 = { type: 'traditional-ira', amount: 94483, enabled: true };
const incomeSource2 = { type: 'social-security', amount: 25000, enabled: true }; // Darla
const incomeSource3 = { type: 'social-security', amount: 25996, enabled: true }; // Charles

const totalSSFromSources = 25000 + 25996;
const totalNonSSFromSources = 94483;
const totalIncomeFromSources = totalSSFromSources + totalNonSSFromSources;

console.log('=== Income Sources Analysis ===');
console.log('Traditional IRA (Darla):', 94483);
console.log('Social Security (Darla):', 25000);
console.log('Social Security (Charles):', 25996);
console.log('Total SS from sources:', totalSSFromSources);
console.log('Total Non-SS from sources:', totalNonSSFromSources);
console.log('Total Income from sources:', totalIncomeFromSources);

// Expected reference line calculation:
const expectedReferenceLinePosition = totalIncomeFromSources - totalSSFromSources;
console.log('\nExpected reference line position:', expectedReferenceLinePosition);

// But we're seeing ~116k, which is close to provisional income
// Provisional income = AGI (excluding SS) + 50% of SS benefits
const provisionalIncome = totalNonSSFromSources + (totalSSFromSources * 0.5);
console.log('Calculated provisional income:', provisionalIncome);

// Check if the reference line might be using provisional income somehow
console.log('\nComparison:');
console.log('Expected (Non-SS income):', expectedReferenceLinePosition);
console.log('Actual from chart:', 116000);
console.log('Provisional income:', provisionalIncome);

if (Math.abs(provisionalIncome - 116000) < 5000) {
  console.log('🔍 CONFIRMED: Reference line is using provisional income calculation!');
}

// Check if there's a bug in how we're getting the total income
console.log('\n=== Potential Bug Analysis ===');
console.log('If totalIncome is being calculated as provisional income instead of actual total income:');
console.log('Buggy calculation: provisionalIncome - totalSSFromSources =', provisionalIncome - totalSSFromSources);
console.log('This would explain the ~116k position!');

