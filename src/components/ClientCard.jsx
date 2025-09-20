import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Edit, 
  Archive, 
  Eye, 
  MoreHorizontal, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Tag
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

// Helper function to get client type display name
const getClientTypeDisplay = (clientType) => {
  const typeMap = {
    'individual': 'Individual',
    'couple': 'Couple',
    'retiree': 'Retiree',
    'business': 'Business'
  };
  
  return typeMap[clientType] || clientType;
};

// Helper function to get scenario count text
const getScenarioCountText = (scenarios) => {
  if (!scenarios || scenarios.length === 0) {
    return 'No scenarios';
  }
  
  if (scenarios.length === 1) {
    return '1 scenario';
  }
  
  return `${scenarios.length} scenarios`;
};

const ClientCard = ({ client, onSelect, onEdit, onArchive }) => {
  if (!client || !client.profile) {
    return null;
  }
  
  const { profile, scenarios = [] } = client;
  const activeScenario = scenarios.find(s => s.isActive);
  
  return (
    <Card className={`client-card ${profile.isArchived ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{profile.clientName}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <User size={14} />
              {profile.primaryContact || 'No primary contact'}
            </CardDescription>
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
              <DropdownMenuItem onClick={() => onSelect(client.id)}>
                <Eye className="mr-2" size={16} />
                Activate Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(client.id)}>
                <Edit className="mr-2" size={16} />
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(client.id)}>
                <Archive className="mr-2" size={16} />
                {profile.isArchived ? 'Unarchive Client' : 'Archive Client'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="text-xs">
            {getClientTypeDisplay(profile.clientType)}
          </Badge>
          
          {profile.isArchived && (
            <Badge variant="secondary" className="text-xs">
              Archived
            </Badge>
          )}
          
          {profile.tags && profile.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          
          {profile.tags && profile.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{profile.tags.length - 2} more
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          {profile.email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-500" />
              <span className="truncate">{profile.email}</span>
            </div>
          )}
          
          {profile.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-500" />
              <span>{profile.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-500" />
            <span>Modified: {formatDate(profile.lastModified)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-500" />
            <span>{getScenarioCountText(scenarios)}</span>
          </div>
        </div>
        
        {activeScenario && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Active Scenario:</div>
            <div className="text-sm font-medium">{activeScenario.name}</div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={() => onEdit(client.id)}>
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
          <Button size="sm" onClick={() => onSelect(client.id)}>
            <Eye size={14} className="mr-1" />
            Activate
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ClientCard;

