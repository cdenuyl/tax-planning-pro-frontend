import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import {
  Edit,
  Archive,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  MapPin,
  Building,
  FileText,
  Plus,
  Trash,
  Copy,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import ScenarioManager from './ScenarioManager.jsx';
import NotesManager from './NotesManager.jsx';
import DocumentManager from './DocumentManager.jsx';
import ActionItemManager from './ActionItemManager.jsx';
import HouseholdManager from './HouseholdManager.jsx';
// import { clientAPI } from '../services/api'; // This will be replaced by useClientData hook actions

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    return 'Invalid date';
  }
};

// Helper function to get client status display name
const getClientStatusDisplay = (status) => {
  const statusMap = {
    'prospect': 'Prospect',
    'active': 'Active',
    'inactive': 'Inactive'
  };

  return statusMap[status] || status;
};

// Helper function to format address (assuming address is an object with street, city, state, zipCode)
// NOTE: Address fields are not directly in the Supabase clients table schema, 
// so this function might need to be adapted or removed if address is stored differently.
const formatAddress = (address) => {
  if (!address) return 'No address provided';

  const parts = [];
  if (address.street) parts.push(address.street);

  const cityStateZip = [];
  if (address.city) cityStateZip.push(address.city);
  if (address.state) cityStateZip.push(address.state);
  if (address.zipCode) cityStateZip.push(address.zipCode);

  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }

  return parts.length > 0 ? parts.join(', ') : 'No address provided';
};

const ClientDetailView = ({
  client: initialClient, // Rename prop to avoid conflict with state
  allClients, // Passed from ClientManagementApp
  // households, // Households will be managed by HouseholdManager internally or passed from useClientData
  // onHouseholdsUpdate, // Handled by useClientData
  onEditClient, // Function to open edit modal
  onArchiveClient, // Function to archive client
  onUpdateClient, // Function to update client data in Supabase (from useClientData)
  appSettings, // Global app settings
  onAppSettingsChange, // Function to update app settings
  currentScenario, // Passed from useClientData
  scenarios, // All scenarios for the current client (from useClientData)
  createScenario, // From useClientData
  updateScenario, // From useClientData
  deleteScenario, // From useClientData
  selectScenario, // From useClientData
}) => {
  const [client, setClient] = useState(initialClient);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    setClient(initialClient);
  }, [initialClient]);

  if (!client) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-lg text-gray-500">Client not found</p>
        </CardContent>
      </Card>
    );
  }

  // Destructure client properties directly from the Supabase schema
  const {
    id,
    user_id,
    taxpayer_first_name,
    taxpayer_last_name,
    taxpayer_email,
    taxpayer_date_of_birth,
    spouse_first_name,
    spouse_last_name,
    spouse_email,
    spouse_date_of_birth,
    status,
    notes,
    created_at,
    updated_at,
    // Scenarios, documents, actionItems are not directly in the client table
    // They would be separate tables linked by client_id and fetched by useClientData
  } = client;

  // Placeholder for documents, actionItems - these would be fetched separately
  // For now, we'll assume scenarios are passed via props from useClientData
  const documents = []; // This would come from a documents table linked to client.id
  const actionItems = []; // This would come from an action_items table linked to client.id
  const households = []; // This would come from a households table linked to client.id

  // Combine taxpayer and spouse names for display
  const clientFullName = `${taxpayer_first_name || ''} ${taxpayer_last_name || ''}`.trim();
  const primaryContact = taxpayer_email || 'N/A'; // Assuming email is primary contact

  // Handle scenario updates (now integrated with useClientData props)
  const handleScenarioUpdate = (updatedScenarioData) => {
    // This function would typically call updateScenario from useClientData
    // For now, ScenarioManager will handle its own state and call updateScenario directly
    console.log('Scenario update requested:', updatedScenarioData);
  };

  // Handle notes updates (placeholder logic)
  const handleNotesUpdate = (updatedNotes) => {
    console.log('Notes update requested:', updatedNotes);
    // This would involve updating the notes table in Supabase, likely via onUpdateClient
    onUpdateClient(id, { notes: updatedNotes });
  };

  // Handle documents updates (placeholder logic)
  const handleDocumentsUpdate = (updatedDocuments) => {
    console.log('Documents update requested:', updatedDocuments);
    // This would involve updating the documents table in Supabase
  };

  // Handle action items updates (placeholder logic)
  const handleActionItemsUpdate = (updatedActionItems) => {
    console.log('Action items update requested:', updatedActionItems);
    // This would involve updating the action_items table in Supabase
  };

  return (
    <div className="client-detail-view">
      <div className="client-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">{clientFullName}</h2>
          <div className="flex items-center gap-2 text-gray-500">
            <User size={16} />
            <span>{primaryContact}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEditClient(id)}>
            <Edit size={16} className="mr-2" />
            Edit Client
          </Button>
          <Button variant="outline" onClick={() => onArchiveClient(id)}>
            <Archive size={16} className="mr-2" />
            {status === 'inactive' ? 'Unarchive Client' : 'Archive Client'}
          </Button>
        </div>
      </div>

      <div className="client-badges flex flex-wrap gap-2 mb-6">
        <Badge variant="outline">
          {getClientStatusDisplay(status)}
        </Badge>

        {status === 'inactive' && (
          <Badge variant="secondary">
            Archived
          </Badge>
        )}

        {/* Tags would be handled if there's a tags column or separate table */}
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Client Profile</CardTitle>
              <CardDescription>
                Basic information about the client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="contact-info">
                  <h3 className="text-lg font-medium mb-4">Contact Information</h3>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-500" />
                      <span className="font-medium">Name:</span>
                      <span>{clientFullName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span>{taxpayer_email || 'N/A'}</span>
                    </div>

                    {/* Phone number is not in the provided schema, assuming it's part of a related table or custom field */}
                    {/* <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      <span className="font-medium">Phone:</span>
                      <span>{profile.phone || 'N/A'}</span>
                    </div> */}

                    {/* Address is not in the provided schema, assuming it's part of a related table or custom field */}
                    {/* <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-500 mt-1" />
                      <span className="font-medium">Address:</span>
                      <span>{formatAddress(profile.address)}</span>
                    </div> */}

                    {/* Advisor and firm name are not in the provided schema */}
                    {/* <div className="flex items-center gap-2">
                      <Building size={16} className="text-gray-500" />
                      <span className="font-medium">Advisor:</span>
                      <span>{profile.advisorName || 'N/A'}</span>
                      {profile.firmName && <span>({profile.firmName})</span>}
                    </div> */}

                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="font-medium">Last Modified:</span>
                      <span>{formatDate(updated_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="planning-info">
                  <h3 className="text-lg font-medium mb-4">Planning Information</h3>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span>
                      <span>{getClientStatusDisplay(status)}</span>
                    </div>

                    {/* Client Type, Risk Profile, Planning Goals, Custom Fields are not directly in the provided schema */}
                    {/* They would be part of a related table or user metadata */}

                    <div className="flex items-start gap-2">
                      <span className="font-medium">Notes:</span>
                      <span>{notes || 'No notes'}</span>
                    </div>

                    {/* Spouse information */}
                    {(spouse_first_name || spouse_last_name || spouse_email || spouse_date_of_birth) && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Spouse Information:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {spouse_first_name && spouse_last_name && (
                            <div className="flex gap-2">
                              <span className="font-medium">Name:</span>
                              <span>{spouse_first_name} {spouse_last_name}</span>
                            </div>
                          )}
                          {spouse_email && (
                            <div className="flex gap-2">
                              <span className="font-medium">Email:</span>
                              <span>{spouse_email}</span>
                            </div>
                          )}
                          {spouse_date_of_birth && (
                            <div className="flex gap-2">
                              <span className="font-medium">Date of Birth:</span>
                              <span>{formatDate(spouse_date_of_birth)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="household">
          <HouseholdManager
            client={client}
            allClients={allClients || []}
            households={households || []}
            // onHouseholdsUpdate={onHouseholdsUpdate} // Handled by useClientData
            onClientUpdate={onUpdateClient}
          />
        </TabsContent>

        <TabsContent value="scenarios">
          <ScenarioManager
            client={client}
            scenarios={scenarios}
            currentScenario={currentScenario}
            onCreateScenario={createScenario}
            onUpdateScenario={updateScenario}
            onDeleteScenario={deleteScenario}
            onSelectScenario={selectScenario}
            appSettings={appSettings}
          />
        </TabsContent>

        <TabsContent value="notes">
          <NotesManager
            client={client}
            notes={notes}
            onNotesUpdate={handleNotesUpdate}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager
            client={client}
            documents={documents}
            onDocumentsUpdate={handleDocumentsUpdate}
          />
        </TabsContent>

        <TabsContent value="actions">
          <ActionItemManager
            client={client}
            actionItems={actionItems}
            onActionItemsUpdate={handleActionItemsUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetailView;


