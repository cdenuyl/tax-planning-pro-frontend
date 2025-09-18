import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { 
  User, 
  Settings, 
  Shield, 
  Users, 
  Share2, 
  Eye, 
  Edit, 
  Building,
  Mail,
  Phone,
  Calendar,
  Lock,
  Bell,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { 
  getCurrentUser, 
  updateUserProfile, 
  getClientAccess,
  getAccessibleClients,
  clearSession,
  USER_ROLES,
  hasPermission,
  PERMISSIONS
} from '../../utils/auth.js';

const UserSettings = ({ onLogout, allClients = [] }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accessibleClients, setAccessibleClients] = useState([]);
  const [clientAccess, setClientAccess] = useState({ ownedClients: [], sharedClients: [] });
  
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    firmName: '',
    title: '',
    phone: '',
    licenseNumber: '',
    bio: ''
  });
  
  const [preferencesForm, setPreferencesForm] = useState({
    theme: 'light',
    notifications: true,
    autoLogout: 24
  });
  
  useEffect(() => {
    loadUserData();
    loadClientAccess();
  }, [allClients]);
  
  const loadUserData = () => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        firmName: user.profile?.firmName || '',
        title: user.profile?.title || '',
        phone: user.profile?.phone || '',
        licenseNumber: user.profile?.licenseNumber || '',
        bio: user.profile?.bio || ''
      });
      setPreferencesForm({
        theme: user.preferences?.theme || 'light',
        notifications: user.preferences?.notifications !== false,
        autoLogout: user.preferences?.autoLogout || 24
      });
    }
  };
  
  const loadClientAccess = () => {
    const user = getCurrentUser();
    if (user) {
      const access = getClientAccess(user.id);
      setClientAccess(access);
      
      const accessible = getAccessibleClients(user.id, allClients);
      setAccessibleClients(accessible);
    }
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = updateUserProfile(currentUser.id, {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        profile: {
          ...currentUser.profile,
          firmName: profileForm.firmName,
          title: profileForm.title,
          phone: profileForm.phone,
          licenseNumber: profileForm.licenseNumber,
          bio: profileForm.bio
        }
      });
      
      if (result.success) {
        setCurrentUser(result.user);
        setSuccess('Profile updated successfully!');
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
  
  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const result = updateUserProfile(currentUser.id, {
        preferences: {
          ...currentUser.preferences,
          ...preferencesForm
        }
      });
      
      if (result.success) {
        setCurrentUser(result.user);
        setSuccess('Preferences updated successfully!');
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
  
  const handleLogout = () => {
    clearSession();
    if (onLogout) {
      onLogout();
    }
  };
  
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
  
  const getAccessTypeBadge = (accessType, permissions) => {
    if (accessType === 'owner') {
      return <Badge className="bg-blue-100 text-blue-800">Owner</Badge>;
    }
    
    if (permissions.includes('share')) {
      return <Badge className="bg-purple-100 text-purple-800">Can Share</Badge>;
    }
    
    if (permissions.includes('edit')) {
      return <Badge className="bg-orange-100 text-orange-800">Can Edit</Badge>;
    }
    
    return <Badge className="bg-gray-100 text-gray-800">View Only</Badge>;
  };
  
  if (!currentUser) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Unable to load user settings. Please try logging in again.</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your profile, preferences, and client access</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="flex items-center space-x-2">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
      
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
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Client Access</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription>
                Update your personal and professional information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firmName">Firm Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="firmName"
                        value={profileForm.firmName}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, firmName: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={profileForm.title}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={profileForm.licenseNumber}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief professional bio..."
                  />
                </div>
                
                <div className="flex items-center space-x-4 pt-4 border-t">
                  <Badge className={getRoleBadgeColor(currentUser.role)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {currentUser.role}
                  </Badge>
                  <div className="text-sm text-gray-600 flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Preferences</span>
              </CardTitle>
              <CardDescription>
                Customize your application experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferencesUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setPreferencesForm(prev => ({ ...prev, theme: 'light' }))}
                        className={`flex items-center space-x-2 p-3 border rounded-lg ${
                          preferencesForm.theme === 'light' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferencesForm(prev => ({ ...prev, theme: 'dark' }))}
                        className={`flex items-center space-x-2 p-3 border rounded-lg ${
                          preferencesForm.theme === 'dark' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <Moon className="w-4 h-4" />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notifications</Label>
                      <p className="text-sm text-gray-600">Receive email notifications for important updates</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreferencesForm(prev => ({ ...prev, notifications: !prev.notifications }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferencesForm.notifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferencesForm.notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="autoLogout">Auto Logout (hours)</Label>
                    <Input
                      id="autoLogout"
                      type="number"
                      min="1"
                      max="168"
                      value={preferencesForm.autoLogout}
                      onChange={(e) => setPreferencesForm(prev => ({ ...prev, autoLogout: parseInt(e.target.value) }))}
                      className="w-32"
                    />
                    <p className="text-sm text-gray-600">Automatically log out after this many hours of inactivity</p>
                  </div>
                </div>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Preferences'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Client Access Tab */}
        <TabsContent value="clients">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Client Access Overview</span>
                </CardTitle>
                <CardDescription>
                  View your owned clients and clients shared with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{clientAccess.ownedClients.length}</div>
                    <div className="text-sm text-blue-800">Owned Clients</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{clientAccess.sharedClients.length}</div>
                    <div className="text-sm text-green-800">Shared with Me</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{accessibleClients.length}</div>
                    <div className="text-sm text-purple-800">Total Access</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Accessible Clients</h4>
                  {accessibleClients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No clients accessible to you yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {accessibleClients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{client.clientName}</div>
                            <div className="text-sm text-gray-600">{client.primaryContact}</div>
                            {client.accessType === 'shared' && client.sharedAt && (
                              <div className="text-xs text-gray-500">
                                Shared {new Date(client.sharedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getAccessTypeBadge(client.accessType, client.permissions)}
                            {client.accessType === 'shared' && (
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Share2 className="w-3 h-3" />
                                <span>Shared</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Settings</span>
              </CardTitle>
              <CardDescription>
                Manage your account security and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Password</div>
                    <div className="text-sm text-gray-600">Last changed: Never</div>
                  </div>
                  <Button variant="outline" disabled>
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">Account Permissions</div>
                  <div className="space-y-2">
                    {Object.values(PERMISSIONS).map((permission) => (
                      <div key={permission} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{permission.replace(/_/g, ' ')}</span>
                        <Badge variant={hasPermission(permission) ? "default" : "secondary"}>
                          {hasPermission(permission) ? "Granted" : "Denied"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Security Notice</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    This is a demo environment. In production, additional security features like 
                    two-factor authentication and password changes would be available.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettings;

