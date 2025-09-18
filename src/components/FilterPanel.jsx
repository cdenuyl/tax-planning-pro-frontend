import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { X } from 'lucide-react';

const FilterPanel = ({ filters, onFilterChange, className = '' }) => {
  // Local state for filter values
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [tagInput, setTagInput] = useState('');
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters]);
  
  // Handle client type change
  const handleClientTypeChange = (value) => {
    const newFilters = { ...localFilters, clientType: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle archived toggle
  const handleArchivedToggle = (checked) => {
    const newFilters = { ...localFilters, isArchived: checked };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (localFilters.tags.includes(newTag)) {
      setTagInput('');
      return;
    }
    
    const newTags = [...localFilters.tags, newTag];
    const newFilters = { ...localFilters, tags: newTags };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
    setTagInput('');
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    const newTags = localFilters.tags.filter(tag => tag !== tagToRemove);
    const newFilters = { ...localFilters, tags: newTags };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle tag input keydown
  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Handle clearing all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      clientType: 'all',
      isArchived: false,
      tags: []
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };
  
  return (
    <Card className={`filter-panel ${className}`}>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client Type Filter */}
          <div className="filter-group">
            <Label htmlFor="client-type" className="mb-2 block">Client Type</Label>
            <Select 
              value={localFilters.clientType} 
              onValueChange={handleClientTypeChange}
              id="client-type"
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="couple">Couple</SelectItem>
                <SelectItem value="retiree">Retiree</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Archived Filter */}
          <div className="filter-group">
            <div className="mb-2 block">&nbsp;</div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-archived" 
                checked={localFilters.isArchived}
                onCheckedChange={handleArchivedToggle}
              />
              <Label htmlFor="show-archived">Show archived clients</Label>
            </div>
          </div>
          
          {/* Clear Filters */}
          <div className="filter-group flex items-end">
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>
          
          {/* Tags Filter */}
          <div className="filter-group md:col-span-3">
            <Label htmlFor="tag-input" className="mb-2 block">Filter by Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Enter tag and press Enter"
                className="flex-grow"
              />
              <Button onClick={handleAddTag}>Add</Button>
            </div>
            
            {localFilters.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {localFilters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      size={14} 
                      className="cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;

