import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { 
  Share2, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  Search,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  getUsers, 
  shareClientWithUser, 
  getClientAccess,
  getCurrentUser,
  USER_ROLES 
} from '../../utils/auth.js';

const ClientSharingModal = ({ 
  isOpen, 
  onClose, 
  client, 
  onSharingUpdate 
}) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState(['view']);
  const [currentShares, setCurrentShares] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const currentUser = getCurrentUser();
  
  const permissionOptions = [
    { value: 'view', label: 'View Only', icon: Eye, description: 'Can view client information and scenarios' },
    { value: 'edit', label: 'Edit', icon: Edit, description: 'Can view and modify client information' },
    { value: 'share', label: 'Share', icon: Share2, description: 'Can view, edit, and share with others' }
  ];
  
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadCurrentShares();
    }
  }, [isOpen, client]);
  
  const loadUsers = () => {
    const allUsers = getUsers();
    // Filter out current user and inactive users
    const availableUsers = allUsers.filter(user => 
      user.id !== currentUser?.id && 
      user.isActive
    );
    setUsers(availableUsers);
  };
  
  const loadCurrentShares = () => {
    if (!client) return;
    
    // Get all users and their client access to find who has access to this client
    const allUsers = getUsers();
    const shares = [];
    
    allUsers.forEach(user => {
      if (user.id === currentUser?.id) return; // Skip current user
      
      const access = getClientAccess(user.id);
      const sharedClient = access.sharedClients.find(share => share.clientId === client.id);
      
      if (sharedClient) {
        shares.push({
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          userRole: user.role,
          permissions: sharedClient.permissions,
          sharedAt: sharedClient.sharedAt,
          sharedBy: sharedClient.sharedBy
        });
      }
    });
    
    setCurrentShares(shares);
  };
  
  const handleShareClient = async () => {
    if (!selectedUser || !client) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = shareClientWithUser(
        client.id,
        currentUser.id,
        selectedUser,
        selectedPermissions
      );
      
      if (result.success) {
        setSuccess('Client shared successfully!');
        setSelectedUser('');
        setSelectedPermissions(['view']);
        loadCurrentShares();
        
        if (onSharingUpdate) {
          onSharingUpdate();
        }
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveShare = (userId) => {
    // In a real implementation, this would call an API to remove the share
    // For now, we'll implement this as removing from localStorage
    try {
      const accessData = localStorage.getItem('client_access_permissions');
      const allPermissions = accessData ? JSON.parse(accessData) : {};
      
      if (allPermissions[userId]) {
        allPermissions[userId].sharedClients = allPermissions[userId].sharedClients.filter(
          share => share.clientId !== client.id
        );
        
        localStorage.setItem('client_access_permissions', JSON.stringify(allPermissions));
        loadCurrentShares();
        
        if (onSharingUpdate) {
          onSharingUpdate();
        }
        
        setSuccess('Share removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Failed to remove share. Please try again.');
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const availableUsers = filteredUsers.filter(user => 
    !currentShares.some(share => share.userId === user.id)
  );
  
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'bg-red-100 text-red-800';
      case USER_ROLES.ADVISOR:
        return 'bg-blue-100 text-blue-800';
      case USER_ROLES.ASSISTANT:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPermissionIcon = (permissions) => {
    if (permissions.includes('share')) return Share2;
    if (permissions.includes('edit')) return Edit;
    return Eye;
  };
  
  const getPermissionLabel = (permissions) => {
    if (permissions.includes('share')) return 'Can Share';
    if (permissions.includes('edit')) return 'Can Edit';
    return 'View Only';
  };
  
  const getPermissionColor = (permissions) => {
    if (permissions.includes('share')) return 'bg-purple-100 text-purple-800';
    if (permissions.includes('edit')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  if (!client) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Client: {client.clientName}</span>
          </DialogTitle>
          <DialogDescription>
            Share this client with team members and manage their access permissions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Share with new user */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Share with Team Member</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <span>{user.firstName} {user.lastName}</span>
                          <Badge className={getRoleBadgeColor(user.role)} variant="secondary">
                            {user.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {permissionOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedPermissions.includes(option.value);
                    
                    return (
                      <div
                        key={option.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (option.value === 'view') {
                            setSelectedPermissions(['view']);
                          } else if (option.value === 'edit') {
                            setSelectedPermissions(['view', 'edit']);
                          } else if (option.value === 'share') {
                            setSelectedPermissions(['view', 'edit', 'share']);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-gray-600">{option.description}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Button 
                onClick={handleShareClient} 
                disabled={!selectedUser || isLoading}
                className="w-full"
              >
                {isLoading ? 'Sharing...' : 'Share Client'}
              </Button>
            </div>
          </div>
          
          {/* Current shares */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Current Shares</h3>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{currentShares.length}</span>
              </Badge>
            </div>
            
            {currentShares.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>This client hasn't been shared with anyone yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentShares.map((share) => {
                  const PermissionIcon = getPermissionIcon(share.permissions);
                  
                  return (
                    <div key={share.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{share.userName}</div>
                          <div className="text-sm text-gray-600">{share.userEmail}</div>
                          <div className="text-xs text-gray-500">
                            Shared {new Date(share.sharedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getRoleBadgeColor(share.userRole)} variant="secondary">
                          {share.userRole}
                        </Badge>
                        <Badge className={getPermissionColor(share.permissions)}>
                          <PermissionIcon className="w-3 h-3 mr-1" />
                          {getPermissionLabel(share.permissions)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveShare(share.userId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientSharingModal;

