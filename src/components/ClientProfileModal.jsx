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
  client: initialClient, // Rename prop to avoid conflict with state
  isOpen,
  onSave,
  onClose,
  mode = 'create' // 'create', 'edit', 'view'
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    taxpayer_first_name: '',
    taxpayer_last_name: '',
    taxpayer_email: '',
    taxpayer_date_of_birth: '',
    spouse_first_name: '',
    spouse_last_name: '',
    spouse_email: '',
    spouse_date_of_birth: '',
    status: 'prospect',
    notes: '',
    // Custom fields and tags are not directly in the Supabase clients table schema
    // They would need separate tables or be stored as JSONB in a 'metadata' column if available
    // For now, we'll omit them or handle them as simple text if needed.
  });

  const [errors, setErrors] = useState({});

  // Initialize form data when client changes or modal opens
  useEffect(() => {
    if (initialClient && mode !== 'create') {
      setFormData({
        taxpayer_first_name: initialClient.taxpayer_first_name || '',
        taxpayer_last_name: initialClient.taxpayer_last_name || '',
        taxpayer_email: initialClient.taxpayer_email || '',
        taxpayer_date_of_birth: initialClient.taxpayer_date_of_birth ? initialClient.taxpayer_date_of_birth.split('T')[0] : '',
        spouse_first_name: initialClient.spouse_first_name || '',
        spouse_last_name: initialClient.spouse_last_name || '',
        spouse_email: initialClient.spouse_email || '',
        spouse_date_of_birth: initialClient.spouse_date_of_birth ? initialClient.spouse_date_of_birth.split('T')[0] : '',
        status: initialClient.status || 'prospect',
        notes: initialClient.notes || '',
      });
    } else if (mode === 'create') {
      // Reset form for new client
      setFormData({
        taxpayer_first_name: '',
        taxpayer_last_name: '',
        taxpayer_email: '',
        taxpayer_date_of_birth: '',
        spouse_first_name: '',
        spouse_last_name: '',
        spouse_email: '',
        spouse_date_of_birth: '',
        status: 'prospect',
        notes: '',
      });
    }
    setErrors({});
    setActiveTab('basic');
  }, [initialClient, mode, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.taxpayer_first_name.trim()) {
      newErrors.taxpayer_first_name = 'Taxpayer first name is required';
    }
    if (!formData.taxpayer_last_name.trim()) {
      newErrors.taxpayer_last_name = 'Taxpayer last name is required';
    }

    if (formData.taxpayer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.taxpayer_email)) {
      newErrors.taxpayer_email = 'Please enter a valid email address';
    }

    if (formData.spouse_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.spouse_email)) {
      newErrors.spouse_email = 'Please enter a valid email address for spouse';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const dataToSave = {
      ...formData,
      // Ensure date fields are null if empty string, as Supabase expects null for empty dates
      taxpayer_date_of_birth: formData.taxpayer_date_of_birth || null,
      spouse_date_of_birth: formData.spouse_date_of_birth || null,
    };

    onSave(dataToSave);
  };

  const clientStatuses = [
    { value: 'prospect', label: 'Prospect' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
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
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="spouse">Spouse Info</TabsTrigger>
            {/* Removed Contact, Planning, Custom Fields tabs as they don't directly map to current schema */}
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxpayer_first_name">Taxpayer First Name *</Label>
                <Input
                  id="taxpayer_first_name"
                  value={formData.taxpayer_first_name}
                  onChange={(e) => handleInputChange('taxpayer_first_name', e.target.value)}
                  placeholder="John"
                  disabled={mode === 'view'}
                  className={errors.taxpayer_first_name ? 'border-red-500' : ''}
                />
                {errors.taxpayer_first_name && (
                  <p className="text-red-500 text-sm">{errors.taxpayer_first_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxpayer_last_name">Taxpayer Last Name *</Label>
                <Input
                  id="taxpayer_last_name"
                  value={formData.taxpayer_last_name}
                  onChange={(e) => handleInputChange('taxpayer_last_name', e.target.value)}
                  placeholder="Doe"
                  disabled={mode === 'view'}
                  className={errors.taxpayer_last_name ? 'border-red-500' : ''}
                />
                {errors.taxpayer_last_name && (
                  <p className="text-red-500 text-sm">{errors.taxpayer_last_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxpayer_email">Taxpayer Email</Label>
                <Input
                  id="taxpayer_email"
                  type="email"
                  value={formData.taxpayer_email}
                  onChange={(e) => handleInputChange('taxpayer_email', e.target.value)}
                  placeholder="john.doe@example.com"
                  disabled={mode === 'view'}
                  className={errors.taxpayer_email ? 'border-red-500' : ''}
                />
                {errors.taxpayer_email && (
                  <p className="text-red-500 text-sm">{errors.taxpayer_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxpayer_date_of_birth">Taxpayer Date of Birth</Label>
                <Input
                  id="taxpayer_date_of_birth"
                  type="date"
                  value={formData.taxpayer_date_of_birth}
                  onChange={(e) => handleInputChange('taxpayer_date_of_birth', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={mode === 'view'}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientStatuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

          {/* Spouse Information Tab */}
          <TabsContent value="spouse" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spouse_first_name">Spouse First Name</Label>
                <Input
                  id="spouse_first_name"
                  value={formData.spouse_first_name}
                  onChange={(e) => handleInputChange('spouse_first_name', e.target.value)}
                  placeholder="Jane"
                  disabled={mode === 'view'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouse_last_name">Spouse Last Name</Label>
                <Input
                  id="spouse_last_name"
                  value={formData.spouse_last_name}
                  onChange={(e) => handleInputChange('spouse_last_name', e.target.value)}
                  placeholder="Doe"
                  disabled={mode === 'view'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouse_email">Spouse Email</Label>
                <Input
                  id="spouse_email"
                  type="email"
                  value={formData.spouse_email}
                  onChange={(e) => handleInputChange('spouse_email', e.target.value)}
                  placeholder="jane.doe@example.com"
                  disabled={mode === 'view'}
                  className={errors.spouse_email ? 'border-red-500' : ''}
                />
                {errors.spouse_email && (
                  <p className="text-red-500 text-sm">{errors.spouse_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="spouse_date_of_birth">Spouse Date of Birth</Label>
                <Input
                  id="spouse_date_of_birth"
                  type="date"
                  value={formData.spouse_date_of_birth}
                  onChange={(e) => handleInputChange('spouse_date_of_birth', e.target.value)}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {mode !== 'view' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Client</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileModal;


