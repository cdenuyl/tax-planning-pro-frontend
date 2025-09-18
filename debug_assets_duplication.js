// Debug script to test asset duplication issue
console.log('=== Testing Asset Duplication Issue ===');

// Simulate the asset data structure
const testAssets = [
  {
    id: 'asset-1',
    name: "John's IRA",
    type: 'traditional-ira',
    owner: 'taxpayer',
    currentValue: 400000,
    hasIncomeSource: true
  },
  {
    id: 'asset-2', 
    name: "Mary's 401k",
    type: 'traditional-401k',
    owner: 'spouse',
    currentValue: 38000,
    hasIncomeSource: true
  },
  {
    id: 'asset-3',
    name: 'Savings',
    type: 'savings',
    owner: 'taxpayer', 
    currentValue: 30000,
    hasIncomeSource: true
  }
];

console.log('Test Assets Array:');
console.log('Length:', testAssets.length);
testAssets.forEach((asset, index) => {
  console.log(`${index + 1}. ID: ${asset.id}, Name: ${asset.name}, Value: $${asset.currentValue.toLocaleString()}`);
});

// Check for duplicate IDs
const ids = testAssets.map(asset => asset.id);
const uniqueIds = [...new Set(ids)];
console.log('\nDuplicate ID Check:');
console.log('Total IDs:', ids.length);
console.log('Unique IDs:', uniqueIds.length);
console.log('Has Duplicates:', ids.length !== uniqueIds.length);

// Check for duplicate names
const names = testAssets.map(asset => asset.name);
const uniqueNames = [...new Set(names)];
console.log('\nDuplicate Name Check:');
console.log('Total Names:', names.length);
console.log('Unique Names:', uniqueNames.length);
console.log('Has Duplicate Names:', names.length !== uniqueNames.length);

if (names.length !== uniqueNames.length) {
  console.log('Duplicate Names Found:');
  names.forEach((name, index) => {
    const duplicateIndices = names.map((n, i) => n === name ? i : -1).filter(i => i !== -1);
    if (duplicateIndices.length > 1) {
      console.log(`"${name}" appears at indices:`, duplicateIndices);
    }
  });
}

console.log('\n=== Simulating React Render ===');
console.log('Assets to render:');
testAssets.forEach((asset, index) => {
  console.log(`Rendering row ${index + 1}: key=${asset.id}, name=${asset.name}`);
});

console.log('\n=== Potential Issues ===');
console.log('1. Check if assets array has duplicate entries');
console.log('2. Check if React keys are unique');
console.log('3. Check if component is rendering multiple times');
console.log('4. Check if there are multiple table bodies');

