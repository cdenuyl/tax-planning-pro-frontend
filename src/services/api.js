// API service layer for Tax Planning Application
import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://tax-planning-pro-api.vercel.app' 
  : 'http://localhost:3001';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token management
let authToken = localStorage.getItem('authToken');
let refreshToken = localStorage.getItem('refreshToken');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken: refreshToken
        });

        const { token } = response.data;
        authToken = token;
        localStorage.setItem('authToken', token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken: newRefreshToken, user } = response.data;
      
      authToken = token;
      refreshToken = newRefreshToken;
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user, token };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authToken = null;
      refreshToken = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Get profile error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get profile' 
      };
    }
  },

  // Register new user (admin only)
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  }
};

// Client API
export const clientAPI = {
  // Get all clients
  getClients: async (params = {}) => {
    try {
      const response = await api.get('/clients', { params });
      return { 
        success: true, 
        clients: response.data.clients,
        pagination: response.data.pagination 
      };
    } catch (error) {
      console.error('Get clients error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get clients' 
      };
    }
  },

  // Get single client
  getClient: async (clientId) => {
    try {
      const response = await api.get(`/clients/${clientId}`);
      return { success: true, client: response.data.client };
    } catch (error) {
      console.error('Get client error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get client' 
      };
    }
  },

  // Create new client
  createClient: async (clientData) => {
    try {
      const response = await api.post('/clients', clientData);
      return { success: true, client: response.data.client };
    } catch (error) {
      console.error('Create client error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create client' 
      };
    }
  },

  // Update client
  updateClient: async (clientId, updates) => {
    try {
      const response = await api.patch(`/clients/${clientId}`, updates);
      return { success: true, client: response.data.client };
    } catch (error) {
      console.error('Update client error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update client' 
      };
    }
  },

  // Delete client
  deleteClient: async (clientId) => {
    try {
      await api.delete(`/clients/${clientId}`);
      return { success: true };
    } catch (error) {
      console.error('Delete client error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to delete client' 
      };
    }
  }
};

// Scenario API
export const scenarioAPI = {
  // Get scenario
  getScenario: async (scenarioId) => {
    try {
      const response = await api.get(`/scenarios/${scenarioId}`);
      return { success: true, scenario: response.data.scenario };
    } catch (error) {
      console.error('Get scenario error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get scenario' 
      };
    }
  },

  // Create scenario
  createScenario: async (scenarioData) => {
    try {
      const response = await api.post('/scenarios', scenarioData);
      return { success: true, scenario: response.data.scenario };
    } catch (error) {
      console.error('Create scenario error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to create scenario' 
      };
    }
  },

  // Update scenario (auto-save)
  updateScenario: async (scenarioId, updates) => {
    try {
      const response = await api.patch(`/scenarios/${scenarioId}`, updates);
      return { success: true, scenario: response.data.scenario };
    } catch (error) {
      console.error('Update scenario error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update scenario' 
      };
    }
  },

  // Set default scenario
  setDefaultScenario: async (scenarioId) => {
    try {
      await api.patch(`/scenarios/${scenarioId}/set-default`);
      return { success: true };
    } catch (error) {
      console.error('Set default scenario error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to set default scenario' 
      };
    }
  },

  // Delete scenario
  deleteScenario: async (scenarioId) => {
    try {
      await api.delete(`/scenarios/${scenarioId}`);
      return { success: true };
    } catch (error) {
      console.error('Delete scenario error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to delete scenario' 
      };
    }
  }
};

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!authToken && !!localStorage.getItem('authToken');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  // Clear all auth data
  clearAuth: () => {
    authToken = null;
    refreshToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return { success: true, status: response.data };
    } catch (error) {
      console.error('Health check error:', error);
      return { success: false, error: 'Backend not available' };
    }
  }
};

export default api;

