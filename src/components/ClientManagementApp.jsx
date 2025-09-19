import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import ClientListView from './ClientListView.jsx';
import ClientProfileModal from './ClientProfileModal.jsx';
import ClientDetailView from './ClientDetailView.jsx';
import { useAuth } from '../contexts/AuthContext';
import { clientAPI } from '../services/api';
import { ArrowLeft, Settings } from 'lucide-react';

// Placeholder for app settings, will be fetched from DB or user metadata later
const getDefaultAppSettings = () => ({
  defaultView: 'assets',
  savedViews: [],
  reportPreferences: {
    includeCharts: true,
    includeCalculations: true,
    defaultTemplate: 'comprehensive',
    advisorBranding: true
  }
});

const ClientManagementApp = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [appSettings, setAppSettings] = useState(getDefaultAppSettings());
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalMode, setClientModalMode] = useState('create'); // 'create' or 'edit'
  const [editingClient, setEditingClient] = useState(null);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  
  // Get active client
  const activeClient = clients.find(c => c.id === activeClientId);

  const fetchClients = useCallback(async () => {
    if (!user?.id) return;
    setDataLoading(true);
    setError(null);
    try {
      const result = await clientAPI.getClients(user.id);
      if (result.success) {
        setClients(result.clients);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch clients: ' + err.message);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchClients();
    }
  }, [user, authLoading]); // Removed fetchClients to prevent infinite loop

  // Handle client selection
  const handleClientSelect = (clientId) => {
    setActiveClientId(clientId);
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
  const handleArchiveClient = async (clientId) => {
    // Supabase update logic
    try {
      const clientToUpdate = clients.find(c => c.id === clientId);
      if (!clientToUpdate) return;

      const updatedProfile = {
        ...clientToUpdate.profile,
        isArchived: !clientToUpdate.profile.isArchived,
        updated_at: new Date().toISOString()
      };
      const result = await clientAPI.updateClient(clientId, { profile: updatedProfile });
      if (result.success) {
        fetchClients(); // Re-fetch clients to update list
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to archive client: ' + err.message);
    }
  };
  
  // Handle save client
  const handleSaveClient = async (profileData) => {
    setDataLoading(true);
    try {
      if (clientModalMode === 'create') {
        // Create new client
        const newClientData = {
          user_id: user.id, // Link to current user
          taxpayer_first_name: profileData.taxpayer_first_name || '',
          taxpayer_last_name: profileData.taxpayer_last_name || '',
          taxpayer_email: profileData.taxpayer_email || null,
          taxpayer_date_of_birth: profileData.taxpayer_date_of_birth || null,
          spouse_first_name: profileData.spouse_first_name || null,
          spouse_last_name: profileData.spouse_last_name || null,
          spouse_email: profileData.spouse_email || null,
          spouse_date_of_birth: profileData.spouse_date_of_birth || null,
          status: profileData.status || 'prospect',
          notes: profileData.notes || null,
          // Add other fields from your schema as needed
        };
        const result = await clientAPI.createClient(newClientData);
        if (result.success) {
          setActiveClientId(result.client.id);
          fetchClients();
        } else {
          setError(result.error);
        }
      } else if (clientModalMode === 'edit') {
        // Update existing client
        const updates = {
          taxpayer_first_name: profileData.taxpayer_first_name || '',
          taxpayer_last_name: profileData.taxpayer_last_name || '',
          taxpayer_email: profileData.taxpayer_email || null,
          taxpayer_date_of_birth: profileData.taxpayer_date_of_birth || null,
          spouse_first_name: profileData.spouse_first_name || null,
          spouse_last_name: profileData.spouse_last_name || null,
          spouse_email: profileData.spouse_email || null,
          spouse_date_of_birth: profileData.spouse_date_of_birth || null,
          status: profileData.status || 'prospect',
          notes: profileData.notes || null,
          updated_at: new Date().toISOString()
        };
        const result = await clientAPI.updateClient(editingClient.id, updates);
        if (result.success) {
          fetchClients();
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Failed to save client: ' + err.message);
    } finally {
      setShowClientModal(false);
      setEditingClient(null);
      setDataLoading(false);
    }
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

  if (authLoading || dataLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading application...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-lg text-red-500">Error: {error}</div>;
  }

  // Render the three-pane dashboard structure
  return (
    <div className="dashboard-layout flex h-screen">
      {/* Left Pane: Clients & Tools */}
      <div className="left-pane w-1/4 bg-gray-100 p-4 border-r border-gray-200">
        <h2 className="text-xl font-bold mb-4">Clients & Tools</h2>
        <div className="client-list-section mb-6">
          <h3 className="text-lg font-semibold mb-2">Client List ({clients.length} clients):</h3>
          <ClientListView
            clients={clients}
            onClientSelect={handleClientSelect}
            onNewClient={handleNewClient}
            onEditClient={handleEditClient}
            onArchiveClient={handleArchiveClient}
            activeClientId={activeClientId}
          />
        </div>
        <div className="other-tools-section">
          <h3 className="text-lg font-semibold mb-2">Other tools and navigation would go here.</h3>
          {/* Placeholder for other tools/navigation */}
        </div>
      </div>

      {/* Middle Pane: Tax Map */}
      <div className="middle-pane flex-grow bg-white p-4 border-r border-gray-200">
        <h2 className="text-xl font-bold mb-4">Tax Map</h2>
        {activeClient ? (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            The main interactive tax map visualization would be rendered in this pane for {activeClient.taxpayer_first_name} {activeClient.taxpayer_last_name}.
            {/* <InteractiveTaxMap client={activeClient} /> */}
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            Select a client to view the Tax Map.
          </div>
        )}
      </div>

      {/* Right Pane: Tax Info & Scenarios */}
      <div className="right-pane w-1/3 bg-gray-50 p-4">
        <h2 className="text-xl font-bold mb-4">Tax Info & Scenarios</h2>
        {activeClient ? (
          <ClientDetailView
            client={activeClient}
            onEditClient={() => handleEditClient(activeClient.id)}
            onArchiveClient={() => handleArchiveClient(activeClient.id)}
            appSettings={appSettings}
            onAppSettingsChange={handleAppSettingsChange}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            Select a client to view detailed tax information and scenarios.
          </div>
        )}
      </div>

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



