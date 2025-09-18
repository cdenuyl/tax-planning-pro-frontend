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

// Helper function to get client status display name
const getClientStatusDisplay = (status) => {
  const statusMap = {
    'prospect': 'Prospect',
    'active': 'Active',
    'inactive': 'Inactive'
  };

  return statusMap[status] || status;
};

const ClientCard = ({ client, onSelect, onEdit, onArchive, isActive }) => {
  if (!client) {
    return null;
  }

  // Destructure client properties directly from the Supabase schema
  const {
    id,
    taxpayer_first_name,
    taxpayer_last_name,
    taxpayer_email,
    status,
    created_at,
    updated_at,
    // Add other fields as they become available in the client object
  } = client;

  const clientFullName = `${taxpayer_first_name || ''} ${taxpayer_last_name || ''}`.trim();
  const primaryContact = taxpayer_email || 'N/A';

  return (
    <Card className={`client-card ${status === 'inactive' ? 'opacity-60' : ''} ${isActive ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{clientFullName}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <User size={14} />
              {primaryContact}
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
              <DropdownMenuItem onClick={() => onSelect(id)}>
                <Eye className="mr-2" size={16} />
                Activate Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <Edit className="mr-2" size={16} />
                Edit Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(id)}>
                <Archive className="mr-2" size={16} />
                {status === 'inactive' ? 'Unarchive Client' : 'Archive Client'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="text-xs">
            {getClientStatusDisplay(status)}
          </Badge>

          {status === 'inactive' && (
            <Badge variant="secondary" className="text-xs">
              Archived
            </Badge>
          )}

          {/* Tags would need to be handled if they were in a join table or a text field */}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          {taxpayer_email && (
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-500" />
              <span className="truncate">{taxpayer_email}</span>
            </div>
          )}

          {/* Phone number is not in the provided schema */}
          {/* <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-500" />
            <span>{profile.phone}</span>
          </div> */}

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-500" />
            <span>Modified: {formatDate(updated_at)}</span>
          </div>

          {/* Scenario count is not directly in the clients table */}
          {/* <div className="flex items-center gap-2">
            <Tag size={14} className="text-gray-500" />
            <span>{getScenarioCountText(scenarios)}</span>
          </div> */}
        </div>

        {/* Active scenario is not directly in the clients table */}
        {/* {activeScenario && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Active Scenario:</div>
            <div className="text-sm font-medium">{activeScenario.name}</div>
          </div>
        )} */}
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
            <Edit size={14} className="mr-1" />
            Edit
          </Button>
          <Button size="sm" onClick={() => onSelect(id)}>
            <Eye size={14} className="mr-1" />
            Activate
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}; 

export default ClientCard;


