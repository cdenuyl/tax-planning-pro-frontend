import React, { useState } from 'react';
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

// Helper function to get client type display name
const getClientTypeDisplay = (clientType) => {
  const typeMap = {
    'individual': 'Individual',
    'couple': 'Couple',
    'retiree': 'Retiree',
    'business': 'Business'
  };
  
  return typeMap[clientType] || clientType;
};

// Helper function to format address
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
  client, 
  allClients,
  households,
  onHouseholdsUpdate,
  onEditClient, 
  onArchiveClient, 
  onUpdateClient,
  appSettings, 
  onAppSettingsChange 
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  if (!client || !client.profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-lg text-gray-500">Client not found</p>
        </CardContent>
      </Card>
    );
  }
  
  const { profile, scenarios = [], notes = [], documents = [], actionItems = [] } = client;
  const activeScenario = scenarios.find(s => s.isActive);
  
  // Handle scenario updates
  const handleScenarioUpdate = (updatedScenarios) => {
    if (onUpdateClient) {
      onUpdateClient({
        ...client,
        scenarios: updatedScenarios
      });
    }
  };
  
  // Handle notes updates
  const handleNotesUpdate = (updatedNotes) => {
    if (onUpdateClient) {
      onUpdateClient({
        ...client,
        notes: updatedNotes
      });
    }
  };
  
  // Handle documents updates
  const handleDocumentsUpdate = (updatedDocuments) => {
    if (onUpdateClient) {
      onUpdateClient({
        ...client,
        documents: updatedDocuments
      });
    }
  };
  
  // Handle action items updates
  const handleActionItemsUpdate = (updatedActionItems) => {
    if (onUpdateClient) {
      onUpdateClient({
        ...client,
        actionItems: updatedActionItems
      });
    }
  };
  
  return (
    <div className="client-detail-view">
      <div className="client-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">{profile.clientName}</h2>
          <div className="flex items-center gap-2 text-gray-500">
            <User size={16} />
            <span>{profile.primaryContact || 'No primary contact'}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEditClient}>
            <Edit size={16} className="mr-2" />
            Edit Client
          </Button>
          <Button variant="outline" onClick={onArchiveClient}>
            <Archive size={16} className="mr-2" />
            {profile.isArchived ? 'Unarchive Client' : 'Archive Client'}
          </Button>
        </div>
      </div>
      
      <div className="client-badges flex flex-wrap gap-2 mb-6">
        <Badge variant="outline">
          {getClientTypeDisplay(profile.clientType)}
        </Badge>
        
        {profile.isArchived && (
          <Badge variant="secondary">
            Archived
          </Badge>
        )}
        
        {profile.tags && profile.tags.map(tag => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
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
                      <span>{profile.primaryContact || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <span>{profile.email || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-500" />
                      <span className="font-medium">Phone:</span>
                      <span>{profile.phone || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-500 mt-1" />
                      <span className="font-medium">Address:</span>
                      <span>{formatAddress(profile.address)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-gray-500" />
                      <span className="font-medium">Advisor:</span>
                      <span>{profile.advisorName || 'N/A'}</span>
                      {profile.firmName && <span>({profile.firmName})</span>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(profile.createdDate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="font-medium">Last Modified:</span>
                      <span>{formatDate(profile.lastModified)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="planning-info">
                  <h3 className="text-lg font-medium mb-4">Planning Information</h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Client Type:</span>
                      <span>{getClientTypeDisplay(profile.clientType)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Risk Profile:</span>
                      <span className="capitalize">{(profile.riskProfile || 'N/A').replace('-', ' ')}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="font-medium">Planning Goals:</span>
                      <div className="flex flex-wrap gap-1">
                        {profile.planningGoals && profile.planningGoals.length > 0 ? (
                          profile.planningGoals.map(goal => (
                            <Badge key={goal} variant="outline" className="text-xs">
                              {goal.replace(/-/g, ' ')}
                            </Badge>
                          ))
                        ) : (
                          <span>None specified</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="font-medium">Notes:</span>
                      <span>{profile.notes || 'No notes'}</span>
                    </div>
                    
                    {profile.customFields && Object.keys(profile.customFields).length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Custom Fields:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(profile.customFields).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium">{key}:</span>
                              <span>{value}</span>
                            </div>
                          ))}
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
            onHouseholdsUpdate={onHouseholdsUpdate}
            onClientUpdate={onUpdateClient}
          />
        </TabsContent>
        
        <TabsContent value="scenarios">
          <ScenarioManager 
            scenarios={scenarios} 
            onScenariosUpdate={handleScenarioUpdate}
            appSettings={appSettings}
          />
        </TabsContent>
        
        <TabsContent value="notes">
          <NotesManager 
            notes={notes} 
            onNotesUpdate={handleNotesUpdate}
          />
        </TabsContent>
        
        <TabsContent value="documents">
          <DocumentManager 
            documents={documents} 
            onDocumentsUpdate={handleDocumentsUpdate}
          />
        </TabsContent>
        
        <TabsContent value="actions">
          <ActionItemManager 
            actionItems={actionItems} 
            onActionItemsUpdate={handleActionItemsUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetailView;

