// Detailed debug script to investigate reference line positioning

// From the user's screenshot:
const totalIncome = 145479;
const agiExcludingSS = 94483; // From right panel "AGI (excluding SS)"
const socialSecurityBenefits = 50996; // From right panel "Total SS Benefits"

console.log('=== Detailed Reference Line Debug ===');
console.log('Total Income:', totalIncome);
console.log('AGI (excluding SS) from panel:', agiExcludingSS);
console.log('SS Benefits from panel:', socialSecurityBenefits);

// Our current calculation logic:
const calculatedNonSSIncome = totalIncome - socialSecurityBenefits;
console.log('\nOur calculation: totalIncome - socialSecurityBenefits');
console.log('Calculated Non-SS Income:', calculatedNonSSIncome);

// Check if this matches the AGI (excluding SS) from the panel
console.log('\nComparison:');
console.log('Panel AGI (excluding SS):', agiExcludingSS);
console.log('Our calculated Non-SS:', calculatedNonSSIncome);
console.log('Difference:', Math.abs(agiExcludingSS - calculatedNonSSIncome));

// The green line appears to be at ~$116k according to user
const actualGreenLinePosition = 116000; // Approximate from chart
console.log('\nActual green line position (from chart):', actualGreenLinePosition);
console.log('Expected position:', agiExcludingSS);
console.log('Position error:', actualGreenLinePosition - agiExcludingSS);

// Investigate potential causes
console.log('\n=== Potential Issues ===');
console.log('1. Are we using the wrong income source for calculation?');
console.log('2. Is there a bug in the getYearlyAmount function?');
console.log('3. Is the reference line using a different income calculation?');

// Check if the difference might be related to provisional income
const provisionalIncome = 119981; // From right panel
console.log('\nProvisional Income from panel:', provisionalIncome);
console.log('Difference from green line position:', Math.abs(provisionalIncome - actualGreenLinePosition));

if (Math.abs(provisionalIncome - actualGreenLinePosition) < 5000) {
  console.log('🔍 GREEN LINE MIGHT BE USING PROVISIONAL INCOME INSTEAD OF NON-SS INCOME!');
}

