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
              costBasis: source.costBasis || 0,
              isFromIncome: true // Mark as synced from income
            };
            updatedAssets.push(newAsset);
            hasChanges = true;
          }
        }
      }
    });

    if (hasChanges) {
      setAssets(updatedAssets);
    }
  }, [incomeSources]);

  // Automatically sync assets from Assets tab to income sources
  useEffect(() => {
    let hasChanges = false;
    const updatedIncomeSources = [...incomeSources];

    assets.forEach(asset => {
      if (!asset.isFromIncome) { // Only sync assets created in Assets tab
        const incomeSourceId = `asset-${asset.id}`;
        const existingSource = incomeSources.find(source => source.id === incomeSourceId);

        if (asset.income > 0) {
          if (existingSource) {
            // Update existing income source
            if (existingSource.amount !== asset.income) {
              existingSource.amount = asset.income;
              hasChanges = true;
            }
          } else {
            // Create new income source from asset
            const newSource = {
              id: incomeSourceId,
              name: asset.name,
              type: asset.type,
              amount: asset.income,
              owner: asset.owner,
              accountValue: asset.currentValue,
              costBasis: asset.costBasis,
              isFromAsset: true // Mark as synced from asset
            };
            updatedIncomeSources.push(newSource);
            hasChanges = true;
          }
        } else {
          // If income is zero, remove the corresponding income source
          if (existingSource) {
            const index = updatedIncomeSources.findIndex(source => source.id === incomeSourceId);
            if (index > -1) {
              updatedIncomeSources.splice(index, 1);
              hasChanges = true;
            }
          }
        }
      }
    });

    if (hasChanges) {
      setIncomeSources(updatedIncomeSources);
    }
  }, [assets]);

  // Client data loading and saving
  useEffect(() => {
    const loadedClients = loadClientsData();
    setClients(loadedClients);
    
    // Set the first client as active if one exists
    if (loadedClients.length > 0) {
      setActiveClientId(loadedClients[0].id);
    }
  }, []);

  // Save clients data whenever it changes
  useEffect(() => {
    saveClientsData(clients);
  }, [clients]);

  // Load active client's data when active client changes
  useEffect(() => {
    if (activeClientId) {
      const activeClient = clients.find(c => c.id === activeClientId);
      if (activeClient) {
        // Load scenarios
        setScenarios(activeClient.scenarios || [
          {
            id: 1,
            name: 'Base Case',
            isActive: true,
            data: getClientTemplate().scenarios[0].data // Use template for new client
          }
        ]);
        
        // Load app settings
        setAppSettings(activeClient.settings || getDefaultClientSettings());
      }
    }
  }, [activeClientId, clients]);

  // Update active client's data when scenarios or settings change
  useEffect(() => {
    if (activeClientId) {
      const updatedClients = clients.map(client => {
        if (client.id === activeClientId) {
          return {
            ...client,
            scenarios: scenarios,
            settings: appSettings
          };
        }
        return client;
      });
      setClients(updatedClients);
    }
  }, [scenarios, appSettings, activeClientId]);

  // Update scenario data when individual state changes
  useEffect(() => {
    const activeScenario = scenarios.find(s => s.isActive);
    if (activeScenario) {
      const updatedData = {
        activeTab,
        ficaEnabled,
        taxpayer,
        spouse,
        incomeSources,
        deductions,
        taxMapSettings,
        assets
      };
      
      // Only update if data has actually changed
      if (JSON.stringify(activeScenario.data) !== JSON.stringify(updatedData)) {
        const updatedScenarios = scenarios.map(s => 
          s.id === activeScenario.id ? { ...s, data: updatedData } : s
        );
        setScenarios(updatedScenarios);
      }
    }
  }, [activeTab, ficaEnabled, taxpayer, spouse, incomeSources, deductions, taxMapSettings, assets]);

  // Handle scenario switching
  const handleSwitchScenario = (scenarioId) => {
    const newScenarios = scenarios.map(s => ({ ...s, isActive: s.id === scenarioId }));
    const newActiveScenario = newScenarios.find(s => s.isActive);
    
    if (newActiveScenario) {
      // Update main state from new active scenario data
      setActiveTab(newActiveScenario.data.activeTab || 'people');
      setFicaEnabled(newActiveScenario.data.ficaEnabled);
      setTaxpayer(newActiveScenario.data.taxpayer);
      setSpouse(newActiveScenario.data.spouse);
      setIncomeSources(newActiveScenario.data.incomeSources);
      setDeductions(newActiveScenario.data.deductions);
      setTaxMapSettings(newActiveScenario.data.taxMapSettings);
      setAssets(newActiveScenario.data.assets || []);
      setScenarios(newScenarios);
    }
  };

  // Handle adding a new scenario
  const handleAddScenario = () => {
    if (scenarios.length >= 5) {
      setShowMaxScenariosWarning(true);
      return;
    }
    
    const newScenario = {
      id: Date.now(),
      name: `Scenario ${scenarios.length + 1}`,
      isActive: false,
      data: JSON.parse(JSON.stringify(activeScenario.data)) // Deep copy of active scenario
    };
    setScenarios([...scenarios, newScenario]);
  };

  // Handle editing a scenario name
  const handleEditScenario = (scenarioId) => {
    setEditingScenarioId(scenarioId);
  };

  // Handle saving a scenario name
  const handleSaveScenarioName = (scenarioId, newName) => {
    const updatedScenarios = scenarios.map(s => 
      s.id === scenarioId ? { ...s, name: newName } : s
    );
    setScenarios(updatedScenarios);
    setEditingScenarioId(null);
  };

  // Handle deleting a scenario
  const handleDeleteScenario = (scenarioId) => {
    if (scenarios.length > 1) {
      const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
      
      // If the deleted scenario was active, make the first one active
      if (activeScenario.id === scenarioId) {
        updatedScenarios[0].isActive = true;
        handleSwitchScenario(updatedScenarios[0].id);
      }
      
      setScenarios(updatedScenarios);
      setShowDeleteConfirm(null);
    }
  };

  // Handle login success
  const handleLoginSuccess = (user, session) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    setUserSession(session);
  };

  // Handle logout
  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserSession(null);
    setActiveClientId(null); // Clear active client on logout
  };

  // Handle client selection
  const handleSelectClient = (clientId) => {
    if (canAccessClient(clientId, currentUser)) {
      setActiveClientId(clientId);
    } else {
      alert('You do not have permission to access this client.');
    }
  };

  // Handle creating a new client
  const handleCreateClient = (clientName) => {
    const newClient = getClientTemplate(clientName);
    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    setActiveClientId(newClient.id);
  };

  // Handle sharing a client
  const handleShareClient = (client) => {
    setClientToShare(client);
    setShowClientSharingModal(true);
  };

  // Memoized tax calculations to prevent re-rendering
  const taxData = useMemo(() => {
    return calculateComprehensiveTaxes(
      taxpayer, 
      spouse, 
      incomeSources, 
      deductions, 
      appSettings, 
      ficaEnabled
    );
  }, [taxpayer, spouse, incomeSources, deductions, appSettings, ficaEnabled]);

  // Memoized AI optimization recommendations
  const aiRecommendations = useMemo(() => {
    return generateOptimizationRecommendations(taxData, incomeSources, deductions, taxpayer, spouse);
  }, [taxData, incomeSources, deductions, taxpayer, spouse]);

  // Memoized multi-year strategy
  const multiYearStrategy = useMemo(() => {
    return generateMultiYearStrategy(taxData, incomeSources, deductions, taxpayer, spouse, appSettings);
  }, [taxData, incomeSources, deductions, taxpayer, spouse, appSettings]);

  // Memoized Michigan Homestead Credit calculation
  const michiganHomesteadCredit = useMemo(() => {
    return calculateMichiganHomesteadCredit(taxpayer, spouse, taxData.summary.totalIncome, appSettings);
  }, [taxpayer, spouse, taxData.summary.totalIncome, appSettings]);

  // Memoized Michigan Property Tax Exemptions
  const michiganPropertyTaxExemptions = useMemo(() => {
    return calculateMichiganPropertyTaxExemptions(taxpayer, spouse, appSettings);
  }, [taxpayer, spouse, appSettings]);

  // Memoized Annuity Taxation analysis
  const annuityTaxation = useMemo(() => {
    const annuitySource = incomeSources.find(s => s.type === 'annuity');
    if (!annuitySource) return null;
    return calculateAnnuityTaxation(annuitySource, taxpayer, spouse);
  }, [incomeSources, taxpayer, spouse]);

  // Memoized Life Insurance Taxation analysis
  const lifeInsuranceTaxation = useMemo(() => {
    const lifeInsuranceSource = incomeSources.find(s => s.type === 'life-insurance');
    if (!lifeInsuranceSource) return null;
    return calculateLifeInsuranceIncomeStream(lifeInsuranceSource, taxpayer, spouse);
  }, [incomeSources, taxpayer, spouse]);

  // Memoized IRMAA thresholds
  const irmaaThresholds = useMemo(() => {
    return getIrmaaThresholds(taxpayer.filingStatus, appSettings.taxYear);
  }, [taxpayer.filingStatus, appSettings.taxYear]);

  // Memoized Social Security thresholds
  const socialSecurityThresholds = useMemo(() => {
    return getSocialSecurityThresholds(taxpayer.filingStatus);
  }, [taxpayer.filingStatus]);

  // Memoized Comprehensive Marginal Rate Analysis
  const comprehensiveMarginalAnalysis = useMemo(() => {
    return getComprehensiveMarginalAnalysis(taxData, taxpayer, spouse, incomeSources, appSettings);
  }, [taxData, taxpayer, spouse, incomeSources, appSettings]);

  // Memoized Capital Gains Analysis
  const capitalGainsAnalysis = useMemo(() => {
    return getCapitalGainsAnalysis(taxData, taxpayer, incomeSources, appSettings);
  }, [taxData, taxpayer, incomeSources, appSettings]);

  // Memoized FICA Tax Analysis
  const ficaTaxAnalysis = useMemo(() => {
    if (!ficaEnabled) return null;
    return calculateFICATaxes(incomeSources, taxpayer.filingStatus);
  }, [ficaEnabled, incomeSources, taxpayer.filingStatus]);

  // Memoized NIIT Analysis
  const niitAnalysis = useMemo(() => {
    return getNIITAnalysis(taxData, taxpayer.filingStatus);
  }, [taxData, taxpayer.filingStatus]);

  // Memoized Additional Medicare Tax Analysis
  const additionalMedicareTaxAnalysis = useMemo(() => {
    return getAdditionalMedicareTaxAnalysis(taxData, taxpayer.filingStatus);
  }, [taxData, taxpayer.filingStatus]);

  // Memoized AMT Analysis
  const amtAnalysis = useMemo(() => {
    return getAMTAnalysis(taxData, taxpayer, appSettings);
  }, [taxData, taxpayer, appSettings]);

  // Handle input changes for taxpayer and spouse
  const handlePersonChange = (person, field, value) => {
    const setter = person === 'taxpayer' ? setTaxpayer : setSpouse;
    setter(prev => {
      const newState = { ...prev, [field]: value };
      // Recalculate age if date of birth changes
      if (field === 'dateOfBirth') {
        newState.age = calculateAge(value);
      }
      return newState;
    });
  };

  // Handle housing changes for taxpayer and spouse
  const handleHousingChange = (person, field, value) => {
    const setter = person === 'taxpayer' ? setTaxpayer : setSpouse;
    setter(prev => ({
      ...prev,
      housing: { ...prev.housing, [field]: value }
    }));
  };

  // Handle adding a new income source
  const handleAddIncomeSource = () => {
    const newId = incomeSources.length > 0 ? Math.max(...incomeSources.map(s => s.id)) + 1 : 1;
    setIncomeSources([...incomeSources, { 
      id: newId, 
      name: '', 
      type: 'wages', 
      amount: 0, 
      owner: 'taxpayer', 
      accountValue: 0, 
      costBasis: 0, 
      isFromAsset: false 
    }]);
  };

  // Handle updating an income source
  const handleUpdateIncomeSource = (id, field, value) => {
    setIncomeSources(incomeSources.map(source => 
      source.id === id ? { ...source, [field]: value } : source
    ));
  };

  // Handle deleting an income source
  const handleDeleteIncomeSource = (id) => {
    setIncomeSources(incomeSources.filter(source => source.id !== id));
  };

  // Handle changes in deductions
  const handleDeductionChange = (category, field, value) => {
    setDeductions(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  // Handle changes in tax map settings
  const handleTaxMapSettingChange = (field, value) => {
    setTaxMapSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle changes in application settings
  const handleAppSettingChange = (category, field, value) => {
    if (category) {
      setAppSettings(prev => ({
        ...prev,
        [category]: { ...prev[category], [field]: value }
      }));
    } else {
      setAppSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle Medicare settings changes
  const handleMedicareChange = (person, part, value) => {
    setAppSettings(prev => ({
      ...prev,
      medicare: {
        ...prev.medicare,
        [person]: { ...prev.medicare[person], [part]: value }
      }
    }));
  };

  // Handle saving view preferences
  const handleSaveView = () => {
    if (!newViewName) {
      alert('Please enter a name for the view.');
      return;
    }

    const preferences = {
      activeTab,
      middlePaneAnalysis,
      taxMapSettings,
      appSettings
    };

    const newView = {
      id: `view-${Date.now()}`,
      name: newViewName,
      preferences
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    localStorage.setItem('taxCalculatorSavedViews', JSON.stringify(updatedViews));

    if (setAsDefaultChecked) {
      setDefaultViewId(newView.id);
      localStorage.setItem('taxCalculatorDefaultView', newView.id);
    }

    setShowViewModal(false);
    setNewViewName('');
    setSetAsDefaultChecked(false);
  };

  // Handle applying a saved view
  const handleApplyView = (viewId) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      applyViewPreferences(view.preferences);
    }
  };

  // Helper to apply view preferences
  const applyViewPreferences = (preferences) => {
    setActiveTab(preferences.activeTab || 'people');
    setMiddlePaneAnalysis(preferences.middlePaneAnalysis || 'taxMap');
    setTaxMapSettings(preferences.taxMapSettings || {});
    setAppSettings(preferences.appSettings || {});
  };

  // Handle deleting a saved view
  const handleDeleteView = (viewId) => {
    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem('taxCalculatorSavedViews', JSON.stringify(updatedViews));

    if (defaultViewId === viewId) {
      setDefaultViewId(null);
      localStorage.removeItem('taxCalculatorDefaultView');
    }
    setShowDeleteViewConfirm(null);
  };

  // Handle setting a default view
  const handleSetDefaultView = (viewId) => {
    setDefaultViewId(viewId);
    localStorage.setItem('taxCalculatorDefaultView', viewId);
  };

  // Render main application or login page
  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Accessible clients for the current user
  const accessibleClients = getAccessibleClients(currentUser, clients);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <img src={taxLogo} alt="Tax-on-a-Me Logo" className="logo" />
          <h1 className="app-title">Tax-on-a-Me</h1>
        </div>
        
        {/* Client Selector */}
        <div className="client-selector-container">
          <ClientSelector 
            clients={accessibleClients}
            activeClientId={activeClientId}
            onSelectClient={handleSelectClient}
            onCreateClient={handleCreateClient}
            currentUser={currentUser}
          />
        </div>

        <div className="header-actions">
          {/* Scenario Management */}
          <div className="scenario-controls">
            {scenarios.map(scenario => (
              <div key={scenario.id} className={`scenario-tab ${scenario.isActive ? 'active' : ''}`}>
                {editingScenarioId === scenario.id ? (
                  <input 
                    type="text" 
                    defaultValue={scenario.name} 
                    onBlur={(e) => handleSaveScenarioName(scenario.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveScenarioName(scenario.id, e.target.value)}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => handleSwitchScenario(scenario.id)}>{scenario.name}</span>
                )}
                <button className="edit-scenario-btn" onClick={() => handleEditScenario(scenario.id)}>✏️</button>
                {scenarios.length > 1 && (
                  <button className="delete-scenario-btn" onClick={() => setShowDeleteConfirm(scenario.id)}>🗑️</button>
                )}
                {showDeleteConfirm === scenario.id && (
                  <div className="delete-confirm-modal">
                    <p>Delete {scenario.name}?</p>
                    <button onClick={() => handleDeleteScenario(scenario.id)}>Yes</button>
                    <button onClick={() => setShowDeleteConfirm(null)}>No</button>
                  </div>
                )}
              </div>
            ))}
            {scenarios.length < 5 && (
              <button className="add-scenario-btn" onClick={handleAddScenario}>+</button>
            )}
          </div>

          {showMaxScenariosWarning && (
            <div className="max-scenarios-warning">
              <p>You can have a maximum of 5 scenarios.</p>
              <button onClick={() => setShowMaxScenariosWarning(false)}>Close</button>
            </div>
          )}

          {/* View Preferences */}
          <div className="view-controls">
            <button onClick={() => setShowViewModal(true)}>Manage Views</button>
            <select onChange={(e) => handleApplyView(e.target.value)} value={activeScenario.id}>
              <option value="">Apply View</option>
              {savedViews.map(view => (
                <option key={view.id} value={view.id}>{view.name}</option>
              ))}
            </select>
          </div>

          {/* User and Settings */}
          <div className="user-settings-container">
            <span>Welcome, {currentUser.username}</span>
            <button onClick={() => setShowUserSettings(true)}>Settings</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Left Pane: Data Input Tabs */}
        <div className="left-pane">
          <div className="tabs-container">
            <div className="tab-buttons">
              <button className={activeTab === 'people' ? 'active' : ''} onClick={() => setActiveTab('people')}>People</button>
              <button className={activeTab === 'income' ? 'active' : ''} onClick={() => setActiveTab('income')}>Income</button>
              <button className={activeTab === 'deductions' ? 'active' : ''} onClick={() => setActiveTab('deductions')}>Deductions</button>
              <button className={activeTab === 'tax-analysis' ? 'active' : ''} onClick={() => setActiveTab('tax-analysis')}>Tax Analysis</button>
              <button className={activeTab === 'multi-year' ? 'active' : ''} onClick={() => setActiveTab('multi-year')}>Multi-Year</button>
              <button className={activeTab === 'ai-optimize' ? 'active' : ''} onClick={() => setActiveTab('ai-optimize')}>AI Optimize</button>
            </div>

            <div className="tab-content">
              {/* People Tab */}
              {activeTab === 'people' && (
                <div className="people-tab">
                  <h2>People</h2>
                  <div className="person-section">
                    <h3>Taxpayer</h3>
                    <div className="input-group">
                      <label>First Name</label>
                      <input type="text" value={taxpayer.firstName} onChange={(e) => handlePersonChange('taxpayer', 'firstName', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Last Name</label>
                      <input type="text" value={taxpayer.lastName} onChange={(e) => handlePersonChange('taxpayer', 'lastName', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Date of Birth (MM/DD/YYYY)</label>
                      <input type="text" value={taxpayer.dateOfBirth} onChange={(e) => handlePersonChange('taxpayer', 'dateOfBirth', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Age</label>
                      <input type="number" value={taxpayer.age || ''} onChange={(e) => handlePersonChange('taxpayer', 'age', parseInt(e.target.value) || null)} />
                    </div>
                  </div>

                  <div className="filing-status-section">
                    <h3>Filing Status</h3>
                    <select value={taxpayer.filingStatus} onChange={(e) => handlePersonChange('taxpayer', 'filingStatus', e.target.value)}>
                      <option value="single">Single</option>
                      <option value="married-jointly">Married Filing Jointly</option>
                      <option value="married-separately">Married Filing Separately</option>
                      <option value="hoh">Head of Household</option>
                      <option value="qw">Qualifying Widow(er)</option>
                    </select>
                  </div>

                  {taxpayer.filingStatus === 'married-jointly' && (
                    <div className="person-section">
                      <h3>Spouse</h3>
                      <div className="input-group">
                        <label>First Name</label>
                        <input type="text" value={spouse.firstName} onChange={(e) => handlePersonChange('spouse', 'firstName', e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Last Name</label>
                        <input type="text" value={spouse.lastName} onChange={(e) => handlePersonChange('spouse', 'lastName', e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Date of Birth (MM/DD/YYYY)</label>
                        <input type="text" value={spouse.dateOfBirth} onChange={(e) => handlePersonChange('spouse', 'dateOfBirth', e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label>Age</label>
                        <input type="number" value={spouse.age || ''} onChange={(e) => handlePersonChange('spouse', 'age', parseInt(e.target.value) || null)} />
                      </div>
                    </div>
                  )}

                  <div className="state-residency-section">
                    <h3>State Residency</h3>
                    <select value={taxpayer.state} onChange={(e) => handlePersonChange('taxpayer', 'state', e.target.value)}>
                      <option value="Michigan">Michigan</option>
                      {/* Add other states as needed */}
                    </select>
                  </div>

                  {taxpayer.state === 'Michigan' && (
                    <div className="michigan-housing-section">
                      <h4>Michigan Homestead Credit</h4>
                      <div className="input-group">
                        <label>Housing Ownership</label>
                        <select value={taxpayer.housing.ownership} onChange={(e) => handleHousingChange('taxpayer', 'ownership', e.target.value)}>
                          <option value="own">Own</option>
                          <option value="rent">Rent</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Taxable Value of Home</label>
                        <input type="number" value={taxpayer.housing.propertyTaxValue} onChange={(e) => handleHousingChange('taxpayer', 'propertyTaxValue', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="input-group">
                        <label>Property Taxes Paid</label>
                        <input type="number" value={taxpayer.housing.propertyTaxesPaid} onChange={(e) => handleHousingChange('taxpayer', 'propertyTaxesPaid', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="input-group">
                        <label>Resident for 6+ months?</label>
                        <input type="checkbox" checked={taxpayer.housing.michiganResident6Months} onChange={(e) => handleHousingChange('taxpayer', 'michiganResident6Months', e.target.checked)} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Income Tab */}
              {activeTab === 'income' && (
                <div className="income-tab">
                  <h2>Income Sources</h2>
                  <div className="income-entry-mode">
                    <button className={incomeEntryMode === 'manual' ? 'active' : ''} onClick={() => setIncomeEntryMode('manual')}>Manual Entry</button>
                    <button className={incomeEntryMode === 'taxReturn' ? 'active' : ''} onClick={() => setIncomeEntryMode('taxReturn')}>Tax Return Import</button>
                  </div>

                  {incomeEntryMode === 'manual' ? (
                    <>
                      {incomeSources.map(source => (
                        <div key={source.id} className="income-source-item">
                          <input 
                            type="text" 
                            placeholder="Name" 
                            value={source.name} 
                            onChange={(e) => handleUpdateIncomeSource(source.id, 'name', e.target.value)}
                          />
                          <select value={source.type} onChange={(e) => handleUpdateIncomeSource(source.id, 'type', e.target.value)}>
                            <option value="wages">Wages</option>
                            <option value="interest">Interest</option>
                            <option value="dividends">Dividends</option>
                            <option value="capital-gains">Capital Gains</option>
                            <option value="traditional-ira">Traditional IRA</option>
                            <option value="roth-ira">Roth IRA</option>
                            <option value="401k">401k</option>
                            <option value="social-security">Social Security</option>
                            <option value="pension">Pension</option>
                            <option value="annuity">Annuity</option>
                            <option value="real-estate">Real Estate</option>
                            <option value="business">Business</option>
                            <option value="other">Other</option>
                          </select>
                          <input 
                            type="number" 
                            placeholder="Amount" 
                            value={source.amount} 
                            onChange={(e) => handleUpdateIncomeSource(source.id, 'amount', parseFloat(e.target.value) || 0)}
                          />
                          <select value={source.owner} onChange={(e) => handleUpdateIncomeSource(source.id, 'owner', e.target.value)}>
                            <option value="taxpayer">Taxpayer</option>
                            {taxpayer.filingStatus === 'married-jointly' && <option value="spouse">Spouse</option>}
                            <option value="joint">Joint</option>
                          </select>
                          {assetBasedIncomeTypes.includes(source.type) && (
                            <input 
                              type="number" 
                              placeholder="Account Value" 
                              value={source.accountValue || ''} 
                              onChange={(e) => handleUpdateIncomeSource(source.id, 'accountValue', parseFloat(e.target.value) || 0)}
                            />
                          )}
                          {source.type === 'capital-gains' && (
                            <input 
                              type="number" 
                              placeholder="Cost Basis" 
                              value={source.costBasis || ''} 
                              onChange={(e) => handleUpdateIncomeSource(source.id, 'costBasis', parseFloat(e.target.value) || 0)}
                            />
                          )}
                          <button onClick={() => handleDeleteIncomeSource(source.id)}>Delete</button>
                        </div>
                      ))}
                      <button onClick={handleAddIncomeSource}>Add Income Source</button>
                    </>
                  ) : (
                    <div className="tax-return-import">
                      <h3>Import from Tax Return (Form 1040)</h3>
                      <div className="input-group">
                        <label>Wages, salaries, tips (Line 1a)</label>
                        <input type="number" value={taxReturnData.wages} onChange={(e) => setTaxReturnData({...taxReturnData, wages: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Taxable interest (Line 2b)</label>
                        <input type="number" value={taxReturnData.taxableInterest} onChange={(e) => setTaxReturnData({...taxReturnData, taxableInterest: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Ordinary dividends (Line 3a)</label>
                        <input type="number" value={taxReturnData.dividends} onChange={(e) => setTaxReturnData({...taxReturnData, dividends: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>IRA distributions (Line 4a)</label>
                        <input type="number" value={taxReturnData.iraDistributions} onChange={(e) => setTaxReturnData({...taxReturnData, iraDistributions: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Pensions and annuities (Line 4b)</label>
                        <input type="number" value={taxReturnData.pensionsAnnuities} onChange={(e) => setTaxReturnData({...taxReturnData, pensionsAnnuities: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Social Security benefits (Line 5a)</label>
                        <input type="number" value={taxReturnData.socialSecurity} onChange={(e) => setTaxReturnData({...taxReturnData, socialSecurity: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Capital gain or (loss) (Line 7)</label>
                        <input type="number" value={taxReturnData.capitalGains} onChange={(e) => setTaxReturnData({...taxReturnData, capitalGains: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="input-group">
                        <label>Other income (Line 8)</label>
                        <input type="number" value={taxReturnData.otherIncome} onChange={(e) => setTaxReturnData({...taxReturnData, otherIncome: parseFloat(e.target.value) || 0})} />
                      </div>
                      <button onClick={() => {
                        // This button would process the tax return data and populate the incomeSources array
                        // For now, it's a placeholder
                        alert('Tax return import is not yet implemented.');
                      }}>Import Data</button>
                    </div>
                  )}
                </div>
              )}

              {/* Deductions Tab */}
              {activeTab === 'deductions' && (
                <div className="deductions-tab">
                  <h2>Deductions</h2>
                  <div className="deduction-section">
                    <h3>Federal Itemized Deductions</h3>
                    <div className="input-group">
                      <label>State and Local Taxes (SALT)</label>
                      <input type="number" value={deductions.itemized.saltDeduction} onChange={(e) => handleDeductionChange('itemized', 'saltDeduction', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="input-group">
                      <label>Mortgage Interest</label>
                      <input type="number" value={deductions.itemized.mortgageInterest} onChange={(e) => handleDeductionChange('itemized', 'mortgageInterest', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="input-group">
                      <label>Charitable Giving</label>
                      <input type="number" value={deductions.itemized.charitableGiving} onChange={(e) => handleDeductionChange('itemized', 'charitableGiving', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="input-group">
                      <label>Medical Expenses</label>
                      <input type="number" value={deductions.itemized.medicalExpenses} onChange={(e) => handleDeductionChange('itemized', 'medicalExpenses', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="input-group">
                      <label>Other Itemized Deductions</label>
                      <input type="number" value={deductions.itemized.otherDeductions} onChange={(e) => handleDeductionChange('itemized', 'otherDeductions', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="deduction-section">
                    <h3>State Deductions (Michigan)</h3>
                    <div className="input-group">
                      <label>Michigan Deductions</label>
                      <input type="number" value={deductions.state.michiganDeductions} onChange={(e) => handleDeductionChange('state', 'michiganDeductions', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="input-group">
                      <label>Other State Credits</label>
                      <input type="number" value={deductions.state.otherCredits} onChange={(e) => handleDeductionChange('state', 'otherCredits', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Analysis Tab */}
              {activeTab === 'tax-analysis' && (
                <div className="tax-analysis-tab">
                  <h2>Tax Analysis Settings</h2>
                  <div className="input-group">
                    <label>Tax Year</label>
                    <select value={appSettings.taxYear} onChange={(e) => handleAppSettingChange(null, 'taxYear', parseInt(e.target.value))}>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>TCJA Sunsetting (2026+)</label>
                    <input type="checkbox" checked={appSettings.tcjaSunsetting} onChange={(e) => handleAppSettingChange(null, 'tcjaSunsetting', e.target.checked)} />
                  </div>
                  <div className="input-group">
                    <label>Enable Automatic RMDs</label>
                    <input type="checkbox" checked={appSettings.rmdEnabled} onChange={(e) => handleAppSettingChange(null, 'rmdEnabled', e.target.checked)} />
                  </div>
                  <div className="input-group">
                    <label>Enable FICA Calculation</label>
                    <input type="checkbox" checked={ficaEnabled} onChange={(e) => setFicaEnabled(e.target.checked)} />
                  </div>
                  
                  <h4>Medicare Settings</h4>
                  <div className="medicare-settings">
                    <div className="person-medicare">
                      <h5>Taxpayer</h5>
                      <div className="input-group">
                        <label>Part B Coverage</label>
                        <input type="checkbox" checked={appSettings.medicare.taxpayer.partB} onChange={(e) => handleMedicareChange('taxpayer', 'partB', e.target.checked)} />
                      </div>
                      <div className="input-group">
                        <label>Part D Coverage</label>
                        <input type="checkbox" checked={appSettings.medicare.taxpayer.partD} onChange={(e) => handleMedicareChange('taxpayer', 'partD', e.target.checked)} />
                      </div>
                    </div>
                    {taxpayer.filingStatus === 'married-jointly' && (
                      <div className="person-medicare">
                        <h5>Spouse</h5>
                        <div className="input-group">
                          <label>Part B Coverage</label>
                          <input type="checkbox" checked={appSettings.medicare.spouse.partB} onChange={(e) => handleMedicareChange('spouse', 'partB', e.target.checked)} />
                        </div>
                        <div className="input-group">
                          <label>Part D Coverage</label>
                          <input type="checkbox" checked={appSettings.medicare.spouse.partD} onChange={(e) => handleMedicareChange('spouse', 'partD', e.target.checked)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Year Tab */}
              {activeTab === 'multi-year' && (
                <div className="multi-year-tab">
                  <h2>Multi-Year Strategy</h2>
                  <div className="strategy-output">
                    {multiYearStrategy.map((item, index) => (
                      <div key={index} className="strategy-item">
                        <strong>{item.year}:</strong> {item.recommendation}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Optimize Tab */}
              {activeTab === 'ai-optimize' && (
                <div className="ai-optimize-tab">
                  <h2>AI Optimization Recommendations</h2>
                  <div className="recommendations-output">
                    {aiRecommendations.map((rec, index) => (
                      <div key={index} className="recommendation-item">
                        <strong>{rec.title}:</strong> {rec.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Pane: Analysis & Visualization */}
        <div className="middle-pane">
          <div className="middle-pane-controls">
            <button className={middlePaneAnalysis === 'taxMap' ? 'active' : ''} onClick={() => setMiddlePaneAnalysis('taxMap')}>Tax Map</button>
            <button className={middlePaneAnalysis === 'assets' ? 'active' : ''} onClick={() => setMiddlePaneAnalysis('assets')}>Assets</button>
            <button className={middlePaneAnalysis === 'sequenceReturns' ? 'active' : ''} onClick={() => setMiddlePaneAnalysis('sequenceReturns')}>Sequence of Returns</button>
            <button className={middlePaneAnalysis === 'socialSecurity' ? 'active' : ''} onClick={() => setMiddlePaneAnalysis('socialSecurity')}>Social Security</button>
            <button className={middlePaneAnalysis === 'reports' ? 'active' : ''} onClick={() => setMiddlePaneAnalysis('reports')}>Reports</button>
            {hasPermission(currentUser, PERMISSIONS.MANAGE_CLIENTS) && (
              <button className={middlePaneAnalysis === 'clients' ? 'active' : ''} onClick={() => setMiddlePaneAnalysis('clients')}>Clients</button>
            )}
          </div>

          <div className="middle-pane-content">
            {middlePaneAnalysis === 'taxMap' && (
              <InteractiveTaxMap 
                taxData={taxData} 
                settings={taxMapSettings} 
                onSettingsChange={handleTaxMapSettingChange} 
              />
            )}
            {middlePaneAnalysis === 'assets' && (
              <AssetsTab 
                assets={assets} 
                setAssets={setAssets} 
                incomeSources={incomeSources} 
                setIncomeSources={setIncomeSources}
              />
            )}
            {middlePaneAnalysis === 'sequenceReturns' && <SequenceOfReturnsAnalysis />}
            {middlePaneAnalysis === 'socialSecurity' && <SocialSecurityAnalysis />}
            {middlePaneAnalysis === 'reports' && <ComprehensiveReports taxData={taxData} />}
            {middlePaneAnalysis === 'clients' && hasPermission(currentUser, PERMISSIONS.MANAGE_CLIENTS) && (
              <ClientManagementTab 
                clients={clients} 
                onShareClient={handleShareClient} 
                currentUser={currentUser} 
              />
            )}
          </div>
        </div>

        {/* Right Pane: Summary & Details */}
        <div className="right-pane">
          <div className="summary-section">
            <h3>Summary</h3>
            <p><strong>Total Income:</strong> {formatCurrency(taxData.summary.totalIncome)}</p>
            <p><strong>AGI:</strong> {formatCurrency(taxData.summary.agi)}</p>
            <p><strong>Taxable Income:</strong> {formatCurrency(taxData.summary.taxableIncome)}</p>
            <p><strong>Federal Tax:</strong> {formatCurrency(taxData.summary.federalTax)}</p>
            <p><strong>State Tax:</strong> {formatCurrency(taxData.summary.stateTax)}</p>
            <p><strong>Total Tax:</strong> {formatCurrency(taxData.summary.totalTax)}</p>
            <p><strong>Effective Tax Rate:</strong> {formatPercentage(taxData.summary.effectiveTaxRate)}</p>
          </div>

          <div className="details-section">
            <h3>Details</h3>
            {/* Add more detailed breakdowns here */}
            <div className="detail-item">
              <h4>Federal Tax Brackets</h4>
              <ul>
                {taxData.federal.brackets.map(bracket => (
                  <li key={bracket.rate}>
                    {formatPercentage(bracket.rate)}: {formatCurrency(bracket.taxInBracket)}
                  </li>
                ))}
              </ul>
            </div>
            {taxData.state && (
              <div className="detail-item">
                <h4>State Tax ({taxpayer.state})</h4>
                <p>Taxable Income: {formatCurrency(taxData.state.taxableIncome)}</p>
                <p>Tax Rate: {formatPercentage(taxData.state.taxRate)}</p>
                <p>Tax Amount: {formatCurrency(taxData.state.taxAmount)}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showViewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {viewModalMode === 'save' ? (
              <>
                <h3>Save Current View</h3>
                <input 
                  type="text" 
                  placeholder="View Name" 
                  value={newViewName} 
                  onChange={(e) => setNewViewName(e.target.value)} 
                />
                <label>
                  <input 
                    type="checkbox" 
                    checked={setAsDefaultChecked} 
                    onChange={(e) => setSetAsDefaultChecked(e.target.checked)} 
                  />
                  Set as Default
                </label>
                <button onClick={handleSaveView}>Save</button>
                <button onClick={() => setShowViewModal(false)}>Cancel</button>
                <button onClick={() => setViewModalMode('manage')}>Manage Views</button>
              </>
            ) : (
              <>
                <h3>Manage Saved Views</h3>
                <ul>
                  {savedViews.map(view => (
                    <li key={view.id}>
                      {view.name}
                      <button onClick={() => handleApplyView(view.id)}>Apply</button>
                      <button onClick={() => handleSetDefaultView(view.id)}>{defaultViewId === view.id ? 'Default' : 'Set Default'}</button>
                      <button onClick={() => setShowDeleteViewConfirm(view.id)}>Delete</button>
                      {showDeleteViewConfirm === view.id && (
                        <div className="delete-confirm-inline">
                          <span>Delete?</span>
                          <button onClick={() => handleDeleteView(view.id)}>Yes</button>
                          <button onClick={() => setShowDeleteViewConfirm(null)}>No</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setViewModalMode('save')}>Save New View</button>
                <button onClick={() => setShowViewModal(false)}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {showClientSharingModal && (
        <ClientSharingModal 
          client={clientToShare} 
          onClose={() => setShowClientSharingModal(false)} 
          currentUser={currentUser}
        />
      )}

      <HelpSystem />
    </div>
  );
}

export default App;
