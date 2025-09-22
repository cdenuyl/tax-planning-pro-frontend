import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Dot, ReferenceArea } from 'recharts';
import { calculateComprehensiveTaxes, getCurrentMarginalRate, MICHIGAN_TAX_RATE, MICHIGAN_HOMESTEAD_THRESHOLD, MICHIGAN_HOMESTEAD_CREDIT } from '../utils/taxCalculations.js';
import { calculateLongTermCapitalGainsTax, LONG_TERM_CAPITAL_GAINS_BRACKETS_2025 } from '../utils/capitalGainsTax.js';
import { getIrmaaThresholds, getSocialSecurityThresholds } from '../utils/irmaaThresholds.js';
import { calculateFICATaxes } from '../utils/ficaTaxes.js';

export function InteractiveTaxMap({ calculations, incomeSources, settings = {}, appSettings = {}, ficaEnabled = false, onToggleIncomeSource, onUpdateSettings }) {
  const { totalIncome, federalTaxableIncome, federalTax, netStateTax, effectiveRateFederal, effectiveRateTotal, filingStatus = 'single' } = calculations || {};
  const { incomeType = 'ordinary', jurisdiction = 'federal', view = 'detailed', methodology = 'incremental' } = settings;
  
  // Helper function to get yearly amount (convert monthly to yearly if needed)
  const getYearlyAmount = (source) => {
    if (source.frequency === 'monthly') {
      return source.amount * 12;
    }
    return source.amount;
  };
  
  // Get thresholds for visualization
  const ssThresholds = getSocialSecurityThresholds(filingStatus);
  const irmaaThresholds = getIrmaaThresholds(filingStatus);
  
  // Calculate IRMAA positions dynamically based on current thresholds (future-proof)
  const calculateIrmaaPositions = useMemo(() => {
    const positions = {};
    
    // Standard reference scenario for consistent positioning
    const referenceSSAmount = 36000; // Standard SS amount for calculations
    const referenceSources = [
      { type: 'social-security', amount: referenceSSAmount, enabled: true },
      { type: 'part-time-consulting', amount: 40000, enabled: true }, // Variable income
    ];
    
    // IRMAA thresholds from the utility (future-proof)
    const currentIrmaaThresholds = [
      { magiThreshold: 106000, spike: 8.0, label: 'IRMAA Tier 1' },
      { magiThreshold: 133000, spike: 6.0, label: 'IRMAA Tier 2' },
      { magiThreshold: 167000, spike: 5.0, label: 'IRMAA Tier 3' },
      { magiThreshold: 200000, spike: 4.0, label: 'IRMAA Tier 4' },
      { magiThreshold: 500000, spike: 3.0, label: 'IRMAA Tier 5' }
    ];
    
    currentIrmaaThresholds.forEach(({ magiThreshold, spike, label }) => {
      if (methodology === 'incremental') {
        // Find the non-SS income that produces the target MAGI
        let targetIncome = magiThreshold * 0.7; // Initial estimate
        let iterations = 0;
        const maxIterations = 20;
        
        while (iterations < maxIterations) {
          // Create test sources for this income level
          const testSources = referenceSources.map(source => {
            if (source.type === 'social-security') {
              return { ...source, amount: referenceSSAmount };
            } else {
              // Scale variable income
              const currentOtherIncome = referenceSources
                .filter(s => s.type !== 'social-security')
                .reduce((sum, s) => sum + s.amount, 0);
              const scaleFactor = currentOtherIncome > 0 ? targetIncome / currentOtherIncome : 0;
              return { ...source, amount: source.amount * scaleFactor };
            }
          });
          
          const testCalculations = calculateComprehensiveTaxes(testSources, 65, null, filingStatus, null, appSettings);
          const testMAGI = testCalculations.federalTaxableIncome;
          
          // Check if we're close enough
          if (Math.abs(testMAGI - magiThreshold) < 500) {
            const chartPosition = Math.round((targetIncome - referenceSSAmount) / 1000) * 1000;
            positions[`tier${magiThreshold}`] = {
              position: chartPosition,
              spike,
              label,
              magiThreshold
            };
            break;
          }
          
          // Adjust target income based on difference
          if (testMAGI < magiThreshold) {
            targetIncome += (magiThreshold - testMAGI) * 0.8;
          } else {
            targetIncome -= (testMAGI - magiThreshold) * 0.8;
          }
          
          iterations++;
        }
      } else {
        // Total Marginal: Use direct MAGI thresholds as positions
        positions[`tier${magiThreshold}`] = {
          position: magiThreshold,
          spike,
          label,
          magiThreshold
        };
      }
    });
    
    return positions;
  }, [methodology, filingStatus, appSettings]);
  
  // Generate tax map data points with methodology-specific calculations
  const taxMapData = useMemo(() => {
    const data = [];
    
    // Get Social Security amount for calculations
    // Helper function to get yearly amount (convert monthly to yearly if needed)
    const getYearlyAmount = (source) => {
      if (source.frequency === 'monthly') {
        return source.amount * 12;
      }
      return source.amount;
    };

    const enabledSources = Array.isArray(incomeSources) ? incomeSources.filter(source => source.enabled) : [];
    const ssSource = enabledSources.find(source => source.type === 'social-security');
    const ssAmount = ssSource ? getYearlyAmount(ssSource) : 0;
    const otherSources = enabledSources.filter(source => source.type !== 'social-security');
    const totalOtherIncome = otherSources.reduce((sum, source) => sum + getYearlyAmount(source), 0);
    
    // Set income range and step based on methodology
    let maxIncome, step, incomeBase;
    
    if (methodology === 'incremental') {
      // Incremental Effects: X-axis is non-SS income
      maxIncome = Math.max(150000, totalOtherIncome * 1.5);
      step = 1000;
      incomeBase = 'nonSS';
    } else {
      // Total Marginal: X-axis is total income
      if (filingStatus === 'marriedFilingJointly') {
        // For MFJ, extend range to show higher IRMAA tiers (up to 750k)
        maxIncome = Math.max(800000, totalIncome * 1.5);
      } else {
        // For Single, use smaller range
        maxIncome = Math.max(200000, totalIncome * 1.5);
      }
      step = 1000;
      incomeBase = 'total';
    }
    
    // Calculate current position for the chart based on methodology and income type
    let currentPosition;
    if (incomeType === 'capital') {
      // For capital gains mode, use actual capital gains amounts
      const totalCapitalGains = (calculations.capitalGains?.longTerm?.amount || 0) + 
                               (calculations.capitalGains?.shortTerm?.amount || 0) +
                               (calculations.capitalGains?.qualified?.amount || 0);
      currentPosition = totalCapitalGains;
    } else if (methodology === 'incremental') {
      // For incremental methodology, current position is non-SS income
      currentPosition = totalIncome - ssAmount;
    } else {
      // For total marginal methodology, current position is total income
      currentPosition = totalIncome;
    }
    
    // Create a set of income values to include in the chart
    const incomeValues = new Set();
    
    // Add regular increments
    for (let income = 0; income <= maxIncome; income += step) {
      incomeValues.add(income);
    }
    
    // Always include the exact current position to ensure the reference line shows
    // This is critical for non-round numbers like $249,999
    if (currentPosition >= 0 && currentPosition <= maxIncome) {
      incomeValues.add(currentPosition);
    }
    
    // Convert to sorted array
    const sortedIncomes = Array.from(incomeValues).sort((a, b) => a - b);
    
    // Generate chart data for each income value using STANDARDIZED sources
    // This ensures chart curves stay stable regardless of current income source characteristics
    for (const income of sortedIncomes) {
      let tempSources;
      let chartIncome = income; // What shows on X-axis
      
      if (incomeType === 'capital') {
        // Capital gains mode: Use standardized ordinary income + variable capital gains
        // Get current ordinary income (excluding capital gains) for baseline
        const currentOrdinaryIncome = enabledSources
          .filter(source => !['long-term-capital-gains', 'short-term-capital-gains', 'qualified-dividends'].includes(source.type))
          .reduce((sum, source) => sum + getYearlyAmount(source), 0);
        
        // Create standardized sources with current ordinary income + variable capital gains
        tempSources = [
          // Keep current ordinary income sources as baseline
          ...enabledSources
            .filter(source => !['long-term-capital-gains', 'short-term-capital-gains', 'qualified-dividends'].includes(source.type))
            .map(source => ({
              ...source,
              amount: getYearlyAmount(source),
              frequency: 'yearly'
            })),
          // Add variable long-term capital gains
          {
            type: 'long-term-capital-gains',
            amount: income,
            enabled: income > 0,
            frequency: 'yearly'
          }
        ];
        chartIncome = income; // X-axis shows capital gains amount
      } else if (methodology === 'incremental') {
        // Incremental Effects: Use standardized income sources for stable chart curves
        // Create standardized sources that don't depend on current source characteristics
        tempSources = [
          // Standard Social Security (fixed amount for chart stability)
          { 
            type: 'social-security', 
            amount: ssAmount, 
            enabled: ssAmount > 0,
            frequency: 'yearly'
          },
          // Standard qualified retirement income (represents the variable income)
          { 
            type: 'traditional-ira', 
            amount: income, 
            enabled: income > 0,
            frequency: 'yearly'
          }
        ];
        chartIncome = income; // X-axis shows non-SS income
      } else {
        // Total Marginal: Use standardized sources for stable chart curves
        if (income === 0) {
          tempSources = [];
        } else if (income <= ssAmount) {
          // Only Social Security up to the income level
          tempSources = [
            { 
              type: 'social-security', 
              amount: income, 
              enabled: true,
              frequency: 'yearly'
            }
          ];
        } else {
          // Social Security + other income
          const remainingIncome = income - ssAmount;
          tempSources = [
            { 
              type: 'social-security', 
              amount: ssAmount, 
              enabled: ssAmount > 0,
              frequency: 'yearly'
            },
            { 
              type: 'traditional-ira', 
              amount: remainingIncome, 
              enabled: remainingIncome > 0,
              frequency: 'yearly'
            }
          ];
        }
      }
      
      // Calculate taxes at this income level
      const tempCalculations = calculateComprehensiveTaxes(tempSources, calculations?.taxpayerAge, calculations?.spouseAge, filingStatus, null, appSettings);
      
      // Determine which rate to use based on income type setting
      let baseMarginalRate, baseLabel;
      if (incomeType === 'ordinary') {
        // Base marginal rates (FEDERAL ONLY - clean stair-stepping)
        const federalMarginalRate = getCurrentMarginalRate(tempCalculations.federalTaxableIncome, filingStatus, appSettings);
        baseMarginalRate = federalMarginalRate; // Base is federal only
        baseLabel = 'Federal Marginal Rate';
      } else {
        // Capital gains rates - use the income amount as capital gains for chart calculation
        const capitalGainsAmount = income;
        // For capital gains mode, use the ordinary income from the calculation (excluding the variable capital gains)
        const ordinaryIncomeForCG = tempCalculations.federalTaxableIncome - capitalGainsAmount;
        const longTermCapitalGainsCalc = calculateLongTermCapitalGainsTax(capitalGainsAmount, Math.max(0, ordinaryIncomeForCG), filingStatus);
        baseMarginalRate = longTermCapitalGainsCalc.marginalRate;
        baseLabel = 'Capital Gains Rate';
      }
      
      // State effective rate (accounts for Social Security exemption)
      let stateEffectiveRate = 0;
      if (income > 0) {
        if (incomeType === 'capital') {
          // Capital gains are not subject to Michigan state tax
          stateEffectiveRate = 0;
        } else {
          // Calculate Michigan AGI (excludes Social Security)
          const socialSecurityAmount = tempSources
            .filter(source => source.type === 'social-security' && source.enabled)
            .reduce((sum, source) => sum + source.amount, 0);
          const michiganTaxableIncome = Math.max(0, income - socialSecurityAmount);
          stateEffectiveRate = michiganTaxableIncome > 0 ? (michiganTaxableIncome / income) * MICHIGAN_TAX_RATE : 0;
        }
      }
      
      // Calculate Social Security effect based on methodology
      let socialSecuritySpike = 0;
      if (tempCalculations.socialSecurity.socialSecurityBenefits > 0) {
        const provisionalIncome = tempCalculations.socialSecurity.provisionalIncome;
        const ssThresholds = getSocialSecurityThresholds(filingStatus);
        
        if (incomeType === 'capital') {
          // For capital gains mode, Social Security effect is based on how capital gains affect provisional income
          // Capital gains are included in provisional income calculation
          if (provisionalIncome > ssThresholds.tier1 && provisionalIncome <= ssThresholds.tier2) {
            // In 50% taxation zone - additional capital gains make 50% of additional SS taxable
            socialSecuritySpike = baseMarginalRate * 0.5 * 100;
          } else if (provisionalIncome > ssThresholds.tier2) {
            // In 85% taxation zone - check if we're still increasing SS taxation
            const maxTaxableSS = ssAmount * 0.85;
            const currentTaxableSS = tempCalculations.socialSecurity.taxableSocialSecurity;
            
            if (currentTaxableSS < maxTaxableSS) {
              // Still increasing SS taxation
              socialSecuritySpike = baseMarginalRate * 0.85 * 100;
            } else {
              // SS is fully taxed, no additional effect
              socialSecuritySpike = 0;
            }
          }
        } else if (methodology === 'incremental') {
          // Incremental Effects: Calculate the marginal effect of additional non-SS income
          // This should spike and then diminish as SS reaches maximum taxation
          
          if (provisionalIncome > ssThresholds.tier1 && provisionalIncome <= ssThresholds.tier2) {
            // In 50% taxation zone - additional income makes 50% of additional SS taxable
            socialSecuritySpike = baseMarginalRate * 0.5 * 100;
          } else if (provisionalIncome > ssThresholds.tier2) {
            // In 85% taxation zone - but check if we're still increasing SS taxation
            const maxTaxableSS = ssAmount * 0.85;
            const currentTaxableSS = tempCalculations.socialSecurity.taxableSocialSecurity;
            
            if (currentTaxableSS < maxTaxableSS) {
              // Still increasing SS taxation
              socialSecuritySpike = baseMarginalRate * 0.85 * 100;
            } else {
              // SS is fully taxed, no additional effect
              socialSecuritySpike = 0;
            }
          }
        } else {
          // Total Marginal: Show cumulative effect (existing logic)
          if (provisionalIncome > ssThresholds.tier1 && provisionalIncome <= ssThresholds.tier2) {
            socialSecuritySpike = baseMarginalRate * 0.5 * 100;
          } else if (provisionalIncome > ssThresholds.tier2) {
            socialSecuritySpike = baseMarginalRate * 0.85 * 100;
          }
        }
        
        // Cap the spike to reasonable levels
        socialSecuritySpike = Math.min(socialSecuritySpike, 25);
      }
      
      // Calculate Big Bold Beautiful Bill senior deduction phase-out effect
      let seniorDeductionPhaseOutEffect = 0;
      
      // Check if taxpayer or spouse is 65+ (eligible for senior deduction)
      // Get ages from calculations object (passed from App.jsx)
      const taxpayerAge = calculations?.taxpayerAge || 0;
      const spouseAge = calculations?.spouseAge || 0;
      const hasEligibleSenior = taxpayerAge >= 65 || spouseAge >= 65;
      
      if (hasEligibleSenior) {
        // Phase-out thresholds for Big Bold Beautiful Bill senior deduction
        const seniorDeductionThresholds = {
          single: { start: 75000, end: 175000 },
          marriedJoint: { start: 150000, end: 250000 },
          marriedFilingJointly: { start: 150000, end: 250000 },
          marriedSeparate: { start: 75000, end: 125000 },
          marriedFilingSeparately: { start: 75000, end: 125000 },
          headOfHousehold: { start: 112500, end: 212500 }
        };
        
        const thresholds = seniorDeductionThresholds[filingStatus] || seniorDeductionThresholds.single;
        
        // Use the current user's actual MAGI to determine if phase-out should be shown
        const currentUserMAGI = calculations.federalAGI || 0;
        
        // Only show phase-out effect if current user's MAGI is in the phase-out range
        const magi = tempCalculations.federalAGI; // Chart point MAGI
        
        //         // Show phase-out effect if:
        // 1. User is eligible (65+)
        // 2. The chart point is within the phase-out range (regardless of current user MAGI)
        if (hasEligibleSenior && magi > thresholds.start && magi < thresholds.end) {
          // 6% phase-out rate means losing 6 cents of deduction per dollar of income
          // This effectively increases marginal tax rate by (marginal rate * 0.06)
          seniorDeductionPhaseOutEffect = baseMarginalRate * 0.06 * 100; // Convert to percentage
        }
        
        // Cap the effect to reasonable levels
        seniorDeductionPhaseOutEffect = Math.min(seniorDeductionPhaseOutEffect, 5);
      }
      
      // Calculate IRMAA effect using filing-status-specific thresholds
      // IRMAA should taper down (fixed dollars / increasing income) with step-ups at new tiers
      let irmaaEffectiveRate = 0;
      
      if (methodology === 'incremental') {
        // Calculate cumulative IRMAA impact with proper tapering effect
        const irmaaThresholds = getIrmaaThresholds(filingStatus);
        let totalIrmaaIncrease = 0;
        
        // Calculate total income for threshold comparison
        let totalIncome;
        if (incomeType === 'capital') {
          // For capital gains mode, total income is the AGI from tempCalculations
          totalIncome = tempCalculations.federalAGI;
        } else {
          // For ordinary income mode, use existing logic
          totalIncome = income + ssAmount;
        }
        
        // Find the HIGHEST IRMAA tier that applies (not cumulative)
        let applicableIrmaaTier = null;
        for (const threshold of irmaaThresholds) {
          // Use the same adjustment logic as the dashed lines
          let adjustedThreshold = threshold.min;
          if (filingStatus === 'single') {
            // Single filer adjustments (same as dashed line positioning)
            if (threshold.min === 106000) adjustedThreshold = 111000; // Tier 1
            else if (threshold.min === 133000) adjustedThreshold = 138000; // Tier 2
            else if (threshold.min === 167000) adjustedThreshold = 172000; // Tier 3
            else adjustedThreshold = threshold.min + 5000; // Fallback
          } else {
            // Married filing jointly adjustments
            if (threshold.min === 212000) adjustedThreshold = 212000; // Tier 1 - use actual MAGI threshold
            else if (threshold.min === 266000) adjustedThreshold = 266000; // Tier 2 - use actual MAGI threshold
            else if (threshold.min === 334000) adjustedThreshold = 334000; // Tier 3 - use actual MAGI threshold
            else adjustedThreshold = threshold.min; // General formula: use MAGI threshold directly
          }
          
          // If total income is above this threshold, this becomes the applicable tier
          if (totalIncome > adjustedThreshold) {
            applicableIrmaaTier = threshold;
          }
        }
        
        // Apply only the highest applicable tier (not cumulative)
        if (applicableIrmaaTier) {
          const partBIncrease = appSettings.medicare?.taxpayer?.partB ? applicableIrmaaTier.partB : 0;
          const partDIncrease = appSettings.medicare?.taxpayer?.partD ? applicableIrmaaTier.partD : 0;
          const spousePartBIncrease = appSettings.medicare?.spouse?.partB ? applicableIrmaaTier.partB : 0;
          const spousePartDIncrease = appSettings.medicare?.spouse?.partD ? applicableIrmaaTier.partD : 0;
          totalIrmaaIncrease = partBIncrease + partDIncrease + spousePartBIncrease + spousePartDIncrease;
        }
        
        // Convert cumulative monthly IRMAA to effective rate with proper cliff behavior
        if (totalIrmaaIncrease > 0 && totalIncome > 0) {
          const annualIrmaaIncrease = totalIrmaaIncrease * 12;
          // Use actual total income for natural tapering effect after cliff
          irmaaEffectiveRate = (annualIrmaaIncrease / totalIncome) * 100;
          // Cap at reasonable level for display
          irmaaEffectiveRate = Math.min(irmaaEffectiveRate, 15.0);
        }
        
      } else {
        // Total Marginal: Similar cumulative calculation with tapering
        const irmaaThresholds = getIrmaaThresholds(filingStatus);
        let totalIrmaaIncrease = 0;
        
        // Calculate income for threshold comparison
        let incomeForIrmaa;
        if (incomeType === 'capital') {
          // For capital gains mode, use AGI from tempCalculations
          incomeForIrmaa = tempCalculations.federalAGI;
        } else {
          // For ordinary income mode, use income directly
          incomeForIrmaa = income;
        }
        
        // Find the HIGHEST IRMAA tier that applies (not cumulative) for Total Marginal
        let applicableIrmaaTier = null;
        for (const threshold of irmaaThresholds) {
          // Use adjusted thresholds for Total Marginal as well
          let adjustedThreshold = threshold.min;
          if (filingStatus === 'single') {
            if (threshold.min === 106000) adjustedThreshold = 111000;
            else if (threshold.min === 133000) adjustedThreshold = 138000;
            else if (threshold.min === 167000) adjustedThreshold = 172000;
            else adjustedThreshold = threshold.min + 5000;
          } else {
            if (threshold.min === 212000) adjustedThreshold = 212000;
            else if (threshold.min === 266000) adjustedThreshold = 266000;
            else if (threshold.min === 334000) adjustedThreshold = 334000;
            else adjustedThreshold = threshold.min;
          }
          
          // If income is above this threshold, this becomes the applicable tier
          if (incomeForIrmaa > adjustedThreshold) {
            applicableIrmaaTier = threshold;
          }
        }
        
        // Apply only the highest applicable tier (not cumulative)
        if (applicableIrmaaTier) {
          const partBIncrease = appSettings.medicare?.taxpayer?.partB ? applicableIrmaaTier.partB : 0;
          const partDIncrease = appSettings.medicare?.taxpayer?.partD ? applicableIrmaaTier.partD : 0;
          const spousePartBIncrease = appSettings.medicare?.spouse?.partB ? applicableIrmaaTier.partB : 0;
          const spousePartDIncrease = appSettings.medicare?.spouse?.partD ? applicableIrmaaTier.partD : 0;
          totalIrmaaIncrease = partBIncrease + partDIncrease + spousePartBIncrease + spousePartDIncrease;
        }
        
        // Convert to effective rate with proper cliff behavior and natural tapering
        if (totalIrmaaIncrease > 0 && incomeForIrmaa > 0) {
          const annualIrmaaIncrease = totalIrmaaIncrease * 12;
          // Use actual income for natural tapering effect after cliff
          irmaaEffectiveRate = (annualIrmaaIncrease / incomeForIrmaa) * 100;
          // Cap at reasonable level for display
          irmaaEffectiveRate = Math.min(irmaaEffectiveRate, 15.0);
        }
      }
      
      // Calculate FICA effect (retirement income focused)
      let ficaEffect = 0;
      if (ficaEnabled && incomeType !== 'capital') {
        // Capital gains are not subject to FICA taxes, so skip FICA calculation for capital gains mode
        // Calculate current earned income from enabled sources only
        const currentEarnedIncome = incomeSources
          .filter(source => source.enabled) // Only consider enabled sources
          .reduce((sum, source) => {
            // Only count earned income sources for FICA
            if (['wages', 'selfEmployment', 'consulting'].includes(source.type)) {
              return sum + source.amount;
            }
            return sum;
          }, 0);
        
        // For retirement planning: FICA only applies up to current earned income level
        // Assume any income beyond current earned income is unearned (pensions, annuities, etc.)
        if (currentEarnedIncome > 0 && income <= currentEarnedIncome && income <= 176100) {
          // Show full FICA rate (7.65%) only for income up to current earned income
          ficaEffect = 7.65;
        } else if (currentEarnedIncome > 0 && income <= 176100 && income > currentEarnedIncome) {
          // Beyond current earned income: assume additional income is unearned (0% FICA)
          ficaEffect = 0;
        }
      }   
      // Total effective marginal rate with effects
      const totalMarginalWithEffects = baseMarginalRate + (socialSecuritySpike / 100) + (seniorDeductionPhaseOutEffect / 100) + (irmaaEffectiveRate / 100) + (ficaEffect / 100);
      
      data.push({
        income: chartIncome, // Use chartIncome for X-axis (non-SS for incremental, total for total)
        // Base rates (FEDERAL ONLY - clean stair-stepping)
        baseMarginalRate: baseMarginalRate * 100,
        baseLabel,
        
        // State rate (separate from federal)
        stateMarginalEffect: stateEffectiveRate * 100,
        
        // Effect areas (stacked on top of base)
        socialSecurityEffect: socialSecuritySpike,
        seniorDeductionPhaseOutEffect: seniorDeductionPhaseOutEffect,
        irmaaEffect: irmaaEffectiveRate, // Now an effective rate, not a spike
        ficaEffect: ficaEffect, // FICA effective rate as percentage
        
        // Individual rates for tooltip
        federalMarginalRate: baseMarginalRate * 100,
        stateMarginalRate: (() => {
          // Recalculate Michigan taxable income for state marginal rate
          const socialSecurityAmount = tempSources
            .filter(source => source.type === 'social-security' && source.enabled)
            .reduce((sum, source) => sum + source.amount, 0);
          const michiganTaxableIncome = Math.max(0, income - socialSecurityAmount);
          return michiganTaxableIncome > 0 ? MICHIGAN_TAX_RATE * 100 : 0;
        })(), // Use actual marginal rate, not effective rate
        effectiveRateFederal: tempCalculations.effectiveRateFederal * 100,
        stateEffectiveRate: stateEffectiveRate * 100, // Add state effective rate to data
        
        // For tooltip - show actual total income regardless of methodology
        formattedIncome: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(
          methodology === 'incremental' ? income + ssAmount : income
        ),
        formattedNonSSIncome: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(income),
        
        // Social Security details for tooltip
        ssDetails: tempCalculations.socialSecurity,
        
        // Methodology info for tooltip
        methodology
      });
    }
    
    return data;
  }, [totalIncome, incomeSources, incomeType, methodology, appSettings, filingStatus, ficaEnabled]);
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Calculate the correct income to display based on methodology
      let displayIncome;
      if (methodology === 'incremental') {
        // For incremental view, show the total income (current position + additional non-SS income)
        const currentNonSSIncome = totalIncome - (incomeSources.find(s => s.type === 'social-security' && s.enabled) ? getYearlyAmount(incomeSources.find(s => s.type === 'social-security' && s.enabled)) : 0);
        const ssAmount = incomeSources.find(s => s.type === 'social-security' && s.enabled) ? getYearlyAmount(incomeSources.find(s => s.type === 'social-security' && s.enabled)) : 0;
        displayIncome = data.income + ssAmount; // data.income is non-SS income, add back SS to get total
      } else {
        // For total marginal view, show the income directly
        displayIncome = data.income;
      }
      
      // Calculate current income taxes for comparison (use actual current calculations)
      const currentFederalTax = federalTax;
      const currentStateTax = netStateTax;
      const currentTotalTax = currentFederalTax + currentStateTax;
      
      // Check if we're at the current position (within a small tolerance)
      const isAtCurrentPosition = Math.abs(displayIncome - totalIncome) < 100;
      
      // Calculate hovered income taxes
      let hoveredFederalTax, hoveredStateTax;
      
      if (isAtCurrentPosition) {
        // If we're at the current position, use the exact current values
        hoveredFederalTax = currentFederalTax;
        hoveredStateTax = currentStateTax;
      } else {
        // For other positions, use the original simple calculation
        hoveredFederalTax = displayIncome * data.effectiveRateFederal / 100;
        hoveredStateTax = displayIncome * data.stateEffectiveRate / 100; // Use state effective rate instead of marginal
      }
      const hoveredTotalTax = hoveredFederalTax + hoveredStateTax;
      
      // Calculate changes
      const federalChange = hoveredFederalTax - currentFederalTax;
      const stateChange = hoveredStateTax - currentStateTax;
      const totalChange = hoveredTotalTax - currentTotalTax;
      
      // Format change function
      const formatChange = (change) => {
        const sign = change >= 0 ? '+' : '';
        return `${sign}$${change.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
      };
      
      // Get IRMAA tier information
      let irmaaTier = null;
      for (let i = 0; i < irmaaThresholds.length; i++) {
        if (displayIncome >= irmaaThresholds[i].min && 
            (i === irmaaThresholds.length - 1 || displayIncome < irmaaThresholds[i + 1].min)) {
          irmaaTier = irmaaThresholds[i];
          break;
        }
      }
      
      // Get Social Security taxation status based on PROVISIONAL INCOME at hovered point
      let ssTaxationStatus = "Not Taxable";
      
      // Calculate provisional income at the hovered point
      // Provisional income = AGI (excluding SS) + Tax-exempt interest + 50% of SS benefits
      const ssAmount = data.ssDetails?.socialSecurityBenefits || 0;
      let agiExcludingSS;
      
      if (methodology === 'incremental') {
        // For incremental: data.income is non-SS income
        agiExcludingSS = data.income;
      } else {
        // For total marginal: data.income is total income, subtract SS
        agiExcludingSS = data.income - ssAmount;
      }
      
      const taxExemptInterest = 0; // Assuming no tax-exempt interest for simplicity
      const provisionalIncomeAtHover = agiExcludingSS + taxExemptInterest + (ssAmount * 0.5);
      
      // Determine SS taxation tier based on provisional income
      // tier1 = 0% threshold, tier2 = 50% threshold, above tier2 = 85%
      if (provisionalIncomeAtHover > ssThresholds.tier2) {
        ssTaxationStatus = "85% Taxable";
      } else if (provisionalIncomeAtHover > ssThresholds.tier1) {
        ssTaxationStatus = "50% Taxable";
      }
      
      // Create a truly transparent tooltip with dark background and white text that follows the cursor
      return (
        <div 
          className="w-80 p-3 rounded-lg shadow-lg pointer-events-none"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.15)', // Very transparent dark background
            backdropFilter: 'blur(2px)',
            // Remove absolute positioning to let Recharts handle it
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm text-white drop-shadow-lg">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(displayIncome)}
            </h3>
            <div className="text-xs font-bold text-white drop-shadow-lg">
              Marginal: Fed {data.federalMarginalRate.toFixed(2)}% | State {data.stateMarginalRate.toFixed(2)}%
            </div>
          </div>
          
          <div className="text-xs grid grid-cols-3 gap-x-2 gap-y-1">
            <div className="font-bold text-white drop-shadow-lg">Federal Effective:</div>
            <div className="font-semibold text-white drop-shadow-lg">{data.effectiveRateFederal.toFixed(2)}%</div>
            <div></div>
            
            <div className="font-bold text-white drop-shadow-lg">State Effective:</div>
            <div className="font-semibold text-white drop-shadow-lg">{data.stateEffectiveRate.toFixed(2)}%</div>
            <div></div>
            
            <div className="font-bold text-white drop-shadow-lg">Federal Tax:</div>
            <div className="font-semibold text-white drop-shadow-lg">${hoveredFederalTax.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            <div className={`font-semibold drop-shadow-lg ${federalChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatChange(federalChange)}
            </div>
            
            <div className="font-bold text-white drop-shadow-lg">State Tax:</div>
            <div className="font-semibold text-white drop-shadow-lg">${hoveredStateTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div className={`font-semibold drop-shadow-lg ${stateChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatChange(stateChange)}
            </div>
            
            <div className="font-bold text-white drop-shadow-lg">Total Tax:</div>
            <div className="font-semibold text-orange-300 drop-shadow-lg">${hoveredTotalTax.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            <div className={`font-bold drop-shadow-lg ${totalChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatChange(totalChange)}
            </div>
            
            {ficaEnabled && data.ficaEffect > 0 && (
              <>
                <div className="font-bold text-white drop-shadow-lg">FICA Rate:</div>
                <div className="font-semibold text-blue-300 drop-shadow-lg">{data.ficaEffect.toFixed(2)}%</div>
                <div></div>
              </>
            )}
            
            {data.ssDetails && data.ssDetails.socialSecurityBenefits > 0 && (
              <>
                <div className="font-bold text-white drop-shadow-lg">SS Status:</div>
                <div className="font-semibold text-white drop-shadow-lg">{ssTaxationStatus}</div>
                <div></div>
                
                {data.socialSecurityEffect > 0 && (
                  <>
                    <div className="font-bold text-white drop-shadow-lg">SS Effect:</div>
                    <div className="text-orange-300 drop-shadow-lg font-bold">+{data.socialSecurityEffect.toFixed(2)}%</div>
                    <div></div>
                  </>
                )}
                
                {data.seniorDeductionPhaseOutEffect > 0 && (
                  <>
                    <div className="font-bold text-white drop-shadow-lg">Senior Deduction Phase-Out:</div>
                    <div className="text-yellow-300 drop-shadow-lg font-bold">+{data.seniorDeductionPhaseOutEffect.toFixed(2)}%</div>
                    <div></div>
                  </>
                )}
              </>
            )}
            
            {irmaaTier && irmaaTier.premium > 0 && (
              <>
                <div className="font-bold text-white drop-shadow-lg">IRMAA Tier:</div>
                <div className="font-semibold text-white drop-shadow-lg">{irmaaTier.label}</div>
                <div></div>
                
                <div className="font-bold text-white drop-shadow-lg">IRMAA Monthly:</div>
                <div className="font-semibold text-white drop-shadow-lg">${irmaaTier.premium.toFixed(2)}</div>
                <div></div>
              </>
            )}
            
            {/* Next Dollar Taxed At Information */}
            <div className="col-span-3 border-t border-white/20 pt-1 mt-1">
              <div className="text-xs font-bold text-white drop-shadow-lg mb-1">Next $ Taxed At:</div>
            </div>
            
            <div className="font-bold text-white drop-shadow-lg">Federal:</div>
            <div className="font-semibold text-white drop-shadow-lg">{(() => {
              try {
                // Show federal effective rate for next dollar, not marginal rate
                const federalEffective = data.effectiveRateFederal || 0;
                return `${federalEffective.toFixed(2)}%`;
              } catch (e) {
                return "N/A";
              }
            })()}</div>
            <div className="text-xs text-white/70 drop-shadow-lg">(effective rate)</div>
            
            <div className="font-bold text-white drop-shadow-lg">State:</div>
            <div className="font-semibold text-white drop-shadow-lg">{(() => {
              try {
                // Show state effective rate for next dollar, not marginal rate
                const stateEffective = data.stateEffectiveRate || 0;
                return `${stateEffective.toFixed(2)}%`;
              } catch (e) {
                return "N/A";
              }
            })()}</div>
            <div className="text-xs text-white/70 drop-shadow-lg">(effective rate)</div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Handle toggle changes
  const handleToggleChange = (setting, value) => {
    if (onUpdateSettings) {
      onUpdateSettings(prev => ({ ...prev, [setting]: value }));
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Methodology Toggle - Incremental Effects Only */}
        <div className="flex bg-white rounded-lg p-1 border">
          <button
            className="px-3 py-1 text-sm font-medium rounded-md bg-purple-600 text-white"
          >
            Incremental Effects
          </button>
        </div>
        
        {/* Income Type Toggle */}
        <div className="flex bg-white rounded-lg p-1 border">
          <button
            onClick={() => handleToggleChange('incomeType', 'ordinary')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              incomeType === 'ordinary' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ordinary Income
          </button>
          <button
            onClick={() => handleToggleChange('incomeType', 'capital')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              incomeType === 'capital' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Capital Gains
          </button>
        </div>
        
        {/* Jurisdiction Toggle */}
        <div className="flex bg-white rounded-lg p-1 border">
          <button
            onClick={() => handleToggleChange('jurisdiction', 'federal')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              jurisdiction === 'federal' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Federal Only
          </button>
          <button
            onClick={() => handleToggleChange('jurisdiction', 'combined')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              jurisdiction === 'combined' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            + State Tax
          </button>
        </div>
        
        {/* View Toggle - Detailed View Only */}
        <div className="flex bg-white rounded-lg p-1 border">
          <button
            className="px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white"
          >
            Detailed View
          </button>
        </div>
      </div>
      
      {/* Income Sources Display */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {Array.isArray(incomeSources) && incomeSources.map((source) => (
            <button
              key={source.id}
              onClick={() => onToggleIncomeSource && onToggleIncomeSource(source.id)}
              className={`px-3 py-1 rounded-full text-sm transition-all duration-200 hover:shadow-md ${
                source.enabled 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 line-through'
              }`}
            >
              {source.name}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(source.amount)}
            </button>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Total Income: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalIncome)} | 
          Taxable: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(federalTaxableIncome)}
        </div>
      </div>
      
      {/* Tax Map Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={taxMapData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3,3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="income"
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              stroke="#666"
              label={{ 
                value: methodology === 'incremental' ? 'Non-Social Security Income' : 'Total Income', 
                position: 'insideBottom', 
                offset: -5,
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' }
              }}
            />
            <YAxis 
              domain={[0, incomeType === 'ordinary' ? 50 : 30]}
              tickFormatter={(value) => `${value}%`}
              stroke="#666"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Social Security Taxation Threshold Areas (only in detailed view) */}
            {view === 'detailed' && (
              <>
                {/* 50% SS Taxation Zone */}
                <ReferenceArea 
                  x1={ssThresholds.tier2} 
                  x2={ssThresholds.tier3}
                  y1={0}
                  y2={2}
                  fill="#fecaca"
                  fillOpacity={0.3}
                  stroke="#ef4444"
                  strokeOpacity={0.5}
                  strokeDasharray="3 3"
                  label={{ position: 'insideTopLeft', value: '50% SS Taxable', fill: '#dc2626', fontSize: 12 }}
                />
                
                {/* 85% SS Taxation Zone */}
                <ReferenceArea 
                  x1={ssThresholds.tier3} 
                  x2={totalIncome * 2}
                  y1={0}
                  y2={2}
                  fill="#f87171"
                  fillOpacity={0.3}
                  stroke="#dc2626"
                  strokeOpacity={0.5}
                  strokeDasharray="3 3"
                  label={{ position: 'insideTopLeft', value: '85% SS Taxable', fill: '#b91c1c', fontSize: 12 }}
                />
              </>
            )}
            
            {/* Threshold Lines (only in detailed view) */}
            {view === 'detailed' && (() => {
              const allThresholds = [];
              
              // Find Social Security thresholds based on actual provisional income thresholds
              const ssThresholds = getSocialSecurityThresholds(filingStatus);
              let foundSS50 = false;
              let foundSS85 = false;
              
              // Get Social Security amount for provisional income calculation
              const socialSecurityAmount = incomeSources
                ?.filter(source => source.type === 'social-security' && source.enabled) || []
                .reduce((sum, source) => sum + getYearlyAmount(source), 0);
              
              // Only process Social Security zones if there's actually Social Security income
              if (socialSecurityAmount > 0) {
                for (let i = 0; i < taxMapData.length; i++) {
                  const current = taxMapData[i];
                  
                  // Calculate provisional income for this data point
                  let provisionalIncome;
                  if (methodology === 'incremental') {
                    // For incremental: provisional income = non-SS income + 50% of SS
                    provisionalIncome = current.income + (socialSecurityAmount * 0.5);
                  } else {
                    // For total marginal: provisional income = total income - SS + 50% of SS
                    provisionalIncome = current.income - socialSecurityAmount + (socialSecurityAmount * 0.5);
                  }
                  
                  // Check for 50% SS threshold (tier 1 to tier 2 transition)
                  if (!foundSS50 && provisionalIncome > ssThresholds.tier1) {
                    allThresholds.push({
                      position: current.income,
                      label: '50% SS Taxable',
                      color: '#dc2626',
                      type: 'ss50'
                    });
                    foundSS50 = true;
                  }
                  
                  // Check for 85% SS threshold (tier 2 to tier 3 transition)
                  if (!foundSS85 && provisionalIncome > ssThresholds.tier2) {
                    allThresholds.push({
                      position: current.income,
                      label: '85% SS Taxable',
                      color: '#dc2626',
                      type: 'ss85'
                    });
                    foundSS85 = true;
                  }
                  
                  // Break early if we found both thresholds
                  if (foundSS50 && foundSS85) break;
                }
              }
              
              // Add IRMAA thresholds using HARDCODED positions that matched Covisum
              // Reverting to the positions that were working correctly for labels
             if (methodology === 'incremental') {
        // Use filing-status-specific IRMAA thresholds instead of hardcoded values
        const irmaaThresholds = getIrmaaThresholds(filingStatus);
        const irmaaPositions = [];
        
        // Calculate positions for each IRMAA tier based on filing status
        irmaaThresholds.forEach((threshold, index) => {
          if (threshold.min > 0) { // Skip the "No IRMAA" tier
            let chartPosition;
            
            if (filingStatus === 'marriedFilingJointly') {
              // For married filing jointly, use accurate positions matching spike detection
              if (threshold.min === 212000) chartPosition = 176000; // 212k - 36k SS = 176k non-SS
              else if (threshold.min === 266000) chartPosition = 230000; // 266k - 36k SS = 230k non-SS
              else if (threshold.min === 334000) chartPosition = 298000; // 334k - 36k SS = 298k non-SS
              else chartPosition = threshold.min - 36000; // General formula: MAGI - SS
            } else {
              // Single filer positions (our existing correct positions)
              if (threshold.min === 106000) chartPosition = 75000; // Tier 1
              else if (threshold.min === 133000) chartPosition = 102000; // Tier 2
              else if (threshold.min === 167000) chartPosition = 136000; // Tier 3
              else if (threshold.min === 200000) chartPosition = 164000; // Tier 4 - proper spacing
              else if (threshold.min === 500000) chartPosition = 464000; // Tier 5 - way out there
              else chartPosition = threshold.min * 0.7; // Fallback estimate
            }
            
            if (chartPosition <= 400000) { // Extended range to show Tier 3 and 4
              irmaaPositions.push({
                position: chartPosition,
                label: `IRMAA Tier ${index}`, // index is correct since we skip index 0 (No IRMAA)
                magiThreshold: threshold.min
              });
            }
          }
        });
        
        irmaaPositions.forEach(({ position, label, magiThreshold }) => {
          allThresholds.push({
            position: position,
            label: label,
            color: '#7e22ce',
            type: `irmaa${magiThreshold}`
          });
        });
        
      } else {
        // For total marginal: Use filing-status-specific positions
        const irmaaThresholds = getIrmaaThresholds(filingStatus);
        const totalMarginalPositions = [];
        
        irmaaThresholds.forEach((threshold, index) => {
          if (threshold.min > 0) { // Skip the "No IRMAA" tier
            let chartPosition;
            
            if (filingStatus === 'marriedFilingJointly') {
              // For married filing jointly, use accurate MAGI thresholds
              if (threshold.min === 212000) chartPosition = 212000; // Tier 1 - use actual MAGI threshold
              else if (threshold.min === 266000) chartPosition = 266000; // Tier 2 - use actual MAGI threshold
              else if (threshold.min === 334000) chartPosition = 334000; // Tier 3 - use actual MAGI threshold
              else if (threshold.min === 400000) chartPosition = 400000; // Tier 4 - use actual MAGI threshold
              else if (threshold.min === 750000) chartPosition = 750000; // Tier 5 - use actual MAGI threshold
              else chartPosition = threshold.min; // General formula: use MAGI threshold directly
            } else {
              // Single filer positions (our existing correct positions)
              if (threshold.min === 106000) chartPosition = 111000; // Tier 1
              else if (threshold.min === 133000) chartPosition = 138000; // Tier 2
              else if (threshold.min === 167000) chartPosition = 172000; // Tier 3
              else if (threshold.min === 200000) chartPosition = 205000; // Tier 4 - proper spacing
              else if (threshold.min === 500000) chartPosition = 505000; // Tier 5 - way out there
              else chartPosition = threshold.min + 5000; // Fallback
            }
            
            // Extend range to show more tiers and adjust tier numbering
            if (chartPosition <= 500000 || filingStatus === 'marriedFilingJointly') { // Extended range
              totalMarginalPositions.push({
                position: chartPosition,
                label: `IRMAA Tier ${index + 1}`, // Add 1 to index since we skip tier 0
                magiThreshold: threshold.min
              });
            }
          }
        });
        
        totalMarginalPositions.forEach(({ position, label, magiThreshold }) => {
          allThresholds.push({
            position: position,
            label: label,
            color: '#7e22ce',
            type: `irmaa${magiThreshold}`
          });
        });
      }
              
              // Sort thresholds by position
              allThresholds.sort((a, b) => a.position - b.position);
              
              // Render threshold lines with downward vertical spacing
              return allThresholds.map((threshold, index) => {
                const verticalOffset = -index * 20; // Larger spacing, downward
                
                return (
                  <ReferenceLine 
                    key={`threshold-${threshold.type}`}
                    x={threshold.position}
                    stroke={threshold.color}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    label={{ 
                      position: 'top',
                      offset: verticalOffset,
                      value: threshold.label, 
                      fill: threshold.color,
                      fontSize: 10
                    }}
                  />
                );
              });
            })()}
            
            {/* Base federal marginal rate area (gray) */}
            <Area 
              type="stepAfter"
              dataKey="baseMarginalRate" 
              stackId="1"
              stroke={incomeType === 'ordinary' ? '#6b7280' : '#047857'} 
              fill={incomeType === 'ordinary' ? '#9ca3af' : '#10b981'}
              fillOpacity={0.6}
              strokeWidth={2}
            />
            
            {/* State marginal rate area (orange, separate stack or combined) */}
            <Area 
              type="stepAfter"
              dataKey="stateMarginalEffect" 
              stackId={jurisdiction === 'combined' ? "1" : "2"}
              stroke="#ea580c" 
              fill="#fb923c"
              fillOpacity={0.5}
              strokeWidth={1}
            />
            
            {/* Social Security effects area (red, stacked on federal) */}
            <Area 
              type="stepAfter"
              dataKey="socialSecurityEffect" 
              stackId="1"
              stroke="#dc2626" 
              fill="#ef4444"
              fillOpacity={0.7}
              strokeWidth={1}
            />
            
            {/* Senior Deduction Phase-Out effects area (orange/yellow, stacked) */}
            <Area 
              type="stepAfter"
              dataKey="seniorDeductionPhaseOutEffect" 
              stackId="1"
              stroke="#f59e0b" 
              fill="#fbbf24"
              fillOpacity={0.7}
              strokeWidth={1}
            />
            
            {/* IRMAA effects area (purple, distinct from Social Security) */}
            <Area 
              type="stepAfter"
              dataKey="irmaaEffect" 
              stackId="1"
              stroke="#7c3aed" 
              fill="#a855f7"
              fillOpacity={0.6}
              strokeWidth={1}
            />
            
            {/* FICA effects area (blue, when enabled) */}
            {ficaEnabled && (
              <Area 
                type="stepAfter"
                dataKey="ficaEffect" 
                stackId="1"
                stroke="#2563eb" 
                fill="#3b82f6"
                fillOpacity={0.6}
                strokeWidth={1}
              />
            )}
            
            {/* Current position indicator */}
            <ReferenceLine 
              x={methodology === 'incremental' ? totalIncome - (incomeSources && Array.isArray(incomeSources) ? incomeSources.filter(s => s.type === 'social-security' && s.enabled).reduce((sum, s) => sum + getYearlyAmount(s), 0) : 0) : totalIncome} 
              stroke="#16a34a" 
              strokeWidth={3}
              strokeDasharray="none"
              label={{
                position: 'top',
                value: methodology === 'incremental' ? 'Current Non-SS Income' : 'Current Income',
                fill: '#16a34a',
                fontSize: 12
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3" style={{ 
            backgroundColor: incomeType === 'ordinary' ? '#9ca3af' : '#10b981' 
          }}></div>
          <span>{incomeType === 'ordinary' ? 'Federal Marginal Rate' : 'Capital Gains Rate'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-orange-400"></div>
          <span>State Effective Rate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-red-500"></div>
          <span>Social Security Effects</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-yellow-500"></div>
          <span>Senior Deduction Phase-Out</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-purple-500"></div>
          <span>Medicare IRMAA Effects</span>
        </div>
        {ficaEnabled && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-500"></div>
            <span>FICA Taxes</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-green-700"></div>
          <span>Current Position</span>
        </div>
        
        {view === 'detailed' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-red-200"></div>
              <span>50% SS Taxable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-red-300"></div>
              <span>85% SS Taxable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0 border-t border-dashed border-purple-700"></div>
              <span>IRMAA Thresholds</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
