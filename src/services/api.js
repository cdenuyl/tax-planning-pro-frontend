// API service layer for Tax Planning Application
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;



export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication API (using Supabase Auth)
export const authAPI = {
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  getProfile: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      const user = data?.user || null;
      return { success: true, user };
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, error: error.message };
    }
  },

  register: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Client API (using Supabase PostgREST)
export const clientAPI = {
  getClients: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true, clients: data };
    } catch (error) {
      console.error('Get clients error:', error);
      return { success: false, error: error.message };
    }
  },

  getClient: async (clientId) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return { success: true, client: data };
    } catch (error) {
      console.error('Get client error:', error);
      return { success: false, error: error.message };
    }
  },

  createClient: async (clientData) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select();
      if (error) throw error;
      return { success: true, client: data[0] };
    } catch (error) {
      console.error('Create client error:', error);
      return { success: false, error: error.message };
    }
  },

  updateClient: async (clientId, updates) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select();
      if (error) throw error;
      return { success: true, client: data[0] };
    } catch (error) {
      console.error('Update client error:', error);
      return { success: false, error: error.message };
    }
  },

  deleteClient: async (clientId) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete client error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Scenario API (using Supabase PostgREST)
export const scenarioAPI = {
  getScenario: async (scenarioId) => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();
      if (error) throw error;
      return { success: true, scenario: data };
    } catch (error) {
      console.error('Get scenario error:', error);
      return { success: false, error: error.message };
    }
  },

  createScenario: async (scenarioData) => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .insert([scenarioData])
        .select();
      if (error) throw error;
      return { success: true, scenario: data[0] };
    } catch (error) {
      console.error('Create scenario error:', error);
      return { success: false, error: error.message };
    }
  },

  updateScenario: async (scenarioId, updates) => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .update(updates)
        .eq('id', scenarioId)
        .select();
      if (error) throw error;
      return { success: true, scenario: data[0] };
    } catch (error) {
      console.error('Update scenario error:', error);
      return { success: false, error: error.message };
    }
  },

  setDefaultScenario: async (scenarioId) => {
    // This logic might need to be implemented as a Supabase Function or a more complex update
    // For now, it's a placeholder.
    console.warn('setDefaultScenario not fully implemented for Supabase.');
    return { success: false, error: 'Not implemented' };
  },

  deleteScenario: async (scenarioId) => {
    try {
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', scenarioId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete scenario error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Utility functions
export const apiUtils = {
  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  },

  clearAuth: async () => {
    await supabase.auth.signOut();
  },

  healthCheck: async () => {
    // Supabase is a managed service, so a direct health check isn't typically needed
    // We can check if the client is initialized.
    if (supabaseUrl && supabaseAnonKey) {
      return { success: true, status: 'Supabase client initialized' };
    } else {
      return { success: false, error: 'Supabase client not configured' };
    }
  }
};

export default supabase;


