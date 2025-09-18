import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateClientReport, 
  generateTaxSummaryReport, 
  generateScenarioComparisonReport 
} from '../pdfReports.js';

// Mock console.log to prevent output during tests
console.log = vi.fn();

describe('PDF Report Generation Utilities', () => {
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
        lastModified: '2025-01-01T00:00:00.000Z',
        results: {
          federalTax: 25000,
          stateTax: 5000,
          effectiveRate: 0.22,
          marginalRate: 0.32
        }
      },
      {
        id: 'scenario2',
        name: 'Retirement Scenario',
        description: 'Projected retirement situation',
        isActive: false,
        createdDate: '2025-01-01T00:00:00.000Z',
        lastModified: '2025-01-01T00:00:00.000Z',
        results: {
          federalTax: 15000,
          stateTax: 3000,
          effectiveRate: 0.15,
          marginalRate: 0.22
        }
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
  
  // Mock Blob for testing
  global.Blob = class Blob {
    constructor(content, options) {
      this.content = content;
      this.options = options;
      this.size = content.reduce((acc, val) => acc + val.length, 0);
      this.type = options.type;
    }
  };
  
  describe('generateClientReport', () => {
    it('should generate a client report', async () => {
      const options = {
        includeNotes: true,
        includeActionItems: true
      };
      
      const pdfBlob = await generateClientReport(sampleClient, options);
      
      // Check that a Blob was returned
      expect(pdfBlob).toBeInstanceOf(Blob);
      
      // Check that console.log was called with a message containing the client name
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test Client')
      );
    });
    
    it('should reject with an error for invalid client data', async () => {
      await expect(generateClientReport(null)).rejects.toThrow();
    });
  });
  
  describe('generateTaxSummaryReport', () => {
    it('should generate a tax summary report for the active scenario', async () => {
      const pdfBlob = await generateTaxSummaryReport(sampleClient);
      
      // Check that a Blob was returned
      expect(pdfBlob).toBeInstanceOf(Blob);
      
      // Check that console.log was called with a message containing the client name and scenario name
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test Client')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Base Scenario')
      );
    });
    
    it('should generate a tax summary report for a specific scenario', async () => {
      const scenario = sampleClient.scenarios[1]; // Retirement Scenario
      
      const pdfBlob = await generateTaxSummaryReport(sampleClient, scenario);
      
      // Check that a Blob was returned
      expect(pdfBlob).toBeInstanceOf(Blob);
      
      // Check that console.log was called with a message containing the client name and scenario name
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test Client')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retirement Scenario')
      );
    });
    
    it('should reject with an error for invalid client data', async () => {
      await expect(generateTaxSummaryReport(null)).rejects.toThrow();
    });
    
    it('should reject with an error when no active scenario is found', async () => {
      const clientWithNoActiveScenario = {
        ...sampleClient,
        scenarios: [
          {
            ...sampleClient.scenarios[0],
            isActive: false
          }
        ]
      };
      
      await expect(generateTaxSummaryReport(clientWithNoActiveScenario)).rejects.toThrow();
    });
  });
  
  describe('generateScenarioComparisonReport', () => {
    it('should generate a comparison report between two scenarios', async () => {
      const scenario1 = sampleClient.scenarios[0]; // Base Scenario
      const scenario2 = sampleClient.scenarios[1]; // Retirement Scenario
      
      const pdfBlob = await generateScenarioComparisonReport(sampleClient, scenario1, scenario2);
      
      // Check that a Blob was returned
      expect(pdfBlob).toBeInstanceOf(Blob);
      
      // Check that console.log was called with a message containing the client name and both scenario names
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test Client')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Base Scenario')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Retirement Scenario')
      );
    });
    
    it('should reject with an error for invalid input data', async () => {
      await expect(generateScenarioComparisonReport(null, null, null)).rejects.toThrow();
      
      const scenario1 = sampleClient.scenarios[0];
      const scenario2 = sampleClient.scenarios[1];
      
      await expect(generateScenarioComparisonReport(null, scenario1, scenario2)).rejects.toThrow();
      await expect(generateScenarioComparisonReport(sampleClient, null, scenario2)).rejects.toThrow();
      await expect(generateScenarioComparisonReport(sampleClient, scenario1, null)).rejects.toThrow();
    });
  });
});

