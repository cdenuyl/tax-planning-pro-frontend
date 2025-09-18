import { describe, it, expect, vi } from 'vitest';
import { 
  calculateTaxEfficientClaimingStrategy,
  runMonteCarloAnalysis
} from '../advancedSocialSecurityOptimization.js';

// Mock dependencies
vi.mock('../taxCalculations.js', () => ({
  calculateComprehensiveTaxes: vi.fn().mockImplementation(() => ({
    federalTaxableIncome: 50000,
    federalTax: 5000,
    federalMarginalRate: 0.22,
    socialSecurity: {
      taxableSocialSecurity: 5000
    },
    irmaa: {
      annualIncrease: 0
    },
    federalTaxBrackets: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 }
    ]
  }))
}));

vi.mock('../irmaaThresholds.js', () => ({
  getIrmaaThresholds: vi.fn().mockReturnValue({
    single: [
      { threshold: 97000, premium: 0 },
      { threshold: 123000, premium: 800 }
    ],
    marriedFilingJointly: [
      { threshold: 194000, premium: 0 },
      { threshold: 246000, premium: 800 }
    ]
  })
}));

describe('Advanced Social Security Optimization', () => {
  // Sample test data
  const taxpayerInfo = {
    dateOfBirth: '1960-01-01',
    filingStatus: 'single'
  };
  
  const spouseInfo = {
    dateOfBirth: '1962-01-01'
  };
  
  const incomeSources = [
    { type: 'w2', amount: 50000, enabled: true },
    { type: 'interest', amount: 5000, enabled: true }
  ];
  
  // Simplified optimization settings to reduce computation
  const optimizationSettings = {
    taxpayerFRABenefit: 2500,
    spouseFRABenefit: 1800,
    taxpayerLifeExpectancy: 75, // Reduced for testing
    spouseLifeExpectancy: 77,   // Reduced for testing
    discountRate: 3,
    colaRate: 2.5,
    considerIRMAA: true,
    considerRothConversions: true,
    targetTaxBracket: 12
  };

  describe('calculateTaxEfficientClaimingStrategy', () => {
    it('returns a valid strategy object', () => {
      // Use a reduced set of claiming ages for testing
      vi.spyOn(Array.prototype, 'forEach').mockImplementation(function(callback) {
        // Only test with ages 62 and 70 to reduce computation
        const ages = [62, 70];
        for (const age of ages) {
          callback.call(this, age);
        }
        return this;
      });

      const result = calculateTaxEfficientClaimingStrategy(
        taxpayerInfo,
        null, // No spouse for simpler test
        incomeSources,
        optimizationSettings
      );
      
      expect(result).toHaveProperty('bestStrategy');
      expect(result).toHaveProperty('optimizationFactors');
      expect(result).toHaveProperty('analysis');
      
      expect(result.bestStrategy).toHaveProperty('taxpayerClaimingAge');
      expect(result.bestStrategy).toHaveProperty('afterTaxPresentValue');
    });

    it('handles invalid inputs gracefully', () => {
      // Use a reduced set of claiming ages for testing
      vi.spyOn(Array.prototype, 'forEach').mockImplementation(function(callback) {
        // Only test with age 62 to reduce computation
        callback.call(this, 62);
        return this;
      });

      // Invalid taxpayer info
      const result1 = calculateTaxEfficientClaimingStrategy(
        null,
        null,
        incomeSources,
        optimizationSettings
      );
      
      expect(result1).toHaveProperty('bestStrategy');
      
      // Invalid income sources
      const result2 = calculateTaxEfficientClaimingStrategy(
        taxpayerInfo,
        null,
        null,
        optimizationSettings
      );
      
      expect(result2).toHaveProperty('bestStrategy');
    });
  });

  describe('runMonteCarloAnalysis', () => {
    it('returns valid Monte Carlo analysis results', () => {
      // Mock the calculateTaxEfficientClaimingStrategy function to avoid heavy computation
      vi.spyOn(global, 'calculateTaxEfficientClaimingStrategy').mockImplementation(() => ({
        bestStrategy: {
          taxpayerClaimingAge: 70,
          spouseClaimingAge: null,
          afterTaxPresentValue: 500000,
          strategy: { taxpayerDelay: 3, spouseDelay: 0 }
        }
      }));

      const result = runMonteCarloAnalysis(
        taxpayerInfo,
        null, // No spouse for simpler test
        incomeSources,
        optimizationSettings,
        10 // Very small number of scenarios for testing
      );
      
      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('valuePercentiles');
      expect(result).toHaveProperty('claimingAgeFrequency');
      expect(result).toHaveProperty('riskMetrics');
    });

    it('handles invalid inputs gracefully', () => {
      // Invalid taxpayer info
      const result1 = runMonteCarloAnalysis(
        null,
        null,
        incomeSources,
        optimizationSettings,
        5
      );
      
      expect(result1).toHaveProperty('scenarios');
      expect(result1.scenarios).toBe(0);
    });
  });
});

