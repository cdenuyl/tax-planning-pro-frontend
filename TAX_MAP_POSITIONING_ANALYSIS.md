# Tax Map Positioning Analysis
## Issue: Chart positioning and scaling problems compared to Tax Clarity

### Problems Identified

#### 1. Current Position Calculation Issue
**Current Logic (Line 154-156)**:
```javascript
currentPosition = methodology === 'incremental' 
  ? totalIncome - (incomeSources.find(s => s.type === 'social-security' && s.enabled) ? getYearlyAmount(incomeSources.find(s => s.type === 'social-security' && s.enabled)) : 0) 
  : totalIncome;
```

**Problem**: This calculates current position as `totalIncome - SS`, but the chart X-axis should represent **additional** non-SS income, not current total.

**Tax Clarity Behavior**: Reference point starts at $0 additional income, before any tax effects.

#### 2. X-Axis Scaling Issue
**Current Logic (Line 128)**:
```javascript
maxIncome = Math.max(150000, totalOtherIncome * 1.5);
```

**Problem**: X-axis represents total non-SS income, but should represent **incremental** non-SS income starting from current position.

#### 3. Tax Bracket Distance Mismatch
- **UI shows**: $16,000 to next bracket
- **Chart shows**: ~$10,000 distance
- **Issue**: Chart scaling doesn't match actual tax bracket calculations

#### 4. Missing Social Security Zones
- **Tax Clarity**: Shows second gray zone around $110k
- **Our chart**: Missing this zone
- **Issue**: Incomplete SS taxation threshold implementation

### Root Cause Analysis

#### Current Position Logic
The current position should represent where the taxpayer is NOW, and the X-axis should show incremental income from that point.

**Current (Incorrect)**:
- X-axis: Total non-SS income from $0
- Current position: Total current non-SS income
- Result: Position appears in tax zones even with $0 taxable income

**Should Be (Correct)**:
- X-axis: Additional non-SS income from current position
- Current position: $0 (starting point for additional income)
- Result: Position starts before tax effects, matching Tax Clarity

#### Chart Data Generation
The chart generates data for income values from 0 to maxIncome, but should generate data for:
- Base income (current situation) + additional income from 0 to range

### Proposed Solution

#### 1. Fix Current Position
- Set current position to $0 on X-axis (representing no additional income)
- Use current income as baseline for all calculations

#### 2. Fix X-Axis Representation
- X-axis should show "Additional Non-SS Income" starting from $0
- All calculations should be: current_income + additional_income

#### 3. Fix Tax Bracket Scaling
- Ensure chart distances match actual tax bracket calculations
- Verify bracket thresholds align with right panel data

#### 4. Add Missing SS Zones
- Implement complete Social Security taxation thresholds
- Add second taxation zone around higher income levels

### Implementation Strategy

1. **Careful Analysis**: Examine current calculation logic without breaking it
2. **Incremental Changes**: Make small, testable changes
3. **Verification**: Compare each change against Tax Clarity behavior
4. **Testing**: Ensure all existing functionality remains intact

### Files to Modify
- `src/components/InteractiveTaxMap.jsx` (primary)
- Potentially tax calculation utilities if needed

### Success Criteria
- Current position (green line) starts at $0 before any tax effects
- Chart distances match right panel tax bracket information
- All Social Security taxation zones visible
- Chart behavior matches Tax Clarity reference

