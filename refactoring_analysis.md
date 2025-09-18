# Tax-on-a-Me Codebase Refactoring Analysis

## Current Structure Analysis

### Main Issues Identified:
1. **Large App.jsx file** (5810 lines, 300KB) - contains too much logic
2. **Scattered tax constants** - tax brackets, rates, and thresholds duplicated across files
3. **Multiple tax calculation files** with overlapping functionality
4. **Inconsistent data structures** for similar calculations
5. **Repeated import patterns** across components

### Current Tax Calculation Files:
- `taxCalculations.js` (734 lines) - Main tax engine
- `capitalGainsTax.js` (320 lines) - Capital gains calculations
- `ficaTaxes.js` (99 lines) - FICA tax calculations
- `niitTax.js` - NIIT calculations
- `additionalMedicareTax.js` - Additional Medicare tax
- `amtTax.js` - Alternative Minimum Tax
- `taxBracketsByYear.js` - Historical tax brackets
- `irmaaThresholds.js` - Medicare premium thresholds

### Duplication Patterns Found:
1. **Tax brackets and rates** defined in multiple files
2. **Filing status handling** repeated across modules
3. **Income validation and formatting** scattered throughout
4. **Threshold calculations** duplicated for different tax types

## Proposed Refactoring Plan

### Phase 1: Create Consolidated Tax Constants
- Create `taxConstants.js` with all tax rates, brackets, and thresholds
- Centralize filing status definitions and validation
- Consolidate year-based tax data

### Phase 2: Create Core Tax Engine
- Create `taxEngine.js` as the main calculation orchestrator
- Standardize input/output data structures
- Implement consistent error handling and validation

### Phase 3: Modularize Specialized Calculations
- Refactor specialized tax modules to use centralized constants
- Standardize calculation interfaces
- Remove duplication while preserving functionality

### Phase 4: Refactor App.jsx
- Extract tax logic into custom hooks
- Separate UI logic from business logic
- Reduce file size and improve maintainability

## Files to Refactor:
- [ ] Create `src/utils/tax/taxConstants.js`
- [ ] Create `src/utils/tax/taxEngine.js`
- [ ] Refactor `taxCalculations.js`
- [ ] Refactor `capitalGainsTax.js`
- [ ] Refactor `ficaTaxes.js`
- [ ] Refactor `niitTax.js`
- [ ] Create custom hooks for App.jsx
- [ ] Update component imports

## Success Criteria:
- No functionality or design changes
- Reduced code duplication
- Improved maintainability
- Consistent data structures
- Smaller, more focused files

