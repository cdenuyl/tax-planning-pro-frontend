import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useClientData } from './hooks/useClientData';
import Login from './components/Login';
import ClientManagementApp from './components/ClientManagementApp'; // Import the main client management component
import AssetsTab from './components/AssetsTab';
import SocialSecurityAnalysis from './components/SocialSecurityAnalysis';
import ComprehensiveReports from './components/ComprehensiveReports';
import ScenarioSelector from './components/ScenarioSelector';

// Main application component (wrapped by AuthProvider)
const TaxPlanningApp = () => {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const {
    currentClient,
    currentScenario,
    clients,
    isLoading: clientLoading,
    error: clientError,
    hasUnsavedChanges,
    loadClients,
    createClient,
    updateClient,
    updateTaxpayerData,
    updateSpouseData,
    updateIncomeSources,
    updateAssets,
    updateDeductions,
    updateSettings,
    forceSave,
    clearCurrentClient,
    selectClient,
    createScenario,
    updateScenario,
    deleteScenario,
    selectScenario,
  } = useClientData();

  const [activeTab, setActiveTab] = useState('client');
  const [scenarios, setScenarios] = useState([]);

  // Initialize data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadClients();
    } else {
      clearCurrentClient();
    }
  }, [isAuthenticated, loadClients, clearCurrentClient]);

  // Update scenarios when current client changes
  useEffect(() => {
    if (currentClient?.scenarios) {
      setScenarios(currentClient.scenarios);
    } else {
      setScenarios([]);
    }
  }, [currentClient]);

  // Show loading screen during authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Tax Planning Pro...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  const handleLogin = useCallback(() => {
    setActiveTab("client");
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Legacy state management for backward compatibility
  const [taxpayer, setTaxpayer] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    fraAmount: 0,
    ...currentScenario?.taxpayerData
  });

  const [spouse, setSpouse] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    fraAmount: 0,
    ...currentScenario?.spouseData
  });

  const [incomeSources, setIncomeSourcesState] = useState(currentScenario?.incomeSources || []);
  const [assets, setAssetsState] = useState(currentScenario?.assets || []);
  const [deductions, setDeductionsState] = useState(currentScenario?.deductions || {});
  const [settings, setSettingsState] = useState(currentScenario?.settings || {});

  // Update local state when scenario changes
  useEffect(() => {
    if (currentScenario) {
      setTaxpayer(prev => ({ ...prev, ...currentScenario.taxpayerData }));
      setSpouse(prev => ({ ...prev, ...currentScenario.spouseData }));
      setIncomeSourcesState(currentScenario.incomeSources || []);
      setAssetsState(currentScenario.assets || []);
      setDeductionsState(currentScenario.deductions || {});
      setSettingsState(currentScenario.settings || {});
    }
  }, [currentScenario]);

  // Wrapper functions to maintain backward compatibility
  const updateScenarioData = (field, data) => {
    switch (field) {
      case 'taxpayer':
        setTaxpayer(prev => ({ ...prev, ...data }));
        updateTaxpayerData(data);
        break;
      case 'spouse':
        setSpouse(prev => ({ ...prev, ...data }));
        updateSpouseData(data);
        break;
      case 'incomeSources':
        setIncomeSourcesState(data);
        updateIncomeSources(data);
        break;
      case 'assets':
        setAssetsState(data);
        updateAssets(data);
        break;
      case 'deductions':
        setDeductionsState(data);
        updateDeductions(data);
        break;
      case 'settings':
        setSettingsState(data);
        updateSettings(data);
        break;
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'client', label: 'Client', icon: '👤' },
    { id: 'assets', label: 'Assets', icon: '🏦' },
    { id: 'socialSecurity', label: 'Social Security', icon: '🏛️' },
    { id: 'reports', label: 'Reports', icon: '📊' }
  ];

  const handleLogout = async () => {
    await logout();
    setActiveTab('client');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Tax Planning Pro
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Save Status */}
              {hasUnsavedChanges && (
                <div className="flex items-center text-yellow-600 text-sm">
                  <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                  Auto-saving...
                </div>
              )}
              
              {/* Current Client */}
              {currentClient && (
                <div className="text-sm text-gray-600">
                  Client: <span className="font-medium">
                    {currentClient.taxpayer_first_name} {currentClient.taxpayer_last_name}
                  </span>
                </div>
              )}
              
              {/* User Info & Logout */}
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {clientError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-700">{clientError}</div>
          </div>
        )}

        {/* Scenario Selector */}
        {currentClient && scenarios.length > 0 && (
          <div className="mb-6">
            <ScenarioSelector 
              scenarios={scenarios}
              currentScenario={currentScenario}
              onScenarioChange={(scenario) => {
                selectScenario(scenario.id);
              }}
              onCreateScenario={createScenario}
              onUpdateScenario={updateScenario}
              onDeleteScenario={deleteScenario}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'client' && (
            <ClientManagementApp
              clients={clients}
              currentClient={currentClient}
              selectClient={selectClient}
              createClient={createClient}
              updateClient={updateClient}
              deleteClient={() => { /* Implement delete client logic */ }}
              // Pass down functions for modals and other client actions
            />
          )}

          {activeTab === 'assets' && currentClient && (
            <AssetsTab
              assets={assets}
              onAssetsChange={(newAssets) => updateScenarioData('assets', newAssets)}
              taxpayer={taxpayer}
              spouse={spouse}
            />
          )}

          {activeTab === 'socialSecurity' && currentClient && (
            <SocialSecurityAnalysis
              taxpayer={taxpayer}
              spouse={spouse}
              updateScenarioData={updateScenarioData}
              incomeSources={incomeSources}
            />
          )}

          {activeTab === 'reports' && currentClient && (
            <ComprehensiveReports
              taxpayer={taxpayer}
              spouse={spouse}
              incomeSources={incomeSources}
              assets={assets}
              deductions={deductions}
              settings={settings}
              scenarios={scenarios}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Root App component with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <TaxPlanningApp />
    </AuthProvider>
  );
};

export default App;


