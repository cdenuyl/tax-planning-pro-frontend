// Client Management Utilities

// Generate unique client ID
export const generateClientId = () => {
  return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Default client settings
export const getDefaultClientSettings = () => ({
  defaultView: 'assets',
  savedViews: [],
  reportPreferences: {
    includeCharts: true,
    includeCalculations: true,
    defaultTemplate: 'comprehensive',
    advisorBranding: true
  }
});

// Default deductions structure
export const getDefaultDeductions = () => ({
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

// Default tax map settings
export const getDefaultTaxMapSettings = () => ({
  incomeType: 'ordinary',
  jurisdiction: 'federal',
  view: 'detailed',
  methodology: 'incremental'
});

// Default app settings
export const getDefaultAppSettings = () => ({
  taxYear: 2025,
  tcjaSunsetting: true,
  rmdEnabled: false,
  medicare: {
    taxpayer: {
      partB: true,
      partD: false
    },
    spouse: {
      partB: false,
      partD: false
    }
  }
});

// Client Templates

// Individual Client Template
export const getIndividualClientTemplate = () => ({
  scenarios: [
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
        deductions: getDefaultDeductions(),
        taxMapSettings: getDefaultTaxMapSettings(),
        assets: []
      }
    }
  ]
});

// Couple Client Template
export const getCoupleClientTemplate = () => ({
  scenarios: [
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
          filingStatus: 'married-joint',
          state: 'Michigan',
          housing: {
            ownership: 'own',
            propertyTaxValue: 200000,
            propertyTaxesPaid: 4000,
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
        deductions: getDefaultDeductions(),
        taxMapSettings: getDefaultTaxMapSettings(),
        assets: []
      }
    }
  ]
});

// Retiree Client Template
export const getRetireeClientTemplate = () => ({
  scenarios: [
    {
      id: 1,
      name: 'Current Retirement Plan',
      isActive: true,
      data: {
        activeTab: 'people',
        ficaEnabled: false,
        taxpayer: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: 65,
          filingStatus: 'married-joint',
          state: 'Michigan',
          housing: {
            ownership: 'own',
            propertyTaxValue: 250000,
            propertyTaxesPaid: 5000,
            michiganResident6Months: true
          }
        },
        spouse: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: 62,
          housing: {
            ownership: 'own',
            propertyTaxValue: 0,
            propertyTaxesPaid: 0,
            michiganResident6Months: true
          }
        },
        incomeSources: [
          { 
            id: 1, 
            name: 'Social Security - Primary', 
            amount: 30000, 
            type: 'social-security', 
            owner: 'taxpayer', 
            enabled: true, 
            penaltyExempt: false 
          },
          { 
            id: 2, 
            name: 'Social Security - Spouse', 
            amount: 18000, 
            type: 'social-security', 
            owner: 'spouse', 
            enabled: true, 
            penaltyExempt: false 
          },
          { 
            id: 3, 
            name: '401(k) Withdrawals', 
            amount: 24000, 
            type: 'traditional-401k', 
            owner: 'taxpayer', 
            enabled: true, 
            penaltyExempt: false, 
            accountValue: 500000 
          }
        ],
        deductions: getDefaultDeductions(),
        taxMapSettings: getDefaultTaxMapSettings(),
        assets: []
      }
    },
    {
      id: 2,
      name: 'Optimized Withdrawal Strategy',
      isActive: false,
      data: {
        activeTab: 'people',
        ficaEnabled: false,
        taxpayer: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: 65,
          filingStatus: 'married-joint',
          state: 'Michigan',
          housing: {
            ownership: 'own',
            propertyTaxValue: 250000,
            propertyTaxesPaid: 5000,
            michiganResident6Months: true
          }
        },
        spouse: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: 62,
          housing: {
            ownership: 'own',
            propertyTaxValue: 0,
            propertyTaxesPaid: 0,
            michiganResident6Months: true
          }
        },
        incomeSources: [
          { 
            id: 1, 
            name: 'Social Security - Primary', 
            amount: 30000, 
            type: 'social-security', 
            owner: 'taxpayer', 
            enabled: true, 
            penaltyExempt: false 
          },
          { 
            id: 2, 
            name: 'Social Security - Spouse', 
            amount: 18000, 
            type: 'social-security', 
            owner: 'spouse', 
            enabled: true, 
            penaltyExempt: false 
          },
          { 
            id: 3, 
            name: 'Traditional IRA Withdrawals', 
            amount: 20000, 
            type: 'traditional-ira', 
            owner: 'taxpayer', 
            enabled: true, 
            penaltyExempt: false, 
            accountValue: 300000 
          },
          { 
            id: 4, 
            name: 'Roth IRA Withdrawals', 
            amount: 8000, 
            type: 'roth-ira', 
            owner: 'taxpayer', 
            enabled: true, 
            penaltyExempt: false, 
            accountValue: 200000 
          }
        ],
        deductions: getDefaultDeductions(),
        taxMapSettings: getDefaultTaxMapSettings(),
        assets: []
      }
    }
  ]
});

// Business Client Template
export const getBusinessClientTemplate = () => ({
  scenarios: [
    {
      id: 1,
      name: 'Current Business Structure',
      isActive: true,
      data: {
        activeTab: 'people',
        ficaEnabled: true,
        taxpayer: {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          age: null,
          filingStatus: 'married-joint',
          state: 'Michigan',
          housing: {
            ownership: 'own',
            propertyTaxValue: 300000,
            propertyTaxesPaid: 6000,
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
        incomeSources: [
          { 
            id: 1, 
            name: 'Business Income (Schedule C)', 
            amount: 120000, 
            type: 'business', 
            owner: 'taxpayer', 
            enabled: true, 
            penaltyExempt: false 
          },
          { 
            id: 2, 
            name: 'SEP-IRA Contribution', 
            amount: -24000, 
            type: 'sep-ira', 
            owner: 'taxpayer', 
            enabled: true, 
            penaltyExempt: false, 
            accountValue: 150000 
          }
        ],
        deductions: getDefaultDeductions(),
        taxMapSettings: getDefaultTaxMapSettings(),
        assets: []
      }
    }
  ]
});

// Get client template by type
export const getClientTemplate = (clientType) => {
  switch (clientType) {
    case 'individual':
      return getIndividualClientTemplate();
    case 'couple':
      return getCoupleClientTemplate();
    case 'retiree':
      return getRetireeClientTemplate();
    case 'business':
      return getBusinessClientTemplate();
    default:
      return getIndividualClientTemplate();
  }
};

// Client data persistence
export const saveClientsData = (clients, activeClientId, appSettings) => {
  const dataToSave = {
    clients,
    activeClientId,
    appSettings,
    lastSaved: new Date().toISOString(),
    version: '1.0'
  };
  
  try {
    localStorage.setItem('taxOnAMe_clientsData', JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('Error saving clients data:', error);
    return false;
  }
};

// Load client data from localStorage
export const loadClientsData = () => {
  try {
    const saved = localStorage.getItem('taxOnAMe_clientsData');
    if (saved) {
      const data = JSON.parse(saved);
      return {
        clients: data.clients || [],
        activeClientId: data.activeClientId || null,
        appSettings: data.appSettings || getDefaultAppSettings(),
        lastSaved: data.lastSaved || null
      };
    }
  } catch (error) {
    console.error('Error loading clients data:', error);
  }
  
  return {
    clients: [],
    activeClientId: null,
    appSettings: getDefaultAppSettings(),
    lastSaved: null
  };
};

// Export client data
export const exportClientData = (client) => {
  const exportData = {
    client,
    exportDate: new Date().toISOString(),
    version: '1.0',
    application: 'Tax-On-A-Me'
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Import client data
export const importClientData = (importDataString) => {
  try {
    const data = JSON.parse(importDataString);
    
    if (!data.client || !data.client.profile) {
      throw new Error('Invalid client data format');
    }
    
    // Generate new ID to avoid conflicts
    const newClient = {
      ...data.client,
      id: generateClientId(),
      profile: {
        ...data.client.profile,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };
    
    return newClient;
  } catch (error) {
    console.error('Error importing client data:', error);
    throw new Error('Failed to import client data: ' + error.message);
  }
};

// Migrate existing scenario data to client format
export const migrateScenarioDataToClient = (scenarios, appSettings) => {
  if (!scenarios || scenarios.length === 0) {
    return {
      clients: [],
      activeClientId: null
    };
  }
  
  // Create a client from the existing scenario data
  const activeScenario = scenarios.find(s => s.isActive) || scenarios[0];
  const taxpayerName = activeScenario.data.taxpayer.firstName + ' ' + activeScenario.data.taxpayer.lastName;
  const spouseName = activeScenario.data.spouse.firstName + ' ' + activeScenario.data.spouse.lastName;
  
  const clientName = spouseName.trim() && spouseName !== ' ' 
    ? `${taxpayerName} & ${spouseName}`
    : taxpayerName;
  
  const newClient = {
    id: generateClientId(),
    profile: {
      clientName: clientName || 'Migrated Client',
      primaryContact: taxpayerName || 'Primary Contact',
      email: '',
      phone: '',
      advisorName: '',
      firmName: '',
      clientType: activeScenario.data.taxpayer.filingStatus === 'married-joint' ? 'couple' : 'individual',
      riskProfile: 'moderate',
      planningGoals: ['tax-optimization'],
      notes: 'Migrated from previous version',
      tags: ['migrated'],
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isActive: true,
      isArchived: false
    },
    scenarios: scenarios,
    settings: getDefaultClientSettings()
  };
  
  return {
    clients: [newClient],
    activeClientId: newClient.id
  };
};

