import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus,
  Heart,
  Baby,
  User,
  X
} from 'lucide-react';

const HouseholdManager = ({ 
  client, 
  allClients = [], 
  households = [], 
  onHouseholdsUpdate,
  onClientUpdate 
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState('spouse');
  const [selectedTaxRole, setSelectedTaxRole] = useState('spouse');

  // Early return if required props are missing
  if (!client || !client.profile || !onHouseholdsUpdate || !onClientUpdate) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load household management. Missing required data.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Find household for current client (using stable calculation)
  const clientHousehold = households.find(household => 
    household && household.members && household.members.some(member => member.clientId === client.id)
  );
  
  // Simple search function without useEffect to avoid loops
  const getSearchResults = useCallback(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const excludeIds = clientHousehold ? 
      clientHousehold.members.map(member => member.clientId) : 
      [client.id];
    
    return allClients
      .filter(searchClient => 
        searchClient.id !== client.id &&
        !excludeIds.includes(searchClient.id) &&
        (searchClient.profile.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         searchClient.profile.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(0, 10);
  }, [searchTerm, allClients, clientHousehold, client.id]);
  
  const searchResults = getSearchResults();
  
  // Handle creating a new household
  const handleCreateHousehold = useCallback(() => {
    const newHousehold = {
      id: Date.now().toString(),
      name: householdName || `${client.profile.clientName} Household`,
      members: [{
        clientId: client.id,
        relationship: 'primary',
        taxRole: 'primary_taxpayer',
        addedDate: new Date().toISOString()
      }],
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    const updatedHouseholds = [...households, newHousehold];
    onHouseholdsUpdate(updatedHouseholds);
    
    setHouseholdName('');
    setShowCreateDialog(false);
  }, [client, households, householdName, onHouseholdsUpdate]);
  
  // Handle adding a member to household
  const handleAddMember = useCallback(() => {
    if (!selectedClient || !clientHousehold) return;
    
    const newMember = {
      clientId: selectedClient.id,
      relationship: selectedRelationship,
      taxRole: selectedTaxRole,
      addedDate: new Date().toISOString()
    };
    
    const updatedHousehold = {
      ...clientHousehold,
      members: [...clientHousehold.members, newMember],
      lastModified: new Date().toISOString()
    };
    
    const updatedHouseholds = households.map(h => 
      h.id === clientHousehold.id ? updatedHousehold : h
    );
    
    onHouseholdsUpdate(updatedHouseholds);
    
    setSelectedClient(null);
    setSearchTerm('');
    setShowAddMemberDialog(false);
  }, [selectedClient, clientHousehold, selectedRelationship, selectedTaxRole, households, onHouseholdsUpdate]);
  
  // Get client name by ID
  const getClientName = useCallback((clientId) => {
    const foundClient = allClients.find(c => c.id === clientId);
    return foundClient?.profile?.clientName || 'Unknown Client';
  }, [allClients]);
  
  // Get relationship display name
  const getRelationshipDisplay = (relationship) => {
    const displayMap = {
      'primary': 'Primary Taxpayer',
      'spouse': 'Spouse',
      'dependent_child': 'Dependent Child',
      'dependent_other': 'Other Dependent',
      'parent': 'Parent',
      'sibling': 'Sibling',
      'other': 'Other'
    };
    return displayMap[relationship] || relationship;
  };
  
  // Get relationship icon
  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case 'spouse':
        return <Heart size={16} className="text-red-500" />;
      case 'dependent_child':
      case 'dependent_other':
        return <Baby size={16} className="text-blue-500" />;
      case 'primary':
        return <User size={16} className="text-blue-600" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };
  
  if (!clientHousehold) {
    // Client is not in a household - show create option
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Household Management
          </CardTitle>
          <CardDescription>
            Create a household to link family members for joint tax planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {client.profile.clientName} is not currently part of a household. 
            Create a household to link spouses, dependents, and other family members.
          </p>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Create Household
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Household</DialogTitle>
                <DialogDescription>
                  Create a household with {client.profile.clientName} as the primary taxpayer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Household Name (Optional)
                  </label>
                  <Input
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder={`${client.profile.clientName} Household`}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateHousehold}>
                  Create Household
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }
  
  // Client is in a household - show household details
  const primaryMember = clientHousehold.members.find(m => m.relationship === 'primary');
  const spouseMember = clientHousehold.members.find(m => m.relationship === 'spouse');
  const dependentMembers = clientHousehold.members.filter(m => 
    m.relationship === 'dependent_child' || m.relationship === 'dependent_other'
  );
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            {clientHousehold.name}
          </CardTitle>
          <CardDescription>
            {clientHousehold.members.length} member(s) • 
            Filing Status: {spouseMember ? 'Married Filing Jointly' : 'Single'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Primary Taxpayer */}
            {primaryMember && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-blue-600" />
                  <div>
                    <div className="font-medium">{getClientName(primaryMember.clientId)}</div>
                    <div className="text-sm text-gray-600">Primary Taxpayer</div>
                  </div>
                </div>
                <Badge variant="secondary">Primary</Badge>
              </div>
            )}
            
            {/* Spouse */}
            {spouseMember && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Heart size={16} className="text-red-500" />
                  <div>
                    <div className="font-medium">{getClientName(spouseMember.clientId)}</div>
                    <div className="text-sm text-gray-600">Spouse</div>
                  </div>
                </div>
                <Badge variant="outline">Spouse</Badge>
              </div>
            )}
            
            {/* Dependents */}
            {dependentMembers.map((dependent) => (
              <div key={dependent.clientId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getRelationshipIcon(dependent.relationship)}
                  <div>
                    <div className="font-medium">{getClientName(dependent.clientId)}</div>
                    <div className="text-sm text-gray-600">{getRelationshipDisplay(dependent.relationship)}</div>
                  </div>
                </div>
                <Badge variant="outline">Dependent</Badge>
              </div>
            ))}
          </div>
        </CardContent>
        <CardContent>
          <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus size={16} />
                Add Household Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Household Member</DialogTitle>
                <DialogDescription>
                  Search for and add a family member to this household
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Search for Client
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email..."
                      className="pl-10"
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                      {searchResults.map((searchClient) => (
                        <div
                          key={searchClient.id}
                          className={`p-2 cursor-pointer hover:bg-gray-50 ${
                            selectedClient?.id === searchClient.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedClient(searchClient)}
                        >
                          <div className="font-medium">{searchClient.profile.clientName}</div>
                          <div className="text-sm text-gray-600">{searchClient.profile.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedClient && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Relationship
                      </label>
                      <Select value={selectedRelationship} onValueChange={setSelectedRelationship}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="dependent_child">Dependent Child</SelectItem>
                          <SelectItem value="dependent_other">Other Dependent</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Tax Role
                      </label>
                      <Select value={selectedTaxRole} onValueChange={setSelectedTaxRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="dependent">Dependent</SelectItem>
                          <SelectItem value="non_dependent">Non-Dependent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} disabled={!selectedClient}>
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default HouseholdManager;

