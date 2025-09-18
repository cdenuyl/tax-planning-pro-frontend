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
  Plus, 
  Edit, 
  Trash, 
  Calendar, 
  User,
  Tag,
  Search,
  SortAsc,
  SortDesc,
  AlertCircle,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  } catch (error) {
    return 'Invalid date';
  }
};

const NotesManager = ({ notes = [], onNotesUpdate }) => {
  // State for notes operations
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteModalMode, setNoteModalMode] = useState('create'); // 'create', 'edit'
  const [editingNote, setEditingNote] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // State for note form
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    author: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdDate');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Handle new note
  const handleNewNote = () => {
    setNoteModalMode('create');
    setEditingNote(null);
    setNoteForm({
      title: '',
      content: '',
      author: '',
      tags: []
    });
    setErrors({});
    setShowNoteModal(true);
  };
  
  // Handle edit note
  const handleEditNote = (note) => {
    setNoteModalMode('edit');
    setEditingNote(note);
    setNoteForm({
      title: note.title || '',
      content: note.content || '',
      author: note.author || '',
      tags: note.tags || []
    });
    setErrors({});
    setShowNoteModal(true);
  };
  
  // Handle delete note
  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    onNotesUpdate(updatedNotes);
    setShowDeleteConfirm(null);
  };
  
  // Handle save note
  const handleSaveNote = () => {
    // Validate form
    const newErrors = {};
    if (!noteForm.title.trim()) {
      newErrors.title = 'Note title is required';
    }
    
    if (!noteForm.content.trim()) {
      newErrors.content = 'Note content is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const now = new Date().toISOString();
    
    if (noteModalMode === 'create') {
      // Create new note
      const newNote = {
        id: `note_${Date.now()}`,
        title: noteForm.title,
        content: noteForm.content,
        author: noteForm.author,
        tags: noteForm.tags,
        createdDate: now,
        lastModified: now
      };
      
      onNotesUpdate([...notes, newNote]);
    } else if (noteModalMode === 'edit') {
      // Update existing note
      const updatedNotes = notes.map(note => {
        if (note.id === editingNote.id) {
          return {
            ...note,
            title: noteForm.title,
            content: noteForm.content,
            author: noteForm.author,
            tags: noteForm.tags,
            lastModified: now
          };
        }
        return note;
      });
      
      onNotesUpdate(updatedNotes);
    }
    
    setShowNoteModal(false);
  };
  
  // Handle input change
  const handleInputChange = (field, value) => {
    setNoteForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Handle add tag
  const handleAddTag = () => {
    if (newTag.trim() && !noteForm.tags.includes(newTag.trim())) {
      setNoteForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  // Handle remove tag
  const handleRemoveTag = (tagToRemove) => {
    setNoteForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Filter and sort notes
  const getFilteredAndSortedNotes = () => {
    let result = [...notes];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(note => 
        note.title?.toLowerCase().includes(lowerSearchTerm) ||
        note.content?.toLowerCase().includes(lowerSearchTerm) ||
        note.author?.toLowerCase().includes(lowerSearchTerm) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let fieldA, fieldB;
      
      // Handle date fields
      if (sortField === 'createdDate' || sortField === 'lastModified') {
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
  
  const filteredNotes = getFilteredAndSortedNotes();
  
  return (
    <div className="notes-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Notes</h2>
          <p className="text-sm text-gray-500">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} available
          </p>
        </div>
        
        <Button onClick={handleNewNote}>
          <Plus size={16} className="mr-2" />
          New Note
        </Button>
      </div>
      
      <div className="search-sort-bar flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-grow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="sort-controls flex gap-2">
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdDate">Created Date</SelectItem>
              <SelectItem value="lastModified">Last Modified</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="author">Author</SelectItem>
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
      
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle size={48} className="text-gray-400 mb-4" />
            <p className="text-lg text-gray-500 mb-4">
              {notes.length === 0 ? 'No notes available' : 'No notes match your search'}
            </p>
            <Button onClick={handleNewNote}>
              <Plus size={16} className="mr-2" />
              Create First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map(note => (
            <Card key={note.id} className="note-card">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{note.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditNote(note)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(note.id)}>
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <User size={14} />
                  {note.author || 'Unknown author'}
                  <span className="mx-1">•</span>
                  <Calendar size={14} />
                  {formatDate(note.createdDate)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="whitespace-pre-wrap">{note.content}</div>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 text-xs text-gray-500">
                Last modified: {formatDate(note.lastModified)}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteModalMode === 'create' ? 'Create New Note' : 'Edit Note'}
            </DialogTitle>
            <DialogDescription>
              {noteModalMode === 'create' 
                ? 'Add a new note for this client' 
                : 'Update the note details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title *</Label>
              <Input
                id="note-title"
                value={noteForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Meeting Notes, Tax Strategy Discussion"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-author">Author</Label>
              <Input
                id="note-author"
                value={noteForm.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Your name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="note-content">Content *</Label>
              <Textarea
                id="note-content"
                value={noteForm.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter note content..."
                rows={6}
                className={errors.content ? 'border-red-500' : ''}
              />
              {errors.content && (
                <p className="text-red-500 text-sm">{errors.content}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {noteForm.tags.map(tag => (
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
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>
              {noteModalMode === 'create' ? 'Create Note' : 'Save Changes'}
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
              This will permanently delete the note. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteNote(showDeleteConfirm)}
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

export default NotesManager;

