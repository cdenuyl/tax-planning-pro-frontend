# Feature Documentation

## 🎯 **Complete Feature Overview**

### **1. Filing Status Support**

#### **Available Options**
- **Single:** Individual taxpayer
- **Married Filing Jointly:** Married couple filing together
- **Head of Household:** Single with qualifying dependents

#### **Tax Implications**
- **Different Tax Brackets:** Each status has unique bracket thresholds
- **Standard Deductions:** 
  - Single: $15,000 (+$2,000 if over 65)
  - Married Filing Jointly: $30,000 (+$1,600 per spouse over 65)
  - Head of Household: $22,500 (+$2,000 if over 65)
- **Social Security Thresholds:**
  - Single/HOH: $25,000 (Tier I), $34,000 (Tier II)
  - Married Filing Jointly: $32,000 (Tier I), $44,000 (Tier II)

#### **How to Use**
1. Select filing status from dropdown in People tab
2. Tax calculations automatically update
3. Add spouse information if filing jointly

---

### **2. Spouse Age Integration**

#### **Features**
- **Automatic Age Calculation:** Enter birthdate, age calculates automatically
- **Joint Deductions:** Additional deductions for spouses over 65
- **Real-time Updates:** Changes immediately affect tax calculations

#### **Age-Based Deductions**
- **Single/HOH:** +$2,000 if taxpayer over 65
- **Married Filing Jointly:** +$1,600 for each spouse over 65

#### **How to Use**
1. Select "Married Filing Jointly" filing status
2. Enter spouse first name, last name, and date of birth
3. Age automatically calculates and updates deductions
4. Verify additional deduction appears in tax summary

---

### **3. Dynamic Income Source Management**

#### **Income Source Types**
- **Traditional IRA:** Subject to early withdrawal penalties
- **401k:** Subject to early withdrawal penalties  
- **Roth IRA:** Subject to early withdrawal penalties
- **Savings Account:** No penalties
- **Dividends:** Investment income
- **Interest:** Bank/bond interest
- **Social Security:** Special taxation rules
- **Annuity:** Retirement income
- **Pension:** Employer retirement plan
- **Wages:** Employment income
- **Other:** Miscellaneous income

#### **Owner Assignment**
- **Taxpayer:** Income belongs to primary taxpayer
- **Spouse:** Income belongs to spouse (for joint filing)

#### **Features**
- **Add Sources:** Click "Add Income Source" button
- **Remove Sources:** Click "Remove" button next to any source
- **Edit Amounts:** Change amounts and see real-time updates
- **Toggle Sources:** Enable/disable sources for calculations
- **Persistent Storage:** Sources maintained across tab switches

#### **How to Use**
1. Go to Income tab
2. Click "Add Income Source"
3. Select account type from dropdown
4. Choose owner (Taxpayer or Spouse)
5. Enter amount
6. Toggle enabled/disabled as needed

---

### **4. Early Withdrawal Penalties**

#### **Penalty Rules**
- **10% Penalty:** Applied to Traditional IRA, 401k, Roth IRA withdrawals
- **Age Threshold:** 59.5 years old
- **Owner-Specific:** Uses age of the source owner (taxpayer or spouse)

#### **Exemption Options**
- **Penalty Exemption Toggle:** Option to exempt penalties per source
- **Common Exemptions:** First-time home purchase, education expenses, etc.

#### **Calculation Logic**
```
If (account_type in [Traditional IRA, 401k, Roth IRA]) AND 
   (owner_age < 59.5) AND 
   (penalty_exempt = false):
   penalty = withdrawal_amount * 0.10
```

#### **How to Use**
1. Add a retirement account (Traditional IRA, 401k, Roth IRA)
2. Ensure owner age is under 59.5
3. Verify 10% penalty appears in federal tax
4. Toggle "Exempt Penalty" to remove penalty if applicable

---

### **5. Tax Calculation Engine**

#### **Federal Tax Calculation**
- **Progressive Brackets:** Uses 2025 tax brackets
- **Filing Status Specific:** Different brackets for each status
- **Marginal Rate Calculation:** Determines current marginal tax rate

#### **State Tax Calculation (Michigan)**
- **Flat Rate:** 4.25% of Michigan taxable income
- **Social Security Exempt:** Michigan doesn't tax Social Security
- **Homestead Credit:** $1,715 credit for income under $69,700

#### **Social Security Taxation**
- **Provisional Income Method:** AGI + 50% of SS benefits
- **Three Tiers:**
  - Tier I: No taxation below threshold
  - Tier II: 50% taxation between thresholds
  - Tier III: 85% taxation above upper threshold

#### **Real-time Calculations**
- **Immediate Updates:** All changes trigger recalculation
- **Comprehensive Results:** Returns all tax details
- **Marginal Rate Analysis:** Shows current and next rate hike

---

### **6. Interactive Tax Map**

#### **Visualization Features**
- **Stacked Area Chart:** Shows federal and state tax progression
- **Income Source Toggles:** Interactive controls above chart
- **Real-time Updates:** Chart updates with any changes
- **Tax Clarity Style:** Professional visualization similar to Tax Clarity tool

#### **Chart Elements**
- **Federal Tax Area:** Blue area showing federal tax
- **State Tax Area:** Green area showing state tax
- **Current Income Line:** Vertical line showing current position
- **Marginal Rate Display:** Shows current marginal tax rate

#### **Interactive Controls**
- **Toggle Income Sources:** Click buttons above chart to enable/disable
- **Hover Details:** Hover over chart for specific tax amounts
- **Responsive Design:** Works on desktop and mobile

---

### **7. Tax Summary Panel**

#### **Summary Information**
- **Total Income:** Sum of all enabled income sources
- **Taxable Income:** After standard deduction
- **Federal Tax:** Including early withdrawal penalties
- **State Tax:** Michigan tax calculation
- **Total Tax:** Combined federal and state
- **Effective Rate:** Total tax / total income
- **Marginal Rate:** Current marginal tax rate

#### **Next Rate Hike Analysis**
- **Amount to Hike:** Additional income needed for next rate increase
- **Current Rate:** Current marginal tax rate
- **New Rate:** Marginal rate after hike
- **Cause:** Reason for rate increase (bracket, SS threshold, etc.)

---

### **8. User Interface Features**

#### **Three-Panel Layout**
- **Left Panel (25%):** Tabbed navigation (People, Income, Deductions, Settings)
- **Middle Panel (50%):** Interactive tax map
- **Right Panel (25%):** Tax summary and analysis

#### **Responsive Design**
- **Desktop Optimized:** Full three-panel layout
- **Mobile Friendly:** Stacked layout on small screens
- **Touch Support:** Mobile-friendly interactions

#### **Professional Styling**
- **Clean Interface:** Modern, professional appearance
- **Consistent Colors:** Blue and green theme
- **Clear Typography:** Easy to read fonts and sizes
- **Intuitive Controls:** User-friendly form elements

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Single Filer with Retirement Withdrawal**
1. Set filing status to "Single"
2. Set age to 55
3. Add Traditional IRA source with $20,000
4. Verify $2,000 penalty (10% of $20,000)
5. Toggle penalty exemption and verify penalty disappears

### **Scenario 2: Joint Filers with Social Security**
1. Set filing status to "Married Filing Jointly"
2. Add spouse over 65
3. Add Social Security source with $30,000
4. Verify additional $1,600 deduction for spouse
5. Check Social Security taxation in summary

### **Scenario 3: Multiple Income Sources**
1. Add wages ($60,000)
2. Add dividends ($5,000)
3. Add interest ($1,000)
4. Toggle sources on/off and watch calculations update
5. Verify tax map updates in real-time

### **Scenario 4: Rate Hike Analysis**
1. Set income to $45,000 (near 12% to 22% bracket)
2. Check "Next Rate Hike" in summary
3. Verify it shows amount needed to reach 22% bracket
4. Add income to cross threshold and verify rate change

---

## 🔧 **Advanced Configuration**

### **Customizing Tax Rules**
Edit `src/utils/taxCalculations.js`:
- Modify `FEDERAL_TAX_BRACKETS_2025` for different brackets
- Change `STANDARD_DEDUCTIONS_2025` for different deductions
- Update `SS_TAXATION_THRESHOLDS` for Social Security rules

### **Adding New Income Types**
Add to `INCOME_SOURCE_TYPES` array in `taxCalculations.js`:
```javascript
{
  value: 'new-type',
  label: 'New Income Type',
  hasEarlyWithdrawalPenalty: false
}
```

### **Modifying State Tax**
Change `MICHIGAN_TAX_RATE` constant or add new state tax functions.

---

This documentation covers all implemented features. Each feature is fully functional and tested.

