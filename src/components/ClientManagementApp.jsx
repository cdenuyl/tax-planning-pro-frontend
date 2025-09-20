import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import ClientListView from './ClientListView.jsx';
import ClientProfileModal from './ClientProfileModal.jsx';
import ClientDetailView from './ClientDetailView.jsx';
import { 
  loadClientsData, 
  saveClientsData, 
  generateClientId, 
  getClientTemplate,
  getDefaultAppSettings
} from '../utils/clientManagement.js';
import { ArrowLeft, Settings } from 'lucide-react';

const ClientManagementApp = () => {
  // Main state
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [appSettings, setAppSettings] = useState(getDefaultAppSettings());
  const [view, setView] = useState('list'); // 'list' or 'detail'
  
  // Modal state
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalMode, setClientModalMode] = useState('create'); // 'create' or 'edit'
  const [editingClient, setEditingClient] = useState(null);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  
  // Get active client
  const activeClient = clients.find(c => c.id === activeClientId);
  
  // Load client data on component mount
  useEffect(() => {
    const data = loadClientsData();
    setClients(data.clients || []);
    setActiveClientId(data.activeClientId);
    setAppSettings(data.appSettings || getDefaultAppSettings());
  }, []);
  
  // Save client data when it changes
  useEffect(() => {
    if (clients.length > 0) {
      saveClientsData(clients, activeClientId, appSettings);
    }
  }, [clients, activeClientId, appSettings]);
  
  // Handle client selection
  const handleClientSelect = (clientId) => {
    setActiveClientId(clientId);
    setView('detail');
  };
  
  // Handle new client
  const handleNewClient = () => {
    setEditingClient(null);
    setClientModalMode('create');
    setShowClientModal(true);
  };
  
  // Handle edit client
  const handleEditClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setEditingClient(client);
    setClientModalMode('edit');
    setShowClientModal(true);
  };
  
  // Handle archive client
  const handleArchiveClient = (clientId) => {
    setClients(prev => prev.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          profile: {
            ...client.profile,
            isArchived: !client.profile.isArchived,
            lastModified: new Date().toISOString()
          }
        };
      }
      return client;
    }));
  };
  
  // Handle save client
  const handleSaveClient = (profileData) => {
    if (clientModalMode === 'create') {
      // Create new client
      const newClient = {
        id: generateClientId(),
        profile: {
          ...profileData,
          createdDate: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isActive: true,
          isArchived: false
        },
        scenarios: getClientTemplate(profileData.clientType).scenarios,
        settings: {
          defaultView: 'assets',
          savedViews: [],
          reportPreferences: {
            includeCharts: true,
            includeCalculations: true,
            defaultTemplate: 'comprehensive',
            advisorBranding: true
          }
        },
        actionItems: [],
        notes: [],
        documents: []
      };
      
      setClients(prev => [...prev, newClient]);
      setActiveClientId(newClient.id);
      setView('detail');
    } else if (clientModalMode === 'edit') {
      // Update existing client
      setClients(prev => prev.map(client => {
        if (client.id === editingClient.id) {
          return {
            ...client,
            profile: {
              ...client.profile,
              ...profileData,
              lastModified: new Date().toISOString()
            }
          };
        }
        return client;
      }));
    }
    
    setShowClientModal(false);
    setEditingClient(null);
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setView('list');
  };
  
  // Handle settings toggle
  const handleSettingsToggle = () => {
    setShowSettings(!showSettings);
  };
  
  // Handle app settings change
  const handleAppSettingsChange = (newSettings) => {
    setAppSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };
  
  // Render client management app
  return (
    <div className="client-management-app">
      <div className="app-header flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tax-on-a-Me</h1>
        <Button variant="outline" onClick={handleSettingsToggle}>
          <Settings size={18} className="mr-2" />
          Settings
        </Button>
      </div>
      
      {view === 'list' ? (
        <ClientListView
          clients={clients}
          onClientSelect={handleClientSelect}
          onNewClient={handleNewClient}
          onEditClient={handleEditClient}
          onArchiveClient={handleArchiveClient}
        />
      ) : (
        <div className="client-detail-container">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBackToList}
              className="flex items-center mr-4"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to List
            </Button>
            
            <h2 className="text-2xl font-bold">
              {activeClient?.profile?.clientName || 'Client Details'}
            </h2>
          </div>
          
          {activeClient && (
            <ClientDetailView
              client={activeClient}
              onEditClient={() => handleEditClient(activeClient.id)}
              onArchiveClient={() => handleArchiveClient(activeClient.id)}
              appSettings={appSettings}
              onAppSettingsChange={handleAppSettingsChange}
            />
          )}
        </div>
      )}
      
      {/* Client Modal */}
      {showClientModal && (
        <ClientProfileModal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          onSave={handleSaveClient}
          mode={clientModalMode}
          client={editingClient}
        />
      )}
      
      {/* Settings Modal would go here */}
    </div>
  );
};

export default ClientManagementApp;

