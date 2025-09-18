import { describe, it, expect } from 'vitest';
import { 
  calculateNIIT,
  calculateNetInvestmentIncome,
  getNIITAnalysis,
  NIIT_RATE,
  NIIT_THRESHOLDS
} from '../niitTax.js';

describe('Net Investment Income Tax (NIIT) Calculations', () => {
  describe('Constants', () => {
    it('should have correct NIIT rate', () => {
      expect(NIIT_RATE).toBe(0.038);
    });

    it('should have correct NIIT thresholds', () => {
      expect(NIIT_THRESHOLDS.single).toBe(200000);
      expect(NIIT_THRESHOLDS.marriedFilingJointly).toBe(250000);
      expect(NIIT_THRESHOLDS['married-filing-jointly']).toBe(250000); // Legacy format
      expect(NIIT_THRESHOLDS.headOfHousehold).toBe(200000);
    });
  });

  describe('calculateNetInvestmentIncome', () => {
    it('calculates net investment income correctly', () => {
      const incomeSources = [
        { type: 'interest', amount: 5000, enabled: true },
        { type: 'dividends', amount: 3000, enabled: true },
        { type: 'long-term-capital-gains', amount: 10000, enabled: true },
        { type: 'short-term-capital-gains', amount: 7000, enabled: true },
        { type: 'w2', amount: 100000, enabled: true }, // Not investment income
        { type: 'rental', amount: 12000, enabled: true },
        { type: 'social-security', amount: 20000, enabled: true } // Not investment income
      ];
      
      const result = calculateNetInvestmentIncome(incomeSources);
      
      // Should include interest, dividends, capital gains, and rental income
      const expectedTotal = 5000 + 3000 + 10000 + 7000 + 12000;
      expect(result).toBe(expectedTotal);
    });

    it('excludes disabled income sources', () => {
      const incomeSources = [
        { type: 'interest', amount: 5000, enabled: true },
        { type: 'dividends', amount: 3000, enabled: false }, // Disabled
        { type: 'long-term-capital-gains', amount: 10000, enabled: true }
      ];
      
      const result = calculateNetInvestmentIncome(incomeSources);
      
      // Should only include interest and capital gains
      const expectedTotal = 5000 + 10000;
      expect(result).toBe(expectedTotal);
    });

    it('returns 0 when no investment income sources', () => {
      const incomeSources = [
        { type: 'w2', amount: 100000, enabled: true },
        { type: 'social-security', amount: 20000, enabled: true }
      ];
      
      const result = calculateNetInvestmentIncome(incomeSources);
      expect(result).toBe(0);
    });

    it('handles monthly frequency correctly', () => {
      const incomeSources = [
        { type: 'interest', amount: 1000, frequency: 'monthly', enabled: true },
        { type: 'dividends', amount: 3000, enabled: true } // Default yearly
      ];
      
      const result = calculateNetInvestmentIncome(incomeSources);
      
      // Monthly interest should be annualized: $1,000 * 12 = $12,000
      // Plus yearly dividends: $3,000
      const expectedTotal = 12000 + 3000;
      expect(result).toBe(expectedTotal);
    });

    it('handles invalid inputs gracefully', () => {
      expect(calculateNetInvestmentIncome(null)).toBe(0);
      expect(calculateNetInvestmentIncome(undefined)).toBe(0);
      expect(calculateNetInvestmentIncome('not an array')).toBe(0);
      expect(calculateNetInvestmentIncome([])).toBe(0);
    });

    it('handles malformed income sources gracefully', () => {
      const incomeSources = [
        { type: 'interest', amount: 5000, enabled: true },
        null,
        undefined,
        { type: 'dividends' }, // Missing amount
        { amount: 3000, enabled: true }, // Missing type
        { type: 'long-term-capital-gains', amount: 10000, enabled: true }
      ];
      
      const result = calculateNetInvestmentIncome(incomeSources);
      
      // Should only include valid sources
      const expectedTotal = 5000 + 10000;
      expect(result).toBe(expectedTotal);
    });
  });

  describe('calculateNIIT', () => {
    it('calculates NIIT correctly for income above threshold (single)', () => {
      const magi = 220000; // Above single threshold of $200,000
      const netInvestmentIncome = 20000;
      const filingStatus = 'single';
      
      const result = calculateNIIT(magi, netInvestmentIncome, filingStatus);
      
      // NIIT is 3.8% of the lesser of:
      // 1. Net investment income ($20,000)
      // 2. MAGI minus threshold ($220,000 - $200,000 = $20,000)
      // So 3.8% of $20,000 = $760
      expect(result.niitTax).toBe(760);
      expect(result.applies).toBe(true);
      expect(result.threshold).toBe(200000);
      expect(result.excessIncome).toBe(20000);
    });

    it('calculates NIIT correctly for income above threshold (married)', () => {
      const magi = 300000; // Above married threshold of $250,000
      const netInvestmentIncome = 30000;
      const filingStatus = 'marriedFilingJointly';
      
      const result = calculateNIIT(magi, netInvestmentIncome, filingStatus);
      
      // NIIT is 3.8% of the lesser of:
      // 1. Net investment income ($30,000)
      // 2. MAGI minus threshold ($300,000 - $250,000 = $50,000)
      // So 3.8% of $30,000 = $1,140
      expect(result.niitTax).toBe(1140);
      expect(result.applies).toBe(true);
    });

    it('returns 0 tax for income below threshold', () => {
      const magi = 180000; // Below single threshold of $200,000
      const netInvestmentIncome = 20000;
      const filingStatus = 'single';
      
      const result = calculateNIIT(magi, netInvestmentIncome, filingStatus);
      expect(result.niitTax).toBe(0);
      expect(result.applies).toBe(false);
    });

    it('returns 0 tax when no net investment income', () => {
      const magi = 250000; // Above threshold
      const netInvestmentIncome = 0;
      const filingStatus = 'single';
      
      const result = calculateNIIT(magi, netInvestmentIncome, filingStatus);
      expect(result.niitTax).toBe(0);
      expect(result.applies).toBe(false);
    });

    it('handles legacy filing status format correctly', () => {
      const magi = 300000;
      const netInvestmentIncome = 30000;
      
      const result1 = calculateNIIT(magi, netInvestmentIncome, 'marriedFilingJointly');
      const result2 = calculateNIIT(magi, netInvestmentIncome, 'married-filing-jointly');
      
      // Both formats should produce the same result
      expect(result1.niitTax).toBe(result2.niitTax);
      expect(result1.threshold).toBe(result2.threshold);
    });

    it('handles invalid filing status gracefully', () => {
      const magi = 300000;
      const netInvestmentIncome = 30000;
      
      const result = calculateNIIT(magi, netInvestmentIncome, 'invalid-status');
      
      // Should default to single filing status
      expect(result.threshold).toBe(200000);
    });

    it('handles invalid inputs gracefully', () => {
      // Invalid MAGI
      const result1 = calculateNIIT(null, 30000, 'single');
      expect(result1.niitTax).toBe(0);
      
      // Invalid netInvestmentIncome
      const result2 = calculateNIIT(300000, null, 'single');
      expect(result2.niitTax).toBe(0);
      
      // Invalid both
      const result3 = calculateNIIT(null, null, 'single');
      expect(result3.niitTax).toBe(0);
      
      // NaN values
      const result4 = calculateNIIT(NaN, NaN, 'single');
      expect(result4.niitTax).toBe(0);
    });
  });

  describe('getNIITAnalysis', () => {
    it('returns correct analysis for income subject to NIIT', () => {
      const magi = 220000; // Above threshold
      const netInvestmentIncome = 20000;
      const filingStatus = 'single';
      
      const result = getNIITAnalysis(magi, netInvestmentIncome, filingStatus);
      
      expect(result).toHaveProperty('threshold');
      expect(result).toHaveProperty('excessIncome');
      expect(result).toHaveProperty('niitTax');
      expect(result).toHaveProperty('applies');
      expect(result).toHaveProperty('ratePercent');
      expect(result).toHaveProperty('thresholdFormatted');
      expect(result).toHaveProperty('taxFormatted');
      
      expect(result.applies).toBe(true);
      expect(result.threshold).toBe(200000);
      expect(result.excessIncome).toBe(20000);
      expect(result.niitTax).toBe(760);
      expect(result.ratePercent).toBe('3.8%');
      expect(result.thresholdFormatted).toBe('$200,000');
      expect(result.taxFormatted).toBe('$760');
    });

    it('returns correct analysis for income not subject to NIIT', () => {
      const magi = 180000; // Below threshold
      const netInvestmentIncome = 20000;
      const filingStatus = 'single';
      
      const result = getNIITAnalysis(magi, netInvestmentIncome, filingStatus);
      
      expect(result.applies).toBe(false);
      expect(result.excessIncome).toBe(0);
      expect(result.niitTax).toBe(0);
      expect(result.distanceToThreshold).toBe(20000);
      expect(result.distanceToThresholdFormatted).toBe('$20,000');
    });

    it('handles different filing statuses with different thresholds', () => {
      const singleResult = getNIITAnalysis(220000, 20000, 'single');
      const marriedResult = getNIITAnalysis(220000, 20000, 'marriedFilingJointly');
      
      expect(singleResult.applies).toBe(true);
      expect(singleResult.threshold).toBe(200000);
      
      // For married filing jointly, $220,000 is below the threshold of $250,000
      expect(marriedResult.applies).toBe(false);
      expect(marriedResult.threshold).toBe(250000);
      expect(marriedResult.distanceToThreshold).toBe(30000);
    });

    it('handles invalid inputs gracefully', () => {
      const result = getNIITAnalysis(null, null, null);
      
      expect(result.niitTax).toBe(0);
      expect(result.applies).toBe(false);
      expect(result.taxFormatted).toBe('$0');
    });
  });
});

