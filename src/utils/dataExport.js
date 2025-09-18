/**
 * Data Export Utilities
 * This module provides functions for exporting client data to various formats
 * including CSV, Excel, and PDF.
 */

/**
 * Generate a unique client ID
 * @returns {string} A unique client ID
 */
export const generateClientId = () => {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert client data to CSV format
 * @param {Object} client - Client data object
 * @param {boolean} includeScenarios - Whether to include scenario data
 * @returns {string} CSV content
 */
export const clientToCSV = (client, includeScenarios = true) => {
  if (!client || !client.profile) return '';
  
  // Extract client profile data
  const { profile } = client;
  
  // Create CSV header row
  const headers = [
    'clientName',
    'primaryContact',
    'email',
    'phone',
    'birthdate',
    'clientType',
    'street',
    'city',
    'state',
    'zipCode',
    'riskProfile',
    'planningGoals',
    'tags',
    'institution',
    'isArchived'
  ];
  
  // Create CSV data row
  const data = [
    profile.clientName || '',
    profile.primaryContact || '',
    profile.email || '',
    profile.phone || '',
    profile.birthdate || '',
    profile.clientType || 'individual',
    profile.street || '',
    profile.city || '',
    profile.state || '',
    profile.zipCode || '',
    profile.riskProfile || '',
    Array.isArray(profile.planningGoals) ? profile.planningGoals.join(',') : '',
    Array.isArray(profile.tags) ? profile.tags.join(',') : '',
    profile.institution || '',
    profile.isArchived ? 'true' : 'false'
  ];
  
  // Convert to CSV
  const headerRow = headers.join(',');
  const dataRow = data.map(value => {
    // Escape commas and quotes
    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(',');
  
  return `${headerRow}\n${dataRow}`;
};

/**
 * Convert multiple clients to CSV format
 * @param {Array} clients - Array of client data objects
 * @returns {string} CSV content
 */
export const clientsToCSV = (clients) => {
  if (!Array.isArray(clients) || clients.length === 0) return '';
  
  // Extract client profile data
  const headers = [
    'clientName',
    'primaryContact',
    'email',
    'phone',
    'clientType',
    'street',
    'city',
    'state',
    'zipCode',
    'riskProfile',
    'planningGoals',
    'tags',
    'institution',
    'isArchived'
  ];
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create CSV data rows
  const dataRows = clients.map(client => {
    const { profile } = client;
    
    if (!profile) return '';
    
    const data = [
      profile.clientName || '',
      profile.primaryContact || '',
      profile.email || '',
      profile.phone || '',
      profile.clientType || 'individual',
      profile.street || '',
      profile.city || '',
      profile.state || '',
      profile.zipCode || '',
      profile.riskProfile || '',
      Array.isArray(profile.planningGoals) ? profile.planningGoals.join(';') : '',
      Array.isArray(profile.tags) ? profile.tags.join(';') : '',
      profile.institution || '',
      profile.isArchived ? 'true' : 'false'
    ];
    
    return data.map(value => {
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  }).join('\n');
  
  return `${headerRow}\n${dataRows}`;
};

/**
 * Download CSV content as a file
 * @param {string} csvContent - CSV content
 * @param {string} fileName - File name
 */
export const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, fileName);
  } else {
    // Other browsers
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Convert client data to Excel format and download
 * @param {Object} client - Client data object
 * @param {boolean} includeScenarios - Whether to include scenario data
 */
export const clientToExcel = (client, includeScenarios = true) => {
  // For now, we'll use CSV as a fallback since Excel generation requires additional libraries
  const csvContent = clientToCSV(client, includeScenarios);
  const fileName = `${client.profile.clientName.replace(/\s+/g, '_')}_export.csv`;
  downloadCSV(csvContent, fileName);
};

/**
 * Convert CSV content to client data objects (supports multiple clients)
 * @param {string} csvContent - CSV content
 * @returns {Array} Array of client data objects
 */
export const csvToClients = (csvContent) => {
  if (!csvContent) return [];
  
  // Split CSV content into lines
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header row
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  const clients = [];
  
  // Process each data row (skip header)
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const dataRow = lines[lineIndex];
    if (!dataRow.trim()) continue; // Skip empty lines
    
    const values = [];
    let inQuotes = false;
    let currentValue = '';
    
    // Parse CSV values handling quoted values with commas
    for (let i = 0; i < dataRow.length; i++) {
      const char = dataRow[i];
      
      if (char === '"') {
        if (inQuotes && dataRow[i + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue);
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue);
    
    // Create client object from headers and values
    const clientData = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        let value = values[index];
        
        // Convert special values
        if (header === 'planningGoals' || header === 'tags') {
          value = value ? value.split(',').map(item => item.trim()) : [];
        } else if (header === 'isArchived') {
          value = value.toLowerCase() === 'true';
        }
        
        clientData[header] = value;
      }
    });
    
    // Create client object structure
    if (clientData.clientName) { // Only add if client has a name
      const newClient = {
        profile: clientData
      };
      
      // Auto-assign branding if institution is provided
      if (clientData.institution) {
        // Import branding functions
        try {
          const { findMatchingLogo, findMatchingDisclosure } = require('./brandingManagement.js');
          const matchingLogo = findMatchingLogo(clientData.institution);
          const matchingDisclosure = findMatchingDisclosure(clientData.institution);
          
          if (matchingLogo || matchingDisclosure) {
            newClient.branding = {
              logoId: matchingLogo?.id || null,
              disclosureId: matchingDisclosure?.id || null,
              autoAssigned: true,
              manualOverride: false,
              lastUpdated: new Date().toISOString()
            };
          }
        } catch (error) {
          // Branding functions not available, continue without auto-assignment
          console.log('Branding auto-assignment not available during import');
        }
      }
      
      clients.push(newClient);
    }
  }
  
  return clients;
};

/**
 * Convert CSV content to client data object (legacy function for single client)
 * @param {string} csvContent - CSV content
 * @returns {Object} Client data object
 */
export const csvToClient = (csvContent) => {
  const clients = csvToClients(csvContent);
  return clients.length > 0 ? clients[0] : null;
};

/**
 * Create a backup of client data
 * @param {Array} clients - Array of client data objects
 * @returns {string} JSON string of backup data
 */
export const createBackup = (clients) => {
  const backupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    clients: clients
  };
  
  return JSON.stringify(backupData, null, 2);
};

/**
 * Download backup data as a file
 * @param {string} backupData - JSON string of backup data
 * @param {string} fileName - File name
 */
export const downloadBackup = (backupData, fileName) => {
  const blob = new Blob([backupData], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, fileName);
  } else {
    // Other browsers
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Restore client data from backup
 * @param {Object} backupData - Backup data object
 * @returns {Array} Array of client data objects
 */
export const restoreFromBackup = (backupData) => {
  if (!backupData || !backupData.clients || !Array.isArray(backupData.clients)) {
    throw new Error('Invalid backup data');
  }
  
  return backupData.clients;
};

