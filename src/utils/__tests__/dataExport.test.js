import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  clientToCSV, 
  clientsToCSV, 
  csvToClient,
  createBackup,
  restoreFromBackup
} from '../dataExport.js';

describe('Data Export Utilities', () => {
  // Sample client data for testing
  const sampleClient = {
    id: 'client1',
    profile: {
      clientName: 'Test Client',
      primaryContact: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      clientType: 'individual',
      riskProfile: 'moderate',
      createdDate: '2025-01-01T00:00:00.000Z',
      lastModified: '2025-01-02T00:00:00.000Z',
      isActive: true,
      isArchived: false,
      planningGoals: ['Retirement', 'Education'],
      tags: ['VIP', 'New Client']
    },
    scenarios: [
      {
        id: 'scenario1',
        name: 'Base Scenario',
        description: 'Current financial situation',
        isActive: true,
        createdDate: '2025-01-01T00:00:00.000Z',
        lastModified: '2025-01-01T00:00:00.000Z'
      }
    ],
    notes: [
      {
        id: 'note1',
        title: 'Initial Meeting',
        content: 'Discussed retirement goals',
        author: 'Advisor',
        createdDate: '2025-01-01T00:00:00.000Z',
        lastModified: '2025-01-01T00:00:00.000Z'
      }
    ],
    actionItems: [
      {
        id: 'action1',
        title: 'Review 401(k) Options',
        description: 'Evaluate current 401(k) allocation',
        status: 'pending',
        priority: 'high',
        dueDate: '2025-02-01T00:00:00.000Z',
        assignedTo: 'Advisor',
        createdDate: '2025-01-01T00:00:00.000Z',
        completedDate: null
      }
    ]
  };
  
  describe('clientToCSV', () => {
    it('should convert client data to CSV format', () => {
      const csvContent = clientToCSV(sampleClient, true);
      
      // Check that CSV content is a string
      expect(typeof csvContent).toBe('string');
      
      // Check that CSV contains client name
      expect(csvContent).toContain('Test Client');
      
      // Check that CSV contains scenario data when includeScenarios is true
      expect(csvContent).toContain('Base Scenario');
      
      // Check that CSV contains notes
      expect(csvContent).toContain('Initial Meeting');
      
      // Check that CSV contains action items
      expect(csvContent).toContain('Review 401(k) Options');
    });
    
    it('should exclude scenario data when includeScenarios is false', () => {
      const csvContent = clientToCSV(sampleClient, false);
      
      // Check that CSV content is a string
      expect(typeof csvContent).toBe('string');
      
      // Check that CSV contains client name
      expect(csvContent).toContain('Test Client');
      
      // Check that CSV does not contain the Scenarios section
      expect(csvContent).not.toContain('# Scenarios');
    });
    
    it('should handle empty client data', () => {
      const csvContent = clientToCSV(null);
      expect(csvContent).toBe('');
    });
  });
  
  describe('clientsToCSV', () => {
    it('should convert multiple clients to CSV format', () => {
      const clients = [
        sampleClient,
        {
          id: 'client2',
          profile: {
            clientName: 'Another Client',
            primaryContact: 'Jane Smith',
            email: 'jane@example.com',
            clientType: 'business',
            isActive: true,
            isArchived: false
          },
          scenarios: [],
          notes: [],
          actionItems: []
        }
      ];
      
      const csvContent = clientsToCSV(clients);
      
      // Check that CSV content is a string
      expect(typeof csvContent).toBe('string');
      
      // Check that CSV contains both client names
      expect(csvContent).toContain('Test Client');
      expect(csvContent).toContain('Another Client');
      
      // Check that CSV contains header row
      expect(csvContent).toContain('clientName,primaryContact,email');
    });
    
    it('should handle empty clients array', () => {
      const csvContent = clientsToCSV([]);
      expect(csvContent).toBe('');
    });
  });
  
  describe('csvToClient', () => {
    it('should convert CSV data back to client object', () => {
      // First convert client to CSV
      const csvContent = clientToCSV(sampleClient, true);
      
      // Then convert CSV back to client
      const parsedClient = csvToClient(csvContent);
      
      // Check that basic client data was preserved
      expect(parsedClient.profile.clientName).toBe('Test Client');
      expect(parsedClient.profile.primaryContact).toBe('John Doe');
      
      // Check that nested address data was preserved
      expect(parsedClient.profile.address.street).toBe('123 Main St');
      expect(parsedClient.profile.address.city).toBe('Anytown');
      
      // Check that arrays were preserved
      expect(parsedClient.profile.planningGoals).toContain('Retirement');
      expect(parsedClient.profile.planningGoals).toContain('Education');
      
      // Check that scenarios were preserved
      expect(parsedClient.scenarios.length).toBeGreaterThan(0);
      expect(parsedClient.scenarios[0].name).toBe('Base Scenario');
      
      // Check that notes were preserved
      expect(parsedClient.notes.length).toBeGreaterThan(0);
      expect(parsedClient.notes[0].title).toBe('Initial Meeting');
      
      // Check that action items were preserved
      expect(parsedClient.actionItems.length).toBeGreaterThan(0);
      expect(parsedClient.actionItems[0].title).toBe('Review 401(k) Options');
    });
    
    it('should handle empty CSV data', () => {
      const parsedClient = csvToClient('');
      expect(parsedClient).toBeNull();
    });
  });
  
  describe('createBackup and restoreFromBackup', () => {
    it('should create a backup with metadata', () => {
      const clients = [sampleClient];
      const backup = createBackup(clients);
      
      // Check that backup has metadata
      expect(backup.metadata).toBeDefined();
      expect(backup.metadata.version).toBeDefined();
      expect(backup.metadata.timestamp).toBeDefined();
      expect(backup.metadata.clientCount).toBe(1);
      
      // Check that backup has clients
      expect(backup.clients).toEqual(clients);
    });
    
    it('should restore clients from backup', () => {
      const clients = [sampleClient];
      const backup = createBackup(clients);
      
      const restoredClients = restoreFromBackup(backup);
      
      // Check that restored clients match original clients
      expect(restoredClients).toEqual(clients);
    });
    
    it('should handle invalid backup data', () => {
      const restoredClients = restoreFromBackup(null);
      expect(restoredClients).toBeNull();
      
      const restoredClients2 = restoreFromBackup({});
      expect(restoredClients2).toBeNull();
      
      const restoredClients3 = restoreFromBackup({ clients: 'not an array' });
      expect(restoredClients3).toBeNull();
    });
  });
});

