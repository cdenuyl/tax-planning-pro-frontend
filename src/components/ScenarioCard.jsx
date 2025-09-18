import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { 
  Edit, 
  Trash, 
  Copy, 
  Check, 
  Calendar, 
  Tag,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';

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

const ScenarioCard = ({ 
  scenario, 
  isSelected,
  onSelect,
  onEdit, 
  onDuplicate, 
  onActivate, 
  onDelete,
  canDelete = true
}) => {
  if (!scenario) return null;
  
  const { 
    id, 
    name, 
    description, 
    isActive, 
    createdDate, 
    lastModified, 
    tags = [],
    results = {}
  } = scenario;
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };
  
  return (
    <Card className={`scenario-card ${isActive ? 'border-blue-500 border-2' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={onSelect}
              id={`select-scenario-${id}`}
            />
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <CardDescription>
                {description || 'No description provided'}
              </CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2" size={16} />
                Edit Scenario
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2" size={16} />
                Duplicate Scenario
              </DropdownMenuItem>
              {!isActive && (
                <DropdownMenuItem onClick={onActivate}>
                  <Check className="mr-2" size={16} />
                  Set as Active
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700 focus:text-red-700"
                >
                  <Trash className="mr-2" size={16} />
                  Delete Scenario
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {isActive && (
            <Badge className="bg-blue-500 hover:bg-blue-600">
              Active
            </Badge>
          )}
          
          {tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500">Federal Tax</span>
            <span className="font-medium">{formatCurrency(results.federalTax)}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-500">State Tax</span>
            <span className="font-medium">{formatCurrency(results.stateTax)}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-500">Effective Rate</span>
            <span className="font-medium">{formatPercentage(results.effectiveRate)}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-gray-500">Marginal Rate</span>
            <span className="font-medium">{formatPercentage(results.marginalRate)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <Calendar size={14} />
          <span>Last calculated: {results.lastCalculated ? formatDate(results.lastCalculated) : 'Never'}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between">
        <div className="flex items-center text-xs text-gray-500">
          <Calendar size={14} className="mr-1" />
          <span>Modified: {formatDate(lastModified)}</span>
        </div>
        
        {!isActive && (
          <Button variant="ghost" size="sm" onClick={onActivate} className="text-blue-600">
            <Check size={14} className="mr-1" />
            Activate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ScenarioCard;

