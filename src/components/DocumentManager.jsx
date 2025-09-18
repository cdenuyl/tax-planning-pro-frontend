import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
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
  FileText,
  Download,
  Upload,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  AlertCircle,
  X,
  File,
  FileText as FileTextIcon
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

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === undefined || bytes === null) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon based on type
const getFileIcon = (fileType) => {
  switch (fileType) {
    case 'pdf':
      return <FileText size={24} className="text-red-500" />;
    case 'image':
      return <File size={24} className="text-blue-500" />;
    case 'spreadsheet':
      return <FileText size={24} className="text-green-500" />;
    case 'document':
      return <FileTextIcon size={24} className="text-yellow-500" />;
    default:
      return <File size={24} className="text-gray-500" />;
  }
};

const DocumentManager = ({ documents = [], onDocumentsUpdate }) => {
  // State for document operations
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentModalMode, setDocumentModalMode] = useState('create'); // 'create', 'edit'
  const [editingDocument, setEditingDocument] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // State for document form
  const [documentForm, setDocumentForm] = useState({
    name: '',
    description: '',
    type: 'document',
    category: 'tax',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('uploadDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Handle new document
  const handleNewDocument = () => {
    setDocumentModalMode('create');
    setEditingDocument(null);
    setDocumentForm({
      name: '',
      description: '',
      type: 'document',
      category: 'tax',
      tags: []
    });
    setErrors({});
    setShowDocumentModal(true);
  };
  
  // Handle edit document
  const handleEditDocument = (document) => {
    setDocumentModalMode('edit');
    setEditingDocument(document);
    setDocumentForm({
      name: document.name || '',
      description: document.description || '',
      type: document.type || 'document',
      category: document.category || 'tax',
      tags: document.tags || []
    });
    setErrors({});
    setShowDocumentModal(true);
  };
  
  // Handle delete document
  const handleDeleteDocument = (documentId) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    onDocumentsUpdate(updatedDocuments);
    setShowDeleteConfirm(null);
  };
  
  // Handle save document
  const handleSaveDocument = () => {
    // Validate form
    const newErrors = {};
    if (!documentForm.name.trim()) {
      newErrors.name = 'Document name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const now = new Date().toISOString();
    
    if (documentModalMode === 'create') {
      // Create new document
      const newDocument = {
        id: `doc_${Date.now()}`,
        name: documentForm.name,
        description: documentForm.description,
        type: documentForm.type,
        category: documentForm.category,
        tags: documentForm.tags,
        uploadDate: now,
        fileSize: 0, // This would be set when a real file is uploaded
        fileUrl: '', // This would be set when a real file is uploaded
        uploadedBy: 'Current User' // This would be set to the actual user
      };
      
      onDocumentsUpdate([...documents, newDocument]);
    } else if (documentModalMode === 'edit') {
      // Update existing document
      const updatedDocuments = documents.map(doc => {
        if (doc.id === editingDocument.id) {
          return {
            ...doc,
            name: documentForm.name,
            description: documentForm.description,
            type: documentForm.type,
            category: documentForm.category,
            tags: documentForm.tags,
            lastModified: now
          };
        }
        return doc;
      });
      
      onDocumentsUpdate(updatedDocuments);
    }
    
    setShowDocumentModal(false);
  };
  
  // Handle input change
  const handleInputChange = (field, value) => {
    setDocumentForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Handle add tag
  const handleAddTag = () => {
    if (newTag.trim() && !documentForm.tags.includes(newTag.trim())) {
      setDocumentForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  // Handle remove tag
  const handleRemoveTag = (tagToRemove) => {
    setDocumentForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Filter and sort documents
  const getFilteredAndSortedDocuments = () => {
    let result = [...documents];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.name?.toLowerCase().includes(lowerSearchTerm) ||
        doc.description?.toLowerCase().includes(lowerSearchTerm) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(doc => doc.category === categoryFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(doc => doc.type === typeFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let fieldA, fieldB;
      
      // Handle date fields
      if (sortField === 'uploadDate' || sortField === 'lastModified') {
        fieldA = new Date(a[sortField] || 0);
        fieldB = new Date(b[sortField] || 0);
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
  
  const filteredDocuments = getFilteredAndSortedDocuments();
  
  // Document categories
  const documentCategories = [
    { value: 'tax', label: 'Tax Documents' },
    { value: 'financial', label: 'Financial Statements' },
    { value: 'legal', label: 'Legal Documents' },
    { value: 'planning', label: 'Planning Documents' },
    { value: 'reports', label: 'Reports' },
    { value: 'other', label: 'Other' }
  ];
  
  // Document types
  const documentTypes = [
    { value: 'document', label: 'Document' },
    { value: 'pdf', label: 'PDF' },
    { value: 'spreadsheet', label: 'Spreadsheet' },
    { value: 'image', label: 'Image' },
    { value: 'other', label: 'Other' }
  ];
  
  return (
    <div className="document-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Documents</h2>
          <p className="text-sm text-gray-500">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} available
          </p>
        </div>
        
        <Button onClick={handleNewDocument}>
          <Plus size={16} className="mr-2" />
          New Document
        </Button>
      </div>
      
      <div className="search-filter-bar flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="filter-sort-controls flex flex-wrap gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {documentCategories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uploadDate">Upload Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="fileSize">File Size</SelectItem>
              <SelectItem value="category">Category</SelectItem>
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
      
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-gray-400 mb-4" />
            <p className="text-lg text-gray-500 mb-4">
              {documents.length === 0 ? 'No documents available' : 'No documents match your filters'}
            </p>
            <Button onClick={handleNewDocument}>
              <Plus size={16} className="mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map(doc => (
            <Card key={doc.id} className="document-card">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getFileIcon(doc.type)}
                    <div>
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                      <CardDescription>
                        {doc.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditDocument(doc)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(doc.id)}>
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-gray-500" />
                    <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <FileText size={14} className="text-gray-500" />
                    <span>Size: {formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
                
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {doc.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between">
                <Badge variant="outline">
                  {documentCategories.find(c => c.value === doc.category)?.label || doc.category}
                </Badge>
                
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Download size={14} />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Document Modal */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {documentModalMode === 'create' ? 'Upload New Document' : 'Edit Document'}
            </DialogTitle>
            <DialogDescription>
              {documentModalMode === 'create' 
                ? 'Upload a new document for this client' 
                : 'Update the document details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="document-name">Document Name *</Label>
              <Input
                id="document-name"
                value={documentForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., 2024 Tax Return, Financial Plan"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="document-description">Description</Label>
              <Textarea
                id="document-description"
                value={documentForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter a description of this document..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document-category">Category</Label>
                <Select
                  value={documentForm.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger id="document-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentCategories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document-type">Type</Label>
                <Select
                  value={documentForm.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {documentModalMode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="document-file">File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">Drag and drop a file here, or click to select a file</p>
                  <Button variant="outline" size="sm">
                    Select File
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Max file size: 10MB
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {documentForm.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
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
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDocument}>
              {documentModalMode === 'create' ? 'Upload Document' : 'Save Changes'}
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
              This will permanently delete the document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteDocument(showDeleteConfirm)}
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

export default DocumentManager;

