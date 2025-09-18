import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/api'; // Import the Supabase client directly

// Custom hook for managing client data with auto-save functionality
export const useClientData = () => {
  const [currentClient, setCurrentClient] = useState(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save timer ref
  const autoSaveTimer = useRef(null);
  const lastSavedScenarioData = useRef(null);

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  // Auto-save functionality
  const scheduleAutoSave = useCallback((data) => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(async () => {
      if (currentScenario && data) {
        try {
          // Update the current scenario in Supabase
          const { data: updatedScenario, error: updateError } = await supabase
            .from('scenarios')
            .update(data)
            .eq('id', currentScenario.id)
            .select();

          if (updateError) throw updateError;

          lastSavedScenarioData.current = data;
          setHasUnsavedChanges(false);
          // Optionally, update currentScenario state if needed
          // setCurrentScenario(prev => ({ ...prev, ...updatedScenario[0] }));
        } catch (error) {
          console.error('Auto-save failed:', error);
          setError('Auto-save failed: ' + error.message);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [currentScenario]);

  // Load all clients
  const loadClients = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*'); // Select all columns for clients

      if (fetchError) throw fetchError;

      setClients(data || []);
    } catch (error) {
      setError('Failed to load clients: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Select a client and load its default scenario
  const selectClient = async (clientId) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      // Fetch scenarios for the selected client
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('client_id', clientId);

      if (scenariosError) throw scenariosError;

      const clientWithScenarios = { ...clientData, scenarios: scenariosData || [] };
      setCurrentClient(clientWithScenarios);

      // Load default scenario for this client
      if (clientWithScenarios.scenarios && clientWithScenarios.scenarios.length > 0) {
        const defaultScenario = clientWithScenarios.scenarios.find(s => s.is_default) || clientWithScenarios.scenarios[0];
        setCurrentScenario(defaultScenario);
        lastSavedScenarioData.current = {
          taxpayer_data: defaultScenario.taxpayer_data,
          spouse_data: defaultScenario.spouse_data,
          income_sources: defaultScenario.income_sources,
          assets: defaultScenario.assets,
          deductions: defaultScenario.deductions,
          settings: defaultScenario.settings
        };
      } else {
        setCurrentScenario(null);
        lastSavedScenarioData.current = null;
      }
    } catch (error) {
      setError('Failed to load client: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new client
  const createClient = async (clientData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Ensure user_id is set for RLS
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;
      if (userError || !user) throw new Error('User not authenticated');

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({ ...clientData, user_id: user.id })
        .select()
        .single();

      if (createError) throw createError;

      // Create default scenario for new client
      const { data: newScenario, error: scenarioError } = await supabase
        .from('scenarios')
        .insert({
          client_id: newClient.id,
          name: 'Default Scenario',
          description: 'Initial tax planning scenario',
          is_default: true,
          taxpayer_data: {},
          spouse_data: {},
          income_sources: [],
          assets: [],
          deductions: {},
          settings: {},
        })
        .select()
        .single();

      if (scenarioError) throw scenarioError;

      const clientWithScenarios = { ...newClient, scenarios: [newScenario] };
      setCurrentClient(clientWithScenarios);
      setCurrentScenario(newScenario);
      lastSavedScenarioData.current = {
        taxpayer_data: newScenario.taxpayer_data,
        spouse_data: newScenario.spouse_data,
        income_sources: newScenario.income_sources,
        assets: newScenario.assets,
        deductions: newScenario.deductions,
        settings: newScenario.settings
      };

      // Refresh clients list
      await loadClients();

      return { success: true, client: clientWithScenarios };
    } catch (error) {
      setError('Failed to create client: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Update client information
  const updateClient = async (clientId, updates) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (updateError) throw updateError;

      setCurrentClient(prev => prev && prev.id === clientId ? { ...prev, ...updatedClient } : prev);

      // Update in clients list
      setClients(prev => prev.map(client =>
        client.id === clientId ? updatedClient : client
      ));

      return { success: true };
    } catch (error) {
      setError('Failed to update client: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete client
  const deleteClient = async (clientId) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (deleteError) throw deleteError;

      // Clear current client if deleted
      if (currentClient?.id === clientId) {
        clearCurrentClient();
      }
      await loadClients(); // Refresh client list
      return { success: true };
    } catch (error) {
      setError('Failed to delete client: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Select a scenario
  const selectScenario = (scenarioId) => {
    if (currentClient && currentClient.scenarios) {
      const scenario = currentClient.scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        setCurrentScenario(scenario);
        lastSavedScenarioData.current = {
          taxpayer_data: scenario.taxpayer_data,
          spouse_data: scenario.spouse_data,
          income_sources: scenario.income_sources,
          assets: scenario.assets,
          deductions: scenario.deductions,
          settings: scenario.settings
        };
      }
    }
  };

  // Create new scenario
  const createScenario = async (scenarioData) => {
    if (!currentClient) {
      setError('No client selected to create a scenario for.');
      return { success: false, error: 'No client selected' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: newScenario, error: createError } = await supabase
        .from('scenarios')
        .insert({ ...scenarioData, client_id: currentClient.id })
        .select()
        .single();

      if (createError) throw createError;

      setCurrentClient(prev => ({ ...prev, scenarios: [...prev.scenarios, newScenario] }));
      setCurrentScenario(newScenario);
      return { success: true, scenario: newScenario };
    } catch (error) {
      setError('Failed to create scenario: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Update scenario
  const updateScenario = async (scenarioId, updates) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: updatedScenario, error: updateError } = await supabase
        .from('scenarios')
        .update(updates)
        .eq('id', scenarioId)
        .select()
        .single();

      if (updateError) throw updateError;

      setCurrentClient(prev => ({
        ...prev,
        scenarios: prev.scenarios.map(s => s.id === scenarioId ? updatedScenario : s)
      }));
      setCurrentScenario(updatedScenario);
      return { success: true };
    } catch (error) {
      setError('Failed to update scenario: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Delete scenario
  const deleteScenario = async (scenarioId) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', scenarioId);

      if (deleteError) throw deleteError;

      setCurrentClient(prev => ({
        ...prev,
        scenarios: prev.scenarios.filter(s => s.id !== scenarioId)
      }));
      if (currentScenario?.id === scenarioId) {
        setCurrentScenario(null); // Clear current scenario if deleted
      }
      return { success: true };
    } catch (error) {
      setError('Failed to delete scenario: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Update scenario data (triggers auto-save)
  const updateScenarioData = useCallback((updates) => {
    if (!currentScenario) return;

    const newData = {
      ...lastSavedScenarioData.current,
      ...updates
    };

    setHasUnsavedChanges(true);
    scheduleAutoSave(newData);
  }, [currentScenario, scheduleAutoSave]);

  // Update taxpayer data
  const updateTaxpayerData = useCallback((updates) => {
    updateScenarioData({
      taxpayer_data: {
        ...lastSavedScenarioData.current?.taxpayer_data,
        ...updates
      }
    });
  }, [updateScenarioData]);

  // Update spouse data
  const updateSpouseData = useCallback((updates) => {
    updateScenarioData({
      spouse_data: {
        ...lastSavedScenarioData.current?.spouse_data,
        ...updates
      }
    });
  }, [updateScenarioData]);

  // Update income sources
  const updateIncomeSources = useCallback((income_sources) => {
    updateScenarioData({ income_sources });
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
    if (currentScenario && lastSavedScenarioData.current) {
      try {
        setIsLoading(true);
        const { error: saveError } = await supabase
          .from('scenarios')
          .update(lastSavedScenarioData.current)
          .eq('id', currentScenario.id);

        if (saveError) throw saveError;

        setHasUnsavedChanges(false);
        return { success: true };
      } catch (error) {
        setError('Failed to save changes: ' + error.message);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    }
    return { success: false, error: 'No current scenario or data to save.' };
  };

  // Clear current client/scenario
  const clearCurrentClient = () => {
    setCurrentClient(null);
    setCurrentScenario(null);
    setHasUnsavedChanges(false);
    lastSavedScenarioData.current = null;

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
    selectClient,
    createClient,
    updateClient,
    deleteClient,
    selectScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    updateTaxpayerData,
    updateSpouseData,
    updateIncomeSources,
    updateAssets,
    updateDeductions,
    updateSettings,
    forceSave,
    clearCurrentClient,

    // Utilities
    setError: (msg) => setError(msg),
    clearError: () => setError(null),
  };
};


