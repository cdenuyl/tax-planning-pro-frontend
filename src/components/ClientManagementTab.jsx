import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import ClientListView from './ClientListView.jsx';
import ClientDetailView from './ClientDetailView.jsx';
import DataImportExport from './DataImportExport.jsx';
import ClientProfileModal from './ClientProfileModal.jsx';
import HelpModal, { helpContent } from './HelpModal.jsx';
import { 
  exportClientData, 
  importClientData
} from '../utils/clientManagement.js';

const ClientManagementTab = ({
  clients,
  activeClientId,
  households,
  currentUser,
  onClientChange,
  onCreateClient,
  onEditClient,
  onDuplicateClient,
  onArchiveClient,
  onCreateScenario,
  onClientsUpdate,
  onHouseholdsUpdate,
  onClientShare
}) => {
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedClientId, setSelectedClientId] = useState(activeClientId);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState('create'); // 'create', 'edit'
  const [editingClient, setEditingClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const activeClient = clients.find(c => c.id === activeClientId);
  const selectedClient = clients.find(c => c.id === selectedClientId) || activeClient;
  
  // Handle client selection
  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (activeTab === 'detail') {
      // If we're in detail view, load the selected client
      onClientChange(clientId);
    }
  };
  
  // Handle client activation (make active for tax calculations)
  const handleActivateClient = (clientId) => {
    onClientChange(clientId);
    setSelectedClientId(clientId);
  };
  
  // Handle new client
  const handleNewClient = () => {
    setProfileModalMode('create');
    setEditingClient(null);
    setShowProfileModal(true);
  };
  
  // Handle edit client
  const handleEditClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    setProfileModalMode('edit');
    setEditingClient(client);
    setShowProfileModal(true);
  };
  
  // Handle save client from modal
  const handleSaveClient = (clientData) => {
    if (profileModalMode === 'create') {
      // Create new client
      onCreateClient(clientData);
    } else {
      // Update existing client
      onEditClient(editingClient.id, clientData);
    }
    
    setShowProfileModal(false);
  };
  
  // Handle archive client
  const handleArchiveClient = (clientId) => {
    onArchiveClient(clientId);
    
    // If the archived client was selected, select the active client instead
    if (selectedClientId === clientId) {
      setSelectedClientId(activeClientId);
    }
  };
  
  // Handle unarchive client
  const handleUnarchiveClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    const updatedClient = {
      ...client,
      profile: { ...client.profile, isArchived: false }
    };
    
    onEditClient(clientId, updatedClient.profile);
  };
  
  // Handle duplicate client
  const handleDuplicateClient = (clientId) => {
    onDuplicateClient(clientId);
  };
  
  // Handle delete client
  const handleDeleteClient = (clientId) => {
    // In a real implementation, this would call a function to delete the client
    // For now, we'll just close the confirmation dialog
    setShowDeleteConfirm(null);
    
    // If the deleted client was selected, select the active client instead
    if (selectedClientId === clientId) {
      setSelectedClientId(activeClientId);
    }
  };
  
  // Handle create scenario
  const handleCreateScenario = (clientId, scenarioData) => {
    onCreateScenario(clientId, scenarioData);
  };
  
  // Handle generate report
  const handleGenerateReport = (clientId) => {
    // Switch to the client and then to reports tab
    onClientChange(clientId);
    // This would trigger a tab change to reports - we'll implement this in the main app
    window.dispatchEvent(new CustomEvent('switchToReports'));
  };
  
  // Handle client update
  const handleUpdateClient = (clientId, updatedClient) => {
    if (clientId === selectedClientId) {
      onEditClient(selectedClientId, updatedClient.profile);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage your clients and their tax planning scenarios</p>
        </div>
        <HelpModal 
          title="Client Management Help"
          content={helpContent.clientManagement}
          triggerText="Help"
        />
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedClient}>Client Details</TabsTrigger>
          <TabsTrigger value="import-export">Import/Export</TabsTrigger>
        </TabsList>
        
        {/* Clients Tab */}
        <TabsContent value="clients">
          <ClientListView 
            clients={clients}
            activeClientId={activeClientId}
            selectedClientId={selectedClientId}
            currentUser={currentUser}
            onClientSelect={handleClientSelect}
            onActivateClient={handleActivateClient}
            onNewClient={handleNewClient}
            onEditClient={handleEditClient}
            onArchiveClient={handleArchiveClient}
            onUnarchiveClient={handleUnarchiveClient}
            onDuplicateClient={handleDuplicateClient}
            onDeleteClient={(clientId) => setShowDeleteConfirm(clientId)}
            onShareClient={onClientShare}
            onViewClient={(clientId) => {
              setSelectedClientId(clientId);
              setActiveTab('detail');
            }}
          />
        </TabsContent>
        
        {/* Client Detail Tab */}
        <TabsContent value="detail">
          {selectedClient ? (
            <ClientDetailView 
              client={selectedClient}
              allClients={clients}
              households={households}
              onHouseholdsUpdate={onHouseholdsUpdate}
              isActive={selectedClient.id === activeClientId}
              onActivateClient={() => handleActivateClient(selectedClient.id)}
              onEditClient={() => handleEditClient(selectedClient.id)}
              onArchiveClient={() => handleArchiveClient(selectedClient.id)}
              onUnarchiveClient={() => handleUnarchiveClient(selectedClient.id)}
              onDuplicateClient={() => handleDuplicateClient(selectedClient.id)}
              onDeleteClient={() => setShowDeleteConfirm(selectedClient.id)}
              onCreateScenario={(scenarioData) => handleCreateScenario(selectedClient.id, scenarioData)}
              onGenerateReport={() => handleGenerateReport(selectedClient.id)}
              onUpdateClient={onEditClient}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Select a client to view details</p>
            </div>
          )}
        </TabsContent>
        
        {/* Import/Export Tab */}
        <TabsContent value="import-export">
          <DataImportExport 
            client={selectedClient}
            allClients={clients}
            onClientUpdate={handleUpdateClient}
            onClientsUpdate={onClientsUpdate}
          />
        </TabsContent>
      </Tabs>
      
      {/* Client Profile Modal */}
      {showProfileModal && (
        <ClientProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={handleSaveClient}
          mode={profileModalMode}
          client={editingClient}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                <p className="text-gray-600 mt-2">
                  Are you sure you want to delete this client? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteClient(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagementTab;

