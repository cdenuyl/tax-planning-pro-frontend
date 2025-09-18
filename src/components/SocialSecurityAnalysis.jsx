import React, { useState, useMemo } from 'react';

import { calculateTaxEfficientClaimingStrategy, runMonteCarloAnalysis } from '../utils/advancedSocialSecurityOptimization.js';

const SocialSecurityAnalysis = ({ 
  taxpayerInfo, 
  spouseInfo, 
  formatCurrency,
  incomeSources = [], // Add income sources prop for tax integration
  onUpdateTaxpayer,
  onUpdateSpouse
}) => {
  // Use props data instead of local state for FRA benefits
  const taxpayerFRABenefit = taxpayerInfo?.fraAmount || '';
  const spouseFRABenefit = spouseInfo?.fraAmount || '';
  
  // State for other analysis inputs (these can remain local as they're not needed in reports)
  const [taxpayerLifeExpectancy, setTaxpayerLifeExpectancy] = useState('');
  const [spouseLifeExpectancy, setSpouseLifeExpectancy] = useState('');
  const [discountRate, setDiscountRate] = useState(3);
  const [colaRate, setColaRate] = useState(2.5);
  
  // Functions to update parent state
  const setTaxpayerFRABenefit = (value) => {
    if (onUpdateTaxpayer) {
      onUpdateTaxpayer({ fraAmount: parseFloat(value) || 0 });
    }
  };
  
  const setSpouseFRABenefit = (value) => {
    if (onUpdateSpouse) {
      onUpdateSpouse({ fraAmount: parseFloat(value) || 0 });
    }
  };
  
  // State for benefit estimator
  const [taxpayerEstimateIncome, setTaxpayerEstimateIncome] = useState('');
  const [taxpayerYearsWorked, setTaxpayerYearsWorked] = useState('');
  const [taxpayerEstimatedBenefit, setTaxpayerEstimatedBenefit] = useState(null);
  const [spouseEstimateIncome, setSpouseEstimateIncome] = useState('');
  const [spouseYearsWorked, setSpouseYearsWorked] = useState('');
  const [spouseEstimatedBenefit, setSpouseEstimatedBenefit] = useState(null);

  // State for advanced optimization
  const [enableAdvancedOptimization, setEnableAdvancedOptimization] = useState(false);
  const [considerIRMAA, setConsiderIRMAA] = useState(true);
  const [considerRothConversions, setConsiderRothConversions] = useState(true);
  const [targetTaxBracket, setTargetTaxBracket] = useState(12);
  const [showMonteCarloAnalysis, setShowMonteCarloAnalysis] = useState(false);
  const [monteCarloResults, setMonteCarloResults] = useState(null);

  // Check if spouse information exists for spousal analysis
  const isMarried = spouseInfo && spouseInfo.dateOfBirth;
  const calculateFRA = (birthDate) => {
    if (!birthDate) return { years: 67, months: 0 };
    
    const birthYear = new Date(birthDate).getFullYear();
    
    if (birthYear <= 1954) return { years: 66, months: 0 };
    if (birthYear >= 1960) return { years: 67, months: 0 };
    
    // For years 1955-1959, FRA increases by 2 months per year
    const monthsToAdd = (birthYear - 1954) * 2;
    return { years: 66, months: monthsToAdd };
  };

  // Social Security benefit estimation functions
  const estimateTaxpayerBenefit = () => {
    // Simple estimation based on income and years worked
    // This is a simplified version of the AIME/PIA calculation
    const estimatedAIME = calculateEstimatedAIME(taxpayerEstimateIncome, taxpayerYearsWorked);
    const estimatedPIA = calculatePIA(estimatedAIME);
    setTaxpayerEstimatedBenefit(Math.round(estimatedPIA));
  };

  const estimateSpouseBenefit = () => {
    const estimatedAIME = calculateEstimatedAIME(spouseEstimateIncome, spouseYearsWorked);
    const estimatedPIA = calculatePIA(estimatedAIME);
    setSpouseEstimatedBenefit(Math.round(estimatedPIA));
  };

  // Calculate estimated AIME based on income and years worked
  const calculateEstimatedAIME = (annualIncome, yearsWorked) => {
    // Simplified calculation: assume consistent income over working years
    // In reality, this would use the highest 35 years with inflation indexing
    const totalYears = Math.min(yearsWorked, 35);
    const zerosYears = Math.max(0, 35 - yearsWorked);
    
    // Simple average (in reality, would need inflation indexing)
    const averageAnnualIncome = annualIncome;
    const totalIndexedEarnings = averageAnnualIncome * totalYears;
    const aime = totalIndexedEarnings / (35 * 12); // Convert to monthly
    
    return Math.min(aime, 13350); // 2025 maximum taxable earnings cap
  };

  // Calculate PIA using 2025 bend points
  const calculatePIA = (aime) => {
    const bendPoint1 = 1226;
    const bendPoint2 = 7391;
    
    let pia = 0;
    
    if (aime <= bendPoint1) {
      pia = aime * 0.90;
    } else if (aime <= bendPoint2) {
      pia = (bendPoint1 * 0.90) + ((aime - bendPoint1) * 0.32);
    } else {
      pia = (bendPoint1 * 0.90) + ((bendPoint2 - bendPoint1) * 0.32) + ((aime - bendPoint2) * 0.15);
    }
    
    return pia;
  };

  // Get FRA for taxpayer and spouse
  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate benefit adjustment factor
  const calculateAdjustmentFactor = (claimingAge, fra, birthYear) => {
    const fraInMonths = fra.years * 12 + fra.months;
    const claimingAgeInMonths = claimingAge * 12;
    const monthsDifference = claimingAgeInMonths - fraInMonths;

    if (monthsDifference === 0) {
      return 1.0; // 100% at FRA
    } else if (monthsDifference < 0) {
      // Early retirement reduction
      const monthsEarly = Math.abs(monthsDifference);
      let reduction = 0;
      
      // First 36 months: 5/9 of 1% per month
      const firstPeriod = Math.min(monthsEarly, 36);
      reduction += firstPeriod * (5/9) * 0.01;
      
      // Additional months: 5/12 of 1% per month
      if (monthsEarly > 36) {
        const additionalMonths = monthsEarly - 36;
        reduction += additionalMonths * (5/12) * 0.01;
      }
      
      return Math.max(0.75, 1.0 - reduction); // Minimum 75%
    } else {
      // Delayed retirement credits
      const monthsDelayed = monthsDifference;
      const yearsDelayed = monthsDelayed / 12;
      
      // 8% per year for those born 1943 or later, 2/3% per month
      if (birthYear >= 1943) {
        return 1.0 + (yearsDelayed * 0.08);
      } else {
        // Graduated scale for earlier birth years
        return 1.0 + (yearsDelayed * 0.065);
      }
    }
  };

  // Calculate spousal benefit (50% of higher earner's FRA benefit)
  const calculateSpousalBenefit = (ownBenefit, spouseFRABenefit) => {
    const spousalAmount = spouseFRABenefit * 0.5;
    return Math.max(ownBenefit, spousalAmount);
  };

  // Calculate present value of lifetime benefits
  const calculatePresentValue = (monthlyBenefit, startAge, lifeExpectancy, discountRate, colaRate) => {
    let presentValue = 0;
    const monthlyDiscountRate = discountRate / 100 / 12;
    const monthlyCOLA = colaRate / 100 / 12;
    
    const totalMonths = (lifeExpectancy - startAge) * 12;
    
    for (let month = 0; month < totalMonths; month++) {
      const adjustedBenefit = monthlyBenefit * Math.pow(1 + monthlyCOLA, month);
      const discountedBenefit = adjustedBenefit / Math.pow(1 + monthlyDiscountRate, month);
      presentValue += discountedBenefit;
    }
    
    return presentValue;
  };

  // Get taxpayer and spouse data
  const taxpayerAge = calculateAge(taxpayerInfo?.dateOfBirth);
  const spouseAge = isMarried ? calculateAge(spouseInfo?.dateOfBirth) : 0;
  const taxpayerFRA = calculateFRA(taxpayerInfo?.dateOfBirth);
  const spouseFRA = isMarried ? calculateFRA(spouseInfo?.dateOfBirth) : { years: 67, months: 0 };
  const taxpayerBirthYear = taxpayerInfo?.dateOfBirth ? new Date(taxpayerInfo.dateOfBirth).getFullYear() : 1960;
  const spouseBirthYear = isMarried && spouseInfo?.dateOfBirth ? new Date(spouseInfo.dateOfBirth).getFullYear() : 1960;

  // Calculate benefits for all claiming ages
  const claimingAges = [62, 63, 64, 65, 66, 67, 68, 69, 70];
  
  const taxpayerBenefits = useMemo(() => {
    // Only calculate if we have valid inputs
    const fraAmount = parseFloat(taxpayerFRABenefit) || 0;
    const lifeExp = parseFloat(taxpayerLifeExpectancy) || 0;
    
    if (fraAmount === 0 || lifeExp === 0) {
      return []; // Return empty array if inputs are invalid
    }
    
    return claimingAges.map(age => {
      // Calculate own benefit
      const adjustmentFactor = calculateAdjustmentFactor(age, taxpayerFRA, taxpayerBirthYear);
      const ownBenefit = fraAmount * adjustmentFactor;
      
      // Calculate spousal benefit (50% of spouse's FRA benefit, with own adjustment factor)
      const spouseFRAAmount = parseFloat(spouseFRABenefit) || 0;
      const spousalBenefit = isMarried && spouseFRAAmount > 0 ? (spouseFRAAmount * 0.5 * adjustmentFactor) : 0;
      
      // Choose the higher benefit
      const monthlyBenefit = Math.max(ownBenefit, spousalBenefit);
      const benefitType = spousalBenefit > ownBenefit ? 'Spousal' : 'Own';
      
      const presentValue = calculatePresentValue(monthlyBenefit, age, lifeExp, discountRate, colaRate);
      
      return {
        age,
        monthlyBenefit,
        ownBenefit,
        spousalBenefit,
        benefitType,
        adjustmentFactor,
        presentValue,
        adjustmentPercent: (adjustmentFactor * 100).toFixed(1),
        isSpousalBenefit: spousalBenefit > ownBenefit
      };
    });
  }, [taxpayerFRABenefit, taxpayerFRA, taxpayerBirthYear, taxpayerLifeExpectancy, discountRate, colaRate, spouseFRABenefit, isMarried]);

  const spouseBenefits = useMemo(() => {
    if (!isMarried) return [];
    
    // Only calculate if we have valid inputs
    const spouseFRAAmount = parseFloat(spouseFRABenefit) || 0;
    const spouseLifeExp = parseFloat(spouseLifeExpectancy) || 0;
    
    if (spouseFRAAmount === 0 || spouseLifeExp === 0) {
      return []; // Return empty array if inputs are invalid
    }
    
    return claimingAges.map(age => {
      // Calculate own benefit
      const adjustmentFactor = calculateAdjustmentFactor(age, spouseFRA, spouseBirthYear);
      const ownBenefit = spouseFRAAmount * adjustmentFactor;
      
      // Calculate spousal benefit (50% of taxpayer's FRA benefit, with own adjustment factor)
      const taxpayerFRAAmount = parseFloat(taxpayerFRABenefit) || 0;
      const spousalBenefit = taxpayerFRAAmount > 0 ? (taxpayerFRAAmount * 0.5 * adjustmentFactor) : 0;
      
      // Choose the higher benefit
      const monthlyBenefit = Math.max(ownBenefit, spousalBenefit);
      const benefitType = spousalBenefit > ownBenefit ? 'Spousal' : 'Own';
      
      const presentValue = calculatePresentValue(monthlyBenefit, age, spouseLifeExp, discountRate, colaRate);
      
      return {
        age,
        monthlyBenefit,
        ownBenefit,
        spousalBenefit,
        benefitType,
        adjustmentFactor,
        presentValue,
        adjustmentPercent: (adjustmentFactor * 100).toFixed(1),
        isSpousalBenefit: spousalBenefit > ownBenefit
      };
    });
  }, [spouseFRABenefit, spouseFRA, spouseBirthYear, spouseLifeExpectancy, discountRate, colaRate, taxpayerFRABenefit, isMarried]);

  // Calculate joint optimization for married couples
  const jointOptimization = useMemo(() => {
    if (!isMarried) return null;
    
    let bestStrategy = null;
    let maxJointValue = 0;
    
    // Test all combinations of claiming ages and benefit types
    for (const taxpayerStrategy of taxpayerBenefits) {
      for (const spouseStrategy of spouseBenefits) {
        // Calculate joint present value considering survivor benefits
        const jointValue = taxpayerStrategy.presentValue + spouseStrategy.presentValue;
        
        if (jointValue > maxJointValue) {
          maxJointValue = jointValue;
          bestStrategy = {
            taxpayerAge: taxpayerStrategy.age,
            spouseAge: spouseStrategy.age,
            taxpayerBenefit: taxpayerStrategy.monthlyBenefit,
            spouseBenefit: spouseStrategy.monthlyBenefit,
            taxpayerType: taxpayerStrategy.benefitType,
            spouseType: spouseStrategy.benefitType,
            jointValue: maxJointValue
          };
        }
      }
    }
    
    return bestStrategy;
  }, [taxpayerBenefits, spouseBenefits, isMarried]);

  // Find optimal single strategy
  const optimalTaxpayerStrategy = taxpayerBenefits.length > 0 ? taxpayerBenefits.reduce((best, current) => 
    current.presentValue > best.presentValue ? current : best
  ) : null;

  const optimalSpouseStrategy = isMarried && spouseBenefits.length > 0 ? spouseBenefits.reduce((best, current) => 
    current.presentValue > best.presentValue ? current : best
  ) : null;

  // Advanced tax-efficient optimization
  const advancedOptimization = useMemo(() => {
    if (!enableAdvancedOptimization || !incomeSources || incomeSources.length === 0) {
      return null;
    }

    const optimizationSettings = {
      taxpayerFRABenefit,
      spouseFRABenefit,
      taxpayerLifeExpectancy,
      spouseLifeExpectancy,
      discountRate,
      colaRate,
      considerIRMAA,
      considerRothConversions,
      targetTaxBracket
    };

    return calculateTaxEfficientClaimingStrategy(
      taxpayerInfo,
      spouseInfo,
      incomeSources,
      optimizationSettings
    );
  }, [
    enableAdvancedOptimization,
    incomeSources,
    taxpayerInfo,
    spouseInfo,
    taxpayerFRABenefit,
    spouseFRABenefit,
    taxpayerLifeExpectancy,
    spouseLifeExpectancy,
    discountRate,
    colaRate,
    considerIRMAA,
    considerRothConversions,
    targetTaxBracket
  ]);

  // Monte Carlo analysis function
  const runMonteCarloAnalysisHandler = async () => {
    if (!incomeSources || incomeSources.length === 0) {
      alert('Income sources are required for Monte Carlo analysis');
      return;
    }

    const optimizationSettings = {
      taxpayerFRABenefit,
      spouseFRABenefit,
      taxpayerLifeExpectancy,
      spouseLifeExpectancy,
      discountRate,
      colaRate,
      considerIRMAA,
      considerRothConversions,
      targetTaxBracket
    };

    const results = runMonteCarloAnalysis(
      taxpayerInfo,
      spouseInfo,
      incomeSources,
      optimizationSettings,
      500 // Number of scenarios
    );

    setMonteCarloResults(results);
    setShowMonteCarloAnalysis(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Security Analysis</h2>
          <p className="text-gray-600">
            Comprehensive Social Security optimization including spousal benefits and claiming strategies.
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Inputs</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Taxpayer Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {taxpayerInfo?.firstName || 'Taxpayer'} FRA Benefit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={taxpayerFRABenefit}
                      onChange={(e) => setTaxpayerFRABenefit(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2500"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">/month</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Life Expectancy</label>
                  <input
                    type="number"
                    value={taxpayerLifeExpectancy}
                    onChange={(e) => setTaxpayerLifeExpectancy(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="85"
                  />
                </div>
              </div>
              
              {/* Social Security Benefit Estimator */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Don't have your SS statement?</h4>
                <p className="text-xs text-gray-600 mb-3">Use our estimator based on income history</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Annual Income</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        type="number"
                        value={taxpayerEstimateIncome}
                        onChange={(e) => setTaxpayerEstimateIncome(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="75000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Years Worked</label>
                    <input
                      type="number"
                      value={taxpayerYearsWorked}
                      onChange={(e) => setTaxpayerYearsWorked(Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="35"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => estimateTaxpayerBenefit()}
                  className="mt-2 w-full bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Estimate FRA Benefit
                </button>
                
                {taxpayerEstimatedBenefit && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Estimated FRA Benefit:</div>
                    <div className="text-sm font-semibold text-green-600">
                      ${taxpayerEstimatedBenefit}/month
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Based on {taxpayerYearsWorked} years at ${taxpayerEstimateIncome.toLocaleString()}/year
                    </div>
                    <button
                      onClick={() => setTaxpayerFRABenefit(taxpayerEstimatedBenefit.toString())}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Use This Estimate
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Spouse Inputs - Always show, regardless of marriage status */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {spouseInfo?.firstName ? `${spouseInfo.firstName}'s FRA Benefit` : 'Spouse FRA Benefit'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={spouseFRABenefit}
                      onChange={(e) => setSpouseFRABenefit(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1800"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">/month</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Life Expectancy</label>
                  <input
                    type="number"
                    value={spouseLifeExpectancy}
                    onChange={(e) => setSpouseLifeExpectancy(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="87"
                  />
                </div>
              </div>
              
              {/* Spouse Social Security Benefit Estimator */}
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  💡 Estimate {spouseInfo?.firstName ? `${spouseInfo.firstName}'s` : 'Spouse'} SS Benefit
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Based on {spouseInfo?.firstName ? `${spouseInfo.firstName}'s` : 'spouse'} income history
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Annual Income</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        type="number"
                        value={spouseEstimateIncome}
                        onChange={(e) => setSpouseEstimateIncome(Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="55000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Years Worked</label>
                    <input
                      type="number"
                      value={spouseYearsWorked}
                      onChange={(e) => setSpouseYearsWorked(Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="30"
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => estimateSpouseBenefit()}
                  className="mt-2 w-full bg-purple-600 text-white text-xs py-1 px-2 rounded hover:bg-purple-700 transition-colors"
                >
                  Estimate FRA Benefit
                </button>
                
                {spouseEstimatedBenefit && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Estimated FRA Benefit:</div>
                    <div className="text-sm font-semibold text-purple-600">
                      ${spouseEstimatedBenefit}/month
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Based on {spouseYearsWorked} years at ${spouseEstimateIncome.toLocaleString()}/year
                    </div>
                    <button
                      onClick={() => setSpouseFRABenefit(spouseEstimatedBenefit.toString())}
                      className="mt-1 text-xs text-purple-600 hover:text-purple-800"
                    >
                      Use This Estimate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Common Analysis Settings */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Rate</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="3"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">COLA Rate</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={colaRate}
                  onChange={(e) => setColaRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2.5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Optimization Settings */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🚀 Advanced Tax-Efficient Optimization</h3>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableAdvancedOptimization}
                onChange={(e) => setEnableAdvancedOptimization(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enable Advanced Analysis</span>
            </label>
          </div>
          
          {enableAdvancedOptimization && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Tax Bracket</label>
                  <select
                    value={targetTaxBracket}
                    onChange={(e) => setTargetTaxBracket(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>Stay in 10% bracket</option>
                    <option value={12}>Fill 12% bracket</option>
                    <option value={22}>Fill 22% bracket</option>
                    <option value={24}>Fill 24% bracket</option>
                    <option value={32}>Fill 32% bracket</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={considerIRMAA}
                      onChange={(e) => setConsiderIRMAA(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Consider IRMAA Impact</span>
                  </label>
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={considerRothConversions}
                      onChange={(e) => setConsiderRothConversions(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Roth Conversion Opportunities</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={runMonteCarloAnalysisHandler}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Run Monte Carlo Analysis
                </button>
                
                {monteCarloResults && (
                  <button
                    onClick={() => setShowMonteCarloAnalysis(!showMonteCarloAnalysis)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    {showMonteCarloAnalysis ? 'Hide' : 'Show'} Risk Analysis
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Strategy</h3>
          
          {isMarried && jointOptimization ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {taxpayerInfo?.firstName || 'Taxpayer'}: Age {jointOptimization.taxpayerAge}
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(jointOptimization.taxpayerBenefit)}/month
                </div>
                <div className="text-xs mt-1">
                  <span className={`px-2 py-1 rounded ${
                    jointOptimization.taxpayerType === 'Spousal' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {jointOptimization.taxpayerType}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  Spouse: Age {jointOptimization.spouseAge}
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(jointOptimization.spouseBenefit)}/month
                </div>
                <div className="text-xs mt-1">
                  <span className={`px-2 py-1 rounded ${
                    jointOptimization.spouseType === 'Spousal' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {jointOptimization.spouseType}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(jointOptimization.jointValue)}
                </div>
                <div className="text-sm text-gray-600">Total Present Value</div>
              </div>
            </div>
          ) : optimalTaxpayerStrategy ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Age {optimalTaxpayerStrategy.age}</div>
                <div className="text-sm text-gray-600">{taxpayerInfo?.firstName || 'Taxpayer'} Claiming Age</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(optimalTaxpayerStrategy.presentValue)}
                </div>
                <div className="text-sm text-gray-600">Total Present Value</div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-500 mb-2">📊</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Strategy Not Available</h4>
              <p className="text-sm text-gray-600">
                Please fill in the FRA benefit amount and life expectancy to see the recommended claiming strategy.
              </p>
            </div>
          )}
        </div>

        {/* Advanced Tax-Efficient Strategy Results */}
        {enableAdvancedOptimization && advancedOptimization && advancedOptimization.bestStrategy && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Tax-Efficient Strategy</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {taxpayerInfo?.firstName || 'Taxpayer'}: Age {advancedOptimization.bestStrategy.taxpayerClaimingAge}
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(advancedOptimization.bestStrategy.taxpayerMonthlyBenefit)}/month
                </div>
                <div className="text-xs mt-1 text-purple-600">
                  Optimization Score: {advancedOptimization.analysis?.summary?.optimizationScore || 0}/100
                </div>
              </div>
              
              {isMarried && advancedOptimization.bestStrategy.spouseClaimingAge && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    Spouse: Age {advancedOptimization.bestStrategy.spouseClaimingAge}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(advancedOptimization.bestStrategy.spouseMonthlyBenefit)}/month
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(advancedOptimization.bestStrategy.afterTaxPresentValue)}
                </div>
                <div className="text-sm text-gray-600">After-Tax Present Value</div>
                {advancedOptimization.bestStrategy.irmaaImpact > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    IRMAA Impact: -{formatCurrency(advancedOptimization.bestStrategy.irmaaImpact)}
                  </div>
                )}
              </div>
            </div>

            {/* Optimization Analysis */}
            <div className="space-y-3">
              {/* Recommendations */}
              {advancedOptimization.analysis?.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">💡 Recommendations</h4>
                  <div className="space-y-2">
                    {advancedOptimization.analysis.recommendations.map((rec, index) => (
                      <div key={index} className="bg-green-50 p-2 rounded text-sm text-green-800">
                        {typeof rec === 'string' ? rec : (
                          <div>
                            {rec.title && <div className="font-medium">{rec.title}</div>}
                            {rec.description && <div>{rec.description}</div>}
                            {rec.impact && <div className="text-xs mt-1">Impact: {rec.impact}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Warnings */}
              {advancedOptimization.analysis?.warnings?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">⚠️ Warnings</h4>
                  <div className="space-y-2">
                    {advancedOptimization.analysis.warnings.map((warning, index) => (
                      <div key={index} className="bg-orange-50 p-2 rounded text-sm text-orange-800">
                        {typeof warning === 'string' ? warning : (
                          <div>
                            {warning.title && <div className="font-medium">{warning.title}</div>}
                            {warning.description && <div>{warning.description}</div>}
                            {warning.impact && <div className="text-xs mt-1">Impact: {warning.impact}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Opportunities */}
              {advancedOptimization.analysis?.opportunities?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">🚀 Opportunities</h4>
                  <div className="space-y-2">
                    {advancedOptimization.analysis.opportunities.map((opp, index) => (
                      <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                        <div className="font-medium text-blue-800">{opp.title}</div>
                        <div className="text-blue-700">{opp.description}</div>
                        {opp.potential && <div className="text-blue-600 text-xs">{opp.potential}</div>}
                        {opp.years && (
                          <div className="text-blue-600 text-xs">
                            Opportunity years: {opp.years.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monte Carlo Risk Analysis */}
        {showMonteCarloAnalysis && monteCarloResults && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Monte Carlo Risk Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Strategy Frequency</h4>
                <div className="text-sm text-gray-600 mb-2">
                  Most frequent optimal strategy: <span className="font-medium">{monteCarloResults.mostFrequentStrategy}</span>
                </div>
                <div className="space-y-1 text-xs">
                  {Object.entries(monteCarloResults.claimingAgeFrequency)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([strategy, frequency]) => (
                      <div key={strategy} className="flex justify-between">
                        <span>Ages {strategy}:</span>
                        <span>{((frequency / monteCarloResults.scenarios) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Value Distribution</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Best Case (90th percentile):</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(monteCarloResults.valuePercentiles.p90)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected (50th percentile):</span>
                    <span className="font-medium">
                      {formatCurrency(monteCarloResults.valuePercentiles.p50)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Worst Case (10th percentile):</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(monteCarloResults.valuePercentiles.p10)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 mt-2">
                    <span>Standard Deviation:</span>
                    <span className="font-medium">
                      {formatCurrency(monteCarloResults.riskMetrics.standardDeviation)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-orange-100 rounded text-sm">
              <div className="font-medium text-orange-800 mb-1">Risk Assessment</div>
              <div className="text-orange-700">
                Based on {monteCarloResults.scenarios} scenarios with varying assumptions, 
                the recommended strategy shows consistency across different economic conditions.
                {monteCarloResults.riskMetrics.standardDeviation > 50000 && 
                  " High variability suggests considering more conservative approaches."}
              </div>
            </div>
          </div>
        )}

        {/* Joint Strategy Heat Map */}
        {isMarried && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Joint Claiming Strategy Matrix</h3>
            <p className="text-sm text-gray-600 mb-6">
              Interactive visualization showing total present value for all claiming age combinations. 
              Darker colors indicate higher lifetime benefits.
            </p>
            
            {/* Show message if data is not available */}
            {(taxpayerBenefits.length === 0 || spouseBenefits.length === 0) ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <div className="text-gray-500 mb-2">📊</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Matrix Not Available</h4>
                <p className="text-sm text-gray-600">
                  Please fill in the FRA benefit amounts and life expectancies for both spouses to see the joint claiming strategy matrix.
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  Required fields: FRA Benefit Amount, Life Expectancy (for both taxpayer and spouse)
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Heat Map Grid */}
                <div className="flex-1">
                  <div className="relative">
                    {/* Y-axis label */}
                    <div className="absolute -left-16 top-1/2 transform -rotate-90 text-sm font-medium text-gray-700">
                      Spouse Claiming Age
                    </div>
                    
                    {/* Grid container */}
                    <div className="ml-8">
                      {/* X-axis labels */}
                      <div className="flex mb-2">
                        <div className="w-8"></div>
                        {claimingAges.map(age => (
                          <div key={age} className="w-12 text-center text-xs font-medium text-gray-600">
                            {age}
                          </div>
                        ))}
                      </div>
                      
                      {/* Grid rows */}
                      {claimingAges.slice().reverse().map(spouseAge => (
                        <div key={spouseAge} className="flex items-center mb-1">
                          {/* Y-axis label */}
                          <div className="w-8 text-right text-xs font-medium text-gray-600 pr-2">
                            {spouseAge}
                          </div>
                          
                          {/* Grid cells */}
                          {claimingAges.map(taxpayerAge => {
                            const taxpayerStrategy = taxpayerBenefits.find(b => b.age === taxpayerAge);
                            const spouseStrategy = spouseBenefits.find(b => b.age === spouseAge);
                            const jointValue = taxpayerStrategy && spouseStrategy ? 
                              taxpayerStrategy.presentValue + spouseStrategy.presentValue : 0;
                            
                            // Calculate color intensity based on joint value (with safety checks)
                            let intensity = 0;
                            if (taxpayerBenefits.length > 0 && spouseBenefits.length > 0) {
                              const allJointValues = taxpayerBenefits.flatMap(tb => 
                                spouseBenefits.map(sb => tb.presentValue + sb.presentValue)
                              );
                              const maxValue = Math.max(...allJointValues);
                              const minValue = Math.min(...allJointValues);
                              if (maxValue > minValue) {
                                intensity = (jointValue - minValue) / (maxValue - minValue);
                              }
                            }
                            
                            const isOptimal = jointOptimization && 
                              taxpayerAge === jointOptimization.taxpayerAge && 
                              spouseAge === jointOptimization.spouseAge;
                          
                          return (
                            <div
                              key={`${taxpayerAge}-${spouseAge}`}
                              className={`w-12 h-8 border border-gray-300 flex items-center justify-center text-xs relative cursor-pointer hover:border-gray-500 transition-colors ${
                                isOptimal ? 'ring-2 ring-green-500' : ''
                              }`}
                              style={{
                                backgroundColor: `rgba(34, 197, 94, ${0.2 + intensity * 0.8})`
                              }}
                              title={`Taxpayer: ${taxpayerAge}, Spouse: ${spouseAge} - ${formatCurrency(jointValue)}`}
                            >
                              {isOptimal && (
                                <span className="text-white font-bold">⭐</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    {/* X-axis title */}
                    <div className="text-center text-sm font-medium text-gray-700 mt-2">
                      {taxpayerInfo?.firstName || 'Taxpayer'} Claiming Age
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend and Info */}
              <div className="lg:w-64">
                {/* Color Legend */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Total Benefits</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(34, 197, 94, 1)'}}></div>
                      <span className="text-xs text-gray-600">Highest</span>
                    </div>
                    <div className="h-16 w-4 rounded mr-2 relative" style={{
                      background: 'linear-gradient(to bottom, rgba(34, 197, 94, 1), rgba(34, 197, 94, 0.2))'
                    }}></div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded mr-2" style={{backgroundColor: 'rgba(34, 197, 94, 0.2)'}}></div>
                      <span className="text-xs text-gray-600">Lowest</span>
                    </div>
                  </div>
                </div>
                
                {/* Strategy Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">⭐</span>
                      <span>Optimal Strategy</span>
                    </div>
                    <div>
                      <strong>Hover</strong> over cells to see exact values
                    </div>
                    <div>
                      <strong>Darker colors</strong> = Higher lifetime benefits
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Individual Benefit Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Taxpayer Benefits */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {taxpayerInfo?.firstName || 'Taxpayer'} Benefit Analysis
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Current Age: {taxpayerAge} | FRA: {taxpayerFRA.years} years {taxpayerFRA.months} months
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monthly</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adjustment</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {taxpayerBenefits.map((benefit) => {
                    const isOptimal = optimalTaxpayerStrategy && benefit.age === optimalTaxpayerStrategy.age;
                    const isFRA = benefit.age === taxpayerFRA.years;
                    const isEarly = benefit.age < taxpayerFRA.years;
                    const isDelayed = benefit.age > taxpayerFRA.years;
                    
                    return (
                      <tr key={benefit.age} className={isOptimal ? 'bg-green-50' : ''}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            {isOptimal && <span className="text-green-500 mr-1">⭐</span>}
                            <span className={isFRA ? 'font-medium text-blue-600' : ''}>
                              {benefit.age}
                              {isFRA && ' (FRA)'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className={
                            isEarly ? 'text-red-600' : 
                            isDelayed ? 'text-green-600' : 
                            'text-blue-600'
                          }>
                            {formatCurrency(benefit.monthlyBenefit)}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          {benefit.isSpousalBenefit ? (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              Spousal
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              Own
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                          {benefit.adjustmentPercent}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(benefit.presentValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Spouse Benefits - Only show if married */}
          {isMarried && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {spouseInfo?.firstName || 'Spouse'} Benefit Analysis
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Current Age: {spouseAge} | FRA: {spouseFRA.years} years {spouseFRA.months} months
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monthly</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Present Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {spouseBenefits.map((benefit) => {
                      const isOptimal = optimalSpouseStrategy && benefit.age === optimalSpouseStrategy.age;
                      const isFRA = benefit.age === spouseFRA.years;
                      const isEarly = benefit.age < spouseFRA.years;
                      const isDelayed = benefit.age > spouseFRA.years;
                      
                      return (
                        <tr key={benefit.age} className={isOptimal ? 'bg-green-50' : ''}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <div className="flex items-center">
                              {isOptimal && <span className="text-green-500 mr-1">⭐</span>}
                              <span className={isFRA ? 'font-medium text-blue-600' : ''}>
                                {benefit.age}
                                {isFRA && ' (FRA)'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm">
                            <span className={
                              isEarly ? 'text-red-600' : 
                              isDelayed ? 'text-green-600' : 
                              'text-blue-600'
                            }>
                              {formatCurrency(benefit.monthlyBenefit)}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            {benefit.isSpousalBenefit ? (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                Spousal
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                Own
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(benefit.presentValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Survivor Benefits Analysis for Married Couples */}
        {isMarried && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Survivor Benefits Analysis</h3>
            <p className="text-sm text-gray-600 mb-4">
              Planning for survivor benefits ensures the surviving spouse receives the maximum possible benefit.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* If Taxpayer Dies First */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  If {taxpayerInfo?.firstName || 'Taxpayer'} Dies First
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current {spouseInfo?.firstName || 'Spouse'} benefit:</span>
                    <span className="font-medium">
                      {formatCurrency(optimalSpouseStrategy?.monthlyBenefit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential survivor benefit:</span>
                    <span className="font-medium">
                      {formatCurrency(optimalTaxpayerStrategy?.monthlyBenefit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Survivor would receive:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(Math.max(
                        optimalSpouseStrategy?.monthlyBenefit || 0,
                        optimalTaxpayerStrategy?.monthlyBenefit || 0
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Survivor receives the higher of their own benefit or 100% of deceased spouse's benefit.
                  </p>
                </div>
              </div>

              {/* If Spouse Dies First */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  If {spouseInfo?.firstName || 'Spouse'} Dies First
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current {taxpayerInfo?.firstName || 'Taxpayer'} benefit:</span>
                    <span className="font-medium">
                      {formatCurrency(optimalTaxpayerStrategy?.monthlyBenefit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential survivor benefit:</span>
                    <span className="font-medium">
                      {formatCurrency(optimalSpouseStrategy?.monthlyBenefit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Survivor would receive:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(Math.max(
                        optimalTaxpayerStrategy?.monthlyBenefit || 0,
                        optimalSpouseStrategy?.monthlyBenefit || 0
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Survivor receives the higher of their own benefit or 100% of deceased spouse's benefit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Insights and Recommendations */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Financial Impact</h4>
              <div className="text-sm text-gray-700 space-y-2">
                {optimalTaxpayerStrategy ? (
                  <p>
                    • Delaying from age 62 to {optimalTaxpayerStrategy.age} increases lifetime value by{' '}
                    {formatCurrency(
                      optimalTaxpayerStrategy.presentValue - 
                      (taxpayerBenefits.find(b => b.age === 62)?.presentValue || 0)
                    )}
                  </p>
                ) : (
                  <p>
                    • Fill in your benefit information to see personalized insights
                  </p>
                )}
                <p>
                  • Each year of delay past FRA increases benefits by approximately 8%
                </p>
                {isMarried && jointOptimization && (
                  <p>
                    • Joint optimization strategy provides{' '}
                    {formatCurrency(jointOptimization.jointValue)} in combined lifetime benefits
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Important Considerations</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <p>• Health status and family longevity history</p>
                <p>• Other retirement income sources and cash flow needs</p>
                <p>• Tax implications of Social Security benefits</p>
                {isMarried && (
                  <>
                    <p>• Spousal benefit coordination and timing</p>
                    <p>• Survivor benefit protection for the surviving spouse</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-500">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This analysis assumes you stop working when claiming benefits. 
              Continuing to work before Full Retirement Age may reduce benefits due to the earnings test. 
              Consult with a financial advisor for personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialSecurityAnalysis;

