# Test Data Analysis and Removal Plan

## 📅 **Analysis Date**: September 2, 2025
## 🎯 **Objective**: Identify and catalog all test data for safe removal

---

## 🔍 **Test Data Locations Identified**

### 1. **Primary Test Data in App.jsx (Lines 87-164)**

#### Taxpayer Information
- **firstName**: 'Jon'
- **lastName**: 'Doe'
- **dateOfBirth**: '01/25/1951'
- **age**: 74
- **filingStatus**: 'single'
- **state**: 'Michigan'

#### Spouse Information
- **firstName**: 'Jane'
- **lastName**: 'Doe'
- **dateOfBirth**: '03/13/1967'
- **age**: null

#### Housing Information
- **propertyTaxValue**: 150000
- **propertyTaxesPaid**: 3500

#### Income Sources (Lines 121-145)
1. **Part-time Consulting**: $40,000 (wages)
2. **Company A 401(k) - Rollover IRA**: $8,000 (traditional-ira, accountValue: $425,000)
3. **Company B Pension**: $7,000 (pension)
4. **Social Security Benefits**: $36,000 (social-security)
5. **Annuity**: $12,000 (annuity, currentValue: $85,000, basisAmount: $50,000)

### 2. **Reference Data in InteractiveTaxMap.jsx**

#### Reference Values for Chart Positioning
- **referenceSSAmount**: 36000 (Line 29)
- **part-time-consulting**: 40000 (Line 32)
- **Chart positioning calculations** using these reference amounts

### 3. **Test Data in Other Components**

#### Placeholder Text
- **ClientProfileModal.jsx**: "John & Jane Doe", "John Doe", "john.doe@example.com"
- **LoginPage.jsx**: "Doe" placeholder
- **SocialSecurityAnalysis.jsx**: Uses taxpayerInfo?.firstName || 'Jon'

#### Test Files
- **__tests__ directories**: Various test files with "John Doe", "Jane Smith" test data

---

## 🎯 **Removal Strategy**

### Phase 1: Clean Default Scenario Data
1. **Empty taxpayer information** (keep structure, remove values)
2. **Empty spouse information** (keep structure, remove values)
3. **Remove default income sources** (empty array)
4. **Reset housing values** to defaults
5. **Keep deductions structure** with zero values

### Phase 2: Update Reference Values
1. **Keep reference calculations** but use generic amounts
2. **Maintain chart positioning logic** without hardcoded test values
3. **Preserve calculation accuracy** with clean defaults

### Phase 3: Clean Placeholder Text
1. **Update placeholders** to generic examples
2. **Remove specific test names** from UI components
3. **Keep helpful placeholder guidance**

---

## ⚠️ **Critical Considerations**

### Must Preserve
- **Data structure integrity** - Keep all object shapes
- **Calculation logic** - Don't break tax calculations
- **Chart positioning** - Maintain IRMAA and SS threshold logic
- **Import/export functionality** - Ensure data loading still works
- **Form validation** - Keep all validation rules

### Safe to Remove
- **Hardcoded names** (Jon, Jane, Doe)
- **Specific dollar amounts** in default data
- **Pre-filled form values**
- **Test asset values**

### Risky Areas
- **Chart reference calculations** - Need careful handling
- **Default object structures** - Must maintain shape
- **Conditional logic** - Don't break null/undefined checks

---

## 📋 **Step-by-Step Removal Plan**

### Step 1: Create Empty Default Scenario
```javascript
// Replace filled scenario with empty structure
{
  id: 1,
  name: 'Base Case',
  isActive: true,
  data: {
    taxpayer: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      age: null,
      // ... keep structure, empty values
    },
    incomeSources: [], // Empty array
    // ... maintain all structures
  }
}
```

### Step 2: Update Reference Values
```javascript
// Keep calculations but use neutral amounts
const referenceSSAmount = 0; // Or keep for positioning?
```

### Step 3: Clean Placeholders
```javascript
// Update to generic examples
placeholder="First Name"
placeholder="Last Name"
placeholder="user@example.com"
```

---

## 🧪 **Testing Requirements**

### Must Test After Each Change
1. **Application loads** without errors
2. **Forms work** with empty defaults
3. **Calculations function** with no data
4. **Import functionality** still works
5. **Chart displays** correctly with no data
6. **Tax analysis** handles empty scenarios

### Validation Points
- **No JavaScript errors** in console
- **Clean UI** with empty forms
- **Proper placeholders** displayed
- **Import/export** functionality intact
- **All tabs accessible** and functional

---

## 📊 **Files to Modify**

### Primary Files
1. **src/App.jsx** - Main scenario data (Lines 87-164)
2. **src/components/InteractiveTaxMap.jsx** - Reference values (Lines 29, 32)

### Secondary Files
3. **src/components/ClientProfileModal.jsx** - Placeholder text
4. **src/components/auth/LoginPage.jsx** - Placeholder text
5. **src/components/SocialSecurityAnalysis.jsx** - Default name fallback

### Test Files (Optional)
- **src/utils/__tests__/*.js** - Test data (can be left as-is)

---

## 🎯 **Expected Outcome**

After removal:
- **Clean application startup** with empty forms
- **Professional appearance** without test data
- **Full functionality preserved** for real client data
- **Import capability** for loading actual client information
- **Ready for production use** without embarrassing test data

---

**Status**: Ready for Implementation ✅

**Risk Level**: HIGH - Requires careful, incremental approach

