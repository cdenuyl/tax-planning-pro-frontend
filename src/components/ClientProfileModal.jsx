import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.jsx';

const ClientProfileModal = ({ 
  client, 
  isOpen, 
  onSave, 
  onClose, 
  mode = 'create' // 'create', 'edit', 'view'
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    clientName: '',
    primaryContact: '',
    email: '',
    phone: '',
    birthdate: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    advisorName: '',
    firmName: '',
    clientType: 'individual',
    riskProfile: 'moderate',
    planningGoals: [],
    notes: '',
    tags: [],
    customFields: {}
  });
  
  const [newTag, setNewTag] = useState('');
  const [newCustomField, setNewCustomField] = useState({ key: '', value: '' });
  const [errors, setErrors] = useState({});
  
  // Initialize form data when client changes
  useEffect(() => {
    if (client && mode !== 'create') {
      setFormData({
        clientName: client.profile.clientName || '',
        primaryContact: client.profile.primaryContact || '',
        email: client.profile.email || '',
        phone: client.profile.phone || '',
        birthdate: client.profile.birthdate || '',
        address: client.profile.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        advisorName: client.profile.advisorName || '',
        firmName: client.profile.firmName || '',
        clientType: client.profile.clientType || 'individual',
        riskProfile: client.profile.riskProfile || 'moderate',
        planningGoals: client.profile.planningGoals || [],
        notes: client.profile.notes || '',
        tags: client.profile.tags || [],
        customFields: client.profile.customFields || {}
      });
    } else if (mode === 'create') {
      // Reset form for new client
      setFormData({
        clientName: '',
        primaryContact: '',
        email: '',
        phone: '',
        birthdate: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        },
        advisorName: '',
        firmName: '',
        clientType: 'individual',
        riskProfile: 'moderate',
        planningGoals: [],
        notes: '',
        tags: [],
        customFields: {}
      });
    }
    setErrors({});
    setActiveTab('basic');
  }, [client, mode, isOpen]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      // Handle nested fields (e.g., address.street)
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      
      // Handle regular fields
      return { ...prev, [field]: value };
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  const handleGoalToggle = (goal) => {
    setFormData(prev => ({
      ...prev,
      planningGoals: prev.planningGoals.includes(goal)
        ? prev.planningGoals.filter(g => g !== goal)
        : [...prev.planningGoals, goal]
    }));
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleAddCustomField = () => {
    if (newCustomField.key.trim() && newCustomField.value.trim()) {
      setFormData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [newCustomField.key.trim()]: newCustomField.value.trim()
        }
      }));
      setNewCustomField({ key: '', value: '' });
    }
  };
  
  const handleRemoveCustomField = (key) => {
    setFormData(prev => {
      const newCustomFields = { ...prev.customFields };
      delete newCustomFields[key];
      return {
        ...prev,
        customFields: newCustomFields
      };
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    
    if (!formData.primaryContact.trim()) {
      newErrors.primaryContact = 'Primary contact is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = () => {
    if (!validateForm()) return;
    
    const profileData = {
      ...formData,
      lastModified: new Date().toISOString()
    };
    
    if (mode === 'create') {
      profileData.createdDate = new Date().toISOString();
      profileData.isActive = true;
      profileData.isArchived = false;
    }
    
    onSave(profileData);
  };
  
  const clientTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'couple', label: 'Married Couple' },
    { value: 'retiree', label: 'Retiree' },
    { value: 'business', label: 'Business Owner' },
    { value: 'trust', label: 'Trust/Estate' }
  ];
  
  const riskProfiles = [
    { value: 'conservative', label: 'Conservative' },
    { value: 'moderate-conservative', label: 'Moderate Conservative' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'moderate-aggressive', label: 'Moderate Aggressive' },
    { value: 'aggressive', label: 'Aggressive' }
  ];
  
  const availableGoals = [
    { value: 'retirement-planning', label: 'Retirement Planning' },
    { value: 'tax-optimization', label: 'Tax Optimization' },
    { value: 'estate-planning', label: 'Estate Planning' },
    { value: 'education-funding', label: 'Education Funding' },
    { value: 'debt-reduction', label: 'Debt Reduction' },
    { value: 'wealth-accumulation', label: 'Wealth Accumulation' },
    { value: 'insurance-planning', label: 'Insurance Planning' },
    { value: 'business-planning', label: 'Business Planning' },
    { value: 'charitable-giving', label: 'Charitable Giving' },
    { value: 'income-generation', label: 'Income Generation' }
  ];
  
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
  ];
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New Client Profile' : 
             mode === 'edit' ? 'Edit Client Profile' : 
             'Client Profile'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new client profile' : 
             mode === 'edit' ? 'Update client information' : 
             'View client information'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="custom">Custom Fields</TabsTrigger>
          </TabsList>
          
          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="John & Jane Doe"
                  disabled={mode === 'view'}
                  className={errors.clientName ? 'border-red-500' : ''}
                />
                {errors.clientName && (
                  <p className="text-red-500 text-sm">{errors.clientName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primaryContact">Primary Contact *</Label>
                <Input
                  id="primaryContact"
                  value={formData.primaryContact}
                  onChange={(e) => handleInputChange('primaryContact', e.target.value)}
                  placeholder="John Doe"
                  disabled={mode === 'view'}
                  className={errors.primaryContact ? 'border-red-500' : ''}
                />
                {errors.primaryContact && (
                  <p className="text-red-500 text-sm">{errors.primaryContact}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthdate">Date of Birth</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => handleInputChange('birthdate', e.target.value)}
                  disabled={mode === 'view'}
                  className={errors.birthdate ? 'border-red-500' : ''}
                />
                {errors.birthdate && (
                  <p className="text-red-500 text-sm">{errors.birthdate}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clientType">Client Type</Label>
                <Select
                  value={formData.clientType}
                  onValueChange={(value) => handleInputChange('clientType', value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger id="clientType">
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="riskProfile">Risk Profile</Label>
                <Select
                  value={formData.riskProfile}
                  onValueChange={(value) => handleInputChange('riskProfile', value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger id="riskProfile">
                    <SelectValue placeholder="Select risk profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {riskProfiles.map(profile => (
                      <SelectItem key={profile.value} value={profile.value}>
                        {profile.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    {mode !== 'view' && (
                      <X 
                        size={14} 
                        className="cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
              {mode !== 'view' && (
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag..."
                    className="flex-grow"
                  />
                  <Button onClick={handleAddTag} size="sm">Add</Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this client..."
                disabled={mode === 'view'}
                rows={4}
              />
            </div>
          </TabsContent>
          
          {/* Contact Information Tab */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john.doe@example.com"
                  disabled={mode === 'view'}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  disabled={mode === 'view'}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                placeholder="123 Main St"
                disabled={mode === 'view'}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  placeholder="Anytown"
                  disabled={mode === 'view'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.address.state}
                  onValueChange={(value) => handleInputChange('address.state', value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  placeholder="12345"
                  disabled={mode === 'view'}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="advisorName">Advisor Name</Label>
                <Input
                  id="advisorName"
                  value={formData.advisorName}
                  onChange={(e) => handleInputChange('advisorName', e.target.value)}
                  placeholder="Your Name"
                  disabled={mode === 'view'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firmName">Firm Name</Label>
                <Input
                  id="firmName"
                  value={formData.firmName}
                  onChange={(e) => handleInputChange('firmName', e.target.value)}
                  placeholder="Advisory Firm LLC"
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Planning Information Tab */}
          <TabsContent value="planning" className="space-y-4">
            <div className="space-y-2">
              <Label>Planning Goals</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableGoals.map(goal => (
                  <div key={goal.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal.value}`}
                      checked={formData.planningGoals.includes(goal.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleGoalToggle(goal.value);
                        } else {
                          handleGoalToggle(goal.value);
                        }
                      }}
                      disabled={mode === 'view'}
                    />
                    <Label
                      htmlFor={`goal-${goal.value}`}
                      className="text-sm font-normal"
                    >
                      {goal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Custom Fields Tab */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-2">
              <Label>Custom Fields</Label>
              {Object.entries(formData.customFields).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(formData.customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-grow grid grid-cols-2 gap-2 border p-2 rounded-md">
                        <div className="font-medium">{key}:</div>
                        <div>{value}</div>
                      </div>
                      {mode !== 'view' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomField(key)}
                        >
                          <X size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No custom fields added yet.</p>
              )}
              
              {mode !== 'view' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                  <Input
                    value={newCustomField.key}
                    onChange={(e) => setNewCustomField({ ...newCustomField, key: e.target.value })}
                    placeholder="Field name"
                    className="md:col-span-1"
                  />
                  <Input
                    value={newCustomField.value}
                    onChange={(e) => setNewCustomField({ ...newCustomField, value: e.target.value })}
                    placeholder="Field value"
                    className="md:col-span-1"
                  />
                  <Button 
                    onClick={handleAddCustomField}
                    disabled={!newCustomField.key.trim() || !newCustomField.value.trim()}
                    className="md:col-span-1"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Field
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          
          {mode !== 'view' && (
            <Button onClick={handleSave}>
              {mode === 'create' ? 'Create Client' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileModal;

