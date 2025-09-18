import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { generateClientId, getDefaultClientSettings, getClientTemplate } from '../utils/clientManagement.js';

const CRMImportModal = ({ isOpen, onClose, onImportClients }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Fields, 3: Preview, 4: Import
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [previewClients, setPreviewClients] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [selectedCRM, setSelectedCRM] = useState('smartoffice');
  const fileInputRef = useRef(null);
  
  const crmTemplates = {
    smartoffice: {
      name: 'SmartOffice by EBIX',
      description: 'Standard SmartOffice client export format',
      expectedFields: {
        'Client Name': 'clientName',
        'First Name': 'firstName',
        'Last Name': 'lastName',
        'Email': 'email',
        'Phone': 'phone',
        'Address': 'address',
        'City': 'city',
        'State': 'state',
        'Zip': 'zip',
        'Date of Birth': 'dateOfBirth',
        'SSN': 'ssn',
        'Marital Status': 'maritalStatus',
        'Spouse First Name': 'spouseFirstName',
        'Spouse Last Name': 'spouseLastName',
        'Spouse DOB': 'spouseDateOfBirth',
        'Advisor': 'advisorName',
        'Notes': 'notes'
      }
    },
    redtail: {
      name: 'Redtail CRM',
      description: 'Redtail CRM client export format',
      expectedFields: {
        'Name': 'clientName',
        'First': 'firstName',
        'Last': 'lastName',
        'Email1': 'email',
        'Phone1': 'phone',
        'Address1': 'address',
        'City': 'city',
        'State': 'state',
        'Zip': 'zip',
        'Birth Date': 'dateOfBirth',
        'Notes': 'notes'
      }
    },
    salesforce: {
      name: 'Salesforce',
      description: 'Salesforce contact export format',
      expectedFields: {
        'Name': 'clientName',
        'FirstName': 'firstName',
        'LastName': 'lastName',
        'Email': 'email',
        'Phone': 'phone',
        'MailingStreet': 'address',
        'MailingCity': 'city',
        'MailingState': 'state',
        'MailingPostalCode': 'zip',
        'Birthdate': 'dateOfBirth',
        'Description': 'notes'
      }
    },
    custom: {
      name: 'Custom CSV',
      description: 'Custom CSV format - manual field mapping',
      expectedFields: {}
    }
  };
  
  const requiredFields = ['clientName', 'firstName', 'lastName'];
  const optionalFields = ['email', 'phone', 'address', 'city', 'state', 'zip', 'dateOfBirth', 'spouseFirstName', 'spouseLastName', 'spouseDateOfBirth', 'advisorName', 'notes'];
  
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
    
    return { headers, data };
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, data } = parseCSV(text);
      
      setHeaders(headers);
      setCsvData(data);
      
      // Auto-map fields based on selected CRM template
      const template = crmTemplates[selectedCRM];
      const autoMapping = {};
      
      headers.forEach(header => {
        const mappedField = template.expectedFields[header];
        if (mappedField) {
          autoMapping[header] = mappedField;
        }
      });
      
      setFieldMapping(autoMapping);
      setStep(2);
    };
    reader.readAsText(file);
  };
  
  const handleFieldMappingChange = (csvField, targetField) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvField]: targetField
    }));
  };
  
  const generatePreview = () => {
    const clients = csvData.slice(0, 5).map((row, index) => {
      const client = {
        id: `preview_${index}`,
        profile: {
          clientName: '',
          primaryContact: '',
          email: '',
          phone: '',
          advisorName: '',
          firmName: '',
          clientType: 'individual',
          riskProfile: 'moderate',
          planningGoals: ['tax-optimization'],
          notes: '',
          tags: ['imported'],
          createdDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isActive: true,
          isArchived: false
        }
      };
      
      // Map CSV fields to client profile
      Object.entries(fieldMapping).forEach(([csvField, targetField]) => {
        const value = row[csvField];
        if (!value) return;
        
        switch (targetField) {
          case 'clientName':
            client.profile.clientName = value;
            break;
          case 'firstName':
            if (!client.profile.clientName) {
              client.profile.clientName = value;
            }
            client.profile.primaryContact = value;
            break;
          case 'lastName':
            if (client.profile.clientName && !client.profile.clientName.includes(' ')) {
              client.profile.clientName += ` ${value}`;
            }
            if (client.profile.primaryContact) {
              client.profile.primaryContact += ` ${value}`;
            }
            break;
          case 'email':
            client.profile.email = value;
            break;
          case 'phone':
            client.profile.phone = value;
            break;
          case 'advisorName':
            client.profile.advisorName = value;
            break;
          case 'notes':
            client.profile.notes = value;
            break;
          case 'spouseFirstName':
          case 'spouseLastName':
            if (value) {
              client.profile.clientType = 'couple';
              if (!client.profile.clientName.includes('&')) {
                const spouseName = targetField === 'spouseFirstName' ? value : 
                                 fieldMapping['spouseFirstName'] ? `${row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'spouseFirstName')]} ${value}` : value;
                client.profile.clientName += ` & ${spouseName}`;
              }
            }
            break;
        }
      });
      
      // Ensure we have a client name
      if (!client.profile.clientName) {
        client.profile.clientName = `Imported Client ${index + 1}`;
      }
      
      // Ensure we have a primary contact
      if (!client.profile.primaryContact) {
        client.profile.primaryContact = client.profile.clientName.split('&')[0].trim();
      }
      
      return client;
    });
    
    setPreviewClients(clients);
    setStep(3);
  };
  
  const performImport = () => {
    const importedClients = csvData.map((row, index) => {
      const client = {
        id: generateClientId(),
        profile: {
          clientName: '',
          primaryContact: '',
          email: '',
          phone: '',
          advisorName: '',
          firmName: '',
          clientType: 'individual',
          riskProfile: 'moderate',
          planningGoals: ['tax-optimization'],
          notes: '',
          tags: ['imported'],
          createdDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isActive: true,
          isArchived: false
        },
        scenarios: getClientTemplate('individual').scenarios,
        settings: getDefaultClientSettings()
      };
      
      // Map CSV fields to client profile (same logic as preview)
      Object.entries(fieldMapping).forEach(([csvField, targetField]) => {
        const value = row[csvField];
        if (!value) return;
        
        switch (targetField) {
          case 'clientName':
            client.profile.clientName = value;
            break;
          case 'firstName':
            if (!client.profile.clientName) {
              client.profile.clientName = value;
            }
            client.profile.primaryContact = value;
            break;
          case 'lastName':
            if (client.profile.clientName && !client.profile.clientName.includes(' ')) {
              client.profile.clientName += ` ${value}`;
            }
            if (client.profile.primaryContact) {
              client.profile.primaryContact += ` ${value}`;
            }
            break;
          case 'email':
            client.profile.email = value;
            break;
          case 'phone':
            client.profile.phone = value;
            break;
          case 'advisorName':
            client.profile.advisorName = value;
            break;
          case 'notes':
            client.profile.notes = value;
            break;
          case 'spouseFirstName':
          case 'spouseLastName':
            if (value) {
              client.profile.clientType = 'couple';
              client.scenarios = getClientTemplate('couple').scenarios;
              if (!client.profile.clientName.includes('&')) {
                const spouseName = targetField === 'spouseFirstName' ? value : 
                                 fieldMapping['spouseFirstName'] ? `${row[Object.keys(fieldMapping).find(k => fieldMapping[k] === 'spouseFirstName')]} ${value}` : value;
                client.profile.clientName += ` & ${spouseName}`;
              }
            }
            break;
        }
      });
      
      // Ensure we have a client name
      if (!client.profile.clientName) {
        client.profile.clientName = `Imported Client ${index + 1}`;
      }
      
      // Ensure we have a primary contact
      if (!client.profile.primaryContact) {
        client.profile.primaryContact = client.profile.clientName.split('&')[0].trim();
      }
      
      return client;
    });
    
    onImportClients(importedClients);
    setImportResults({
      total: importedClients.length,
      successful: importedClients.length,
      failed: 0
    });
    setStep(4);
  };
  
  const resetModal = () => {
    setStep(1);
    setCsvData([]);
    setHeaders([]);
    setFieldMapping({});
    setPreviewClients([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleClose = () => {
    resetModal();
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Import Clients from CRM
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { num: 1, title: 'Upload CSV' },
                { num: 2, title: 'Map Fields' },
                { num: 3, title: 'Preview' },
                { num: 4, title: 'Import' }
              ].map((stepItem, index) => (
                <div key={stepItem.num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepItem.num 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepItem.num}
                  </div>
                  <span className={`ml-2 text-sm ${
                    step >= stepItem.num ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </span>
                  {index < 3 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      step > stepItem.num ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step 1: Upload CSV */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select CRM System</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(crmTemplates).map(([key, template]) => (
                    <div
                      key={key}
                      onClick={() => setSelectedCRM(key)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedCRM === key
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600 mb-4">
                    Click to upload your CSV file or drag and drop
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Choose CSV File
                  </Button>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">CSV Export Instructions</h4>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p><strong>SmartOffice:</strong> Go to Contacts → Export → Select fields → Export as CSV</p>
                    <p><strong>Other CRMs:</strong> Export contact list with name, email, phone, and other relevant fields</p>
                    <p><strong>Required fields:</strong> Client Name (or First/Last Name)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Map Fields */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Map CSV Fields to Client Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Match your CSV columns to the appropriate client fields. Required fields are marked with *.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {headers.map(header => (
                  <div key={header} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {header}
                      </label>
                      <div className="text-xs text-gray-500">
                        Sample: {csvData[0]?.[header] || 'No data'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <select
                        value={fieldMapping[header] || ''}
                        onChange={(e) => handleFieldMappingChange(header, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Skip Field --</option>
                        <optgroup label="Required Fields">
                          {requiredFields.map(field => (
                            <option key={field} value={field}>
                              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} *
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Optional Fields">
                          {optionalFields.map(field => (
                            <option key={field} value={field}>
                              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between">
                <Button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Back
                </Button>
                <Button
                  onClick={generatePreview}
                  disabled={!Object.values(fieldMapping).some(field => requiredFields.includes(field))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  Preview Import
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Preview Import ({csvData.length} clients)
                </h3>
                <p className="text-gray-600 mb-4">
                  Review the first 5 clients to ensure the mapping is correct.
                </p>
              </div>
              
              <div className="space-y-4">
                {previewClients.map((client, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{client.profile.clientName}</h4>
                        <p className="text-sm text-gray-600">{client.profile.primaryContact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{client.profile.email}</p>
                        <p className="text-sm text-gray-600">{client.profile.phone}</p>
                      </div>
                      <div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {client.profile.clientType}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between">
                <Button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Back to Mapping
                </Button>
                <Button
                  onClick={performImport}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  Import {csvData.length} Clients
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 4: Import Results */}
          {step === 4 && importResults && (
            <div className="space-y-6 text-center">
              <div>
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import Successful!</h3>
                <p className="text-gray-600">
                  Successfully imported {importResults.successful} of {importResults.total} clients.
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">What's Next?</h4>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>• Review and edit client profiles as needed</li>
                  <li>• Set up tax scenarios for each client</li>
                  <li>• Configure planning goals and risk profiles</li>
                  <li>• Generate comprehensive tax reports</li>
                </ul>
              </div>
              
              <Button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRMImportModal;

