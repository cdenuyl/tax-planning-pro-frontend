import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { 
  Plus, 
  Edit, 
  Trash, 
  Calendar, 
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  X
} from 'lucide-react';

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

// Helper function to get priority badge
const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'high':
      return <Badge className="bg-red-500 hover:bg-red-600">High</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
    case 'low':
      return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Helper function to get status badge
const getStatusBadge = (status) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case 'in-progress':
      return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const ActionItemManager = ({ actionItems = [], onActionItemsUpdate }) => {
  // State for action item operations
  const [showActionItemModal, setShowActionItemModal] = useState(false);
  const [actionItemModalMode, setActionItemModalMode] = useState('create'); // 'create', 'edit'
  const [editingActionItem, setEditingActionItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // State for action item form
  const [actionItemForm, setActionItemForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: ''
  });
  const [errors, setErrors] = useState({});
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Handle new action item
  const handleNewActionItem = () => {
    setActionItemModalMode('create');
    setEditingActionItem(null);
    setActionItemForm({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
      assignedTo: ''
    });
    setErrors({});
    setShowActionItemModal(true);
  };
  
  // Handle edit action item
  const handleEditActionItem = (actionItem) => {
    setActionItemModalMode('edit');
    setEditingActionItem(actionItem);
    
    // Format date for input field
    let formattedDueDate = '';
    if (actionItem.dueDate) {
      try {
        const date = new Date(actionItem.dueDate);
        formattedDueDate = date.toISOString().split('T')[0];
      } catch (error) {
        console.error('Error formatting date:', error);
      }
    }
    
    setActionItemForm({
      title: actionItem.title || '',
      description: actionItem.description || '',
      status: actionItem.status || 'pending',
      priority: actionItem.priority || 'medium',
      dueDate: formattedDueDate,
      assignedTo: actionItem.assignedTo || ''
    });
    setErrors({});
    setShowActionItemModal(true);
  };
  
  // Handle delete action item
  const handleDeleteActionItem = (actionItemId) => {
    const updatedActionItems = actionItems.filter(item => item.id !== actionItemId);
    onActionItemsUpdate(updatedActionItems);
    setShowDeleteConfirm(null);
  };
  
  // Handle toggle action item status
  const handleToggleStatus = (actionItemId) => {
    const updatedActionItems = actionItems.map(item => {
      if (item.id === actionItemId) {
        const newStatus = item.status === 'completed' ? 'pending' : 'completed';
        const completedDate = newStatus === 'completed' ? new Date().toISOString() : null;
        
        return {
          ...item,
          status: newStatus,
          completedDate
        };
      }
      return item;
    });
    
    onActionItemsUpdate(updatedActionItems);
  };
  
  // Handle save action item
  const handleSaveActionItem = () => {
    // Validate form
    const newErrors = {};
    if (!actionItemForm.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const now = new Date().toISOString();
    
    // Convert form date to ISO string if provided
    let dueDate = null;
    if (actionItemForm.dueDate) {
      try {
        dueDate = new Date(actionItemForm.dueDate).toISOString();
      } catch (error) {
        console.error('Error converting date:', error);
      }
    }
    
    if (actionItemModalMode === 'create') {
      // Create new action item
      const newActionItem = {
        id: `action_${Date.now()}`,
        title: actionItemForm.title,
        description: actionItemForm.description,
        status: actionItemForm.status,
        priority: actionItemForm.priority,
        dueDate,
        assignedTo: actionItemForm.assignedTo,
        createdDate: now,
        completedDate: actionItemForm.status === 'completed' ? now : null
      };
      
      onActionItemsUpdate([...actionItems, newActionItem]);
    } else if (actionItemModalMode === 'edit') {
      // Update existing action item
      const updatedActionItems = actionItems.map(item => {
        if (item.id === editingActionItem.id) {
          return {
            ...item,
            title: actionItemForm.title,
            description: actionItemForm.description,
            status: actionItemForm.status,
            priority: actionItemForm.priority,
            dueDate,
            assignedTo: actionItemForm.assignedTo,
            completedDate: actionItemForm.status === 'completed' 
              ? (item.completedDate || now) 
              : null
          };
        }
        return item;
      });
      
      onActionItemsUpdate(updatedActionItems);
    }
    
    setShowActionItemModal(false);
  };
  
  // Handle input change
  const handleInputChange = (field, value) => {
    setActionItemForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Filter and sort action items
  const getFilteredAndSortedActionItems = () => {
    let result = [...actionItems];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.title?.toLowerCase().includes(lowerSearchTerm) ||
        item.description?.toLowerCase().includes(lowerSearchTerm) ||
        item.assignedTo?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(item => item.priority === priorityFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let fieldA, fieldB;
      
      // Handle date fields
      if (sortField === 'dueDate' || sortField === 'createdDate' || sortField === 'completedDate') {
        fieldA = a[sortField] ? new Date(a[sortField]) : new Date(8640000000000000); // Far future for null dates
        fieldB = b[sortField] ? new Date(b[sortField]) : new Date(8640000000000000);
      } else {
        fieldA = a[sortField] || '';
        fieldB = b[sortField] || '';
        
        // Handle string comparison
        if (typeof fieldA === 'string') {
          fieldA = fieldA.toLowerCase();
          fieldB = fieldB.toLowerCase();
        }
      }
      
      // Apply sort direction
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
    
    return result;
  };
  
  const filteredActionItems = getFilteredAndSortedActionItems();
  
  // Check if an action item is overdue
  const isOverdue = (item) => {
    if (item.status === 'completed' || !item.dueDate) return false;
    
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dueDate < today;
  };
  
  return (
    <div className="action-item-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Action Items</h2>
          <p className="text-sm text-gray-500">
            {actionItems.length} {actionItems.length === 1 ? 'action item' : 'action items'} available
          </p>
        </div>
        
        <Button onClick={handleNewActionItem}>
          <Plus size={16} className="mr-2" />
          New Action Item
        </Button>
      </div>
      
      <div className="search-filter-bar flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search action items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="filter-sort-controls flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="createdDate">Created Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-2"
          >
            {sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
            {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </div>
      
      {filteredActionItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-gray-400 mb-4" />
            <p className="text-lg text-gray-500 mb-4">
              {actionItems.length === 0 ? 'No action items available' : 'No action items match your filters'}
            </p>
            <Button onClick={handleNewActionItem}>
              <Plus size={16} className="mr-2" />
              Create First Action Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredActionItems.map(item => (
            <Card 
              key={item.id} 
              className={`action-item-card ${
                item.status === 'completed' ? 'border-green-200 bg-green-50' : 
                isOverdue(item) ? 'border-red-200 bg-red-50' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={item.status === 'completed'}
                      onCheckedChange={() => handleToggleStatus(item.id)}
                      id={`complete-${item.id}`}
                    />
                    <div>
                      <CardTitle className={`text-lg ${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                        {item.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        {getPriorityBadge(item.priority)}
                        {getStatusBadge(item.status)}
                        
                        {item.dueDate && (
                          <span className={`flex items-center gap-1 ${
                            isOverdue(item) ? 'text-red-600 font-medium' : ''
                          }`}>
                            <Calendar size={14} />
                            Due: {formatDate(item.dueDate)}
                            {isOverdue(item) && ' (Overdue)'}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditActionItem(item)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(item.id)}>
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {item.description && (
                <CardContent className="pb-2">
                  <div className="text-sm">{item.description}</div>
                </CardContent>
              )}
              
              <CardFooter className="pt-2 flex justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  {item.assignedTo && (
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      Assigned to: {item.assignedTo}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {item.status === 'completed' && item.completedDate && (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-500" />
                      Completed: {formatDate(item.completedDate)}
                    </span>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Action Item Modal */}
      <Dialog open={showActionItemModal} onOpenChange={setShowActionItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionItemModalMode === 'create' ? 'Create New Action Item' : 'Edit Action Item'}
            </DialogTitle>
            <DialogDescription>
              {actionItemModalMode === 'create' 
                ? 'Add a new action item for this client' 
                : 'Update the action item details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action-title">Title *</Label>
              <Input
                id="action-title"
                value={actionItemForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Review tax documents, Schedule meeting"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="action-description">Description</Label>
              <Textarea
                id="action-description"
                value={actionItemForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter details about this action item..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="action-status">Status</Label>
                <Select
                  value={actionItemForm.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger id="action-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action-priority">Priority</Label>
                <Select
                  value={actionItemForm.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger id="action-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="action-due-date">Due Date</Label>
                <Input
                  id="action-due-date"
                  type="date"
                  value={actionItemForm.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="action-assigned-to">Assigned To</Label>
                <Input
                  id="action-assigned-to"
                  value={actionItemForm.assignedTo}
                  onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                  placeholder="Name of person responsible"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionItemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveActionItem}>
              {actionItemModalMode === 'create' ? 'Create Action Item' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the action item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteActionItem(showDeleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActionItemManager;

