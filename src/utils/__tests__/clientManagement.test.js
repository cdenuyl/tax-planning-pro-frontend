import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  saveClient, 
  loadClient, 
  saveAllClients, 
  loadAllClients,
  createClient,
  updateClient,
  deleteClient,
  archiveClient,
  unarchiveClient,
  createScenario,
  updateScenario,
  deleteScenario,
  setActiveScenario
} from '../clientManagement.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((i) => Object.keys(store)[i] || null),
    length: vi.fn(() => Object.keys(store).length),
    _getStore: () => store
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Client Management Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  describe('saveClient and loadClient', () => {
    it('should save and load a client', () => {
      const client = {
        id: 'client1',
        profile: {
          clientName: 'Test Client',
          primaryContact: 'John Doe'
        }
      };
      
      saveClient(client);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'client_client1',
        expect.any(String)
      );
      
      // Reset the mock to check loadClient
      vi.clearAllMocks();
      
      const loadedClient = loadClient('client1');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('client_client1');
      expect(loadedClient).toEqual(client);
    });
    
    it('should return null when loading a non-existent client', () => {
      const loadedClient = loadClient('nonexistent');
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('client_nonexistent');
      expect(loadedClient).toBeNull();
    });
  });
  
  describe('saveAllClients and loadAllClients', () => {
    it('should save and load all clients', () => {
      const clients = [
        {
          id: 'client1',
          profile: {
            clientName: 'Test Client 1',
            primaryContact: 'John Doe'
          }
        },
        {
          id: 'client2',
          profile: {
            clientName: 'Test Client 2',
            primaryContact: 'Jane Smith'
          }
        }
      ];
      
      saveAllClients(clients);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'client_list',
        expect.any(String)
      );
      
      // Reset the mock to check loadAllClients
      vi.clearAllMocks();
      
      const loadedClients = loadAllClients();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('client_list');
      expect(loadedClients).toEqual(clients);
    });
    
    it('should return an empty array when no clients exist', () => {
      const loadedClients = loadAllClients();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('client_list');
      expect(loadedClients).toEqual([]);
    });
  });
  
  describe('createClient', () => {
    it('should create a new client with default values', () => {
      const profile = {
        clientName: 'New Client',
        primaryContact: 'New Contact'
      };
      
      const newClient = createClient(profile);
      
      expect(newClient).toEqual({
        id: expect.any(String),
        profile: {
          ...profile,
          createdDate: expect.any(String),
          lastModified: expect.any(String),
          isActive: true,
          isArchived: false
        },
        scenarios: [],
        notes: [],
        actionItems: [],
        documents: []
      });
    });
    
    it('should create a client with provided ID if specified', () => {
      const profile = {
        clientName: 'New Client',
        primaryContact: 'New Contact'
      };
      
      const newClient = createClient(profile, 'custom-id');
      
      expect(newClient.id).toBe('custom-id');
    });
  });
  
  describe('updateClient', () => {
    it('should update an existing client', () => {
      // First create and save a client
      const originalClient = createClient({
        clientName: 'Original Name',
        primaryContact: 'Original Contact'
      });
      
      saveClient(originalClient);
      
      // Update the client
      const updatedProfile = {
        clientName: 'Updated Name',
        primaryContact: 'Updated Contact'
      };
      
      const updatedClient = updateClient(originalClient.id, updatedProfile);
      
      expect(updatedClient.profile.clientName).toBe('Updated Name');
      expect(updatedClient.profile.primaryContact).toBe('Updated Contact');
      expect(updatedClient.profile.lastModified).not.toBe(originalClient.profile.lastModified);
      
      // Check that it was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `client_${originalClient.id}`,
        expect.any(String)
      );
    });
    
    it('should return null when updating a non-existent client', () => {
      const updatedClient = updateClient('nonexistent', {
        clientName: 'Updated Name'
      });
      
      expect(updatedClient).toBeNull();
    });
  });
  
  describe('deleteClient', () => {
    it('should delete a client', () => {
      // First create and save a client
      const client = createClient({
        clientName: 'Test Client',
        primaryContact: 'Test Contact'
      });
      
      saveClient(client);
      
      // Also save to client list
      saveAllClients([client]);
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Delete the client
      const result = deleteClient(client.id);
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(`client_${client.id}`);
      
      // Check that it was removed from the client list
      const clientList = loadAllClients();
      expect(clientList).toEqual([]);
    });
    
    it('should return false when deleting a non-existent client', () => {
      const result = deleteClient('nonexistent');
      
      expect(result).toBe(false);
    });
  });
  
  describe('archiveClient and unarchiveClient', () => {
    it('should archive a client', () => {
      // First create and save a client
      const client = createClient({
        clientName: 'Test Client',
        primaryContact: 'Test Contact'
      });
      
      saveClient(client);
      
      // Archive the client
      const archivedClient = archiveClient(client.id);
      
      expect(archivedClient.profile.isArchived).toBe(true);
      
      // Check that it was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `client_${client.id}`,
        expect.any(String)
      );
    });
    
    it('should unarchive a client', () => {
      // First create, archive, and save a client
      const client = createClient({
        clientName: 'Test Client',
        primaryContact: 'Test Contact'
      });
      
      client.profile.isArchived = true;
      saveClient(client);
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Unarchive the client
      const unarchivedClient = unarchiveClient(client.id);
      
      expect(unarchivedClient.profile.isArchived).toBe(false);
      
      // Check that it was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `client_${client.id}`,
        expect.any(String)
      );
    });
  });
  
  describe('Scenario Management', () => {
    let client;
    
    beforeEach(() => {
      // Create a client with no scenarios
      client = createClient({
        clientName: 'Test Client',
        primaryContact: 'Test Contact'
      });
      
      saveClient(client);
    });
    
    it('should create a scenario', () => {
      const scenarioData = {
        name: 'Test Scenario',
        description: 'Test Description'
      };
      
      const updatedClient = createScenario(client.id, scenarioData);
      
      expect(updatedClient.scenarios).toHaveLength(1);
      expect(updatedClient.scenarios[0].name).toBe('Test Scenario');
      expect(updatedClient.scenarios[0].description).toBe('Test Description');
      expect(updatedClient.scenarios[0].isActive).toBe(true); // First scenario should be active
      
      // Check that it was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `client_${client.id}`,
        expect.any(String)
      );
    });
    
    it('should update a scenario', () => {
      // First create a scenario
      const clientWithScenario = createScenario(client.id, {
        name: 'Original Scenario',
        description: 'Original Description'
      });
      
      const scenarioId = clientWithScenario.scenarios[0].id;
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Update the scenario
      const updatedClient = updateScenario(client.id, scenarioId, {
        name: 'Updated Scenario',
        description: 'Updated Description'
      });
      
      expect(updatedClient.scenarios[0].name).toBe('Updated Scenario');
      expect(updatedClient.scenarios[0].description).toBe('Updated Description');
      
      // Check that it was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `client_${client.id}`,
        expect.any(String)
      );
    });
    
    it('should delete a scenario', () => {
      // First create two scenarios
      let clientWithScenarios = createScenario(client.id, {
        name: 'Scenario 1',
        description: 'Description 1'
      });
      
      clientWithScenarios = createScenario(clientWithScenarios.id, {
        name: 'Scenario 2',
        description: 'Description 2'
      });
      
      const scenarioId = clientWithScenarios.scenarios[1].id;
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Delete the second scenario
      const updatedClient = deleteScenario(client.id, scenarioId);
      
      expect(updatedClient.scenarios).toHaveLength(1);
      expect(updatedClient.scenarios[0].name).toBe('Scenario 1');
      
      // Check that it was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `client_${client.id}`,
        expect.any(String)
      );
    });
    
    it('should set a scenario as active', () => {
      // First create two scenarios
      let clientWithScenarios = createScenario(client.id, {
        name: 'Scenario 1',
        description: 'Description 1'
      });
      
      clientWithScenarios = createScenario(clientWithScenarios.id, {
        name: 'Scenario 2',
        description: 'Description 2'
      });
      
      const scenario1Id = clientWithScenarios.scenarios[0].id;
      const scenario2Id = clientWithScenarios.scenarios[1].id;
      
      // By default, the first scenario should be active
      expect(clientWithScenarios.scenarios[0].isActive).toBe(true);
      expect(clientWithScenarios.scenarios[1].isActive).toBe(false);
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Set the second scenario as active
      const updatedClient = setActiveScenario(client.id, scenario2Id);
      
      expect(updatedClient.scenarios[0].isActive).toBe(false);
      expect(updatedClient.scenarios[1].isActive).toBe(true);
      
      // Check that it was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `client_${client.id}`,
        expect.any(String)
      );
    });
  });
});

