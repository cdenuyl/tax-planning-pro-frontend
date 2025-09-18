import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { InteractiveTaxMap } from './components/InteractiveTaxMap.jsx';
import AssetsTab from './components/AssetsTab.jsx';
import SequenceOfReturnsAnalysis from './components/SequenceOfReturnsAnalysis.jsx';
import SocialSecurityAnalysis from './components/SocialSecurityAnalysis.jsx';
import ComprehensiveReports from './components/ComprehensiveReports.jsx';
import ClientManagementTab from './components/ClientManagementTab.jsx';
import ClientSelector from './components/ClientSelector.jsx';
import ClientProfileModal from './components/ClientProfileModal.jsx';
import LoginPage from './components/auth/LoginPage.jsx';
import UserManagement from './components/auth/UserManagement.jsx';
import UserSettings from './components/auth/UserSettings.jsx';
import ClientSharingModal from './components/auth/ClientSharingModal.jsx';
import BrandingSettings from './components/BrandingSettings.jsx';
import HelpSystem from './components/HelpSystem.jsx';
import HelpModal, { helpContent } from './components/HelpModal.jsx';
import { calculateComprehensiveTaxes, formatCurrency, formatPercentage, MICHIGAN_TAX_RATE, getYearlyAmount } from './utils/taxCalculations.js';
import { findNextRateHike, findNextRateChanges } from './utils/nextRateHike.js';
import { generateOptimizationRecommendations, generateMultiYearStrategy } from './utils/aiOptimization';
import { calculateMichiganHomesteadCredit, calculateMichiganPropertyTaxExemptions } from './utils/michiganHomestead';
import { calculateAnnuityTaxation, calculateAnnuityRMD, getAnnuityTaxStrategies, classifyAnnuity } from './utils/annuityTaxation';
import { calculateLifeInsuranceIncomeStream, getLifeInsuranceTaxStrategies, classifyLifeInsurancePolicy } from './utils/lifeInsuranceTaxation';
import { getIrmaaThresholds, getSocialSecurityThresholds } from './utils/irmaaThresholds.js';
import { getComprehensiveMarginalAnalysis } from './utils/comprehensiveMarginalRateAnalysis.js';
import { getCapitalGainsAnalysis, formatCapitalGainsCurrency, formatCapitalGainsPercentage } from './utils/capitalGainsAnalysis.js';
import { getCapitalGainsInfo } from './utils/capitalGainsTax.js';
import { calculateFICATaxes, formatFICABreakdown } from './utils/ficaTaxes.js';
import { calculateNIIT, calculateNetInvestmentIncome, getNIITAnalysis } from './utils/niitTax.js';
import { calculateAdditionalMedicareTax, getAdditionalMedicareTaxAnalysis } from './utils/additionalMedicareTax.js';
import { getAMTAnalysis, formatAMTCurrency, formatAMTPercentage } from './utils/amtTax.js';
import { updateRMDCalculations, isRMDQualifiedAccount, formatRMDDisplay } from './utils/rmdCalculations.js';
import { 
  generateClientId, 
  getClientTemplate, 
  saveClientsData, 
  loadClientsData, 
  migrateScenarioDataToClient,
  getDefaultClientSettings 
} from './utils/clientManagement.js';
import { 
  isAuthenticated, 
  getCurrentUser, 
  getCurrentSession,
  clearSession,
  getAccessibleClients,
  canAccessClient,
  hasPermission,
  PERMISSIONS,
  USER_ROLES
} from './utils/auth.js';
import './App.css';
import taxLogo from './assets/tax-on-a-me-logo.png';

// Asset-based income types (these can have account values)
const assetBasedIncomeTypes = [
  'traditional-ira', 'roth-ira', '401k', 'traditional-401k', 'roth-401k', 
  '403b', '457', 'sep-ira', 'simple-ira', 'annuity', 'brokerage', 
  'savings', 'cd', 'real-estate', 'business'
];

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  
  try {
    const [month, day, year] = dateOfBirth.split('/').map(Number);
    if (!month || !day || !year) return null;
    
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}

// Tax calculation constants (these are now imported from taxCalculations.js)
function App() {
  // Scenario Management State
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      name: 'Base Case',
      isActive: true,
      data: {
        activeTab: 'people',
        ficaEnabled: false,
        taxpayer: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: null,
          filingStatus: 'single',
          state: 'Michigan',
          fraAmount: 0,
          housing: {
            ownership: 'own',
            propertyTaxValue: 0,
            propertyTaxesPaid: 0,
            michiganResident6Months: true
          }
        },
        spouse: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: null,
          fraAmount: 0,
          housing: {
            ownership: 'own',
            propertyTaxValue: 0,
            propertyTaxesPaid: 0,
            michiganResident6Months: true
          }
        },
        incomeSources: [],
        deductions: {
          itemized: {
            saltDeduction: 0,
            mortgageInterest: 0,
            charitableGiving: 0,
            medicalExpenses: 0,
            otherDeductions: 0
          },
          state: {
            michiganDeductions: 0,
            otherCredits: 0
          }
        },
        taxMapSettings: {
          incomeType: 'ordinary',
          jurisdiction: 'federal',
          view: 'detailed',
          methodology: 'incremental'
        }
      }
    }
  ]);
  
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showMaxScenariosWarning, setShowMaxScenariosWarning] = useState(false);
  
  // Client Management State
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  
  // Household Management State
  const [households, setHouseholds] = useState([]);
  
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [showClientSharingModal, setShowClientSharingModal] = useState(false);
  const [clientToShare, setClientToShare] = useState(null);
  
  // Get current active scenario
  const activeScenario = scenarios.find(s => s.isActive) || scenarios[0];
  
  // Extract current scenario data for easier access
  const [activeTab, setActiveTab] = useState(activeScenario.data.activeTab || 'people');
  const [ficaEnabled, setFicaEnabled] = useState(activeScenario.data.ficaEnabled);
  const [taxpayer, setTaxpayer] = useState(activeScenario.data.taxpayer);
  const [spouse, setSpouse] = useState(activeScenario.data.spouse);
  const [incomeSources, setIncomeSources] = useState(activeScenario.data.incomeSources);
  const [deductions, setDeductions] = useState(activeScenario.data.deductions);
  const [taxMapSettings, setTaxMapSettings] = useState(activeScenario.data.taxMapSettings);
  
  // Middle pane analysis type state
  const [middlePaneAnalysis, setMiddlePaneAnalysis] = useState('taxMap'); // 'taxMap', 'sequenceReturns', 'socialSecurity', 'assets', 'clients', or 'reports'
  
  // Assets state for bi-directional functionality with income sources
  const [assets, setAssets] = useState(activeScenario.data.assets || []);

  // Calculate initial ages for taxpayer and spouse if they have birthdates but no ages
  useEffect(() => {
    // Calculate taxpayer age if birthdate exists but age is null
    if (taxpayer.dateOfBirth && taxpayer.age === null) {
      const calculatedAge = calculateAge(taxpayer.dateOfBirth);
      if (calculatedAge !== null) {
        setTaxpayer(prev => ({ ...prev, age: calculatedAge }));
      }
    }
    
    // Calculate spouse age if birthdate exists but age is null
    if (spouse.dateOfBirth && spouse.age === null) {
      const calculatedAge = calculateAge(spouse.dateOfBirth);
      if (calculatedAge !== null) {
        setSpouse(prev => ({ ...prev, age: calculatedAge }));
      }
    }
  }, []); // Run only once on component mount

  // Auto-enable Medicare Part B for people 65 or older (only when age changes due to birthdate)
  const [previousTaxpayerAge, setPreviousTaxpayerAge] = useState(taxpayer.age);
  const [previousSpouseAge, setPreviousSpouseAge] = useState(spouse.age);
  
  useEffect(() => {
    let needsUpdate = false;
    const newMedicareSettings = { ...appSettings.medicare };
    
    // Check if taxpayer age increased to 65+ (only auto-enable on age increase, not decrease)
    if (taxpayer.age && taxpayer.age >= 65 && 
        previousTaxpayerAge && previousTaxpayerAge < 65 && 
        !appSettings.medicare.taxpayer.partB) {
      newMedicareSettings.taxpayer.partB = true;
      needsUpdate = true;
    }
    
    // Check if spouse age increased to 65+ (only auto-enable on age increase, not decrease)
    if (spouse.age && spouse.age >= 65 && 
        previousSpouseAge && previousSpouseAge < 65 && 
        !appSettings.medicare.spouse.partB) {
      newMedicareSettings.spouse.partB = true;
      needsUpdate = true;
    }
    
    // Update previous ages
    setPreviousTaxpayerAge(taxpayer.age);
    setPreviousSpouseAge(spouse.age);
    
    // Update settings if needed
    if (needsUpdate) {
      setAppSettings(prev => ({
        ...prev,
        medicare: newMedicareSettings
      }));
    }
  }, [taxpayer.age, spouse.age]);

  // Authentication initialization
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      
      if (authenticated) {
        const user = getCurrentUser();
        const session = getCurrentSession();
        setCurrentUser(user);
        setUserSession(session);
      }
    };
    
    checkAuth();
    
    // Check authentication status periodically
    const authInterval = setInterval(checkAuth, 60000); // Check every minute
    
    return () => clearInterval(authInterval);
  }, []);

  // Tax return import state
  const [incomeEntryMode, setIncomeEntryMode] = useState('manual'); // 'manual' or 'taxReturn'
  const [taxReturnData, setTaxReturnData] = useState({
    wages: 0,                    // Line 1a - Wages, salaries, tips
    taxableInterest: 0,          // Line 2b - Taxable interest
    dividends: 0,                // Line 3a - Ordinary dividends
    iraDistributions: 0,         // Line 4a - IRA distributions
    pensionsAnnuities: 0,        // Line 4b - Pensions and annuities
    socialSecurity: 0,           // Line 5a - Social Security benefits
    capitalGains: 0,             // Line 7 - Capital gains
    otherIncome: 0,              // Line 8 - Other income
  });

  // Application settings state
  const [appSettings, setAppSettings] = useState({
    taxYear: 2025,
    tcjaSunsetting: true, // Whether to apply TCJA sunsetting for 2026+
    rmdEnabled: false, // Whether to automatically calculate and show RMDs (default off)
    medicare: {
      taxpayer: {
        partB: false,  // Taxpayer Medicare Part B coverage (default off, auto-enable for 65+)
        partD: false  // Taxpayer Medicare Part D coverage (default off)
      },
      spouse: {
        partB: false, // Spouse Medicare Part B coverage (default off, auto-enable for 65+)
        partD: false  // Spouse Medicare Part D coverage (default off)
      }
    }
  });

  // View Preferences State
  const [savedViews, setSavedViews] = useState([]);
  const [defaultViewId, setDefaultViewId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalMode, setViewModalMode] = useState('save'); // 'save' or 'manage'
  const [newViewName, setNewViewName] = useState('');
  const [setAsDefaultChecked, setSetAsDefaultChecked] = useState(false);
  const [showDeleteViewConfirm, setShowDeleteViewConfirm] = useState(null);

  // Helper function to format RMD display information
  const formatRMDDisplay = (rmdDetails) => {
    if (!rmdDetails) return null;
    
    const balance = rmdDetails.overrideBalance || rmdDetails.qualifiedBalance || 0;
    const factor = rmdDetails.factor || 1;
    const age = rmdDetails.age || 0;
    const calculatedRMD = Math.round(balance / factor);
    
    return {
      balanceDisplay: formatCurrency(balance),
      factorDisplay: factor.toFixed(1),
      ageDisplay: `${age} years`,
      calculationDisplay: `${formatCurrency(balance)} ÷ ${factor.toFixed(1)} = ${formatCurrency(calculatedRMD)}`
    };
  };

  // Function to update scenario data (taxpayer, spouse, etc.)
  const updateScenarioData = (updates) => {
    if (updates.taxpayer) {
      setTaxpayer(prev => ({ ...prev, ...updates.taxpayer }));
    }
    if (updates.spouse) {
      setSpouse(prev => ({ ...prev, ...updates.spouse }));
    }
    // Add other scenario data updates as needed
    if (updates.incomeSources) {
      setIncomeSources(updates.incomeSources);
    }
    if (updates.assets) {
      setAssets(updates.assets);
    }
  };

  // Load saved views from localStorage on component mount
  useEffect(() => {
    const loadSavedViews = () => {
      try {
        const saved = localStorage.getItem('taxCalculatorSavedViews');
        const defaultView = localStorage.getItem('taxCalculatorDefaultView');
        
        if (saved) {
          const parsedViews = JSON.parse(saved);
          setSavedViews(parsedViews);
        }
        
        if (defaultView) {
          setDefaultViewId(defaultView);
          // Apply default view on load
          const views = saved ? JSON.parse(saved) : [];
          const defaultViewData = views.find(v => v.id === defaultView);
          if (defaultViewData) {
            applyViewPreferences(defaultViewData.preferences);
          }
        }
      } catch (error) {
        console.error('Error loading saved views:', error);
      }
    };
    
    loadSavedViews();
  }, []);

  // Auto-update RMD calculations when income sources or settings change
  useEffect(() => {
    if (appSettings.rmdEnabled) {
      const updatedSources = updateRMDCalculations(incomeSources, taxpayer, spouse);
      
      // Only update if there are actual changes to avoid infinite loops
      const hasChanges = JSON.stringify(updatedSources) !== JSON.stringify(incomeSources);
      if (hasChanges) {
        setIncomeSources(updatedSources);
      }
    } else {
      // If RMD is disabled, remove auto-generated RMD sources
      const nonRMDSources = incomeSources.filter(source => source.type !== 'estimated-rmd');
      if (nonRMDSources.length !== incomeSources.length) {
        setIncomeSources(nonRMDSources);
      }
    }
  }, [appSettings.rmdEnabled, taxpayer.dateOfBirth, spouse?.dateOfBirth, 
      // Only trigger on qualified account value changes, not income amount changes
      incomeSources.filter(source => isRMDQualifiedAccount(source.type)).map(source => `${source.type}-${source.accountValue || 0}-${source.owner}`).join(',')
  ]);

  // Automatically sync existing asset-based income sources to Assets tab
  useEffect(() => {
    const assetBasedIncomeTypes = [
      'traditional-ira', 'roth-ira', 'traditional-401k', 'roth-401k', 
      '403b', '457', 'sep-ira', 'simple-ira', 'annuity', 'brokerage', 
      'savings', 'cd', 'real-estate', 'business'
    ];

    let hasChanges = false;
    const updatedAssets = [...assets];

    incomeSources.forEach(source => {
      if (assetBasedIncomeTypes.includes(source.type) && !source.isFromAsset) {
        // Skip income sources that were created from assets to prevent circular sync
        // Get the appropriate account value based on income type
        const accountValue = source.type === 'annuity' 
          ? (source.annuityDetails?.currentValue || 0)
          : (source.accountValue || 0);

        if (accountValue > 0) {
          const assetId = `income-${source.id}`;
          const existingAsset = assets.find(asset => asset.id === assetId);
          
          // Check if there's already an asset with the same name and type that was created from Assets tab
          // This prevents creating duplicate assets when an asset is created from Assets tab with income
          const assetFromAssetsTab = assets.find(asset => 
            asset.name === source.name && 
            asset.type === source.type && 
            asset.currentValue === accountValue &&
            asset.id.startsWith('asset-') // Assets created from Assets tab have 'asset-' prefix
          );

          if (!existingAsset && !assetFromAssetsTab) {
            // Create new asset for existing income source
            const newAsset = {
              id: assetId,
              name: source.name,
              type: source.type,
              owner: source.owner,
              currentValue: accountValue,
              hasIncomeSource: true,
              incomeAmount: source.amount || 0,
              enabled: source.enabled,
              linkedIncomeSourceId: source.id,
              // For annuities, copy additional details
              ...(source.type === 'annuity' && {
                annuityType: source.annuityDetails?.annuityType,
                qualifiedStatus: source.annuityDetails?.qualifiedStatus,
                annuitizationDate: source.annuityDetails?.annuitizationDate,
                exclusionRatio: source.annuityDetails?.exclusionRatio
              })
            };
            
            updatedAssets.push(newAsset);
            hasChanges = true;
          } else {
            // Update existing asset if values have changed
            const shouldUpdate = 
              existingAsset.currentValue !== accountValue ||
              existingAsset.incomeAmount !== (source.amount || 0) ||
              existingAsset.enabled !== source.enabled;

            if (shouldUpdate) {
              const assetIndex = updatedAssets.findIndex(asset => asset.id === assetId);
              if (assetIndex !== -1) {
                updatedAssets[assetIndex] = {
                  ...existingAsset,
                  currentValue: accountValue,
                  incomeAmount: source.amount || 0,
                  enabled: source.enabled,
                  // For annuities, update additional details
                  ...(source.type === 'annuity' && {
                    annuityType: source.annuityDetails?.annuityType,
                    qualifiedStatus: source.annuityDetails?.qualifiedStatus,
                    annuitizationDate: source.annuityDetails?.annuitizationDate,
                    exclusionRatio: source.annuityDetails?.exclusionRatio
                  })
                };
                hasChanges = true;
              }
            }
          }
        }
      }
    });

    if (hasChanges) {
      setAssets(updatedAssets);
      // Save to active scenario
      updateActiveScenario({ assets: updatedAssets });
    }
  }, [
    // Only trigger when asset-based income sources change their values or when scenarios change
    incomeSources.map(source => {
      if (['traditional-ira', 'roth-ira', 'traditional-401k', 'roth-401k', '403b', '457', 'sep-ira', 'simple-ira', 'annuity', 'brokerage', 'savings', 'cd', 'real-estate', 'business'].includes(source.type)) {
        const accountValue = source.type === 'annuity' 
          ? (source.annuityDetails?.currentValue || 0)
          : (source.accountValue || 0);
        return `${source.id}-${source.type}-${accountValue}-${source.amount}-${source.enabled}`;
      }
      return null;
    }).filter(Boolean).join(','),
    activeScenario.id // Also trigger when scenario changes
  ]);

  // Sync current scenario data back to client when changes are made
  useEffect(() => {
    if (activeClientId && clients.length > 0) {
      const currentScenarioData = {
        activeTab,
        ficaEnabled,
        taxpayer,
        spouse,
        incomeSources,
        deductions,
        taxMapSettings,
        assets
      };
      
      // Update the active scenario in the client data
      setClients(prev => prev.map(client => {
        if (client.id === activeClientId) {
          const updatedScenarios = client.scenarios.map(scenario => {
            if (scenario.isActive) {
              return {
                ...scenario,
                data: currentScenarioData,
                lastModified: new Date().toISOString()
              };
            }
            return scenario;
          });
          
          return {
            ...client,
            scenarios: updatedScenarios,
            profile: {
              ...client.profile,
              lastModified: new Date().toISOString()
            }
          };
        }
        return client;
      }));
    }
  }, [
    activeClientId,
    activeTab,
    ficaEnabled,
    taxpayer,
    spouse,
    incomeSources,
    deductions,
    taxMapSettings,
    assets
  ]);

  // View Preferences Functions
  const getCurrentViewPreferences = () => {
    return {
      // Core application settings
      ficaEnabled,
      activeTab,
      middlePaneAnalysis,
      taxMapSettings,
      appSettings: {
        taxYear: appSettings.taxYear,
        tcjaSunsetting: appSettings.tcjaSunsetting,
        rmdEnabled: appSettings.rmdEnabled,
        medicare: appSettings.medicare
      },
      // UI state preferences
      timestamp: new Date().toISOString()
    };
  };

  const applyViewPreferences = (preferences) => {
    if (preferences.ficaEnabled !== undefined) {
      setFicaEnabled(preferences.ficaEnabled);
    }
    if (preferences.activeTab !== undefined) {
      setActiveTab(preferences.activeTab);
    }
    if (preferences.middlePaneAnalysis !== undefined) {
      setMiddlePaneAnalysis(preferences.middlePaneAnalysis);
    }
    if (preferences.taxMapSettings) {
      setTaxMapSettings(preferences.taxMapSettings);
    }
    if (preferences.appSettings) {
      setAppSettings(prev => ({
        ...prev,
        ...preferences.appSettings
      }));
    }
    // Legacy support for direct medicare setting
    if (preferences.medicare && !preferences.appSettings?.medicare) {
      setAppSettings(prev => ({
        ...prev,
        medicare: preferences.medicare
      }));
    }
  };

  const saveView = (name, setAsDefault = false) => {
    const newView = {
      id: Date.now().toString(),
      name,
      preferences: getCurrentViewPreferences(),
      createdAt: new Date().toISOString()
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem('taxCalculatorSavedViews', JSON.stringify(updatedViews));

    if (setAsDefault) {
      setDefaultViewId(newView.id);
      localStorage.setItem('taxCalculatorDefaultView', newView.id);
    }

    return newView;
  };

  const updateView = (viewId, name) => {
    const updatedViews = savedViews.map(view => 
      view.id === viewId 
        ? { ...view, name, preferences: getCurrentViewPreferences(), updatedAt: new Date().toISOString() }
        : view
    );
    
    setSavedViews(updatedViews);
    localStorage.setItem('taxCalculatorSavedViews', JSON.stringify(updatedViews));
  };

  const deleteView = (viewId) => {
    const updatedViews = savedViews.filter(view => view.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem('taxCalculatorSavedViews', JSON.stringify(updatedViews));

    // Clear default if it was the deleted view
    if (defaultViewId === viewId) {
      setDefaultViewId(null);
      localStorage.removeItem('taxCalculatorDefaultView');
    }
  };

  const loadView = (viewId) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      applyViewPreferences(view.preferences);
    }
  };

  const setAsDefaultView = (viewId) => {
    setDefaultViewId(viewId);
    localStorage.setItem('taxCalculatorDefaultView', viewId);
  };

  // Multi-year analysis state
  const [multiYearSettings, setMultiYearSettings] = useState({
    projectionYears: 5,
    incomeGrowthRate: 3.0,
    socialSecurityCOLA: 2.5,
    rothConversionAmount: 0,
    targetTaxBracket: '12',
    retirementAtAge65: false,
    delaySocialSecurityTo70: false,
    startMedicareAt65: false
  });
  
  const [multiYearResults, setMultiYearResults] = useState(null);

  // Scenario Management Functions
  const saveCurrentScenarioData = () => {
    return {
      activeTab,
      ficaEnabled,
      taxpayer,
      spouse,
      incomeSources,
      deductions,
      taxMapSettings,
      appSettings,
      assets
    };
  };

  const updateActiveScenario = (newData) => {
    setScenarios(prev => prev.map(scenario => 
      scenario.isActive 
        ? { ...scenario, data: { ...scenario.data, ...newData } }
        : scenario
    ));
  };

  const switchToScenario = (scenarioId) => {
    // Save current scenario data first
    const currentData = saveCurrentScenarioData();
    updateActiveScenario(currentData);

    // Switch to new scenario
    setScenarios(prev => prev.map(scenario => ({
      ...scenario,
      isActive: scenario.id === scenarioId
    })));

    // Load new scenario data
    const newScenario = scenarios.find(s => s.id === scenarioId);
    if (newScenario) {
      setActiveTab(newScenario.data.activeTab);
      setFicaEnabled(newScenario.data.ficaEnabled);
      setTaxpayer(newScenario.data.taxpayer);
      setSpouse(newScenario.data.spouse);
      setIncomeSources(newScenario.data.incomeSources);
      setDeductions(newScenario.data.deductions);
      // Load appSettings if available, otherwise use current appSettings as fallback
      if (newScenario.data.appSettings) {
        setAppSettings(newScenario.data.appSettings);
      }
      setTaxMapSettings(newScenario.data.taxMapSettings);
    }
  };

  const createNewScenario = (name, cloneFromCurrent = false) => {
    const newId = Math.max(...scenarios.map(s => s.id)) + 1;
    
    let newScenarioData;
    if (cloneFromCurrent) {
      newScenarioData = saveCurrentScenarioData();
    } else {
      // Create blank scenario but preserve people data (same people, different tax scenario)
      const currentData = saveCurrentScenarioData();
      newScenarioData = {
        activeTab: 'people',
        ficaEnabled: false,
        // Preserve taxpayer and spouse information
        taxpayer: {
          ...currentData.taxpayer
        },
        spouse: {
          ...currentData.spouse
        },
        // Reset financial data for new scenario
        incomeSources: [],
        deductions: {
          itemized: {
            saltDeduction: 0,
            mortgageInterest: 0,
            charitableGiving: 0,
            medicalExpenses: 0,
            otherDeductions: 0
          },
          state: {
            michiganDeductions: 0,
            otherCredits: 0
          }
        },
        // Preserve app settings including Medicare settings
        appSettings: {
          ...currentData.appSettings
        },
        taxMapSettings: {
          incomeType: 'ordinary',
          jurisdiction: 'federal',
          view: 'detailed',
          methodology: 'incremental'
        }
      };
    }

    // Save current scenario data before switching
    const currentData = saveCurrentScenarioData();
    updateActiveScenario(currentData);

    const newScenario = {
      id: newId,
      name,
      isActive: true, // Make the new scenario active
      data: newScenarioData
    };

    // Update scenarios: deactivate current and add new active scenario
    setScenarios(prev => [...prev.map(s => ({ ...s, isActive: false })), newScenario]);
    
    // Load the new scenario data into the application state
    setActiveTab(newScenarioData.activeTab);
    setFicaEnabled(newScenarioData.ficaEnabled);
    setTaxpayer(newScenarioData.taxpayer);
    setSpouse(newScenarioData.spouse);
    setIncomeSources(newScenarioData.incomeSources);
    setDeductions(newScenarioData.deductions);
    // Load appSettings if available
    if (newScenarioData.appSettings) {
      setAppSettings(newScenarioData.appSettings);
    }
    setTaxMapSettings(newScenarioData.taxMapSettings);
    
    return newId;
  };

  const deleteScenario = (scenarioId) => {
    if (scenarios.length <= 1) return; // Don't delete the last scenario
    
    setScenarios(prev => {
      const filtered = prev.filter(s => s.id !== scenarioId);
      const deletedWasActive = prev.find(s => s.id === scenarioId)?.isActive;
      
      if (deletedWasActive && filtered.length > 0) {
        // Find the index of the deleted scenario in the original array
        const deletedIndex = prev.findIndex(s => s.id === scenarioId);
        
        // Try to switch to the scenario to the left (previous index)
        let newActiveScenario;
        if (deletedIndex > 0) {
          // Switch to the scenario to the left
          const leftScenarioId = prev[deletedIndex - 1].id;
          newActiveScenario = filtered.find(s => s.id === leftScenarioId);
        } else {
          // If we're deleting the first scenario, switch to the new first scenario
          // or prioritize the base case if it exists
          const baseCase = filtered.find(s => s.name === 'Base Case');
          newActiveScenario = baseCase || filtered[0];
        }
        
        if (newActiveScenario) {
          newActiveScenario.isActive = true;
          // Load the new active scenario data
          setActiveTab(newActiveScenario.data.activeTab);
          setFicaEnabled(newActiveScenario.data.ficaEnabled);
          setTaxpayer(newActiveScenario.data.taxpayer);
          setSpouse(newActiveScenario.data.spouse);
          setIncomeSources(newActiveScenario.data.incomeSources);
          setDeductions(newActiveScenario.data.deductions);
          setTaxReturnData(newActiveScenario.data.taxReturnData);
          setIncomeEntryMode(newActiveScenario.data.incomeEntryMode);
          // Load appSettings if available, otherwise keep current appSettings
          if (newActiveScenario.data.appSettings) {
            setAppSettings(newActiveScenario.data.appSettings);
          }
          setTaxMapSettings(newActiveScenario.data.taxMapSettings);
        }
      }
      
      return filtered;
    });
  };

  const renameScenario = (scenarioId, newName) => {
    if (!newName.trim()) return;
    setScenarios(prev => prev.map(scenario => 
      scenario.id === scenarioId 
        ? { ...scenario, name: newName.trim() }
        : scenario
    ));
    setEditingScenarioId(null);
  };

  const handleAddScenario = () => {
    if (scenarios.length >= 6) {
      setShowMaxScenariosWarning(true);
      return;
    }
    setShowScenarioModal(true);
  };

  const confirmDeleteScenario = (scenarioId) => {
    if (scenarios.length <= 1) {
      alert("Cannot delete the last scenario.");
      return;
    }
    setShowDeleteConfirm(scenarioId);
  };

  const executeDeleteScenario = () => {
    if (showDeleteConfirm) {
      deleteScenario(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  // Calculate taxes using the comprehensive calculation function with age, spouse age, filing status, deductions, and app settings
  const baseCalculations = useMemo(() => {
    return calculateComprehensiveTaxes(incomeSources, taxpayer.age, spouse.age, taxpayer.filingStatus, deductions, appSettings);
  }, [incomeSources, taxpayer.age, spouse.age, taxpayer.filingStatus, deductions, appSettings]);

  // Calculate comprehensive marginal rate analysis separately to avoid circular dependency
  const comprehensiveMarginalAnalysis = useMemo(() => {
    try {
      return getComprehensiveMarginalAnalysis(incomeSources, taxpayer.age, spouse.age, taxpayer.filingStatus, appSettings);
    } catch (error) {
      console.error('Error calculating comprehensive marginal analysis:', error);
      // Fallback to basic bracket analysis
      return {
        currentMarginalRate: baseCalculations.federalMarginalRate,
        currentBracketRate: baseCalculations.federalMarginalRate,
        amountToNextBracket: baseCalculations.amountToNextBracket,
        nextBracketRate: baseCalculations.nextBracket?.rate || baseCalculations.federalMarginalRate,
        amountToNextRateHike: baseCalculations.amountToNextBracket,
        nextEffectiveMarginalRate: baseCalculations.nextBracket?.rate || baseCalculations.federalMarginalRate,
        rateHikeSource: 'tax_bracket'
      };
    }
  }, [incomeSources, taxpayer.age, spouse.age, taxpayer.filingStatus, appSettings, baseCalculations]);

  // Create conditional calculations that exclude FICA when disabled
  const calculations = useMemo(() => {
    let baseCalc;
    if (!ficaEnabled) {
      // When FICA is disabled, subtract FICA taxes from totals
      const ficaAmount = baseCalculations.fica?.totalFICA || 0;
      baseCalc = {
        ...baseCalculations,
        totalTax: baseCalculations.totalTax - ficaAmount,
        effectiveRateTotal: baseCalculations.totalIncome > 0 ? 
          ((baseCalculations.totalTax - ficaAmount) / baseCalculations.totalIncome) : 0
      };
    } else {
      // When FICA is enabled, add FICA marginal rate to totalMarginalRate
      const ficaMarginalRate = 0.0765; // 7.65% FICA rate (6.2% SS + 1.45% Medicare)
      baseCalc = {
        ...baseCalculations,
        totalMarginalRate: baseCalculations.totalMarginalRate + ficaMarginalRate
      };
    }
    
    // Add comprehensive marginal analysis to the calculations
    return {
      ...baseCalc,
      ...comprehensiveMarginalAnalysis
    };
  }, [baseCalculations, ficaEnabled, comprehensiveMarginalAnalysis]);

  // Calculate next rate hike information
  const nextRateHike = useMemo(() => {
    return findNextRateHike(incomeSources, taxpayer.age, taxpayer.filingStatus, appSettings);
  }, [incomeSources, taxpayer.age, taxpayer.filingStatus, appSettings]);

  // Calculate multiple rate changes (both increases and decreases)
  const nextRateChanges = useMemo(() => {
    return findNextRateChanges(incomeSources, taxpayer.age, taxpayer.filingStatus, 4);
  }, [incomeSources, taxpayer.age, taxpayer.filingStatus]);

  // Generate AI optimization recommendations
  const optimizationRecommendations = useMemo(() => {
    return generateOptimizationRecommendations(incomeSources, taxpayer, spouse, deductions, appSettings);
  }, [incomeSources, taxpayer, spouse, deductions, appSettings]);

  // Generate multi-year strategy
  const multiYearStrategy = useMemo(() => {
    return generateMultiYearStrategy(incomeSources, taxpayer, spouse, deductions, appSettings);
  }, [incomeSources, taxpayer, spouse, deductions, appSettings]);

  // Get data for the active scenario (used by the tax map)
  const getMapDisplayScenarioData = useMemo(() => {
    // Always show active scenario data since we now switch scenarios globally
    return {
      calculations,
      incomeSources,
      settings: taxMapSettings,
      appSettings,
      ficaEnabled,
      scenario: scenarios.find(s => s.isActive)
    };
  }, [scenarios, calculations, incomeSources, taxMapSettings, appSettings, ficaEnabled]);

  // Calculate Michigan Homestead Credit
  const homesteadCredit = useMemo(() => {
    if (taxpayer.state === 'Michigan') {
      return calculateMichiganHomesteadCredit(taxpayer, spouse, calculations.totalIncome, taxpayer.filingStatus);
    }
    return { eligible: false, credit: 0 };
  }, [taxpayer, spouse, calculations.totalIncome, taxpayer.filingStatus]);

  // Calculate Michigan property tax exemptions
  const propertyTaxExemptions = useMemo(() => {
    if (taxpayer.state === 'Michigan') {
      return calculateMichiganPropertyTaxExemptions(taxpayer, spouse, taxpayer.age);
    }
    return [];
  }, [taxpayer, spouse, taxpayer.age]);

  // Calculate annuity taxation details for enabled annuity sources
  const annuityTaxationDetails = useMemo(() => {
    const annuitySources = incomeSources.filter(source => source.type === 'annuity' && source.enabled && source.annuityDetails);
    
    return annuitySources.map(source => {
      const taxation = calculateAnnuityTaxation(source.annuityDetails, taxpayer.age, source.amount);
      const rmd = calculateAnnuityRMD(source.annuityDetails, taxpayer.age, spouse.age);
      const strategies = getAnnuityTaxStrategies(source.annuityDetails, taxpayer.age, 0.22); // Assume 22% tax rate
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        taxation,
        rmd,
        strategies,
        classification: classifyAnnuity(source.annuityDetails.purchaseDate)
      };
    });
  }, [incomeSources, taxpayer.age, spouse.age]);

  // Calculate life insurance taxation details for enabled life insurance sources
  const lifeInsuranceTaxationDetails = useMemo(() => {
    const lifeInsuranceSources = incomeSources.filter(source => source.type === 'life-insurance' && source.enabled && source.lifeInsuranceDetails);
    
    return lifeInsuranceSources.map(source => {
      const ownerAge = source.owner === 'spouse' ? spouse.age : taxpayer.age;
      const taxation = calculateLifeInsuranceIncomeStream(
        source.lifeInsuranceDetails, 
        source.lifeInsuranceDetails.accessMethod || 'withdrawal',
        getYearlyAmount(source),
        ownerAge
      );
      const strategies = getLifeInsuranceTaxStrategies(source.lifeInsuranceDetails, ownerAge, 0.22); // Assume 22% tax rate
      
      return {
        sourceId: source.id,
        sourceName: source.name,
        taxation,
        strategies,
        classification: classifyLifeInsurancePolicy(source.lifeInsuranceDetails.policyType || 'whole-life', source.lifeInsuranceDetails)
      };
    });
  }, [incomeSources, taxpayer.age, spouse.age]);

  // Calculate   // Calculate capital gains taxation details
  const capitalGainsDetails = useMemo(() => {
    const longTermGains = incomeSources
      .filter(source => source.enabled && source.type === 'long-term-capital-gains')
      .reduce((sum, source) => sum + getYearlyAmount(source), 0);
    
    const shortTermGains = incomeSources
      .filter(source => source.enabled && source.type === 'short-term-capital-gains')
      .reduce((sum, source) => sum + getYearlyAmount(source), 0);
    
    const qualifiedDividends = incomeSources
      .filter(source => source.enabled && source.type === 'qualified-dividends')
      .reduce((sum, source) => sum + getYearlyAmount(source), 0);
    
    // Calculate ordinary income (excluding capital gains and qualified dividends)
    const ordinaryIncome = incomeSources
      .filter(source => source.enabled && 
        !source.type.includes('capital-gains') && 
        source.type !== 'qualified-dividends')
      .reduce((sum, source) => sum + getYearlyAmount(source), 0);
    
    if (longTermGains > 0 || shortTermGains > 0 || qualifiedDividends > 0) {
      return getCapitalGainsInfo(
        longTermGains, 
        shortTermGains, 
        qualifiedDividends,
        ordinaryIncome, 
        taxpayer.filingStatus, 
        calculations.federalTaxBrackets
      );
    }
    
    return null;
  }, [incomeSources, taxpayer.filingStatus, calculations.federalTaxBrackets]);

  // Helper function to get earned income from income sources
  const getEarnedIncome = (incomeSources) => {
    const earnedIncomeTypes = ['wages', 'self-employment', 'business'];
    
    return incomeSources
      .filter(source => source.enabled && earnedIncomeTypes.includes(source.type))
      .reduce((sum, source) => {
        // Handle frequency conversion
        const yearlyAmount = source.frequency === 'monthly' ? source.amount * 12 : source.amount;
        return sum + yearlyAmount;
      }, 0);
  };

  // Calculate FICA taxes
  const ficaTaxes = useMemo(() => {
    const earnedIncome = getEarnedIncome(incomeSources);
    return calculateFICATaxes(earnedIncome, taxpayer.filingStatus);
  }, [incomeSources, taxpayer.filingStatus, getEarnedIncome]);

  // Calculate capital gains analysis
  const capitalGainsAnalysis = useMemo(() => {
    
    const ordinaryIncome = calculations.federalTaxableIncome - 
      (calculations.capitalGains?.longTerm?.amount || 0) - 
      (calculations.capitalGains?.shortTerm?.amount || 0) - 
      (calculations.capitalGains?.qualified?.amount || 0);
    
    const result = getCapitalGainsAnalysis(incomeSources, ordinaryIncome, taxpayer.filingStatus);
    return result;
  }, [incomeSources, calculations, taxpayer.filingStatus]);

  // Calculate NIIT analysis
  const niitAnalysis = useMemo(() => {
    const netInvestmentIncome = calculateNetInvestmentIncome(incomeSources.filter(s => s.enabled));
    const modifiedAGI = calculations.federalAGI; // Using AGI as approximation for MAGI
    return getNIITAnalysis(modifiedAGI, netInvestmentIncome, taxpayer.filingStatus);
  }, [incomeSources, calculations.federalAGI, taxpayer.filingStatus]);

  // Calculate Additional Medicare Tax analysis
  const additionalMedicareTaxAnalysis = useMemo(() => {
    const earnedIncome = getEarnedIncome(incomeSources.filter(s => s.enabled));
    return getAdditionalMedicareTaxAnalysis(earnedIncome, taxpayer.filingStatus);
  }, [incomeSources, taxpayer.filingStatus]);

  // Calculate AMT analysis
  const amtAnalysis = useMemo(() => {
    const deductions = {
      stateAndLocalTaxes: calculations.stateTax || 0,
      miscellaneousItemized: 0 // Add if we implement itemized deductions
    };
    const result = getAMTAnalysis(incomeSources.filter(s => s.enabled), deductions, calculations.federalTax, taxpayer.filingStatus);
    return result;
  }, [incomeSources, calculations.federalTax, calculations.stateTax, taxpayer.filingStatus]);

  const toggleIncomeSource = (id) => {
    setIncomeSources(prev => prev.map(source => 
      source.id === id ? { ...source, enabled: !source.enabled } : source
    ));
  };

  const addIncomeSource = () => {
    // Fix ID generation to handle string IDs and empty arrays
    const existingIds = incomeSources
      .map(s => typeof s.id === 'number' ? s.id : parseInt(s.id) || 0)
      .filter(id => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = maxId + 1;
    
    const newSource = {
      id: newId,
      name: `New Income Source #${newId}`,
      amount: 0,
      type: 'wages',
      owner: 'taxpayer',
      enabled: true,
      penaltyExempt: false
    };
    
    const updatedSources = [...incomeSources, newSource];
    setIncomeSources(updatedSources);
    
    // Save to active scenario
    updateActiveScenario({ incomeSources: updatedSources });
  };

  const removeIncomeSource = (id) => {
    const filtered = incomeSources.filter(source => source.id !== id);
    setIncomeSources(filtered);
    
    // Bi-directional sync: Remove corresponding asset if it exists
    const assetId = `income-${id}`;
    const updatedAssets = assets.filter(asset => asset.id !== assetId);
    setAssets(updatedAssets);
    
    // Save to active scenario
    updateActiveScenario({ incomeSources: filtered, assets: updatedAssets });
  };

  const updateIncomeSource = (id, field, value) => {
    const updated = incomeSources.map(source => {
      if (source.id === id) {
        const updatedSource = { ...source, [field]: value };
        return updatedSource;
      }
      return source;
    });
    
    setIncomeSources(updated);
    
    // Bi-directional sync: Update corresponding asset if it exists
    const updatedSource = updated.find(source => source.id === id);
    if (updatedSource && assetBasedIncomeTypes.includes(updatedSource.type)) {
      // Check if there's a corresponding asset
      const assetId = `income-${id}`;
      const existingAsset = assets.find(asset => asset.id === assetId);
      
      // Get the appropriate account value based on income type
      const accountValue = updatedSource.type === 'annuity' 
        ? (updatedSource.annuityDetails?.currentValue || 0)
        : (updatedSource.accountValue || 0);
      
      if (existingAsset || (accountValue && accountValue > 0)) {
        // Update or create asset
        const assetData = {
          id: assetId,
          name: updatedSource.name,
          type: updatedSource.type,
          owner: updatedSource.owner,
          currentValue: accountValue,
          hasIncomeSource: true,
          incomeAmount: updatedSource.amount || 0,
          enabled: updatedSource.enabled,
          linkedIncomeSourceId: id,
          // For annuities, copy additional details
          ...(updatedSource.type === 'annuity' && {
            annuityType: updatedSource.annuityDetails?.annuityType,
            qualifiedStatus: updatedSource.annuityDetails?.qualifiedStatus,
            annuitizationDate: updatedSource.annuityDetails?.annuitizationDate,
            exclusionRatio: updatedSource.annuityDetails?.exclusionRatio
          })
        };
        
        let updatedAssets;
        if (existingAsset) {
          // Update existing asset
          updatedAssets = assets.map(asset => 
            asset.id === assetId ? assetData : asset
          );
        } else if (accountValue && accountValue > 0) {
          // Create new asset
          updatedAssets = [...assets, assetData];
        } else {
          updatedAssets = assets;
        }
        
        setAssets(updatedAssets);
        
        // Save both income sources and assets to active scenario
        updateActiveScenario({ incomeSources: updated, assets: updatedAssets });
      } else if (!accountValue || accountValue === 0) {
        // Remove asset if account value is removed
        const updatedAssets = assets.filter(asset => asset.id !== assetId);
        setAssets(updatedAssets);
        
        // Save both income sources and assets to active scenario
        updateActiveScenario({ incomeSources: updated, assets: updatedAssets });
      } else {
        // Save only income sources to active scenario
        updateActiveScenario({ incomeSources: updated });
      }
    } else {
      // Save only income sources to active scenario
      updateActiveScenario({ incomeSources: updated });
    }
  };

  const handleDeleteAsset = (assetId) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
    // Also remove corresponding income source if it exists
    setIncomeSources(prev => prev.filter(source => source.id !== `asset-${assetId}` && source.linkedAssetId !== assetId));
  };

  // Tax return import functions
  const importFromTaxReturn = () => {
    const newSources = [];
    let nextId = Math.max(...incomeSources.map(s => s.id), 0) + 1;

    // Mapping from tax return fields to income sources
    const taxReturnMapping = [
      { field: 'wages', type: 'wages', label: 'Wages and Salaries' },
      { field: 'taxableInterest', type: 'interest', label: 'Taxable Interest' },
      { field: 'dividends', type: 'dividends', label: 'Dividends' },
      { field: 'iraDistributions', type: 'traditional-ira', label: 'IRA Distributions' },
      { field: 'pensionsAnnuities', type: 'pension', label: 'Pensions and Annuities' },
      { field: 'socialSecurity', type: 'social-security', label: 'Social Security Benefits' },
      { field: 'capitalGains', type: 'other', label: 'Capital Gains' },
      { field: 'otherIncome', type: 'other', label: 'Other Income' }
    ];

    // Create income sources from tax return data
    taxReturnMapping.forEach(mapping => {
      const amount = taxReturnData[mapping.field];
      if (amount > 0) {
        newSources.push({
          id: nextId++,
          name: mapping.label,
          amount: amount,
          type: mapping.type,
          owner: 'taxpayer',
          enabled: true,
          penaltyExempt: false,
          source: 'taxReturn' // Mark as imported from tax return
        });
      }
    });

    // Intelligent merging: Remove old tax return sources, keep manual sources
    const manualSources = incomeSources.filter(source => source.source !== 'taxReturn');
    setIncomeSources([...manualSources, ...newSources]);
    
    // Show success message or feedback
  };

  const updateTaxReturnField = (field, value) => {
    setTaxReturnData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  // Multi-year analysis function
  const generateMultiYearAnalysis = () => {
    const results = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = 0; year < multiYearSettings.projectionYears; year++) {
      // Calculate projected income sources for this year
      const projectedSources = incomeSources.map(source => {
        let growthRate = multiYearSettings.incomeGrowthRate / 100;
        
        // Apply different growth rates for different income types
        if (source.type === 'social-security') {
          growthRate = multiYearSettings.socialSecurityCOLA / 100;
        }
        
        const projectedAmount = source.amount * Math.pow(1 + growthRate, year);
        
        return {
          ...source,
          amount: projectedAmount
        };
      });
      
      // Add Roth conversion if specified
      if (multiYearSettings.rothConversionAmount > 0) {
        projectedSources.push({
          id: `roth-conversion-${year}`,
          type: 'ira-distribution',
          description: 'Roth Conversion',
          amount: multiYearSettings.rothConversionAmount,
          enabled: true,
          owner: 'taxpayer',
          source: 'projection'
        });
      }
      
      // Calculate taxes for this year
      const yearCalculations = calculateComprehensiveTaxes(
        projectedSources, 
        taxpayer.age + year, 
        spouse.age ? spouse.age + year : null, 
        taxpayer.filingStatus, 
        deductions,
        appSettings
      );
      
      results.push({
        year: currentYear + year,
        projectedAge: taxpayer.age + year,
        totalIncome: yearCalculations.totalIncome,
        federalTax: yearCalculations.federalTax,
        stateTax: yearCalculations.stateTax,
        totalTax: yearCalculations.federalTax + yearCalculations.stateTax,
        effectiveRate: yearCalculations.totalIncome > 0 ? 
          ((yearCalculations.federalTax + yearCalculations.stateTax) / yearCalculations.totalIncome) * 100 : 0,
        socialSecurityTaxable: yearCalculations.socialSecurity.taxableSocialSecurity,
        irmaaStatus: yearCalculations.irmaaMonthly > 0 ? 
          `$${yearCalculations.irmaaMonthly.toFixed(0)}/mo` : 'No IRMAA',
        sources: projectedSources
      });
    }
    
    // Calculate insights
    const insights = {
      totalTaxSavings: 0, // Could calculate vs no Roth conversion scenario
      optimalConversionAmount: multiYearSettings.rothConversionAmount,
      averageEffectiveRate: results.reduce((sum, year) => sum + year.effectiveRate, 0) / results.length,
      irmaaYears: results.filter(year => year.irmaaStatus !== 'No IRMAA').length
    };
    
    setMultiYearResults({
      projections: results,
      insights: insights,
      settings: { ...multiYearSettings }
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate, decimals = 2) => {
    return (rate * 100).toFixed(decimals) + '%';
  };

  const enabledSourcesCount = incomeSources.filter(source => source.enabled).length;
  const totalSourcesCount = incomeSources.length;

  const tabs = [
    { id: 'people', label: 'People' },
    { id: 'income', label: 'Income' },
    { id: 'deductions', label: 'Deductions' },
    { id: 'tax-analysis', label: 'Tax Analysis' },
    { id: 'multiyear', label: 'Multi-Year' },
    { id: 'ai-optimize', label: 'AI Optimize' },
    { id: 'universal-settings', label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Scenario Management Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo and App Name */}
            <div className="flex items-center gap-3">
              <img src={taxLogo} alt="Tax-On-A-Me" className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">Tax-On-A-Me</h1>
              <span className="text-gray-600">
                {activeClientId && clients.find(c => c.id === activeClientId)?.profile?.clientName || ''}
              </span>
            </div>
            
            {/* Scenarios */}
            <div className="flex items-center gap-2">
            {scenarios.map(scenario => (
              <div key={scenario.id} className="flex items-center gap-1">
                {editingScenarioId === scenario.id ? (
                  <input
                    type="text"
                    defaultValue={scenario.name}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onBlur={(e) => renameScenario(scenario.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameScenario(scenario.id, e.target.value);
                      } else if (e.key === 'Escape') {
                        setEditingScenarioId(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => switchToScenario(scenario.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      scenario.isActive 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {scenario.name}
                  </button>
                )}
                {editingScenarioId !== scenario.id && scenarios.length > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingScenarioId(scenario.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit scenario name"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => confirmDeleteScenario(scenario.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete scenario"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
          <button
            onClick={handleAddScenario}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            title="Add new scenario"
          >
            + Add Scenario
          </button>
        </div>
      </div>

      {/* Scenario Creation Modal */}
      {showScenarioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Tax Map</h2>
            <p className="text-gray-600 mb-4">You can create a new blank tax map or clone the currently selected one.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Tax Map Name
              </label>
              <input
                type="text"
                placeholder="New Tax Map Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="scenarioNameInput"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowScenarioModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const nameInput = document.getElementById('scenarioNameInput');
                  const name = nameInput.value.trim() || 'New Scenario';
                  createNewScenario(name, false);
                  setShowScenarioModal(false);
                  nameInput.value = '';
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Create a Blank Tax Map
              </button>
              <button
                onClick={() => {
                  const nameInput = document.getElementById('scenarioNameInput');
                  const name = nameInput.value.trim() || 'Copy of ' + activeScenario.name;
                  createNewScenario(name, true);
                  setShowScenarioModal(false);
                  nameInput.value = '';
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clone Current Tax Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Max Scenarios Warning Modal */}
      {showMaxScenariosWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maximum Scenarios Reached</h3>
            <p className="text-gray-600 mb-6">
              You can have a maximum of 6 scenarios. Please delete an existing scenario first to create a new one.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMaxScenariosWarning(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Scenario</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{scenarios.find(s => s.id === showDeleteConfirm)?.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteScenario}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Three Panel Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Tabbed Input Sections (25%) */}
        <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
          {/* Scenario Name */}
          <div className="p-4 border-b border-gray-200">
            <div className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium">
              {activeScenario.name}
            </div>
          </div>
          
          {/* Tabbed Navigation - Two Rows */}
          <div className="border-b border-gray-200">
            <nav className="space-y-1">
              {/* First Row */}
              <div className="flex">
                {tabs.slice(0, 4).map((tab, index) => {
                  const colorClasses = [
                    { bg: 'bg-blue-50', text: 'text-blue-700', hover: 'hover:bg-blue-100', border: 'border-blue-500' },    // People
                    { bg: 'bg-green-50', text: 'text-green-700', hover: 'hover:bg-green-100', border: 'border-green-500' },   // Income
                    { bg: 'bg-purple-50', text: 'text-purple-700', hover: 'hover:bg-purple-100', border: 'border-purple-500' }, // Deductions
                    { bg: 'bg-red-50', text: 'text-red-700', hover: 'hover:bg-red-100', border: 'border-red-500' },         // Tax Analysis
                  ];
                  const colors = colorClasses[index];
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${colors.bg} ${colors.text} ${colors.hover} ${
                        activeTab === tab.id
                          ? colors.border
                          : 'border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              
              {/* Second Row */}
              <div className="flex">
                {tabs.slice(4).map((tab, index) => {
                  const colorClasses = [
                    { bg: 'bg-orange-50', text: 'text-orange-700', hover: 'hover:bg-orange-100', border: 'border-orange-500' }, // Multi-Year
                    { bg: 'bg-pink-50', text: 'text-pink-700', hover: 'hover:bg-pink-100', border: 'border-pink-500' },       // AI Optimize
                    { bg: 'bg-gray-50', text: 'text-gray-700', hover: 'hover:bg-gray-100', border: 'border-gray-500' },        // Settings
                    { bg: 'bg-indigo-50', text: 'text-indigo-700', hover: 'hover:bg-indigo-100', border: 'border-indigo-500' } // Universal Settings
                  ];
                  const colors = colorClasses[index];
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${colors.bg} ${colors.text} ${colors.hover} ${
                        activeTab === tab.id
                          ? colors.border
                          : 'border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'people' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Taxpayer Information</h3>
                  <div className="space-y-2">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                        <input 
                          type="text" 
                          value={taxpayer.firstName}
                          onChange={(e) => setTaxpayer(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                        <input 
                          type="text" 
                          value={taxpayer.lastName}
                          onChange={(e) => setTaxpayer(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    {/* Compact details row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input 
                          type="text" 
                          value={taxpayer.dateOfBirth}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                            if (value.length >= 2) {
                              value = value.substring(0, 2) + '/' + value.substring(2);
                            }
                            if (value.length >= 5) {
                              value = value.substring(0, 5) + '/' + value.substring(5, 9);
                            }
                            const newAge = value.length === 10 ? calculateAge(value) : null;
                            setTaxpayer(prev => ({ 
                              ...prev, 
                              dateOfBirth: value,
                              age: newAge
                            }));
                          }}
                          placeholder="MM/DD/YYYY"
                          maxLength="10"
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                        />
                        {taxpayer.age && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            Age {taxpayer.age}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Filing Status</label>
                        <select 
                          value={taxpayer.filingStatus}
                          onChange={(e) => setTaxpayer(prev => ({ ...prev, filingStatus: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                        >
                          <option value="single">Single</option>
                          <option value="marriedFilingJointly">Married Joint</option>
                          <option value="headOfHousehold">Head of House</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                        <select 
                          value={taxpayer.state}
                          onChange={(e) => setTaxpayer(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                        >
                          <option value="Michigan">MI</option>
                          <option value="Ohio">OH</option>
                          <option value="Indiana">IN</option>
                          <option value="Illinois">IL</option>
                          <option value="Wisconsin">WI</option>
                          <option value="Pennsylvania">PA</option>
                          <option value="New York">NY</option>
                          <option value="California">CA</option>
                          <option value="Texas">TX</option>
                          <option value="Florida">FL</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Spouse/Partner Information</h3>
                  <p className="text-xs text-gray-600 mb-2">Stored for Reference</p>
                  <div className="space-y-2">
                    {/* Spouse name row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                        <input 
                          type="text" 
                          placeholder="First name"
                          value={spouse.firstName}
                          onChange={(e) => setSpouse(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                        <input 
                          type="text" 
                          placeholder="Last name"
                          value={spouse.lastName}
                          onChange={(e) => setSpouse(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    {/* Spouse date of birth */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input 
                        type="text" 
                        placeholder="MM/DD/YYYY"
                        value={spouse.dateOfBirth}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2);
                          }
                          if (value.length >= 5) {
                            value = value.substring(0, 5) + '/' + value.substring(5, 9);
                          }
                          const newAge = value.length === 10 ? calculateAge(value) : null;
                          setSpouse(prev => ({ 
                            ...prev, 
                            dateOfBirth: value,
                            age: newAge
                          }));
                        }}
                        maxLength="10"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md max-w-xs"
                      />
                      {spouse.age && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          Age {spouse.age}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medicare Coverage Section */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-3">Medicare Coverage</h4>
                  
                  {/* Taxpayer Medicare Coverage */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-green-800 mb-2">Taxpayer Medicare Coverage</h5>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="taxpayerMedicarePartB"
                          checked={appSettings.medicare.taxpayer.partB}
                          onChange={(e) => setAppSettings(prev => ({ 
                            ...prev, 
                            medicare: {
                              ...prev.medicare,
                              taxpayer: { ...prev.medicare.taxpayer, partB: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="taxpayerMedicarePartB" className="ml-2 text-sm text-green-800">
                          Medicare Part B ($185/month base + IRMAA surcharges)
                        </label>
                      </div>
                      {appSettings.medicare.taxpayer.partB && taxpayer.age && taxpayer.age < 65 && (
                        <div className="ml-6 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          ⚠️ Warning: Taxpayer is {taxpayer.age} years old. Medicare eligibility typically begins at age 65.
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="taxpayerMedicarePartD"
                          checked={appSettings.medicare.taxpayer.partD}
                          onChange={(e) => setAppSettings(prev => ({ 
                            ...prev, 
                            medicare: {
                              ...prev.medicare,
                              taxpayer: { ...prev.medicare.taxpayer, partD: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="taxpayerMedicarePartD" className="ml-2 text-sm text-green-800">
                          Medicare Part D (Plan premium + IRMAA surcharges)
                        </label>
                      </div>
                      {appSettings.medicare.taxpayer.partD && taxpayer.age && taxpayer.age < 65 && (
                        <div className="ml-6 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          ⚠️ Warning: Taxpayer is {taxpayer.age} years old. Medicare eligibility typically begins at age 65.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spouse Medicare Coverage */}
                  <div className="mb-2">
                    <h5 className="text-sm font-medium text-green-800 mb-2">Spouse Medicare Coverage</h5>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="spouseMedicarePartB"
                          checked={appSettings.medicare.spouse.partB}
                          onChange={(e) => setAppSettings(prev => ({ 
                            ...prev, 
                            medicare: {
                              ...prev.medicare,
                              spouse: { ...prev.medicare.spouse, partB: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="spouseMedicarePartB" className="ml-2 text-sm text-green-800">
                          Medicare Part B ($185/month base + IRMAA surcharges)
                        </label>
                      </div>
                      {appSettings.medicare.spouse.partB && spouse.age && spouse.age < 65 && (
                        <div className="ml-6 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          ⚠️ Warning: Spouse is {spouse.age} years old. Medicare eligibility typically begins at age 65.
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="spouseMedicarePartD"
                          checked={appSettings.medicare.spouse.partD}
                          onChange={(e) => setAppSettings(prev => ({ 
                            ...prev, 
                            medicare: {
                              ...prev.medicare,
                              spouse: { ...prev.medicare.spouse, partD: e.target.checked }
                            }
                          }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="spouseMedicarePartD" className="ml-2 text-sm text-green-800">
                          Medicare Part D (Plan premium + IRMAA surcharges)
                        </label>
                      </div>
                      {appSettings.medicare.spouse.partD && spouse.age && spouse.age < 65 && (
                        <div className="ml-6 mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                          ⚠️ Warning: Spouse is {spouse.age} years old. Medicare eligibility typically begins at age 65.
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-green-700 mt-2">
                    Check the Medicare parts each person has to see accurate IRMAA impact on the tax map
                  </p>
                </div>

                {/* Housing Information Section */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-3">Housing Information</h4>
                  <p className="text-sm text-orange-700 mb-3">Used for Michigan Homestead Property Tax Credit calculations</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Ownership</label>
                      <select 
                        value={taxpayer.housing.ownership}
                        onChange={(e) => setTaxpayer(prev => ({ 
                          ...prev, 
                          housing: { ...prev.housing, ownership: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="own">Own Primary Residence</option>
                        <option value="rent">Rent</option>
                      </select>
                    </div>

                    {taxpayer.housing.ownership === 'own' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Property Tax Value</label>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 mr-2">$</span>
                              <input 
                                type="number" 
                                value={taxpayer.housing.propertyTaxValue}
                                onChange={(e) => setTaxpayer(prev => ({ 
                                  ...prev, 
                                  housing: { ...prev.housing, propertyTaxValue: parseInt(e.target.value) || 0 }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="150000"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Assessed value for tax purposes</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Property Taxes Paid</label>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 mr-2">$</span>
                              <input 
                                type="number" 
                                value={taxpayer.housing.propertyTaxesPaid}
                                onChange={(e) => setTaxpayer(prev => ({ 
                                  ...prev, 
                                  housing: { ...prev.housing, propertyTaxesPaid: parseInt(e.target.value) || 0 }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="3500"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Total property taxes paid in tax year</p>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="michiganResident"
                        checked={taxpayer.housing.michiganResident6Months}
                        onChange={(e) => setTaxpayer(prev => ({ 
                          ...prev, 
                          housing: { ...prev.housing, michiganResident6Months: e.target.checked }
                        }))}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label htmlFor="michiganResident" className="ml-2 text-sm text-gray-700">
                        Michigan resident for 6+ months of the tax year
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'income' && (
              <div className="space-y-4">
                {/* Compact Income Header - Sticky */}
                <div className="sticky top-0 bg-white border-b border-gray-200 pb-2 z-10">
                  <div className="flex items-center justify-between gap-2">
                    {/* Mode Toggle - Compact */}
                    <div className="flex bg-gray-100 rounded p-0.5 border">
                      <button
                        onClick={() => setIncomeEntryMode('manual')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          incomeEntryMode === 'manual' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Manual Entry
                      </button>
                      <button
                        onClick={() => setIncomeEntryMode('taxReturn')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          incomeEntryMode === 'taxReturn' 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Tax Return Import
                      </button>
                    </div>
                    
                    {/* Action Buttons - Compact */}
                    <div className="flex items-center gap-2">
                      {incomeEntryMode === 'manual' && (
                        <button 
                          onClick={addIncomeSource}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded transition-colors h-6"
                        >
                          + Add Source
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to reset all income sources? This will clear all entered amounts and cannot be undone.')) {
                            setIncomeSources([]);
                            setTaxReturnData({
                              wages: '',
                              taxableInterest: '',
                              dividends: '',
                              iraDistributions: '',
                              pensionsAnnuities: '',
                              socialSecurity: '',
                              capitalGains: '',
                              otherIncome: ''
                            });
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded transition-colors h-6"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tax Return Import Mode */}
                {incomeEntryMode === 'taxReturn' && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Enter Your 2024 Tax Return Information</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter amounts from your 2024 Form 1040 to automatically populate income sources.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Wages */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 1a - Wages, Salaries, Tips
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.wages}
                          onChange={(e) => updateTaxReturnField('wages', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>

                      {/* Taxable Interest */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 2b - Taxable Interest
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.taxableInterest}
                          onChange={(e) => updateTaxReturnField('taxableInterest', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>

                      {/* Dividends */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 3a - Ordinary Dividends
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.dividends}
                          onChange={(e) => updateTaxReturnField('dividends', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>

                      {/* IRA Distributions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 4a - IRA Distributions
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.iraDistributions}
                          onChange={(e) => updateTaxReturnField('iraDistributions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>

                      {/* Pensions and Annuities */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 4b - Pensions and Annuities
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.pensionsAnnuities}
                          onChange={(e) => updateTaxReturnField('pensionsAnnuities', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>

                      {/* Social Security */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 5a - Social Security Benefits
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.socialSecurity}
                          onChange={(e) => updateTaxReturnField('socialSecurity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>

                      {/* Capital Gains */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 7 - Capital Gains
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.capitalGains}
                          onChange={(e) => updateTaxReturnField('capitalGains', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>

                      {/* Other Income */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Line 8 - Other Income
                        </label>
                        <input
                          type="number"
                          value={taxReturnData.otherIncome}
                          onChange={(e) => updateTaxReturnField('otherIncome', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Total from tax return: {formatCurrency(
                          taxReturnData.wages + 
                          taxReturnData.taxableInterest + 
                          taxReturnData.dividends + 
                          taxReturnData.iraDistributions + 
                          taxReturnData.pensionsAnnuities + 
                          taxReturnData.socialSecurity + 
                          taxReturnData.capitalGains + 
                          taxReturnData.otherIncome
                        )}
                      </div>
                      <Button 
                        onClick={importFromTaxReturn}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                      >
                        Import Income Sources
                      </Button>
                    </div>
                  </div>
                )}

                {/* Income Sources List - Always Show */}
                <div className="space-y-3">
                  {incomeSources.map((source) => (
                    <div key={source.id} className={`border rounded-lg p-4 ${
                      source.source === 'taxReturn' ? 'border-blue-200 bg-blue-50' : 
                      source.type === 'estimated-rmd' ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={source.enabled}
                            onChange={() => toggleIncomeSource(source.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={source.name}
                              onChange={(e) => updateIncomeSource(source.id, 'name', e.target.value)}
                              className="font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                              placeholder="Income source name"
                              readOnly={source.type === 'estimated-rmd'}
                            />
                            {source.source === 'taxReturn' && (
                              <div className="text-xs text-blue-600 mt-1">Imported from tax return</div>
                            )}
                            {source.type === 'estimated-rmd' && (
                              <div className="text-xs text-green-600 mt-1">Auto-generated RMD estimate</div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => removeIncomeSource(source.id)}
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 text-sm"
                          disabled={source.type === 'estimated-rmd'}
                        >
                          {source.type === 'estimated-rmd' ? 'Auto-Generated' : 'Remove'}
                        </Button>
                      </div>
                      
                      {/* RMD Details Section */}
                      {source.type === 'estimated-rmd' && source.rmdDetails && (
                        <div className="mb-4 p-3 bg-white border border-green-200 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-green-800">RMD Shortfall Details</div>
                            <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Additional Amount Needed
                            </div>
                          </div>
                          
                          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            <div className="font-medium">This represents the additional income needed to meet RMD requirements</div>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <div>Required RMD: {formatCurrency(source.rmdDetails.requiredRMD || 0)}</div>
                              <div>Current Income: {formatCurrency(source.rmdDetails.existingIncome || 0)}</div>
                            </div>
                            <div className="mt-1 font-medium">
                              Shortfall: {formatCurrency(source.rmdDetails.shortfallAmount || 0)}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs text-green-700">
                            <div>
                              <span className="font-medium">Qualified Balance:</span> {formatRMDDisplay(source.rmdDetails)?.balanceDisplay}
                            </div>
                            <div>
                              <span className="font-medium">Age Factor:</span> {formatRMDDisplay(source.rmdDetails)?.factorDisplay}
                            </div>
                            <div>
                              <span className="font-medium">Owner Age:</span> {formatRMDDisplay(source.rmdDetails)?.ageDisplay}
                            </div>
                            <div>
                              <span className="font-medium">Calculation:</span> {formatRMDDisplay(source.rmdDetails)?.calculationDisplay}
                            </div>
                          </div>
                          
                          {/* Override Options */}
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <div className="text-xs font-medium text-green-800 mb-2">Override Options</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-green-700 mb-1">Override RMD Amount</label>
                                <input
                                  type="number"
                                  placeholder="Enter actual RMD"
                                  value={source.rmdDetails.overrideAmount || ''}
                                  onChange={(e) => {
                                    const newAmount = e.target.value ? parseFloat(e.target.value) : null;
                                    updateIncomeSource(source.id, 'rmdDetails', {
                                      ...source.rmdDetails,
                                      overrideAmount: newAmount
                                    });
                                    if (newAmount) {
                                      updateIncomeSource(source.id, 'amount', newAmount);
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-green-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-green-700 mb-1">Override Account Balance</label>
                                <input
                                  type="number"
                                  placeholder="Prior year balance"
                                  value={source.rmdDetails.overrideBalance || ''}
                                  onChange={(e) => {
                                    const newBalance = e.target.value ? parseFloat(e.target.value) : null;
                                    updateIncomeSource(source.id, 'rmdDetails', {
                                      ...source.rmdDetails,
                                      overrideBalance: newBalance
                                    });
                                    // Recalculate RMD if balance is overridden
                                    if (newBalance && source.rmdDetails.factor) {
                                      const newRMD = Math.round(newBalance / source.rmdDetails.factor);
                                      updateIncomeSource(source.id, 'amount', newRMD);
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-green-300 rounded"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Account Type</label>
                          <select
                            value={source.type}
                            onChange={(e) => {
                              updateIncomeSource(source.id, 'type', e.target.value);
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            disabled={source.type === 'estimated-rmd'}
                          >
                            <option value="wages">Wages</option>
                            <option value="traditional-ira">Traditional IRA</option>
                            <option value="traditional-401k">Traditional 401(k)</option>
                            <option value="roth-401k">Roth 401(k)</option>
                            <option value="roth-ira">Roth IRA</option>
                            <option value="403b">403(b)</option>
                            <option value="457">457 Plan</option>
                            <option value="sep-ira">SEP-IRA</option>
                            <option value="simple-ira">SIMPLE-IRA</option>
                            <option value="savings">Savings</option>
                            <option value="brokerage">Brokerage Account</option>
                            <option value="cd">Certificate of Deposit</option>
                            <option value="dividends">Ordinary Dividends</option>
                            <option value="qualified-dividends">Qualified Dividends</option>
                            <option value="interest">Interest</option>
                            <option value="social-security">Social Security</option>
                            <option value="annuity">Annuity</option>
                            <option value="pension">Pension</option>
                            <option value="life-insurance">Life Insurance</option>
                            <option value="long-term-capital-gains">Long-Term Capital Gains</option>
                            <option value="short-term-capital-gains">Short-Term Capital Gains</option>
                            <option value="estimated-rmd">Estimated RMD</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Owner</label>
                          <select
                            value={source.owner || 'taxpayer'}
                            onChange={(e) => updateIncomeSource(source.id, 'owner', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            disabled={source.type === 'estimated-rmd'}
                          >
                            <option value="taxpayer">{taxpayer.firstName || 'Taxpayer'}</option>
                            <option value="spouse">{spouse.firstName || 'Spouse'}</option>
                            {/* Joint option for non-qualified accounts */}
                            {['savings', 'brokerage', 'cd', 'dividends', 'qualified-dividends', 'interest', 'long-term-capital-gains', 'short-term-capital-gains', 'other'].includes(source.type) && (
                              <option value="joint">Joint</option>
                            )}
                          </select>
                        </div>
                      </div>
                      
                      {/* FICA Toggle for Wages */}
                      {source.type === 'wages' && (
                        <div className="mb-3 p-2 bg-blue-50 rounded border">
                          <label className="flex items-center text-sm text-blue-900">
                            <input
                              type="checkbox"
                              checked={ficaEnabled}
                              onChange={(e) => setFicaEnabled(e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                            />
                            Include FICA taxes (Social Security & Medicare) in calculations
                          </label>
                          <div className="text-xs text-blue-700 mt-1">
                            Shows FICA effects on the Tax Map and includes in total tax calculations
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Income Amount {(source.type === 'social-security' || source.type === 'pension') && source.frequency === 'monthly' ? '(Monthly)' : '(Yearly)'}
                          </label>
                          <input
                            type="number"
                            value={source.amount}
                            onChange={(e) => updateIncomeSource(source.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            placeholder="0"
                            disabled={source.type === 'estimated-rmd'}
                          />
                        </div>
                        {assetBasedIncomeTypes.includes(source.type) && source.type !== 'annuity' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Account Value (Optional)
                            </label>
                            <input
                              type="number"
                              value={source.accountValue || ''}
                              onChange={(e) => updateIncomeSource(source.id, 'accountValue', parseInt(e.target.value) || null)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Account balance"
                              disabled={source.type === 'estimated-rmd'}
                            />
                            {source.accountValue && source.amount && (
                              <div className="text-xs text-gray-500 mt-1">
                                Draw: {((source.amount / source.accountValue) * 100).toFixed(1)}%
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col">
                          {(source.type === 'social-security' || source.type === 'pension') ? (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                              <select
                                value={source.frequency || 'yearly'}
                                onChange={(e) => updateIncomeSource(source.id, 'frequency', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              >
                                <option value="yearly">Yearly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-end h-full">
                              {(source.type === 'traditional-ira' || source.type === '401k') && (
                                <label className="flex items-center text-xs text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={source.penaltyExempt || false}
                                    onChange={(e) => updateIncomeSource(source.id, 'penaltyExempt', e.target.checked)}
                                    className="w-3 h-3 text-blue-600 mr-1"
                                  />
                                  Penalty Exempt
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Roth IRA-specific fields */}
                      {source.type === 'roth-ira' && (
                        <div className="mt-3 p-3 bg-green-50 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-xs font-medium text-green-900">Roth IRA Tax Details</h6>
                            <span className="text-xs text-green-700">
                              Age: {taxpayer.dateOfBirth ? Math.floor((new Date() - new Date(taxpayer.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Account Opening Date</label>
                              <input
                                type="date"
                                value={source.rothDetails?.openingDate || ''}
                                onChange={(e) => updateIncomeSource(source.id, 'rothDetails', {
                                  ...source.rothDetails,
                                  openingDate: e.target.value
                                })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Total Contributions</label>
                              <input
                                type="number"
                                value={source.rothDetails?.totalContributions || ''}
                                onChange={(e) => updateIncomeSource(source.id, 'rothDetails', {
                                  ...source.rothDetails,
                                  totalContributions: parseFloat(e.target.value) || 0
                                })}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                                placeholder="Principal amount"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <label className="flex items-center text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={source.rothDetails?.fiveYearRuleMet || false}
                                onChange={(e) => updateIncomeSource(source.id, 'rothDetails', {
                                  ...source.rothDetails,
                                  fiveYearRuleMet: e.target.checked
                                })}
                                className="w-3 h-3 text-green-600 mr-1"
                              />
                              5-Year Rule Met
                            </label>
                            
                            {source.rothDetails && (
                              <div className="text-xs text-gray-600">
                                {(() => {
                                  const age = taxpayer.dateOfBirth ? Math.floor((new Date() - new Date(taxpayer.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
                                  const over59Half = age >= 59.5;
                                  const fiveYearMet = source.rothDetails.fiveYearRuleMet || 
                                    (source.rothDetails.openingDate && 
                                     new Date() - new Date(source.rothDetails.openingDate) >= 5 * 365.25 * 24 * 60 * 60 * 1000);
                                  
                                  const withdrawalAmount = source.amount || 0;
                                  const contributions = source.rothDetails.totalContributions || 0;
                                  const earningsWithdrawn = Math.max(0, withdrawalAmount - contributions);
                                  
                                  if (withdrawalAmount <= contributions) {
                                    return "Tax & Penalty Free";
                                  } else if (over59Half && fiveYearMet) {
                                    return "Tax & Penalty Free";
                                  } else if (over59Half && !fiveYearMet) {
                                    return `Tax on $${earningsWithdrawn.toLocaleString()}`;
                                  } else if (!over59Half && fiveYearMet) {
                                    return `10% Penalty on $${earningsWithdrawn.toLocaleString()}`;
                                  } else {
                                    return `Tax + 10% Penalty on $${earningsWithdrawn.toLocaleString()}`;
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Annuity-specific fields */}
                      {source.type === 'annuity' && (
                        <div className="mt-3 p-3 bg-purple-50 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-xs font-medium text-purple-900">TEFRA Details</h6>
                            {source.annuityDetails && (
                              <span className={`px-2 py-1 text-xs rounded ${
                                classifyAnnuity(source.annuityDetails.purchaseDate).isPreTEFRA ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {classifyAnnuity(source.annuityDetails.purchaseDate).tefraClassification}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-gray-700 mb-1">Purchase Date</label>
                              <input
                                type="date"
                                value={source.annuityDetails?.purchaseDate || '1980-01-01'}
                                onChange={(e) => updateIncomeSource(source.id, 'annuityDetails', {
                                  ...source.annuityDetails,
                                  purchaseDate: e.target.value
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-1">Basis Amount</label>
                              <input
                                type="number"
                                value={source.annuityDetails?.basisAmount || 50000}
                                onChange={(e) => updateIncomeSource(source.id, 'annuityDetails', {
                                  ...source.annuityDetails,
                                  basisAmount: parseInt(e.target.value) || 0
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                placeholder="50000"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-1">Current Value</label>
                              <input
                                type="number"
                                value={source.annuityDetails?.currentValue || 85000}
                                onChange={(e) => updateIncomeSource(source.id, 'annuityDetails', {
                                  ...source.annuityDetails,
                                  currentValue: parseInt(e.target.value) || 0
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                                placeholder="85000"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-1">Type</label>
                              <select
                                value={source.annuityDetails?.annuityType || 'deferred'}
                                onChange={(e) => updateIncomeSource(source.id, 'annuityDetails', {
                                  ...source.annuityDetails,
                                  annuityType: e.target.value
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="deferred">Deferred</option>
                                <option value="immediate">Immediate</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <label className="flex items-center text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={source.annuityDetails?.isQualified || false}
                                onChange={(e) => updateIncomeSource(source.id, 'annuityDetails', {
                                  ...source.annuityDetails,
                                  isQualified: e.target.checked
                                })}
                                className="w-3 h-3 text-purple-600 mr-1"
                              />
                              Qualified Annuity (401k, IRA, etc.)
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Life Insurance-specific fields */}
                      {source.type === 'life-insurance' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-xs font-medium text-blue-900">Life Insurance Details</h6>
                            {source.lifeInsuranceDetails && (
                              <span className={`px-2 py-1 text-xs rounded ${
                                source.lifeInsuranceDetails.isMEC ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {source.lifeInsuranceDetails.isMEC ? 'MEC' : 'Non-MEC'}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-gray-700 mb-1">Policy Type</label>
                              <select
                                value={source.lifeInsuranceDetails?.policyType || 'whole-life'}
                                onChange={(e) => updateIncomeSource(source.id, 'lifeInsuranceDetails', {
                                  ...source.lifeInsuranceDetails,
                                  policyType: e.target.value
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="whole-life">Whole Life</option>
                                <option value="universal-life">Universal Life</option>
                                <option value="variable-life">Variable Life</option>
                                <option value="term">Term Life</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-1">Access Method</label>
                              <select
                                value={source.lifeInsuranceDetails?.accessMethod || 'withdrawal'}
                                onChange={(e) => updateIncomeSource(source.id, 'lifeInsuranceDetails', {
                                  ...source.lifeInsuranceDetails,
                                  accessMethod: e.target.value
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="withdrawal">Withdrawal</option>
                                <option value="loan">Policy Loan</option>
                                <option value="combination">Combination</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div>
                              <label className="block text-gray-700 mb-1">Cash Value</label>
                              <input
                                type="number"
                                value={source.lifeInsuranceDetails?.currentCashValue || ''}
                                onChange={(e) => updateIncomeSource(source.id, 'lifeInsuranceDetails', {
                                  ...source.lifeInsuranceDetails,
                                  currentCashValue: parseFloat(e.target.value) || 0
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="150000"
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 mb-1">Premiums Paid</label>
                              <input
                                type="number"
                                value={source.lifeInsuranceDetails?.totalPremiumsPaid || ''}
                                onChange={(e) => updateIncomeSource(source.id, 'lifeInsuranceDetails', {
                                  ...source.lifeInsuranceDetails,
                                  totalPremiumsPaid: parseFloat(e.target.value) || 0
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="120000"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <label className="flex items-center text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={source.lifeInsuranceDetails?.isMEC || false}
                                onChange={(e) => updateIncomeSource(source.id, 'lifeInsuranceDetails', {
                                  ...source.lifeInsuranceDetails,
                                  isMEC: e.target.checked
                                })}
                                className="w-3 h-3 text-blue-600 mr-1"
                              />
                              Modified Endowment Contract (MEC)
                            </label>
                          </div>
                          
                          {/* Display taxation summary */}
                          {source.lifeInsuranceDetails && (
                            <div className="mt-2 p-2 bg-white rounded text-xs">
                              <div className="font-medium text-gray-700 mb-1">Taxation Summary:</div>
                              <div className="text-gray-600">
                                {(() => {
                                  const cashValue = source.lifeInsuranceDetails.currentCashValue || 0;
                                  const premiumsPaid = source.lifeInsuranceDetails.totalPremiumsPaid || 0;
                                  const withdrawalAmount = getYearlyAmount(source);
                                  const isMEC = source.lifeInsuranceDetails.isMEC;
                                  const gains = Math.max(0, cashValue - premiumsPaid);
                                  
                                  if (source.lifeInsuranceDetails.policyType === 'term') {
                                    return "Term life has no cash value";
                                  } else if (isMEC) {
                                    if (withdrawalAmount <= gains) {
                                      return `Fully taxable (MEC - gains first): $${withdrawalAmount.toLocaleString()}`;
                                    } else {
                                      return `Partially taxable (MEC): $${gains.toLocaleString()} taxable`;
                                    }
                                  } else {
                                    if (withdrawalAmount <= premiumsPaid) {
                                      return "Tax-free (return of basis)";
                                    } else {
                                      const taxable = withdrawalAmount - premiumsPaid;
                                      return `Partially taxable: $${taxable.toLocaleString()} taxable`;
                                    }
                                  }
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tax-analysis' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Tax Analysis</h3>
                  
                  {/* FICA Toggle */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="fica-toggle" className="text-sm font-medium text-gray-700">
                      Include FICA in Calc
                    </label>
                    <input
                      id="fica-toggle"
                      type="checkbox"
                      checked={ficaEnabled}
                      onChange={(e) => setFicaEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* FICA Tax Analysis - Always show for informational purposes */}
                {calculations.earnedIncome > 0 && (
                  <div className="bg-blue-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-blue-900">
                      FICA Tax Analysis
                      {!ficaEnabled && (
                        <span className="text-xs text-gray-500 ml-2">(Not included in calculations)</span>
                      )}
                    </h4>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Earned Income:</span>
                          <span className="font-medium">${calculations.earnedIncome?.toLocaleString() || '0'}</span>
                        </div>
                        
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Social Security Tax (6.2%):</span>
                            <span className="font-medium text-red-600">${ficaTaxes.socialSecurityTax?.toLocaleString() || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Medicare Tax (1.45%):</span>
                            <span className="font-medium text-red-600">${ficaTaxes.medicareTax?.toLocaleString() || '0'}</span>
                          </div>
                          {ficaTaxes.additionalMedicareTax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Additional Medicare (0.9%):</span>
                              <span className="font-medium text-red-600">${ficaTaxes.additionalMedicareTax?.toLocaleString() || '0'}</span>
                            </div>
                          )}
                          
                          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                            <span className="text-gray-800">Total FICA Tax:</span>
                            <span className="text-red-600">${ficaTaxes.totalFICA?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <div><strong>Social Security:</strong> 6.2% on wages up to $176,100 (2025 wage base: $176,100)</div>
                      <div><strong>Medicare:</strong> 1.45% on all wages</div>
                      <div><strong>Additional Medicare:</strong> 0.9% on wages over $200,000</div>
                    </div>
                  </div>
                )}

                {/* NIIT Analysis */}
                {niitAnalysis.niitApplies && (
                  <div className="bg-yellow-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-yellow-900">Net Investment Income Tax (NIIT)</h4>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Investment Income:</span>
                          <span className="font-medium">${niitAnalysis.investmentIncome?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AGI Threshold:</span>
                          <span className="font-medium">${niitAnalysis.threshold?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Excess AGI:</span>
                          <span className="font-medium">${niitAnalysis.excessAGI?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax Rate:</span>
                          <span className="font-medium">3.8%</span>
                        </div>
                        
                        <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                          <span className="text-gray-800">NIIT Tax:</span>
                          <span className="text-red-600">${niitAnalysis.niitTax?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600">
                      <strong>NIIT:</strong> 3.8% tax on investment income for high earners
                      Applies to investment income when AGI exceeds threshold
                    </div>
                  </div>
                )}

                {/* Additional Medicare Tax Analysis */}
                {additionalMedicareTaxAnalysis.additionalMedicareTaxApplies && (
                  <div className="bg-pink-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-pink-900">Additional Medicare Tax</h4>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Earned Income:</span>
                          <span className="font-medium">${additionalMedicareTaxAnalysis.earnedIncome?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Threshold:</span>
                          <span className="font-medium">${additionalMedicareTaxAnalysis.threshold?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Excess Income:</span>
                          <span className="font-medium">${additionalMedicareTaxAnalysis.excessIncome?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax Rate:</span>
                          <span className="font-medium">0.9%</span>
                        </div>
                        
                        <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                          <span className="text-gray-800">Additional Medicare Tax:</span>
                          <span className="text-red-600">${additionalMedicareTaxAnalysis.additionalMedicareTax?.toLocaleString() || '0'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600">
                      <strong>Additional Medicare:</strong> 0.9% tax on earned income over threshold
                      Applies to wages, self-employment income, and RRTA compensation
                    </div>
                  </div>
                )}

                {/* AMT Analysis */}
                {calculations.totalIncome > 0 && (
                  <div className="bg-orange-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-orange-900">
                      Alternative Minimum Tax (AMT)
                      {!amtAnalysis.amtApplies && (
                        <span className="text-xs text-gray-500 ml-2">(No AMT liability)</span>
                      )}
                    </h4>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Regular Tax:</span>
                          <span className="font-semibold">{formatAMTCurrency(amtAnalysis.regularTax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AMT Income (AMTI):</span>
                          <span className="font-semibold">{formatAMTCurrency(amtAnalysis.amtIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AMT Exemption:</span>
                          <span className="font-semibold">{formatAMTCurrency(amtAnalysis.exemption)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AMT Taxable Income:</span>
                          <span className="font-semibold">{formatAMTCurrency(amtAnalysis.amtTaxableIncome)}</span>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">AMT Tax:</span>
                            <span className="font-semibold">{formatAMTCurrency(amtAnalysis.amtTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 font-medium">Additional Tax Due:</span>
                            <span className="font-bold text-orange-600">{formatAMTCurrency(amtAnalysis.additionalTax)}</span>
                          </div>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Effective AMT Rate:</span>
                            <span className="font-semibold">{formatAMTPercentage(amtAnalysis.effectiveAMTRate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {amtAnalysis.adjustments.adjustmentDetails.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">AMT Adjustments:</h5>
                        <div className="space-y-1 text-xs">
                          {amtAnalysis.adjustments.adjustmentDetails.map((adj, index) => (
                            <div key={index} className="flex justify-between text-gray-600">
                              <span>{adj.description}:</span>
                              <span>+{formatAMTCurrency(adj.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-600">
                      <div><strong>AMT:</strong> Parallel tax calculation ensuring minimum tax payment</div>
                      <div>You pay the higher of regular tax or AMT</div>
                    </div>
                  </div>
                )}

                {/* No Tax Analyses Message - Only show when no special taxes apply */}
                {!niitAnalysis.niitApplies && !additionalMedicareTaxAnalysis.additionalMedicareTaxApplies && calculations.earnedIncome === 0 && calculations.totalIncome === 0 && (
                  <div className="bg-gray-50 border rounded-lg p-6 text-center">
                    <div className="text-gray-600">
                      <p className="mb-2">No tax analyses available.</p>
                      <p className="text-sm">Add income sources to see detailed tax analysis.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deductions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Deductions</h3>
                
                {/* Standard vs Itemized Comparison */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Standard vs Itemized Deduction</h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Standard Deduction */}
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm font-medium text-gray-700 mb-1">Standard Deduction</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency(calculations.standardDeduction)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {taxpayer.filingStatus === 'marriedFilingJointly' ? 'Married Filing Jointly' : 
                         taxpayer.filingStatus === 'headOfHousehold' ? 'Head of Household' : 'Single'}
                        {taxpayer.age >= 65 && ' + Over 65'}
                        {taxpayer.filingStatus === 'marriedFilingJointly' && spouse.age >= 65 && ' + Spouse Over 65'}
                      </div>
                    </div>
                    
                    {/* Itemized Deduction */}
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm font-medium text-gray-700 mb-1">Itemized Deductions</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(
                          deductions.itemized.saltDeduction + 
                          deductions.itemized.mortgageInterest + 
                          deductions.itemized.charitableGiving + 
                          Math.max(0, deductions.itemized.medicalExpenses - (calculations.federalAGI * 0.075)) +
                          deductions.itemized.otherDeductions
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Total itemized amount
                      </div>
                    </div>
                  </div>
                  
                  {/* Which deduction is being used */}
                  <div className="text-center p-2 rounded" style={{
                    backgroundColor: (deductions.itemized.saltDeduction + 
                                    deductions.itemized.mortgageInterest + 
                                    deductions.itemized.charitableGiving + 
                                    Math.max(0, deductions.itemized.medicalExpenses - (calculations.federalAGI * 0.075)) +
                                    deductions.itemized.otherDeductions) > calculations.standardDeduction ? '#dcfce7' : '#dbeafe'
                  }}>
                    <div className="text-sm font-medium">
                      Using: {(deductions.itemized.saltDeduction + 
                              deductions.itemized.mortgageInterest + 
                              deductions.itemized.charitableGiving + 
                              Math.max(0, deductions.itemized.medicalExpenses - (calculations.federalAGI * 0.075)) +
                              deductions.itemized.otherDeductions) > calculations.standardDeduction ? 'Itemized' : 'Standard'} Deduction
                    </div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(Math.max(
                        calculations.standardDeduction,
                        deductions.itemized.saltDeduction + 
                        deductions.itemized.mortgageInterest + 
                        deductions.itemized.charitableGiving + 
                        Math.max(0, deductions.itemized.medicalExpenses - (calculations.federalAGI * 0.075)) +
                        deductions.itemized.otherDeductions
                      ))}
                    </div>
                  </div>
                </div>

                {/* Itemized Deduction Categories */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Itemized Deduction Categories</h4>
                  
                  <div className="space-y-4">
                    {/* State and Local Taxes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State and Local Taxes (SALT)
                        <span className="text-xs text-gray-500 ml-1">(Capped at $10,000)</span>
                      </label>
                      <input
                        type="number"
                        value={deductions.itemized.saltDeduction}
                        onChange={(e) => setDeductions(prev => ({
                          ...prev,
                          itemized: { ...prev.itemized, saltDeduction: Math.min(10000, parseInt(e.target.value) || 0) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                        max="10000"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Property taxes, state income taxes, sales taxes
                      </div>
                    </div>

                    {/* Mortgage Interest */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mortgage Interest
                      </label>
                      <input
                        type="number"
                        value={deductions.itemized.mortgageInterest}
                        onChange={(e) => setDeductions(prev => ({
                          ...prev,
                          itemized: { ...prev.itemized, mortgageInterest: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Interest on mortgage debt up to $750,000
                      </div>
                    </div>

                    {/* Charitable Giving */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Charitable Contributions
                      </label>
                      <input
                        type="number"
                        value={deductions.itemized.charitableGiving}
                        onChange={(e) => setDeductions(prev => ({
                          ...prev,
                          itemized: { ...prev.itemized, charitableGiving: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Donations to qualified charitable organizations
                      </div>
                    </div>

                    {/* Medical Expenses */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medical and Dental Expenses
                        <span className="text-xs text-gray-500 ml-1">(Only amount over 7.5% of AGI)</span>
                      </label>
                      <input
                        type="number"
                        value={deductions.itemized.medicalExpenses}
                        onChange={(e) => setDeductions(prev => ({
                          ...prev,
                          itemized: { ...prev.itemized, medicalExpenses: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Total medical expenses: {formatCurrency(deductions.itemized.medicalExpenses)}<br/>
                        7.5% of AGI threshold: {formatCurrency(calculations.federalAGI * 0.075)}<br/>
                        Deductible amount: {formatCurrency(Math.max(0, deductions.itemized.medicalExpenses - (calculations.federalAGI * 0.075)))}
                      </div>
                    </div>

                    {/* Other Deductions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Itemized Deductions
                      </label>
                      <input
                        type="number"
                        value={deductions.itemized.otherDeductions}
                        onChange={(e) => setDeductions(prev => ({
                          ...prev,
                          itemized: { ...prev.itemized, otherDeductions: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Other qualifying itemized deductions
                      </div>
                    </div>
                  </div>
                </div>

                {/* State Deductions and Credits */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Michigan State Deductions & Credits</h4>
                  
                  <div className="space-y-4">
                    {/* Michigan Homestead Property Tax Credit */}
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-gray-700">Michigan Homestead Property Tax Credit</div>
                        <div className="text-lg font-semibold text-orange-600">
                          {homesteadCredit.eligible ? formatCurrency(homesteadCredit.credit) : '$0'}
                        </div>
                      </div>
                      
                      {homesteadCredit.eligible ? (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>✅ Eligible - Property owner, Michigan resident 6+ months</div>
                          <div>Property taxes paid: {formatCurrency(homesteadCredit.propertyTaxesPaid)}</div>
                          <div>Property tax value: {formatCurrency(homesteadCredit.propertyTaxValue)}</div>
                          <div>Income threshold: {homesteadCredit.incomeThreshold}</div>
                          {homesteadCredit.calculation && (
                            <div className="mt-2 p-2 bg-white rounded text-xs">
                              <div className="font-medium">Calculation Details:</div>
                              <div>Max creditable property tax: {formatCurrency(homesteadCredit.calculation.maxCreditablePropertyTax)}</div>
                              <div>3.5% of income threshold: {formatCurrency(homesteadCredit.calculation.incomeThresholdForPropertyTax)}</div>
                              <div>Excess property tax: {formatCurrency(homesteadCredit.calculation.excessPropertyTax)}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-red-600">
                          ❌ Not eligible: {homesteadCredit.reason}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Based on housing information in People tab
                      </div>
                    </div>

                    {/* Property Tax Exemptions Info */}
                    {propertyTaxExemptions.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm font-medium text-blue-800 mb-2">Additional Property Tax Exemptions Available</div>
                        <div className="space-y-2">
                          {propertyTaxExemptions.map((exemption, index) => (
                            <div key={index} className="text-xs text-blue-700">
                              <div className="font-medium">{exemption.name}</div>
                              <div>{exemption.description}</div>
                              <div className="text-blue-600">Potential saving: {exemption.potentialSaving}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Michigan Homestead Credit (Auto-calculated) */}
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm font-medium text-gray-700 mb-1">Michigan Homestead Credit (Income-Based)</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(calculations.michiganCredit || 0)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Automatically calculated based on income (available if total income ≤ $69,700)
                      </div>
                    </div>

                    {/* Other Michigan Deductions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Michigan Deductions
                      </label>
                      <input
                        type="number"
                        value={deductions.state.michiganDeductions}
                        onChange={(e) => setDeductions(prev => ({
                          ...prev,
                          state: { ...prev.state, michiganDeductions: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Michigan-specific deductions (retirement income, etc.)
                      </div>
                    </div>

                    {/* Other State Credits */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Other Michigan Credits
                      </label>
                      <input
                        type="number"
                        value={deductions.state.otherCredits}
                        onChange={(e) => setDeductions(prev => ({
                          ...prev,
                          state: { ...prev.state, otherCredits: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        placeholder="0"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Other Michigan tax credits
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capital Gains Taxation Analysis */}
                {capitalGainsDetails && (
                  <div className="bg-green-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-green-900">Capital Gains Taxation Analysis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Long-Term Capital Gains */}
                      {capitalGainsDetails.longTerm.gains > 0 && (
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">Long-Term Capital Gains</h5>
                            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                              Preferential Rates
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gains Amount:</span>
                              <span className="font-semibold">{formatCurrency(capitalGainsDetails.longTerm.gains)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tax Rate:</span>
                              <span className="font-semibold">{capitalGainsDetails.longTerm.bracket}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Federal Tax:</span>
                              <span className="font-semibold text-red-600">{formatCurrency(capitalGainsDetails.longTerm.ordinaryCapitalGainsTax)}</span>
                            </div>
                            {capitalGainsDetails.longTerm.niitApplies && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">NIIT (3.8%):</span>
                                <span className="font-semibold text-red-600">{formatCurrency(capitalGainsDetails.longTerm.niitTax)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-600">Total Tax:</span>
                              <span className="font-bold text-red-600">{formatCurrency(capitalGainsDetails.longTerm.tax)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Effective Rate:</span>
                              <span className="font-semibold">{formatPercentage(capitalGainsDetails.longTerm.effectiveRate)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Short-Term Capital Gains */}
                      {capitalGainsDetails.shortTerm.gains > 0 && (
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">Short-Term Capital Gains</h5>
                            <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                              Ordinary Rates
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Gains Amount:</span>
                              <span className="font-semibold">{formatCurrency(capitalGainsDetails.shortTerm.gains)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tax Rate:</span>
                              <span className="font-semibold">{capitalGainsDetails.shortTerm.bracket}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Federal Tax:</span>
                              <span className="font-semibold text-red-600">{formatCurrency(capitalGainsDetails.shortTerm.ordinaryCapitalGainsTax)}</span>
                            </div>
                            {capitalGainsDetails.shortTerm.niitApplies && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">NIIT (3.8%):</span>
                                <span className="font-semibold text-red-600">{formatCurrency(capitalGainsDetails.shortTerm.niitTax)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t pt-2">
                              <span className="text-gray-600">Total Tax:</span>
                              <span className="font-bold text-red-600">{formatCurrency(capitalGainsDetails.shortTerm.tax)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Effective Rate:</span>
                              <span className="font-semibold">{formatPercentage(capitalGainsDetails.shortTerm.effectiveRate)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Total Capital Gains Summary */}
                    {capitalGainsDetails.total.gains > 0 && (
                      <div className="mt-4 p-3 bg-gray-100 rounded">
                        <h6 className="font-medium text-gray-800 mb-2">Total Capital Gains Summary</h6>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-gray-600">Total Gains</div>
                            <div className="font-bold">{formatCurrency(capitalGainsDetails.total.gains)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Total Tax</div>
                            <div className="font-bold text-red-600">{formatCurrency(capitalGainsDetails.total.tax)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Overall Rate</div>
                            <div className="font-bold">{formatPercentage(capitalGainsDetails.total.effectiveRate)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-gray-600">
                      <div><strong>Note:</strong> Long-term gains (held &gt;1 year) qualify for preferential tax rates of 0%, 15%, or 20%.</div>
                      <div><strong>Short-term gains</strong> (held ≤1 year) are taxed as ordinary income at your marginal tax rate.</div>
                      {(capitalGainsDetails.longTerm.niitApplies || capitalGainsDetails.shortTerm.niitApplies) && (
                        <div><strong>NIIT:</strong> 3.8% Net Investment Income Tax applies to high earners on investment income.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Net Investment Income Tax (NIIT) Analysis */}
                {niitAnalysis.applies && (
                  <div className="bg-purple-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-purple-900">Net Investment Income Tax (NIIT)</h4>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Modified AGI:</span>
                          <span className="font-semibold">{formatCurrency(niitAnalysis.modifiedAGI)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Net Investment Income:</span>
                          <span className="font-semibold">{formatCurrency(niitAnalysis.netInvestmentIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">NIIT Threshold:</span>
                          <span className="font-semibold">{niitAnalysis.thresholdFormatted}</span>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxable Amount:</span>
                            <span className="font-semibold">{formatCurrency(niitAnalysis.taxableAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">NIIT Rate:</span>
                            <span className="font-semibold">{niitAnalysis.ratePercent}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 font-medium">NIIT Tax:</span>
                          <span className="font-bold text-purple-600">{niitAnalysis.taxFormatted}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600">
                      <div><strong>NIIT:</strong> 3.8% tax on investment income for high earners</div>
                      <div>Applies to the lesser of: net investment income or excess over threshold</div>
                    </div>
                  </div>
                )}

                {/* Additional Medicare Tax Analysis */}
                {additionalMedicareTaxAnalysis.applies && (
                  <div className="bg-red-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-red-900">Additional Medicare Tax</h4>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Earned Income:</span>
                          <span className="font-semibold">{formatCurrency(additionalMedicareTaxAnalysis.earnedIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Threshold:</span>
                          <span className="font-semibold">{additionalMedicareTaxAnalysis.thresholdFormatted}</span>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Excess Income:</span>
                            <span className="font-semibold">{formatCurrency(additionalMedicareTaxAnalysis.excessIncome)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax Rate:</span>
                            <span className="font-semibold">{additionalMedicareTaxAnalysis.ratePercent}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 font-medium">Additional Medicare Tax:</span>
                          <span className="font-bold text-red-600">{additionalMedicareTaxAnalysis.taxFormatted}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600">
                      <div><strong>Additional Medicare:</strong> 0.9% tax on earned income over threshold</div>
                      <div>Applies to wages, self-employment income, and RRTA compensation</div>
                    </div>
                  </div>
                )}

                {/* Annuity Taxation Analysis */}
                {annuityTaxationDetails.length > 0 && (
                  <div className="bg-purple-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-purple-900">Annuity Taxation Analysis</h4>
                    
                    {annuityTaxationDetails.map((annuity, index) => (
                      <div key={annuity.sourceId} className="mb-4 last:mb-0">
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{annuity.sourceName}</h5>
                            <span className={`px-2 py-1 text-xs rounded ${
                              annuity.classification.isPreTEFRA ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {annuity.classification.tefraClassification}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Taxable Amount:</div>
                              <div className="font-semibold text-red-600">{formatCurrency(annuity.taxation.taxableAmount)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Tax-Free Amount:</div>
                              <div className="font-semibold text-green-600">{formatCurrency(annuity.taxation.nonTaxableAmount)}</div>
                            </div>
                          </div>
                          
                          {annuity.taxation.penaltyAmount > 0 && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                              <div className="text-red-800 font-medium">Early Withdrawal Penalty</div>
                              <div className="text-red-600">{formatCurrency(annuity.taxation.penaltyAmount)} (10% on taxable portion)</div>
                            </div>
                          )}
                          
                          {annuity.rmd.rmdRequired && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                              <div className="text-yellow-800 font-medium">Required Minimum Distribution</div>
                              <div className="text-yellow-700">Annual RMD: {formatCurrency(annuity.rmd.rmdAmount)}</div>
                              <div className="text-xs text-yellow-600">Based on {annuity.rmd.tableUsed} (Factor: {annuity.rmd.lifetimeFactor})</div>
                            </div>
                          )}
                          
                          <div className="mt-3 text-xs text-gray-600">
                            <div><strong>Taxation Method:</strong> {annuity.classification.taxationMethod}</div>
                            {!annuity.classification.isPreTEFRA && annuity.taxation.exclusionRatio && (
                              <div><strong>Exclusion Ratio:</strong> {(annuity.taxation.exclusionRatio * 100).toFixed(1)}% tax-free</div>
                            )}
                            {annuity.classification.isPreTEFRA && (
                              <div><strong>Basis Remaining:</strong> {formatCurrency(annuity.taxation.basisRemaining)}</div>
                            )}
                          </div>
                          
                          {annuity.strategies.length > 0 && (
                            <div className="mt-3 border-t pt-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">Tax Strategies:</div>
                              {annuity.strategies.slice(0, 2).map((strategy, idx) => (
                                <div key={idx} className="text-xs text-gray-600 mb-1">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                    strategy.priority === 'high' ? 'bg-red-400' : 
                                    strategy.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                  }`}></span>
                                  <strong>{strategy.title}:</strong> {strategy.description}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Life Insurance Taxation Analysis */}
                {lifeInsuranceTaxationDetails.length > 0 && (
                  <div className="bg-blue-50 border rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-blue-900">Life Insurance Taxation Analysis</h4>
                    
                    {lifeInsuranceTaxationDetails.map((policy, index) => (
                      <div key={policy.sourceId} className="mb-4 last:mb-0">
                        <div className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-gray-800">{policy.sourceName}</h5>
                            <span className={`px-2 py-1 text-xs rounded ${
                              policy.classification.isMEC ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {policy.classification.isMEC ? 'MEC' : policy.classification.policyType}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600">Taxable Amount:</div>
                              <div className="font-semibold text-red-600">{formatCurrency(policy.taxation.taxableAmount)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Tax-Free Amount:</div>
                              <div className="font-semibold text-green-600">{formatCurrency(policy.taxation.taxFreeAmount)}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                            <div>
                              <div className="text-gray-600">Access Method:</div>
                              <div className="font-medium capitalize">{policy.taxation.accessMethod}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Effective Tax Rate:</div>
                              <div className="font-medium">{formatPercentage(policy.taxation.effectiveTaxRate)}</div>
                            </div>
                          </div>
                          
                          <div className="mt-3 text-xs text-gray-600">
                            <div><strong>Strategy:</strong> {policy.taxation.strategy}</div>
                            <div><strong>Tax Treatment:</strong> {policy.classification.taxCharacteristics}</div>
                            {policy.classification.isMEC && (
                              <div className="text-red-600"><strong>MEC Impact:</strong> {policy.classification.mecImpact}</div>
                            )}
                          </div>
                          
                          {policy.strategies.length > 0 && (
                            <div className="mt-3 border-t pt-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">Tax Strategies:</div>
                              {policy.strategies.slice(0, 2).map((strategy, idx) => (
                                <div key={idx} className="text-xs text-gray-600 mb-1">
                                  <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                    strategy.priority === 'High' ? 'bg-red-400' : 
                                    strategy.priority === 'Medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                  }`}></span>
                                  <strong>{strategy.strategy}:</strong> {strategy.description}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'multiyear' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Multi-Year Tax Planning</h3>
                
                {/* Projection Years */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Projection Years</label>
                  <select 
                    value={multiYearSettings.projectionYears}
                    onChange={(e) => setMultiYearSettings(prev => ({ ...prev, projectionYears: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="3">3 Years</option>
                    <option value="5">5 Years</option>
                    <option value="10">10 Years</option>
                  </select>
                </div>

                {/* Income Growth Assumptions */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Income Growth Assumptions</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income Growth</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="0.1"
                          value={multiYearSettings.incomeGrowthRate}
                          onChange={(e) => setMultiYearSettings(prev => ({ ...prev, incomeGrowthRate: parseFloat(e.target.value) || 0 }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <span className="text-sm text-gray-600">% per year</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Social Security COLA</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          step="0.1"
                          value={multiYearSettings.socialSecurityCOLA}
                          onChange={(e) => setMultiYearSettings(prev => ({ ...prev, socialSecurityCOLA: parseFloat(e.target.value) || 0 }))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <span className="text-sm text-gray-600">% per year</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Roth Conversion Analysis */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Roth Conversion Planning</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Conversion Amount</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">$</span>
                        <input 
                          type="number" 
                          step="1000"
                          value={multiYearSettings.rothConversionAmount}
                          onChange={(e) => setMultiYearSettings(prev => ({ ...prev, rothConversionAmount: parseInt(e.target.value) || 0 }))}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Tax Bracket</label>
                      <select 
                        value={multiYearSettings.targetTaxBracket}
                        onChange={(e) => setMultiYearSettings(prev => ({ ...prev, targetTaxBracket: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="10">Stay in 10% bracket</option>
                        <option value="12">Fill 12% bracket</option>
                        <option value="22">Fill 22% bracket</option>
                        <option value="24">Fill 24% bracket</option>
                        <option value="custom">Custom amount</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Scenario Planning */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Scenario Planning</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="retirement-scenario" 
                        checked={multiYearSettings.retirementAtAge65}
                        onChange={(e) => setMultiYearSettings(prev => ({ ...prev, retirementAtAge65: e.target.checked }))}
                        className="rounded" 
                      />
                      <label htmlFor="retirement-scenario" className="text-sm text-gray-700">
                        Model retirement at age 65
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="ss-delay" 
                        checked={multiYearSettings.delaySocialSecurityTo70}
                        onChange={(e) => setMultiYearSettings(prev => ({ ...prev, delaySocialSecurityTo70: e.target.checked }))}
                        className="rounded" 
                      />
                      <label htmlFor="ss-delay" className="text-sm text-gray-700">
                        Delay Social Security to age 70
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="medicare-start" 
                        checked={multiYearSettings.startMedicareAt65}
                        onChange={(e) => setMultiYearSettings(prev => ({ ...prev, startMedicareAt65: e.target.checked }))}
                        className="rounded" 
                      />
                      <label htmlFor="medicare-start" className="text-sm text-gray-700">
                        Start Medicare at age 65
                      </label>
                    </div>
                  </div>
                </div>

                {/* Analysis Controls */}
                <div className="pt-4 border-t">
                  <button 
                    onClick={generateMultiYearAnalysis}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Generate Multi-Year Analysis
                  </button>
                </div>

                {/* Results Display */}
                {multiYearResults && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-medium text-gray-800">Analysis Results</h4>
                    
                    {/* Summary Table */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-gray-700 mb-2">Year-by-Year Projections</div>
                      <div className="space-y-1">
                        {multiYearResults.projections.map((year, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-600">{year.year} (Age {year.projectedAge})</span>
                            <span className="font-medium">{formatCurrency(year.totalTax)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Insights */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-green-800 mb-2">Key Insights</div>
                      <div className="text-xs text-green-700 space-y-1">
                        <div>• Avg Effective Rate: {multiYearResults.insights.averageEffectiveRate.toFixed(1)}%</div>
                        <div>• IRMAA Years: {multiYearResults.insights.irmaaYears} of {multiYearSettings.projectionYears}</div>
                        {multiYearSettings.rothConversionAmount > 0 && (
                          <div>• Annual Roth Conversion: {formatCurrency(multiYearSettings.rothConversionAmount)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Insights */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">Quick Insights</h5>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>• Current effective rate (Fed): {(calculations.federalTax / calculations.totalIncome * 100).toFixed(2)}%</div>
                    <div>• Optimal Roth conversion: ~${(() => {
                      // Calculate optimal Roth conversion to fill 12% bracket
                      const currentTaxableIncome = calculations.federalTaxableIncome || 0;
                      const bracket12Max = taxpayer.filingStatus === 'single' ? 47150 : 94300;
                      const roomIn12Bracket = Math.max(0, bracket12Max - currentTaxableIncome);
                      return Math.min(roomIn12Bracket, 50000).toLocaleString();
                    })()}/year</div>
                    <div>• IRMAA threshold: ${(() => {
                      try {
                        const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
                        const currentAGI = calculations.adjustedGrossIncome || calculations.totalIncome;
                        
                        // Use the same adjusted threshold logic as the chart
                        let adjustedThreshold = irmaaThresholds[1]?.min || 103000;
                        if (taxpayer.filingStatus === 'single') {
                          // Single filer adjustments (same as chart positioning)
                          if (adjustedThreshold === 106000) adjustedThreshold = 111000; // Tier 1
                          else if (adjustedThreshold === 133000) adjustedThreshold = 138000; // Tier 2
                          else if (adjustedThreshold === 167000) adjustedThreshold = 172000; // Tier 3
                          else adjustedThreshold = adjustedThreshold + 5000; // Fallback
                        } else {
                          // Married filing jointly adjustments
                          if (adjustedThreshold === 212000) adjustedThreshold = 212000; // Tier 1 - use actual MAGI threshold
                          else if (adjustedThreshold === 266000) adjustedThreshold = 266000; // Tier 2 - use actual MAGI threshold
                          else if (adjustedThreshold === 334000) adjustedThreshold = 334000; // Tier 3 - use actual MAGI threshold
                          else adjustedThreshold = adjustedThreshold; // General formula: use MAGI threshold directly
                        }
                        
                        const distanceToIrmaa = Math.max(0, adjustedThreshold - currentAGI);
                        return distanceToIrmaa.toLocaleString();
                      } catch (e) {
                        return "N/A";
                      }
                    })()} away</div>
                    <div>• Next SS tier: ${(() => {
                      try {
                        const ssThresholds = getSocialSecurityThresholds(taxpayer.filingStatus);
                        const provisionalIncome = calculations.provisionalIncome || calculations.totalIncome || 0;
                        let nextThreshold = 0;
                        
                        // Debug: Check current tier and thresholds
                        if (provisionalIncome <= ssThresholds.tier2) {
                          nextThreshold = ssThresholds.tier2 - provisionalIncome;
                        } else if (provisionalIncome < ssThresholds.tier3) {
                          nextThreshold = ssThresholds.tier3 - provisionalIncome;
                        } else {
                          return "0 (at highest tier)";
                        }
                        return Math.max(0, nextThreshold).toLocaleString();
                      } catch (e) {
                        return "N/A";
                      }
                    })()} away</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai-optimize' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-pink-700">AI Tax Optimization</h3>
                  <div className="text-sm text-gray-600">
                    {optimizationRecommendations.length} recommendations found
                  </div>
                </div>

                {/* Optimization Recommendations */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Current Year Recommendations</h4>
                  
                  {optimizationRecommendations.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-green-600 mr-3">✓</div>
                        <div>
                          <h5 className="font-medium text-green-800">Tax Strategy Optimized</h5>
                          <p className="text-sm text-green-700">No immediate optimization opportunities found. Your current tax strategy appears well-positioned.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    optimizationRecommendations.map((rec, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${
                        rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                        rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                        'border-blue-200 bg-blue-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                rec.priority === 'high' ? 'bg-red-500' :
                                rec.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}></span>
                              <h5 className="font-medium text-gray-800">{rec.title}</h5>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {rec.priority} priority
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                            <p className="text-sm text-gray-600 mb-3">{rec.recommendation}</p>
                            
                            {rec.potentialSavings && (
                              <div className="text-sm font-medium text-green-600 mb-3">
                                Potential Savings: {typeof rec.potentialSavings === 'number' 
                                  ? `$${rec.potentialSavings.toLocaleString()}` 
                                  : rec.potentialSavings}
                              </div>
                            )}
                            
                            {rec.actionItems && rec.actionItems.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Action Items:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {rec.actionItems.map((item, itemIndex) => (
                                    <li key={itemIndex} className="flex items-start">
                                      <span className="text-gray-400 mr-2">•</span>
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Multi-Year Strategy */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Multi-Year Strategy Overview</h4>
                  
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h5 className="font-medium text-gray-800">Strategic Planning Timeline</h5>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {multiYearStrategy.slice(0, 5).map((yearStrategy, index) => (
                        <div key={index} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-800">
                              {yearStrategy.year} (Age {yearStrategy.age})
                            </div>
                            <div className="text-sm text-gray-500">
                              {index === 0 ? 'Current Year' : `Year ${index + 1}`}
                            </div>
                          </div>
                          
                          {yearStrategy.recommendations.length > 0 ? (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {yearStrategy.recommendations.map((rec, recIndex) => (
                                <li key={recIndex} className="flex items-start">
                                  <span className="text-blue-400 mr-2">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Continue current strategy</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Roth Conversion Analysis */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-800">Roth Conversion Analysis</h4>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Current Tax Environment</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Federal Marginal Rate:</span>
                            <span className="font-medium">{formatPercentage(calculations.effectiveMarginalRate || calculations.federalMarginalRate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Combined Marginal Rate:</span>
                            <span className="font-medium">{formatPercentage((calculations.effectiveMarginalRate || calculations.federalMarginalRate) + (calculations.netStateTax / calculations.federalTaxableIncome || 0))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Room to Next Rate Hike:</span>
                            <span className="font-medium">{formatCurrency(calculations.amountToNextRateHike || calculations.amountToNextBracket || 0)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Conversion Considerations</h5>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            <span>Current age: {taxpayer.age} (RMDs start at 73)</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            <span>Years until RMDs: {Math.max(73 - taxpayer.age, 0)}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-blue-400 mr-2">•</span>
                            <span>Consider multi-year conversion strategy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-600">
                    <strong>Disclaimer:</strong> These recommendations are based on current tax law and your entered information. 
                    Tax planning strategies should be evaluated with a qualified tax professional who can consider your complete financial situation. 
                    Future tax law changes may affect the validity of these recommendations.
                  </p>
                </div>

                {/* Tax Credits Analysis */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="text-lg font-semibold mb-3">Tax Credits</h4>
                  <div className="space-y-3">
                    {/* Federal Credits */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-600 border-b pb-1">Federal Credits</div>
                      <div className="text-xs text-gray-500 italic">
                        No federal credits currently calculated. Future versions may include:
                      </div>
                      <div className="text-xs text-gray-400 pl-2 space-y-1">
                        <div>• Child Tax Credit</div>
                        <div>• Earned Income Tax Credit</div>
                        <div>• Education Credits</div>
                        <div>• Retirement Savings Contributions Credit</div>
                      </div>
                    </div>

                    {/* State Credits */}
                    <div className="space-y-2 border-t pt-2">
                      <div className="text-sm font-medium text-gray-600">Michigan State Credits</div>
                      
                      {/* Michigan Homestead Credit */}
                      {calculations.michiganCredit > 0 && (
                        <div className="bg-green-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 font-medium">Homestead Property Tax Credit</span>
                            <span className="text-sm font-bold text-green-600">-{formatCurrency(calculations.michiganCredit)}</span>
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Automatically calculated based on income and filing status
                          </div>
                        </div>
                      )}
                      
                      {calculations.michiganCredit === 0 && (
                        <div className="text-xs text-gray-500">
                          No Michigan Homestead Credit (income may be above threshold)
                        </div>
                      )}

                      {/* Other State Credits from Deductions */}
                      {deductions.state.otherCredits > 0 && (
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700 font-medium">Other Michigan Credits</span>
                            <span className="text-sm font-bold text-blue-600">-{formatCurrency(deductions.state.otherCredits)}</span>
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Manually entered in Deductions tab
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total Credits Summary */}
                    <div className="space-y-2 border-t pt-2">
                      <div className="text-sm font-medium text-gray-600">Credits Summary</div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Total Federal Credits</span>
                          <span className="text-sm font-medium">{formatCurrency(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Total State Credits</span>
                          <span className="text-sm font-medium text-green-600">
                            -{formatCurrency(calculations.michiganCredit + (deductions.state.otherCredits || 0))}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span className="text-sm font-bold text-gray-700">Total Credits</span>
                          <span className="text-sm font-bold text-green-600">
                            -{formatCurrency(calculations.michiganCredit + (deductions.state.otherCredits || 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Credits Impact */}
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                      <div className="font-medium">Impact on Tax Liability:</div>
                      <div>Credits directly reduce your tax owed dollar-for-dollar, unlike deductions which reduce taxable income.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'universal-settings' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-indigo-700">Settings</h3>
                  <button
                    onClick={() => {
                      setViewModalMode('save');
                      setShowViewModal(true);
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                  >
                    Save Current View
                  </button>
                </div>
                
                {/* Tax Year Selection */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium mb-3">Tax Year</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax Year for Calculations
                      </label>
                      <select 
                        value={appSettings.taxYear}
                        onChange={(e) => setAppSettings(prev => ({ ...prev, taxYear: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value={2024}>2024</option>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select the tax year for bracket calculations and thresholds
                      </p>
                    </div>
                    
                    {/* TCJA Sunsetting Toggle */}
                    {appSettings.taxYear >= 2026 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Apply TCJA Sunsetting
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                              Tax Cuts and Jobs Act provisions expire after 2025. Enable to use pre-TCJA brackets for 2026+.
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={appSettings.tcjaSunsetting}
                            onChange={(e) => setAppSettings(prev => ({ ...prev, tcjaSunsetting: e.target.checked }))}
                            className="ml-3 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RMD Feature Toggle */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium mb-3">RMD Features</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Enable RMD Calculations
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Automatically calculate Required Minimum Distributions for qualified accounts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={appSettings.rmdEnabled}
                      onChange={(e) => setAppSettings(prev => ({ ...prev, rmdEnabled: e.target.checked }))}
                      className="ml-3 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {/* Branding Settings */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium mb-3">Branding & Disclosures</h4>
                  <BrandingSettings />
                </div>

                {/* Current Settings Summary */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-md font-medium text-blue-900 mb-2">Current Settings Summary</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Tax Year: <span className="font-medium">{appSettings.taxYear}</span></div>
                    {appSettings.taxYear >= 2026 && (
                      <div>TCJA Sunsetting: <span className="font-medium">{appSettings.tcjaSunsetting ? 'Enabled' : 'Disabled'}</span></div>
                    )}
                    <div>RMD Calculations: <span className="font-medium">{appSettings.rmdEnabled ? 'Enabled' : 'Disabled'}</span></div>
                    <div>Display Precision: <span className="font-medium">2 decimal places</span></div>
                    <div>Advanced Features: <span className="font-medium">Enabled</span></div>
                  </div>
                </div>
                
                {/* Saved Views Management */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium mb-3">Saved View Preferences</h4>
                  
                  {savedViews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-sm">No saved views yet</div>
                      <div className="text-xs mt-1">Save your current view preferences to quickly switch between different setups</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedViews.map((view) => (
                        <div key={view.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="font-medium text-sm">{view.name}</div>
                            <div className="text-xs text-gray-500">
                              Saved {new Date(view.timestamp).toLocaleDateString()}
                              {defaultViewId === view.id && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => loadView(view)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                            >
                              Load
                            </button>
                            {defaultViewId !== view.id && (
                              <button
                                onClick={() => setAsDefaultView(view.id)}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => setShowDeleteViewConfirm(view.id)}
                              className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current View Preview */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <h4 className="text-md font-medium text-indigo-900 mb-3">Current View Settings</h4>
                  <div className="text-sm text-indigo-800 space-y-2">
                    <div className="flex justify-between">
                      <span>FICA Enabled:</span>
                      <span className="font-medium">{ficaEnabled ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Map View:</span>
                      <span className="font-medium capitalize">{taxMapSettings.methodology}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RMD Auto-Calculation:</span>
                      <span className="font-medium">{appSettings.rmdEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medicare Part B (Taxpayer):</span>
                      <span className="font-medium">{appSettings.medicare.taxpayer.partB ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medicare Part B (Spouse):</span>
                      <span className="font-medium">{appSettings.medicare.spouse.partB ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* RMD Settings */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium mb-3">Required Minimum Distribution (RMD) Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Auto-Calculate RMDs
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          Automatically calculate and add estimated RMDs as income sources when qualified accounts are detected
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appSettings.rmdEnabled}
                          onChange={(e) => setAppSettings(prev => ({
                            ...prev,
                            rmdEnabled: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                    
                    {appSettings.rmdEnabled && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-sm text-blue-800">
                          <div className="font-medium mb-1">How RMD Auto-Calculation Works:</div>
                          <ul className="text-xs space-y-1 ml-4 list-disc">
                            <li>Detects qualified accounts (Traditional IRA, 401k, etc.) for taxpayer and spouse</li>
                            <li>Calculates RMDs based on account balances and current age (using IRS factors)</li>
                            <li>Creates separate "Estimated RMD" income sources that can be toggled on/off</li>
                            <li>Updates automatically when account balances or ages change</li>
                            <li>Each RMD source allows manual override of calculated amount</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-md font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setViewModalMode('manage');
                        setShowViewModal(true);
                      }}
                      className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                    >
                      Manage All Views
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Reset all view preferences to default? This cannot be undone.')) {
                          setSavedViews([]);
                          setDefaultViewId(null);
                          localStorage.removeItem('taxCalculatorSavedViews');
                          localStorage.removeItem('taxCalculatorDefaultView');
                        }
                      }}
                      className="w-full px-3 py-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                    >
                      Reset All Views
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Middle Panel - Analysis (50%) */}
        <div className="flex-1 bg-white border-r border-gray-200">
          <div className="p-6 h-full flex flex-col">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {middlePaneAnalysis === 'taxMap' 
                    ? 'Rate on next dollar of Ordinary Income' 
                    : middlePaneAnalysis === 'sequenceReturns'
                    ? 'Sequence of Returns Analysis'
                    : middlePaneAnalysis === 'socialSecurity'
                    ? 'Social Security Analysis'
                    : middlePaneAnalysis === 'reports'
                    ? 'Professional Reports'
                    : middlePaneAnalysis === 'help'
                    ? 'Help & Documentation'
                    : 'Assets Management'
                  }
                </h2>
                
                {/* Analysis Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setMiddlePaneAnalysis('taxMap')}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      middlePaneAnalysis === 'taxMap'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tax Map
                  </button>
                  <button
                    onClick={() => setMiddlePaneAnalysis('sequenceReturns')}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      middlePaneAnalysis === 'sequenceReturns'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sequence Risk
                  </button>
                  <button
                    onClick={() => setMiddlePaneAnalysis('socialSecurity')}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      middlePaneAnalysis === 'socialSecurity'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Social Security
                  </button>
                  <button
                    onClick={() => setMiddlePaneAnalysis('assets')}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      middlePaneAnalysis === 'assets'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Assets
                  </button>
                  <button
                    onClick={() => setMiddlePaneAnalysis('clients')}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      middlePaneAnalysis === 'clients'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Clients
                  </button>
                  <button
                    onClick={() => setMiddlePaneAnalysis('reports')}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      middlePaneAnalysis === 'reports'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Reports
                  </button>
                  <button
                    onClick={() => setMiddlePaneAnalysis('help')}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      middlePaneAnalysis === 'help'
                        ? 'bg-white text-blue-600 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Help
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              {middlePaneAnalysis === 'taxMap' ? (
                <InteractiveTaxMap 
                  calculations={getMapDisplayScenarioData.calculations}
                  incomeSources={getMapDisplayScenarioData.incomeSources}
                  settings={getMapDisplayScenarioData.settings}
                  appSettings={getMapDisplayScenarioData.appSettings}
                  ficaEnabled={getMapDisplayScenarioData.ficaEnabled}
                  onToggleIncomeSource={toggleIncomeSource}
                  onUpdateSettings={setTaxMapSettings}
                />
              ) : middlePaneAnalysis === 'sequenceReturns' ? (
                <SequenceOfReturnsAnalysis 
                  assets={assets}
                  incomeSources={incomeSources}
                  formatCurrency={formatCurrency}
                />
              ) : middlePaneAnalysis === 'socialSecurity' ? (
                <SocialSecurityAnalysis 
                  taxpayerInfo={taxpayer}
                  spouseInfo={spouse}
                  formatCurrency={formatCurrency}
                  incomeSources={incomeSources}
                  onUpdateTaxpayer={(updates) => updateScenarioData({ taxpayer: { ...taxpayer, ...updates } })}
                  onUpdateSpouse={(updates) => updateScenarioData({ spouse: { ...spouse, ...updates } })}
                />
              ) : middlePaneAnalysis === 'reports' ? (
                <ComprehensiveReports
                  calculations={calculations}
                  incomeSources={incomeSources}
                  assets={assets}
                  settings={taxMapSettings}
                  appSettings={appSettings}
                  taxpayer={taxpayer}
                  spouse={spouse}
                  scenarios={scenarios}
                  onGenerateReport={(reportData) => {
                    console.log('Generating report:', reportData);
                    // Report generation logic will be implemented here
                  }}
                />
              ) : middlePaneAnalysis === 'help' ? (
                <HelpSystem />
              ) : middlePaneAnalysis === 'clients' ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <ClientManagementTab
                      clients={clients}
                      activeClientId={activeClientId}
                      households={households}
                      currentUser={currentUser}
                      onClientShare={(client) => {
                        setClientToShare(client);
                        setShowClientSharingModal(true);
                      }}
                      onHouseholdsUpdate={(updatedHouseholds) => {
                        setHouseholds(updatedHouseholds);
                        
                        // Sync household data to People tab when household changes
                        if (activeClientId) {
                          const clientHousehold = updatedHouseholds.find(household => 
                            household.members.some(member => member.clientId === activeClientId)
                          );
                          
                          if (clientHousehold) {
                            const primaryMember = clientHousehold.members.find(m => m.relationship === 'primary');
                            const spouseMember = clientHousehold.members.find(m => m.relationship === 'spouse');
                            
                            // Update taxpayer from primary member
                            if (primaryMember) {
                              const primaryClient = clients.find(c => c.id === primaryMember.clientId);
                              if (primaryClient) {
                                setTaxpayer(prev => ({
                                  ...prev,
                                  firstName: primaryClient.profile.primaryContact?.split(' ')[0] || prev.firstName,
                                  lastName: primaryClient.profile.primaryContact?.split(' ')[1] || prev.lastName,
                                  state: primaryClient.profile.state || prev.state,
                                  filingStatus: spouseMember ? 'marriedFilingJointly' : 'single'
                                }));
                              }
                            }
                            
                            // Update spouse from spouse member
                            if (spouseMember) {
                              const spouseClient = clients.find(c => c.id === spouseMember.clientId);
                              if (spouseClient) {
                                setSpouse(prev => ({
                                  ...prev,
                                  firstName: spouseClient.profile.primaryContact?.split(' ')[0] || '',
                                  lastName: spouseClient.profile.primaryContact?.split(' ')[1] || '',
                                  dateOfBirth: spouseClient.profile.birthdate || '',
                                  state: spouseClient.profile.state || prev.state
                                }));
                              }
                            } else {
                              // Clear spouse data if no spouse in household
                              setSpouse(prev => ({
                                ...prev,
                                firstName: '',
                                lastName: '',
                                dateOfBirth: ''
                              }));
                            }
                          }
                        }
                      }}
                      onClientChange={(clientId) => {
                        setActiveClientId(clientId);
                        
                        // Load client data into the main application
                        const selectedClient = clients.find(c => c.id === clientId);
                        if (selectedClient && selectedClient.scenarios && selectedClient.scenarios.length > 0) {
                          // Load the client's scenarios into the main application
                          setScenarios(selectedClient.scenarios);
                          
                          // Find the active scenario or use the first one
                          const activeScenario = selectedClient.scenarios.find(s => s.isActive) || selectedClient.scenarios[0];
                          if (activeScenario && activeScenario.data) {
                            // Load scenario data into the main application state
                            setActiveTab(activeScenario.data.activeTab || 'people');
                            setFicaEnabled(activeScenario.data.ficaEnabled || false);
                            setTaxpayer(activeScenario.data.taxpayer || {
                              firstName: selectedClient.profile.primaryContact?.split(' ')[0] || '',
                              lastName: selectedClient.profile.primaryContact?.split(' ')[1] || '',
                              dateOfBirth: '',
                              age: null,
                              filingStatus: 'single',
                              state: selectedClient.profile.state || 'Michigan',
                              housing: {
                                ownership: 'rent',
                                propertyTaxValue: 0,
                                propertyTaxesPaid: 0,
                                michiganResident6Months: true
                              }
                            });
                            setSpouse(activeScenario.data.spouse || {
                              firstName: '',
                              lastName: '',
                              dateOfBirth: '',
                              age: null,
                              housing: {
                                ownership: 'rent',
                                propertyTaxValue: 0,
                                propertyTaxesPaid: 0,
                                michiganResident6Months: true
                              }
                            });
                            setIncomeSources(activeScenario.data.incomeSources || []);
                            setDeductions(activeScenario.data.deductions || {
                              itemized: {
                                saltDeduction: 0,
                                mortgageInterest: 0,
                                charitableGiving: 0,
                                medicalExpenses: 0,
                                otherDeductions: 0
                              },
                              state: {
                                michiganDeductions: 0,
                                otherCredits: 0
                              }
                            });
                            setTaxMapSettings(activeScenario.data.taxMapSettings || {
                              incomeType: 'ordinary',
                              jurisdiction: 'federal',
                              view: 'detailed',
                              methodology: 'incremental'
                            });
                            setAssets(activeScenario.data.assets || []);
                          }
                        } else {
                          // Create a default scenario for the client if none exists
                          const defaultScenario = {
                            id: 1,
                            name: 'Base Case',
                            isActive: true,
            data: {
              activeTab: 'people',
              ficaEnabled: false,
                              taxpayer: {
                                firstName: selectedClient.profile.primaryContact?.split(' ')[0] || '',
                                lastName: selectedClient.profile.primaryContact?.split(' ')[1] || '',
                                dateOfBirth: '',
                                age: null,
                                filingStatus: 'single',
                                state: selectedClient.profile.state || 'Michigan',
                                housing: {
                                  ownership: 'rent',
                                  propertyTaxValue: 0,
                                  propertyTaxesPaid: 0,
                                  michiganResident6Months: true
                                }
                              },
                              spouse: {
                                firstName: '',
                                lastName: '',
                                dateOfBirth: '',
                                age: null,
                                housing: {
                                  ownership: 'rent',
                                  propertyTaxValue: 0,
                                  propertyTaxesPaid: 0,
                                  michiganResident6Months: true
                                }
                              },
                              incomeSources: [],
                              deductions: {
                                itemized: {
                                  saltDeduction: 0,
                                  mortgageInterest: 0,
                                  charitableGiving: 0,
                                  medicalExpenses: 0,
                                  otherDeductions: 0
                                },
                                state: {
                                  michiganDeductions: 0,
                                  otherCredits: 0
                                }
                              },
                              taxMapSettings: {
                                incomeType: 'ordinary',
                                jurisdiction: 'federal',
                                view: 'detailed',
                                methodology: 'incremental'
                              },
                              assets: []
                            }
                          };
                          
                          // Update the client with the default scenario
                          setClients(prev => prev.map(client => 
                            client.id === clientId 
                              ? { ...client, scenarios: [defaultScenario] }
                              : client
                          ));
                          
                          setScenarios([defaultScenario]);
                          setActiveTab('people');
                          setFicaEnabled(false);
                          setTaxpayer(defaultScenario.data.taxpayer);
                          setSpouse(defaultScenario.data.spouse);
                          setIncomeSources([]);
                          setDeductions(defaultScenario.data.deductions);
                          setTaxMapSettings(defaultScenario.data.taxMapSettings);
                          setAssets([]);
                        }
                      }}
                      onCreateClient={(clientData) => {
                        const newClient = {
                          id: generateClientId(),
                          profile: {
                            ...clientData,
                            createdDate: new Date().toISOString(),
                            lastModified: new Date().toISOString(),
                            isActive: true,
                            isArchived: false
                          },
                          scenarios: [
                            {
                              id: 1,
                              name: 'Base Case',
                              isActive: true,
                              createdDate: new Date().toISOString(),
                              lastModified: new Date().toISOString(),
                              data: {}
                            }
                          ]
                        };
                        setClients(prev => [...prev, newClient]);
                        setActiveClientId(newClient.id);
                      }}
                      onEditClient={(clientId, updatedData) => {
                        setClients(prev => prev.map(client => 
                          client.id === clientId 
                            ? { 
                                ...client, 
                                profile: { 
                                  ...client.profile, 
                                  ...updatedData, 
                                  lastModified: new Date().toISOString() 
                                } 
                              }
                            : client
                        ));
                      }}
                      onDuplicateClient={(clientId) => {
                        const clientToDuplicate = clients.find(c => c.id === clientId);
                        if (clientToDuplicate) {
                          const newClient = {
                            ...clientToDuplicate,
                            id: generateClientId(),
                            profile: {
                              ...clientToDuplicate.profile,
                              clientName: `${clientToDuplicate.profile.clientName} (Copy)`,
                              createdDate: new Date().toISOString(),
                              lastModified: new Date().toISOString()
                            }
                          };
                          setClients(prev => [...prev, newClient]);
                        }
                      }}
                      onArchiveClient={(clientId) => {
                        setClients(prev => prev.map(client => 
                          client.id === clientId 
                            ? { 
                                ...client, 
                                profile: { 
                                  ...client.profile, 
                                  isArchived: true, 
                                  lastModified: new Date().toISOString() 
                                } 
                              }
                            : client
                        ));
                      }}
                      onCreateScenario={(clientId, scenarioData) => {
                        setClients(prev => prev.map(client => 
                          client.id === clientId 
                            ? { 
                                ...client, 
                                scenarios: [...client.scenarios, {
                                  id: Date.now(),
                                  ...scenarioData,
                                  createdDate: new Date().toISOString(),
                                  lastModified: new Date().toISOString()
                                }]
                              }
                            : client
                        ));
                      }}
                      onClientsUpdate={(updatedClients) => {
                        setClients(updatedClients);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <AssetsTab
                  assets={assets}
                  setAssets={setAssets}
                  incomeSources={incomeSources}
                  setIncomeSources={setIncomeSources}
                  taxpayer={taxpayer}
                  spouse={spouse}
                  formatCurrency={formatCurrency}
                />
              )}
            </div>
            
            {/* Scenario Comparison Section - Only show for Tax Map */}
            {middlePaneAnalysis === 'taxMap' && scenarios.length > 1 && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Scenario Comparison</h3>
                  <p className="text-sm text-gray-600">Click a scenario to view its tax map above</p>
                </div>
                
                {/* Grid layout that fits 3 scenarios per row with wrapping */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-full">
                  {scenarios.map((scenario) => {
                    try {
                      // Calculate taxes for this scenario
                      const scenarioCalcs = calculateComprehensiveTaxes(
                        scenario.data.incomeSources,
                        scenario.data.taxpayer.age,
                        scenario.data.spouse.age,
                        scenario.data.taxpayer.filingStatus,
                        scenario.data.deductions,
                        scenario.data.appSettings
                      );
                      
                      // Apply FICA logic
                      const finalCalcs = !scenario.data.ficaEnabled ? 
                        {
                          ...scenarioCalcs,
                          totalTax: scenarioCalcs.totalTax - (scenarioCalcs.fica?.totalFICA || 0),
                          effectiveRateTotal: scenarioCalcs.totalIncome > 0 ? 
                            ((scenarioCalcs.totalTax - (scenarioCalcs.fica?.totalFICA || 0)) / scenarioCalcs.totalIncome) : 0
                        } : 
                        {
                          ...scenarioCalcs,
                          totalMarginalRate: scenarioCalcs.totalMarginalRate + 0.0765
                        };
                      
                      // Ensure all required fields exist with fallback values
                      const safeCalcs = {
                        totalIncome: finalCalcs.totalIncome || 0,
                        adjustedGrossIncome: finalCalcs.adjustedGrossIncome || finalCalcs.totalIncome || 0,
                        taxableIncome: finalCalcs.taxableIncome || 0,
                        federalTax: finalCalcs.federalTax || 0,
                        netStateTax: finalCalcs.netStateTax || 0,
                        totalTax: finalCalcs.totalTax || 0,
                        federalMarginalRate: finalCalcs.federalMarginalRate || 0,
                        federalEffectiveRate: finalCalcs.totalIncome > 0 ? (finalCalcs.federalTax || 0) / finalCalcs.totalIncome : 0,
                        stateMarginalRate: finalCalcs.stateMarginalRate || 0,
                        stateEffectiveRate: finalCalcs.totalIncome > 0 ? (finalCalcs.netStateTax || 0) / finalCalcs.totalIncome : 0,
                        effectiveRateTotal: finalCalcs.effectiveRateTotal || 0,
                        socialSecurity: finalCalcs.socialSecurity || null,
                        irmaa: finalCalcs.irmaa || null
                      };
                      
                      return (
                        <div
                          key={scenario.id}
                          onClick={() => switchToScenario(scenario.id)}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            scenario.isActive
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="mb-2">
                            <h4 className={`font-semibold text-sm ${scenario.isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                              {scenario.name}
                            </h4>
                            {scenario.isActive && (
                              <span className="text-xs text-green-600 font-medium">Active</span>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            {/* Income Summary */}
                            <div className="border-b border-gray-200 pb-1">
                              <div className="font-medium text-gray-800 mb-1 text-xs">Income Summary</div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Income:</span>
                                <span className="font-medium">{formatCurrency(safeCalcs.totalIncome)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">AGI:</span>
                                <span className="font-medium">{formatCurrency(safeCalcs.adjustedGrossIncome)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Taxable Income:</span>
                                <span className="font-medium">{formatCurrency(safeCalcs.taxableIncome)}</span>
                              </div>
                            </div>

                            {/* Tax Summary */}
                            <div className="border-b border-gray-200 pb-1">
                              <div className="font-medium text-gray-800 mb-1 text-xs">Tax Summary</div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Federal Tax:</span>
                                <span className="font-medium">{formatCurrency(safeCalcs.federalTax)}</span>
                              </div>
                              {safeCalcs.penalties && safeCalcs.penalties.totalPenalties > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span className="text-red-600">Early Withdrawal Penalty:</span>
                                  <span className="font-medium">{formatCurrency(safeCalcs.penalties.totalPenalties)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">State Tax:</span>
                                <span className="font-medium">{formatCurrency(safeCalcs.netStateTax)}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span className="text-gray-800">Total Tax:</span>
                                <span>{formatCurrency(safeCalcs.totalTax)}</span>
                              </div>
                            </div>

                            {/* Rates Summary */}
                            <div className="border-b border-gray-200 pb-1">
                              <div className="font-medium text-gray-800 mb-1 text-xs">Tax Rates</div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fed Marginal:</span>
                                <span className="font-medium">{formatPercentage(safeCalcs.effectiveMarginalRate || safeCalcs.federalMarginalRate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fed Effective:</span>
                                <span className="font-medium">{formatPercentage(safeCalcs.federalEffectiveRate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">State Marginal:</span>
                                <span className="font-medium">{formatPercentage(safeCalcs.stateMarginalRate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">State Effective:</span>
                                <span className="font-medium">{formatPercentage(safeCalcs.stateEffectiveRate)}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span className="text-gray-800">Total Effective:</span>
                                <span>{formatPercentage(safeCalcs.effectiveRateTotal)}</span>
                              </div>
                            </div>

                            {/* Early Withdrawal Penalty Breakdown - Only show if has penalties */}
                            {safeCalcs.penalties && safeCalcs.penalties.totalPenalties > 0 && (
                              <div className="border-b border-gray-200 pb-1">
                                <div className="font-medium text-red-800 mb-1 text-xs">Early Withdrawal Penalties</div>
                                {safeCalcs.penalties.penaltyDetails.map((penalty, index) => (
                                  <div key={index} className="mb-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-red-600 truncate" title={penalty.sourceName}>
                                        {penalty.sourceName} ({penalty.owner})
                                      </span>
                                      <span className="font-medium text-red-600">{formatCurrency(penalty.penalty)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Age {penalty.ownerAge} • 10% penalty</span>
                                      <span>{formatPercentage(penalty.penalty / penalty.amount)}</span>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between font-semibold text-red-600 text-xs border-t pt-1">
                                  <span>Total Penalties:</span>
                                  <span>{formatCurrency(safeCalcs.penalties.totalPenalties)}</span>
                                </div>
                              </div>
                            )}

                            {/* Social Security Summary - Only show if has SS benefits */}
                            {safeCalcs.socialSecurity && safeCalcs.socialSecurity.totalBenefits > 0 && (
                              <div className="border-b border-gray-200 pb-1">
                                <div className="font-medium text-gray-800 mb-1 text-xs">Social Security</div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Benefits:</span>
                                  <span className="font-medium">{formatCurrency(safeCalcs.socialSecurity.totalBenefits)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Taxable:</span>
                                  <span className="font-medium">{formatCurrency(safeCalcs.socialSecurity.taxableBenefits)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">Taxation Tier:</span>
                                  <span className="text-gray-700">
                                    {safeCalcs.socialSecurity.taxableBenefits === 0 ? 'Tier I (0%)' : 
                                     safeCalcs.socialSecurity.tier === 'II' ? 'Tier II (50%)' : 
                                     'Tier III (85%)'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Medicare/IRMAA Summary */}
                            <div className="border-b border-gray-200 pb-1">
                              <div className="font-medium text-gray-800 mb-1 text-xs">Medicare Costs</div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Base Premium:</span>
                                <span className="font-medium">$185/mo</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">IRMAA Surcharge:</span>
                                <span className="font-medium">
                                  {safeCalcs.irmaa && safeCalcs.irmaa.monthlyIncrease > 0 
                                    ? `+$${safeCalcs.irmaa.monthlyIncrease}/mo`
                                    : '$0/mo'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span className="text-gray-800">Total/Month:</span>
                                <span>
                                  ${185 + (safeCalcs.irmaa?.monthlyIncrease || 0)}/mo
                                </span>
                              </div>
                              {safeCalcs.irmaa && safeCalcs.irmaa.currentTier && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">IRMAA Tier:</span>
                                  <span className="text-gray-700">{safeCalcs.irmaa.currentTier}</span>
                                </div>
                              )}
                            </div>

                            {/* Next Dollar Summary */}
                            <div>
                              <div className="font-medium text-gray-800 mb-1 text-xs">Next $ Taxed At</div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Federal:</span>
                                <span className="font-medium">{formatPercentage(safeCalcs.effectiveMarginalRate || safeCalcs.federalMarginalRate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">State:</span>
                                <span className="font-medium">{formatPercentage(safeCalcs.stateMarginalRate)}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span className="text-gray-800">Combined:</span>
                                <span>{formatPercentage((safeCalcs.effectiveMarginalRate || safeCalcs.federalMarginalRate) + safeCalcs.stateMarginalRate)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (error) {
                      return (
                        <div
                          key={scenario.id}
                          className="p-3 rounded-lg border-2 border-red-200 bg-red-50"
                        >
                          <div className="mb-2">
                            <h4 className="font-semibold text-sm text-red-900">{scenario.name}</h4>
                            <span className="text-xs text-red-600 font-medium">Calculation Error</span>
                          </div>
                          <div className="text-xs text-red-600">
                            Unable to calculate taxes for this scenario
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Panel - Tax Summary (25%) */}
        <div className="w-1/4 bg-gray-50 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Base Case Header */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Base Case</h2>
            </div>

            {/* Consolidated Tax Summary */}
            <div className="bg-white p-4 rounded-lg border">
              {/* Income Header */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Income</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(calculations.totalIncome)}
                </div>
              </div>
              
              {/* Tax Rates Grid */}
              <div className="space-y-3">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-2 pb-2 border-b border-gray-200">
                  <div className="text-xs font-medium text-gray-500"></div>
                  <div className="text-xs font-medium text-gray-500 text-center">Marginal Rate</div>
                  <div className="text-xs font-medium text-gray-500 text-center">Effective Rate</div>
                </div>
                
                {/* Federal Tax Row */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-sm text-gray-600">
                    Federal Tax
                    <div className="text-xs text-gray-600 font-medium">
                      {formatCurrency(calculations.federalTax)}
                      {calculations.penalties && calculations.penalties.totalPenalties > 0 && (
                        <span className="text-red-600 ml-1">+{formatCurrency(calculations.penalties.totalPenalties)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-gray-600">
                      {formatPercentage(calculations.effectiveMarginalRate || calculations.federalMarginalRate)}
                    </span>
                  </div>
                  <div className="text-center">
                    {calculations.penalties && calculations.penalties.totalPenalties > 0 ? (
                      <div className="text-sm font-bold">
                        <div className="text-gray-600">{formatPercentage(calculations.effectiveRateFederalWithPenalties)}</div>
                        <div className="text-red-600 text-xs">({formatPercentage(calculations.effectiveRatePenalty)} penalty)</div>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-gray-600">
                        {formatPercentage(calculations.effectiveRateFederal)}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* FICA Tax Row - Only show when FICA is enabled */}
                {ficaEnabled && (
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="text-sm text-gray-600">
                      FICA Tax
                      <div className="text-xs text-green-600 font-medium">{formatCurrency(ficaTaxes.totalFICA)}</div>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-green-600">
                        {getEarnedIncome(incomeSources) > 0 ? formatPercentage(ficaTaxes.totalFICA / getEarnedIncome(incomeSources)) : '0.00%'}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-green-600">
                        {calculations.totalIncome > 0 ? formatPercentage(ficaTaxes.totalFICA / calculations.totalIncome) : '0.00%'}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* State Tax Row */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="text-sm text-gray-600">
                    State Tax (MI)
                    <div className="text-xs text-orange-600 font-medium">{formatCurrency(calculations.netStateTax)}</div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-orange-600">
                      {formatPercentage(MICHIGAN_TAX_RATE)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-orange-600">
                      {formatPercentage(calculations.netStateTax / calculations.totalIncome)}
                    </span>
                  </div>
                </div>
                
                {/* IRMAA Row - Show when Medicare coverage is enabled */}
                {(() => {
                  // Calculate current IRMAA costs
                  const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
                  let currentTier = null;
                  for (let i = 0; i < irmaaThresholds.length; i++) {
                    if (calculations.federalAGI >= irmaaThresholds[i].min && 
                        (i === irmaaThresholds.length - 1 || calculations.federalAGI < irmaaThresholds[i + 1].min)) {
                      currentTier = irmaaThresholds[i];
                      break;
                    }
                  }
                  
                  // Calculate total IRMAA surcharge (additional costs only, not base Medicare)
                  const totalIrmaaIncrease = (appSettings.medicare?.taxpayer?.partB ? (currentTier?.partB || 0) : 0) + 
                                           (appSettings.medicare?.taxpayer?.partD ? (currentTier?.partD || 0) : 0) +
                                           (appSettings.medicare?.spouse?.partB ? (currentTier?.partB || 0) : 0) + 
                                           (appSettings.medicare?.spouse?.partD ? (currentTier?.partD || 0) : 0);
                  
                  const annualIrmaaIncrease = totalIrmaaIncrease * 12;
                  const irmaaEffectiveRate = calculations.totalIncome > 0 ? (annualIrmaaIncrease / calculations.totalIncome) : 0;
                  
                  // Only show if there's Medicare coverage enabled
                  const hasMedicareCoverage = appSettings.medicare?.taxpayer?.partB || appSettings.medicare?.taxpayer?.partD || 
                                            appSettings.medicare?.spouse?.partB || appSettings.medicare?.spouse?.partD;
                  
                  if (hasMedicareCoverage) {
                    return (
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div className="text-sm text-gray-600">
                          IRMAA
                          <div className="text-xs text-purple-600 font-medium">{formatCurrency(annualIrmaaIncrease)}</div>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-bold text-purple-600">
                            0.00%
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-bold text-purple-600">
                            {formatPercentage(irmaaEffectiveRate)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* OBBB Senior Deduction Phase-Out Row - Show when eligible and in phase-out range */}
                {(() => {
                  // Check if taxpayer or spouse is 65+ (eligible for senior deduction)
                  const taxpayerAge = calculations.taxpayerAge || 0;
                  const spouseAge = calculations.spouseAge || 0;
                  const hasEligibleSenior = taxpayerAge >= 65 || spouseAge >= 65;
                  
                  if (!hasEligibleSenior) return null;
                  
                  // Phase-out thresholds for Big Bold Beautiful Bill senior deduction
                  const seniorDeductionThresholds = {
                    single: { start: 75000, end: 175000 },
                    marriedJoint: { start: 150000, end: 250000 },
                    marriedFilingJointly: { start: 150000, end: 250000 },
                    marriedSeparate: { start: 75000, end: 125000 },
                    marriedFilingSeparately: { start: 75000, end: 125000 },
                    headOfHousehold: { start: 112500, end: 212500 }
                  };
                  
                  const filingStatus = calculations.filingStatus || 'single';
                  const thresholds = seniorDeductionThresholds[filingStatus] || seniorDeductionThresholds.single;
                  const currentMAGI = calculations.federalAGI;
                  
                  // Only show if in phase-out range
                  if (currentMAGI <= thresholds.start || currentMAGI >= thresholds.end) return null;
                  
                  // Calculate phase-out amount
                  const phaseOutRange = thresholds.end - thresholds.start;
                  const amountIntoPhaseOut = currentMAGI - thresholds.start;
                  const phaseOutPercentage = amountIntoPhaseOut / phaseOutRange;
                  
                  // Maximum senior deduction is $1,800 per eligible person
                  const maxDeductionPerPerson = 1800;
                  const eligiblePersons = (taxpayerAge >= 65 ? 1 : 0) + (spouseAge >= 65 ? 1 : 0);
                  const maxTotalDeduction = maxDeductionPerPerson * eligiblePersons;
                  
                  // Amount of deduction phased out
                  const deductionPhasedOut = maxTotalDeduction * phaseOutPercentage;
                  
                  // Effective rate impact (lost deduction * marginal rate)
                  const marginalRate = calculations.effectiveMarginalRate || calculations.federalMarginalRate || 0;
                  const taxImpact = deductionPhasedOut * marginalRate;
                  const effectiveRateImpact = calculations.totalIncome > 0 ? (taxImpact / calculations.totalIncome) : 0;
                  
                  return (
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="text-sm text-gray-600">
                        OBBB Phase-Out
                        <div className="text-xs text-yellow-600 font-medium">{formatCurrency(deductionPhasedOut)} lost</div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-yellow-600">
                          {formatPercentage(marginalRate)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-yellow-600">
                          {formatPercentage(effectiveRateImpact)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Combined Tax Row */}
                <div className="grid grid-cols-3 gap-2 items-center pt-2 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700">
                    Fed + State
                    <div className="text-xs text-purple-600 font-medium">{formatCurrency(calculations.totalTax)}</div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-purple-600">
                      {formatPercentage(calculations.totalMarginalRate)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-purple-600">
                      {formatPercentage(calculations.effectiveRateTotal)}
                    </span>
                  </div>
                </div>
                
                {/* Combined Tax + IRMAA Row - Show when Medicare coverage is enabled */}
                {(() => {
                  // Calculate current IRMAA costs
                  const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
                  let currentTier = null;
                  for (let i = 0; i < irmaaThresholds.length; i++) {
                    if (calculations.federalAGI >= irmaaThresholds[i].min && 
                        (i === irmaaThresholds.length - 1 || calculations.federalAGI < irmaaThresholds[i + 1].min)) {
                      currentTier = irmaaThresholds[i];
                      break;
                    }
                  }
                  
                  // Calculate total IRMAA surcharge
                  const totalIrmaaIncrease = (appSettings.medicare?.taxpayer?.partB ? (currentTier?.partB || 0) : 0) + 
                                           (appSettings.medicare?.taxpayer?.partD ? (currentTier?.partD || 0) : 0) +
                                           (appSettings.medicare?.spouse?.partB ? (currentTier?.partB || 0) : 0) + 
                                           (appSettings.medicare?.spouse?.partD ? (currentTier?.partD || 0) : 0);
                  
                  const annualIrmaaIncrease = totalIrmaaIncrease * 12;
                  const totalTaxPlusIrmaa = calculations.totalTax + annualIrmaaIncrease;
                  const totalEffectiveRatePlusIrmaa = calculations.totalIncome > 0 ? (totalTaxPlusIrmaa / calculations.totalIncome) : 0;
                  
                  // Only show if there's Medicare coverage enabled and IRMAA costs
                  const hasMedicareCoverage = appSettings.medicare?.taxpayer?.partB || appSettings.medicare?.taxpayer?.partD || 
                                            appSettings.medicare?.spouse?.partB || appSettings.medicare?.spouse?.partD;
                  
                  if (hasMedicareCoverage) {
                    return (
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div className="text-sm font-medium text-gray-700">
                          Fed + State + IRMAA
                          <div className="text-xs text-indigo-600 font-medium">{formatCurrency(totalTaxPlusIrmaa)}</div>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-bold text-indigo-600">
                            {formatPercentage(calculations.totalMarginalRate)}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-bold text-indigo-600">
                            {formatPercentage(totalEffectiveRatePlusIrmaa)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Tax Bracket Analysis */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Tax Bracket Analysis</h3>
              
              {/* Next Rate Changes (Multiple Changes) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Next Rate Changes</span>
                  <span className="text-xs text-gray-500">
                    Current: {formatPercentage(nextRateChanges.currentRate)}
                  </span>
                </div>
                
                {nextRateChanges.rateChanges.length > 0 ? (
                  <div className="space-y-2">
                    {nextRateChanges.rateChanges.map((change, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {change.changeType === 'increase' ? '↗️' : '↘️'} ${change.amountToChange.toLocaleString()}
                          </span>
                          <span className={`font-bold ${change.changeType === 'increase' ? 'text-red-600' : 'text-green-600'}`}>
                            {formatPercentage(change.fromRate)} → {formatPercentage(change.toRate)}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-1">
                          {change.cause}
                        </div>
                        <div className="text-gray-400">
                          At income: ${change.thresholdIncome.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">
                    No significant rate changes found within range
                  </div>
                )}
                
                {/* Legacy single rate hike for comparison */}
                {nextRateHike.amountToHike && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-400">
                      Legacy "Next Rate Hike": ${nextRateHike.amountToHike.toLocaleString()} ({nextRateHike.cause})
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Capital Gains Taxation Analysis */}
            {(calculations.capitalGains?.longTerm?.amount > 0 || calculations.capitalGains?.shortTerm?.amount > 0 || calculations.capitalGains?.qualified?.amount > 0) && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">Capital Gains Taxation</h3>
                <div className="space-y-3">
                  {/* Total Capital Gains Overview */}
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                    <span className="text-sm font-medium text-green-700">Total Capital Gains</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency((calculations.capitalGains?.longTerm?.amount || 0) + 
                                    (calculations.capitalGains?.shortTerm?.amount || 0) + 
                                    (calculations.capitalGains?.qualified?.amount || 0))}
                    </span>
                  </div>
                  
                  {/* Capital Gains Breakdown */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600 border-b pb-1">Capital Gains Breakdown</div>
                    
                    {/* Long-term Capital Gains */}
                    {calculations.capitalGains?.longTerm?.amount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Long-term Capital Gains</span>
                          <span className="text-sm font-medium">{formatCurrency(calculations.capitalGains.longTerm.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500 ml-4">Tax</span>
                          <span className="text-xs text-gray-700">{formatCurrency(calculations.capitalGains.longTerm.tax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500 ml-4">Effective Rate</span>
                          <span className="text-xs text-gray-700">{(calculations.capitalGains.longTerm.effectiveRate * 100).toFixed(2)}%</span>
                        </div>
                        {/* LTCG Rate Bracket Info */}
                        <div className="text-xs text-gray-500 ml-4">
                          {(() => {
                            const rate = calculations.capitalGains.longTerm.effectiveRate;
                            if (rate === 0) return "0% LTCG bracket";
                            if (rate <= 0.15) return "15% LTCG bracket";
                            return "20% LTCG bracket";
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* Short-term Capital Gains */}
                    {calculations.capitalGains?.shortTerm?.amount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Short-term Capital Gains</span>
                          <span className="text-sm font-medium">{formatCurrency(calculations.capitalGains.shortTerm.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500 ml-4">Tax (as ordinary income)</span>
                          <span className="text-xs text-gray-700">{formatCurrency(calculations.capitalGains.shortTerm.tax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500 ml-4">Effective Rate</span>
                          <span className="text-xs text-gray-700">{(calculations.capitalGains.shortTerm.effectiveRate * 100).toFixed(2)}%</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-4">
                          Taxed at {formatPercentage(calculations.effectiveMarginalRate || calculations.federalMarginalRate)} marginal rate
                        </div>
                      </div>
                    )}
                    
                    {/* Qualified Dividends */}
                    {calculations.capitalGains?.qualified?.amount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Qualified Dividends</span>
                          <span className="text-sm font-medium">{formatCurrency(calculations.capitalGains.qualified.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500 ml-4">Tax (LTCG rates)</span>
                          <span className="text-xs text-gray-700">{formatCurrency(calculations.capitalGains.qualified.tax)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500 ml-4">Effective Rate</span>
                          <span className="text-xs text-gray-700">{(calculations.capitalGains.qualified.effectiveRate * 100).toFixed(2)}%</span>
                        </div>
                      </div>
                    )}
                    
                    {/* NIIT Analysis */}
                    {(() => {
                      const totalInvestmentIncome = (calculations.capitalGains?.longTerm?.amount || 0) + 
                                                   (calculations.capitalGains?.shortTerm?.amount || 0) + 
                                                   (calculations.capitalGains?.qualified?.amount || 0);
                      const niitThreshold = taxpayer.filingStatus === 'marriedFilingJointly' ? 250000 : 
                                           taxpayer.filingStatus === 'marriedFilingSeparately' ? 125000 : 200000;
                      const niitApplies = calculations.federalAGI > niitThreshold && totalInvestmentIncome > 0;
                      const niitBase = Math.min(totalInvestmentIncome, Math.max(0, calculations.federalAGI - niitThreshold));
                      const niitTax = niitApplies ? niitBase * 0.038 : 0;
                      
                      if (niitApplies) {
                        return (
                          <div className="space-y-1 border-t pt-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Net Investment Income Tax (NIIT)</span>
                              <span className="text-sm font-medium text-purple-600">3.8%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-500 ml-4">NIIT Base</span>
                              <span className="text-xs text-gray-700">{formatCurrency(niitBase)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-500 ml-4">NIIT Tax</span>
                              <span className="text-xs text-gray-700">{formatCurrency(niitTax)}</span>
                            </div>
                            <div className="text-xs text-gray-500 ml-4">
                              AGI over {formatCurrency(niitThreshold)} threshold
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Total Capital Gains Tax */}
                    <div className="bg-gray-50 p-2 rounded mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Total Capital Gains Tax</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency((calculations.capitalGains?.longTerm?.tax || 0) + 
                                        (calculations.capitalGains?.shortTerm?.tax || 0) + 
                                        (calculations.capitalGains?.qualified?.tax || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Overall Effective Rate</span>
                        <span className="text-xs text-gray-700">
                          {(() => {
                            const totalGains = (calculations.capitalGains?.longTerm?.amount || 0) + 
                                             (calculations.capitalGains?.shortTerm?.amount || 0) + 
                                             (calculations.capitalGains?.qualified?.amount || 0);
                            const totalTax = (calculations.capitalGains?.longTerm?.tax || 0) + 
                                           (calculations.capitalGains?.shortTerm?.tax || 0) + 
                                           (calculations.capitalGains?.qualified?.tax || 0);
                            return totalGains > 0 ? `${((totalTax / totalGains) * 100).toFixed(2)}%` : '0.00%';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capital Gains Optimization Strategies */}
                  <div className="space-y-2 border-t pt-3">
                    <div className="text-sm font-medium text-gray-600">💡 Optimization Strategies</div>
                    {(() => {
                      const strategies = [];
                      const totalLTCG = calculations.capitalGains?.longTerm?.amount || 0;
                      const totalSTCG = calculations.capitalGains?.shortTerm?.amount || 0;
                      const currentLTCGRate = calculations.capitalGains?.longTerm?.effectiveRate || 0;
                      const niitThreshold = taxpayer.filingStatus === 'marriedFilingJointly' ? 250000 : 
                                           taxpayer.filingStatus === 'marriedFilingSeparately' ? 125000 : 200000;
                      
                      // Strategy 1: Hold for long-term treatment
                      if (totalSTCG > 0) {
                        const potentialSavings = totalSTCG * ((calculations.effectiveMarginalRate || calculations.federalMarginalRate) - 0.15);
                        if (potentialSavings > 0) {
                          strategies.push(
                            <div key="hold" className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              <strong>Hold Strategy:</strong> Holding short-term gains for 1+ year could save ~{formatCurrency(potentialSavings)} in taxes
                            </div>
                          );
                        }
                      }
                      
                      // Strategy 2: Tax-loss harvesting
                      if (totalLTCG > 0 || totalSTCG > 0) {
                        strategies.push(
                          <div key="harvest" className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            <strong>Tax-Loss Harvesting:</strong> Realize losses to offset {formatCurrency(totalLTCG + totalSTCG)} in gains
                          </div>
                        );
                      }
                      
                      // Strategy 3: NIIT avoidance
                      if (calculations.federalAGI > niitThreshold * 0.9) {
                        strategies.push(
                          <div key="niit" className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                            <strong>NIIT Avoidance:</strong> Consider timing gains to stay below {formatCurrency(niitThreshold)} AGI threshold
                          </div>
                        );
                      }
                      
                      // Strategy 4: 0% bracket utilization
                      if (currentLTCGRate === 0) {
                        const ltcgThreshold = taxpayer.filingStatus === 'marriedFilingJointly' ? 94050 : 
                                             taxpayer.filingStatus === 'headOfHousehold' ? 63000 : 47025;
                        const remainingRoom = Math.max(0, ltcgThreshold - calculations.federalTaxableIncome);
                        if (remainingRoom > 1000) {
                          strategies.push(
                            <div key="zero" className="text-xs text-green-600 bg-green-50 p-2 rounded">
                              <strong>0% Bracket Opportunity:</strong> {formatCurrency(remainingRoom)} room left in 0% LTCG bracket
                            </div>
                          );
                        }
                      }
                      
                      return strategies.length > 0 ? strategies : (
                        <div className="text-xs text-gray-500 italic">
                          Current capital gains strategy appears optimal
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Income Breakdown */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Income Breakdown</h3>
              <div className="space-y-3">
                {/* Total Income */}
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="text-sm font-medium text-gray-700">Total Income</span>
                  <span className="text-lg font-bold text-green-600">{formatCurrency(calculations.totalIncome)}</span>
                </div>
                
                {/* AGI Components */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-600 border-b pb-1">Adjusted Gross Income (AGI)</div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 pl-2">Federal AGI</span>
                    <span className="text-sm font-medium">{formatCurrency(calculations.federalAGI)}</span>
                  </div>
                  {calculations.socialSecurity.socialSecurityBenefits > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 pl-2">Taxable SS Benefits</span>
                        <span className="text-sm font-medium text-red-600">{formatCurrency(calculations.socialSecurity.taxableSocialSecurity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 pl-2">Non-taxable SS Benefits</span>
                        <span className="text-sm font-medium text-green-600">{formatCurrency(calculations.socialSecurity.socialSecurityBenefits - calculations.socialSecurity.taxableSocialSecurity)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Provisional Income (if applicable) */}
                {calculations.socialSecurity.socialSecurityBenefits > 0 && (
                  <div className="space-y-2 border-t pt-2">
                    <div className="text-sm font-medium text-gray-600">Provisional Income Analysis</div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 pl-2">AGI (excluding SS)</span>
                      <span className="text-sm font-medium">{formatCurrency(calculations.federalAGI - calculations.socialSecurity.taxableSocialSecurity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 pl-2">+ Tax-exempt Interest</span>
                      <span className="text-sm font-medium">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 pl-2">+ 50% of SS Benefits</span>
                      <span className="text-sm font-medium">{formatCurrency(calculations.socialSecurity.socialSecurityBenefits * 0.5)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-sm font-medium text-gray-700">Provisional Income</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(calculations.socialSecurity.provisionalIncome)}</span>
                    </div>
                  </div>
                )}

                {/* Deductions */}
                <div className="space-y-2 border-t pt-2">
                  <div className="text-sm font-medium text-gray-600">Deductions</div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 pl-2">Standard Deduction</span>
                    <span className="text-sm font-medium">{formatCurrency(calculations.standardDeduction)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-sm font-medium text-gray-700">Federal Taxable Income</span>
                    <span className="text-sm font-bold text-purple-600">{formatCurrency(calculations.federalTaxableIncome)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Social Security Analysis */}
            {calculations.socialSecurity.socialSecurityBenefits > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">Social Security Taxation</h3>
                <div className="space-y-3">
                  {/* SS Benefits Overview */}
                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                    <span className="text-sm font-medium text-blue-700">Total SS Benefits</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(calculations.socialSecurity.socialSecurityBenefits)}</span>
                  </div>
                  
                  {/* Current Tier Status */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-600 border-b pb-1">Current Taxation Status</div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Tier</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded ${
                        calculations.socialSecurity.tier === 1 ? 'bg-green-100 text-green-700' :
                        calculations.socialSecurity.tier === 2 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        Tier {calculations.socialSecurity.tier} ({calculations.socialSecurity.taxationPercentage}% Taxable)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taxable Amount</span>
                      <span className="text-sm font-medium text-red-600">{formatCurrency(calculations.socialSecurity.taxableSocialSecurity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tax-Free Amount</span>
                      <span className="text-sm font-medium text-green-600">{formatCurrency(calculations.socialSecurity.socialSecurityBenefits - calculations.socialSecurity.taxableSocialSecurity)}</span>
                    </div>
                  </div>

                  {/* Tier Thresholds */}
                  <div className="space-y-2 border-t pt-2">
                    <div className="text-sm font-medium text-gray-600">Taxation Thresholds</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tier 1 (0% taxable):</span>
                        <span className="font-medium">
                          {taxpayer.filingStatus === 'marriedFilingJointly' ? 'Up to $32,000' : 'Up to $25,000'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tier 2 (50% taxable):</span>
                        <span className="font-medium">
                          {taxpayer.filingStatus === 'marriedFilingJointly' ? '$32,001 - $44,000' : '$25,001 - $34,000'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tier 3 (85% taxable):</span>
                        <span className="font-medium">
                          {taxpayer.filingStatus === 'marriedFilingJointly' ? 'Over $44,000' : 'Over $34,000'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Current Position */}
                    <div className="bg-gray-50 p-2 rounded mt-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Your Provisional Income</span>
                        <span className="text-sm font-bold text-blue-600">{formatCurrency(calculations.socialSecurity.provisionalIncome)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medicare/IRMAA Analysis */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Medicare Premium Analysis (IRMAA)</h3>
              <div className="space-y-3">
                {/* Total Medicare Costs */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-600 border-b pb-1">Total Medicare Costs</div>
                  {(() => {
                    // Calculate current IRMAA tier
                    const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
                    let currentTier = null;
                    for (let i = 0; i < irmaaThresholds.length; i++) {
                      if (calculations.federalAGI >= irmaaThresholds[i].min && 
                          (i === irmaaThresholds.length - 1 || calculations.federalAGI < irmaaThresholds[i + 1].min)) {
                        currentTier = irmaaThresholds[i];
                        break;
                      }
                    }
                                  // Calculate base Medicare costs
                    const baseCosts = {
                      taxpayer: {
                        partB: appSettings.medicare?.taxpayer?.partB ? 185.00 : 0,
                        partD: appSettings.medicare?.taxpayer?.partD ? 0 : 0 // Part D base varies by plan
                      },
                      spouse: {
                        partB: appSettings.medicare?.spouse?.partB ? 185.00 : 0,
                        partD: appSettings.medicare?.spouse?.partD ? 0 : 0 // Part D base varies by plan
                      }
                    };
                    
                    // Calculate IRMAA surcharges
                    const irmaaSurcharges = {
                      taxpayer: {
                        partB: appSettings.medicare?.taxpayer?.partB ? (currentTier?.partB || 0) : 0,
                        partD: appSettings.medicare?.taxpayer?.partD ? (currentTier?.partD || 0) : 0
                      },
                      spouse: {
                        partB: appSettings.medicare?.spouse?.partB ? (currentTier?.partB || 0) : 0,
                        partD: appSettings.medicare?.spouse?.partD ? (currentTier?.partD || 0) : 0
                      }
                    }; 
                    
                    // Calculate totals
                    const totalBaseCost = baseCosts.taxpayer.partB + baseCosts.taxpayer.partD + 
                                         baseCosts.spouse.partB + baseCosts.spouse.partD;
                    const totalIrmaaIncrease = irmaaSurcharges.taxpayer.partB + irmaaSurcharges.taxpayer.partD +
                                              irmaaSurcharges.spouse.partB + irmaaSurcharges.spouse.partD;
                    const totalMonthlyCost = totalBaseCost + totalIrmaaIncrease;
                    
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Base Medicare Cost</span>
                          <span className="text-sm font-medium text-blue-600">
                            ${totalBaseCost.toFixed(2)}/month
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">IRMAA Surcharge</span>
                          <span className="text-sm font-medium text-red-600">
                            +${totalIrmaaIncrease.toFixed(2)}/month
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium text-gray-800">Total Medicare Cost</span>
                          <span className="text-sm font-bold text-purple-600">
                            ${totalMonthlyCost.toFixed(2)}/month (${(totalMonthlyCost * 12).toFixed(0)}/year)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Current IRMAA Status */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-600 border-b pb-1">Current IRMAA Tier</div>
                  {(() => {
                    // Calculate current IRMAA tier
                    const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
                    let currentTier = null;
                    for (let i = 0; i < irmaaThresholds.length; i++) {
                      if (calculations.federalAGI >= irmaaThresholds[i].min && 
                          (i === irmaaThresholds.length - 1 || calculations.federalAGI < irmaaThresholds[i + 1].min)) {
                        currentTier = irmaaThresholds[i];
                        break;
                      }
                    }
                    
                    const totalIrmaaIncrease = (appSettings.medicare?.taxpayer?.partB ? (currentTier?.partB || 0) : 0) + 
                                             (appSettings.medicare?.taxpayer?.partD ? (currentTier?.partD || 0) : 0) +
                                             (appSettings.medicare?.spouse?.partB ? (currentTier?.partB || 0) : 0) + 
                                             (appSettings.medicare?.spouse?.partD ? (currentTier?.partD || 0) : 0);
                    
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Tier</span>
                          <span className={`text-sm font-bold px-2 py-1 rounded ${
                            totalIrmaaIncrease === 0 ? 'bg-green-100 text-green-700' :
                            totalIrmaaIncrease <= 100 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {currentTier?.label?.replace(/\+\$.*/, '') || 'No IRMAA'}
                          </span>
                        </div>
                        {appSettings.medicarePartB && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Part B Surcharge</span>
                            <span className="text-sm font-medium text-red-600">
                              {currentTier?.partB > 0 ? `+$${currentTier.partB.toFixed(2)}/month` : '$0.00/month'}
                            </span>
                          </div>
                        )}
                        {appSettings.medicarePartD && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Part D Surcharge</span>
                            <span className="text-sm font-medium text-red-600">
                              {currentTier?.partD > 0 ? `+$${currentTier.partD.toFixed(2)}/month` : '$0.00/month'}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium text-gray-800">Total IRMAA Increase</span>
                          <span className="text-sm font-bold text-red-600">
                            +${totalIrmaaIncrease.toFixed(2)}/month (+${(totalIrmaaIncrease * 12).toFixed(0)}/year)
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* IRMAA Thresholds */}
                <div className="space-y-2 border-t pt-2">
                  <div className="text-sm font-medium text-gray-600">IRMAA Thresholds (2025)</div>
                  <div className="space-y-1 text-xs">
                    {(() => {
                      const irmaaThresholds = getIrmaaThresholds(taxpayer.filingStatus);
                      return irmaaThresholds.map((tier, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-600">
                            {tier.max === Infinity 
                              ? `Over ${formatCurrency(tier.min)}:` 
                              : `${formatCurrency(tier.min)} - ${formatCurrency(tier.max)}:`
                            }
                          </span>
                          <span className="font-medium">
                            {tier.partB === 0 && tier.partD === 0 ? 'No increase' : 
                             `B: +$${tier.partB}/mo${appSettings.medicarePartD ? `, D: +$${tier.partD}/mo` : ''}`}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  {/* Current Position */}
                  <div className="bg-gray-50 p-2 rounded mt-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Your AGI (IRMAA basis)</span>
                      <span className="text-sm font-bold text-blue-600">{formatCurrency(calculations.federalAGI)}</span>
                    </div>
                  </div>
                </div>

                {/* Medicare Part B Base Premium Note */}
                <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                  <div className="font-medium">Note:</div>
                  <div>IRMAA amounts are in addition to the standard Medicare Part B premium ($185/mo in 2025)</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* View Save/Manage Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {viewModalMode === 'save' ? 'Save Current View' : 'Manage Views'}
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setNewViewName('');
                  setSetAsDefaultChecked(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {viewModalMode === 'save' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    View Name
                  </label>
                  <input
                    type="text"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="Enter a name for this view..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm font-medium text-gray-700 mb-2">Current Settings Preview:</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>FICA Enabled: {ficaEnabled ? 'Yes' : 'No'}</div>
                    <div>Active Tab: {activeTab}</div>
                    <div>Active Map Tab: {
                      middlePaneAnalysis === 'taxMap' ? 'Tax Map' :
                      middlePaneAnalysis === 'sequenceReturns' ? 'Sequence Risk' :
                      middlePaneAnalysis === 'socialSecurity' ? 'Social Security' :
                      middlePaneAnalysis === 'assets' ? 'Assets' :
                      middlePaneAnalysis === 'clients' ? 'Clients' :
                      middlePaneAnalysis === 'reports' ? 'Reports' :
                      middlePaneAnalysis === 'help' ? 'Help' : middlePaneAnalysis
                    }</div>
                    <div>Rate Display: {taxMapSettings.rateType}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="setAsDefault"
                    checked={setAsDefaultChecked}
                    onChange={(e) => setSetAsDefaultChecked(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="setAsDefault" className="text-sm text-gray-700">
                    Set as default view
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      if (newViewName.trim()) {
                        saveView(newViewName.trim(), setAsDefaultChecked);
                        setShowViewModal(false);
                        setNewViewName('');
                        setSetAsDefaultChecked(false);
                      }
                    }}
                    disabled={!newViewName.trim()}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Save View
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setNewViewName('');
                      setSetAsDefaultChecked(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteViewConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete View</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this saved view? This action cannot be undone.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  deleteView(showDeleteViewConfirm);
                  setShowDeleteViewConfirm(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteViewConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Authentication wrapper component
function AuthenticatedApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <App onLogout={handleLogout} />;
}

export default AuthenticatedApp;

