import { describe, it, expect, vi } from 'vitest';
import { 
  formatCurrency, 
  formatPercentage, 
  getTaxBrackets, 
  getStandardDeduction,
  calculateComprehensiveTaxes,
  FEDERAL_TAX_BRACKETS_2025,
  STANDARD_DEDUCTIONS_2025,
  ADDITIONAL_DEDUCTION_OVER_65,
  SS_TAXATION_THRESHOLDS
} from '../taxCalculations.js';

// Mock dependencies
vi.mock('../capitalGainsTax.js', () => ({
  calculateLongTermCapitalGainsTax: vi.fn().mockImplementation(() => ({
    tax: 1500,
    ordinaryCapitalGainsTax: 1500,
    niitTax: 0,
    effectiveRate: 0.15,
    marginalRate: 0.15,
    bracket: '15%',
    niitApplies: false
  })),
  calculateShortTermCapitalGainsTax: vi.fn().mockImplementation(() => ({
    tax: 2200,
    ordinaryCapitalGainsTax: 2200,
    niitTax: 0,
    effectiveRate: 0.22,
    marginalRate: 0.22,
    bracket: '22%',
    niitApplies: false
  }))
}));

vi.mock('../niitTax.js', () => ({
  calculateNIIT: vi.fn().mockImplementation(() => ({
    niitTax: 0,
    applies: false
  })),
  calculateNetInvestmentIncome: vi.fn().mockReturnValue(10000)
}));

describe('Tax Calculation Utilities', () => {
  describe('Constants', () => {
    it('should have correct federal tax brackets', () => {
      expect(FEDERAL_TAX_BRACKETS_2025.single.length).toBeGreaterThan(0);
      expect(FEDERAL_TAX_BRACKETS_2025.marriedFilingJointly.length).toBeGreaterThan(0);
      expect(FEDERAL_TAX_BRACKETS_2025.headOfHousehold.length).toBeGreaterThan(0);
      
      // Check rates are in ascending order
      const singleRates = FEDERAL_TAX_BRACKETS_2025.single.map(b => b.rate);
      for (let i = 1; i < singleRates.length; i++) {
        expect(singleRates[i]).toBeGreaterThan(singleRates[i-1]);
      }
    });

    it('should have correct standard deductions', () => {
      expect(STANDARD_DEDUCTIONS_2025.single).toBeGreaterThan(0);
      expect(STANDARD_DEDUCTIONS_2025.marriedFilingJointly).toBeGreaterThan(STANDARD_DEDUCTIONS_2025.single);
      expect(STANDARD_DEDUCTIONS_2025.headOfHousehold).toBeGreaterThan(STANDARD_DEDUCTIONS_2025.single);
    });

    it('should have correct additional deductions for seniors', () => {
      expect(ADDITIONAL_DEDUCTION_OVER_65.single).toBeGreaterThan(0);
      expect(ADDITIONAL_DEDUCTION_OVER_65.marriedFilingJointly).toBeGreaterThan(0);
    });

    it('should have correct Social Security taxation thresholds', () => {
      expect(SS_TAXATION_THRESHOLDS.single.tier1).toBeLessThan(SS_TAXATION_THRESHOLDS.single.tier2);
      expect(SS_TAXATION_THRESHOLDS.marriedFilingJointly.tier1).toBeLessThan(SS_TAXATION_THRESHOLDS.marriedFilingJointly.tier2);
      expect(SS_TAXATION_THRESHOLDS.marriedFilingJointly.tier1).toBeGreaterThan(SS_TAXATION_THRESHOLDS.single.tier1);
    });
  });

  describe('formatCurrency', () => {
    it('formats numbers as USD currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1500.75)).toBe('$1,501');
      expect(formatCurrency(0)).toBe('$0');
      expect(formatCurrency(-500)).toBe('-$500');
    });

    it('handles edge cases', () => {
      expect(formatCurrency(null)).toBe('$0');
      expect(formatCurrency(undefined)).toBe('$0');
      expect(formatCurrency(NaN)).toBe('$0');
    });
  });

  describe('formatPercentage', () => {
    it('formats decimal as percentage with default 2 decimal places', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(0.5)).toBe('50.00%');
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('formats decimal as percentage with specified decimal places', () => {
      expect(formatPercentage(0.1234, 1)).toBe('12.3%');
      expect(formatPercentage(0.5, 0)).toBe('50%');
    });

    it('handles edge cases', () => {
      expect(formatPercentage(null)).toBe('0.00%');
      expect(formatPercentage(undefined)).toBe('0.00%');
      expect(formatPercentage(NaN)).toBe('0.00%');
    });
  });

  describe('getTaxBrackets', () => {
    it('returns correct tax brackets for single filing status', () => {
      const brackets = getTaxBrackets('single');
      expect(brackets).toBeInstanceOf(Array);
      expect(brackets.length).toBeGreaterThan(0);
      expect(brackets[0]).toHaveProperty('min');
      expect(brackets[0]).toHaveProperty('max');
      expect(brackets[0]).toHaveProperty('rate');
    });

    it('returns correct tax brackets for married filing jointly', () => {
      const brackets = getTaxBrackets('marriedFilingJointly');
      expect(brackets).toBeInstanceOf(Array);
      expect(brackets.length).toBeGreaterThan(0);
      // First bracket should have higher thresholds than single
      expect(brackets[0].max).toBeGreaterThan(getTaxBrackets('single')[0].max);
    });

    it('returns correct tax brackets for head of household', () => {
      const brackets = getTaxBrackets('headOfHousehold');
      expect(brackets).toBeInstanceOf(Array);
      expect(brackets.length).toBeGreaterThan(0);
    });

    it('handles invalid filing status gracefully', () => {
      const brackets = getTaxBrackets('invalid');
      expect(brackets).toBeInstanceOf(Array);
      expect(brackets.length).toBeGreaterThan(0);
    });

    it('respects tax year settings', () => {
      const brackets2025 = getTaxBrackets('single', { taxYear: 2025 });
      const brackets2026 = getTaxBrackets('single', { taxYear: 2026, tcjaSunsetting: true });
      
      // Rates might change between years
      expect(brackets2025).not.toEqual(brackets2026);
    });
  });

  describe('getStandardDeduction', () => {
    it('returns correct standard deduction for single filing status', () => {
      const deduction = getStandardDeduction('single');
      expect(typeof deduction).toBe('number');
      expect(deduction).toBeGreaterThan(0);
    });

    it('returns higher standard deduction for seniors (age 65+)', () => {
      const regularDeduction = getStandardDeduction('single', 64);
      const seniorDeduction = getStandardDeduction('single', 65);
      expect(seniorDeduction).toBeGreaterThan(regularDeduction);
    });

    it('returns correct standard deduction for married filing jointly', () => {
      const singleDeduction = getStandardDeduction('single');
      const marriedDeduction = getStandardDeduction('marriedFilingJointly');
      // Married deduction should be higher than single
      expect(marriedDeduction).toBeGreaterThan(singleDeduction);
    });

    it('adds additional deduction for both spouses over 65', () => {
      const regularMarriedDeduction = getStandardDeduction('marriedFilingJointly', 64, 64);
      const oneSpouseOver65 = getStandardDeduction('marriedFilingJointly', 65, 64);
      const bothSpousesOver65 = getStandardDeduction('marriedFilingJointly', 65, 65);
      
      expect(oneSpouseOver65).toBeGreaterThan(regularMarriedDeduction);
      expect(bothSpousesOver65).toBeGreaterThan(oneSpouseOver65);
    });

    it('respects tax year settings', () => {
      const deduction2025 = getStandardDeduction('single', 64, null, { taxYear: 2025 });
      const deduction2026 = getStandardDeduction('single', 64, null, { taxYear: 2026, tcjaSunsetting: true });
      
      // Deductions might change between years
      expect(deduction2025).not.toEqual(deduction2026);
    });
  });

  describe('calculateComprehensiveTaxes', () => {
    const basicIncomeSources = [
      {
        name: 'Salary',
        type: 'w2',
        amount: 75000,
        enabled: true
      }
    ];

    const incomeSourcesWithSS = [
      {
        name: 'Salary',
        type: 'w2',
        amount: 75000,
        enabled: true
      },
      {
        name: 'Social Security',
        type: 'social-security',
        amount: 24000,
        enabled: true
      }
    ];

    const incomeSourcesWithCapitalGains = [
      {
        name: 'Salary',
        type: 'w2',
        amount: 75000,
        enabled: true
      },
      {
        name: 'Long-term Capital Gains',
        type: 'long-term-capital-gains',
        amount: 10000,
        enabled: true
      },
      {
        name: 'Short-term Capital Gains',
        type: 'short-term-capital-gains',
        amount: 10000,
        enabled: true
      }
    ];

    it('calculates taxes for basic income scenario', () => {
      const result = calculateComprehensiveTaxes(basicIncomeSources, 45, null, 'single');
      
      // Check that the result has the expected structure
      expect(result).toHaveProperty('totalIncome');
      expect(result).toHaveProperty('federalTaxableIncome');
      expect(result).toHaveProperty('federalTax');
      expect(result).toHaveProperty('stateTax');
      expect(result).toHaveProperty('socialSecurity');
      expect(result).toHaveProperty('fica');
      
      // Basic validation of values
      expect(result.totalIncome).toBe(75000);
      expect(result.federalTaxableIncome).toBeGreaterThan(0);
      expect(result.federalTaxableIncome).toBeLessThan(75000); // Due to standard deduction
      expect(result.federalTax).toBeGreaterThan(0);
      expect(result.stateTax).toBeGreaterThan(0);
    });

    it('applies standard deduction correctly', () => {
      const result = calculateComprehensiveTaxes(basicIncomeSources, 45, null, 'single');
      const standardDeduction = getStandardDeduction('single', 45);
      
      // Taxable income should be total income minus standard deduction
      expect(result.federalTaxableIncome).toBe(75000 - standardDeduction);
    });

    it('handles different filing statuses', () => {
      const singleResult = calculateComprehensiveTaxes(basicIncomeSources, 45, null, 'single');
      const marriedResult = calculateComprehensiveTaxes(basicIncomeSources, 45, 45, 'marriedFilingJointly');
      
      // Due to different tax brackets and standard deductions, these should be different
      expect(singleResult.federalTax).not.toBe(marriedResult.federalTax);
    });

    it('calculates Social Security taxation correctly', () => {
      // Below threshold - no taxation
      const lowIncomeResult = calculateComprehensiveTaxes(
        incomeSourcesWithSS,
        65, null, 'single'
      );
      
      // Above threshold - partial taxation
      const highIncomeResult = calculateComprehensiveTaxes([
        ...incomeSourcesWithSS,
        { name: 'Interest', type: 'interest', amount: 20000, enabled: true }
      ], 65, null, 'single');
      
      expect(lowIncomeResult.socialSecurity).toHaveProperty('taxableSocialSecurity');
      expect(highIncomeResult.socialSecurity).toHaveProperty('taxableSocialSecurity');
      
      // Higher income should result in more taxable Social Security
      expect(highIncomeResult.socialSecurity.taxableSocialSecurity)
        .toBeGreaterThan(lowIncomeResult.socialSecurity.taxableSocialSecurity);
    });

    it('calculates IRMAA correctly for high incomes', () => {
      // Below IRMAA threshold
      const lowIncomeResult = calculateComprehensiveTaxes(
        basicIncomeSources,
        65, null, 'single'
      );
      
      // Above IRMAA threshold
      const highIncomeResult = calculateComprehensiveTaxes([
        { name: 'Pension', type: 'pension', amount: 150000, enabled: true }
      ], 65, null, 'single');
      
      expect(lowIncomeResult).toHaveProperty('irmaa');
      expect(highIncomeResult).toHaveProperty('irmaa');
      
      // Higher income should trigger IRMAA
      expect(highIncomeResult.irmaa.applies).toBe(true);
      expect(highIncomeResult.irmaa.annualIncrease).toBeGreaterThan(0);
    });

    it('integrates capital gains calculations correctly', () => {
      const result = calculateComprehensiveTaxes(
        incomeSourcesWithCapitalGains,
        45, null, 'single'
      );
      
      expect(result).toHaveProperty('capitalGains');
      expect(result.capitalGains).toHaveProperty('longTerm');
      expect(result.capitalGains).toHaveProperty('shortTerm');
      expect(result.capitalGains).toHaveProperty('total');
      
      // Capital gains should be included in total income
      expect(result.totalIncome).toBe(75000 + 10000 + 10000);
      
      // Capital gains taxes should be calculated
      expect(result.capitalGains.longTerm.tax).toBeGreaterThan(0);
      expect(result.capitalGains.shortTerm.tax).toBeGreaterThan(0);
      expect(result.capitalGains.total.tax).toBe(
        result.capitalGains.longTerm.tax + result.capitalGains.shortTerm.tax
      );
    });

    it('handles disabled income sources correctly', () => {
      const result = calculateComprehensiveTaxes([
        { name: 'Salary', type: 'w2', amount: 75000, enabled: true },
        { name: 'Bonus', type: 'w2', amount: 25000, enabled: false } // Disabled
      ], 45, null, 'single');
      
      // Disabled income should not be included
      expect(result.totalIncome).toBe(75000);
    });

    it('handles invalid inputs gracefully', () => {
      // Invalid income sources
      const result1 = calculateComprehensiveTaxes(null, 45, null, 'single');
      expect(result1).toHaveProperty('totalIncome');
      expect(result1.totalIncome).toBe(0);
      
      // Invalid age
      const result2 = calculateComprehensiveTaxes(basicIncomeSources, null, null, 'single');
      expect(result2).toHaveProperty('totalIncome');
      
      // Invalid filing status
      const result3 = calculateComprehensiveTaxes(basicIncomeSources, 45, null, 'invalid');
      expect(result3).toHaveProperty('totalIncome');
    });
  });
});

