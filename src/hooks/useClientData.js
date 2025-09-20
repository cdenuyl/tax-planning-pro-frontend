import { useState, useEffect, useCallback, useRef } from 'react';
import { clientAPI, scenarioAPI } from '../services/api';

// Custom hook for managing client data with auto-save functionality
export const useClientData = (initialClientId = null) => {
  const [currentClient, setCurrentClient] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Auto-save timer ref
  const autoSaveTimer = useRef(null);
  const lastSavedData = useRef(null);

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load specific client if provided
  useEffect(() => {
    if (initialClientId) {
      loadClient(initialClientId);
    }
  }, [initialClientId]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback((data) => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(async () => {
      if (currentScenario && data) {
        try {
          await scenarioAPI.updateScenario(currentScenario.id, data);
          lastSavedData.current = data;
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [currentScenario]);

  // Load all clients
  const loadClients = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await clientAPI.getClients();
      if (result.success) {
        setClients(result.clients);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific client and their default scenario
  const loadClient = async (clientId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await clientAPI.getClient(clientId);
      if (result.success) {
        setCurrentClient(result.client);
        
        // Load default scenario for this client
        if (result.client.scenarios && result.client.scenarios.length > 0) {
          const defaultScenario = result.client.scenarios.find(s => s.isDefault) || result.client.scenarios[0];
          setCurrentScenario(defaultScenario);
          lastSavedData.current = {
            taxpayerData: defaultScenario.taxpayerData,
            spouseData: defaultScenario.spouseData,
            incomeSources: defaultScenario.incomeSources,
            assets: defaultScenario.assets,
            deductions: defaultScenario.deductions,
            settings: defaultScenario.settings
          };
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load client');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new client
  const createClient = async (clientData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await clientAPI.createClient(clientData);
      if (result.success) {
        setCurrentClient(result.client);
        
        // Create default scenario for new client
        const scenarioResult = await scenarioAPI.createScenario({
          clientId: result.client.id,
          name: 'Default Scenario',
          description: 'Initial tax planning scenario'
        });
        
        if (scenarioResult.success) {
          setCurrentScenario(scenarioResult.scenario);
        }
        
        // Refresh clients list
        await loadClients();
        
        return { success: true, client: result.client };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to create client');
      return { success: false, error: 'Failed to create client' };
    } finally {
      setIsLoading(false);
    }
  };

  // Update client information
  const updateClient = async (clientId, updates) => {
    try {
      const result = await clientAPI.updateClient(clientId, updates);
      if (result.success) {
        setCurrentClient(result.client);
        
        // Update in clients list
        setClients(prev => prev.map(client => 
          client.id === clientId ? result.client : client
        ));
        
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Failed to update client');
      return { success: false, error: 'Failed to update client' };
    }
  };

  // Update scenario data (triggers auto-save)
  const updateScenarioData = useCallback((updates) => {
    if (!currentScenario) return;

    const newData = {
      ...lastSavedData.current,
      ...updates
    };

    setHasUnsavedChanges(true);
    scheduleAutoSave(newData);
  }, [currentScenario, scheduleAutoSave]);

  // Update taxpayer data
  const updateTaxpayerData = useCallback((updates) => {
    updateScenarioData({
      taxpayerData: {
        ...lastSavedData.current?.taxpayerData,
        ...updates
      }
    });
  }, [updateScenarioData]);

  // Update spouse data
  const updateSpouseData = useCallback((updates) => {
    updateScenarioData({
      spouseData: {
        ...lastSavedData.current?.spouseData,
        ...updates
      }
    });
  }, [updateScenarioData]);

  // Update income sources
  const updateIncomeSources = useCallback((incomeSources) => {
    updateScenarioData({ incomeSources });
  }, [updateScenarioData]);

  // Update assets
  const updateAssets = useCallback((assets) => {
    updateScenarioData({ assets });
  }, [updateScenarioData]);

  // Update deductions
  const updateDeductions = useCallback((deductions) => {
    updateScenarioData({ deductions });
  }, [updateScenarioData]);

  // Update settings
  const updateSettings = useCallback((settings) => {
    updateScenarioData({ settings });
  }, [updateScenarioData]);

  // Force save (manual save)
  const forceSave = async () => {
    if (currentScenario && lastSavedData.current) {
      try {
        setIsLoading(true);
        await scenarioAPI.updateScenario(currentScenario.id, lastSavedData.current);
        setHasUnsavedChanges(false);
        return { success: true };
      } catch (error) {
        setError('Failed to save changes');
        return { success: false, error: 'Failed to save changes' };
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Clear current client/scenario
  const clearCurrentClient = () => {
    setCurrentClient(null);
    setCurrentScenario(null);
    setHasUnsavedChanges(false);
    lastSavedData.current = null;
    
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  return {
    // State
    currentClient,
    currentScenario,
    clients,
    isLoading,
    error,
    hasUnsavedChanges,
    
    // Actions
    loadClients,
    loadClient,
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
    
    // Utilities
    setError: (error) => setError(error),
    clearError: () => setError(null),
  };
};

