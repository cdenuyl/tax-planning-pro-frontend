import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.jsx';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination.jsx';
import ClientCard from './ClientCard.jsx';
import FilterPanel from './FilterPanel.jsx';
import { PlusCircle, Filter, SortAsc, SortDesc } from 'lucide-react';

const ClientListView = ({ 
  clients = [], 
  onClientSelect, 
  onActivateClient,
  onNewClient, 
  onEditClient, 
  onArchiveClient 
}) => {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    clientType: 'all',
    isArchived: false,
    tags: []
  });
  
  // State for sorting
  const [sortField, setSortField] = useState('clientName');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filtered and sorted clients
  const [filteredClients, setFilteredClients] = useState([]);
  
  // Apply search, filters, and sorting
  useEffect(() => {
    let result = [...clients];
    
    // Apply search
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(client => 
        client.profile.clientName.toLowerCase().includes(lowerSearchTerm) ||
        client.profile.primaryContact.toLowerCase().includes(lowerSearchTerm) ||
        client.profile.email.toLowerCase().includes(lowerSearchTerm) ||
        (client.profile.tags && client.profile.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }
    
    // Apply filters
    if (filters.clientType !== 'all') {
      result = result.filter(client => client.profile.clientType === filters.clientType);
    }
    
    if (!filters.isArchived) {
      result = result.filter(client => !client.profile.isArchived);
    }
    
    if (filters.tags.length > 0) {
      result = result.filter(client => 
        client.profile.tags && 
        filters.tags.some(tag => client.profile.tags.includes(tag))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let fieldA, fieldB;
      
      // Handle nested fields
      if (sortField === 'clientName') {
        fieldA = a.profile.clientName;
        fieldB = b.profile.clientName;
      } else if (sortField === 'primaryContact') {
        fieldA = a.profile.primaryContact;
        fieldB = b.profile.primaryContact;
      } else if (sortField === 'lastModified') {
        fieldA = new Date(a.profile.lastModified);
        fieldB = new Date(b.profile.lastModified);
      } else if (sortField === 'createdDate') {
        fieldA = new Date(a.profile.createdDate);
        fieldB = new Date(b.profile.createdDate);
      } else {
        fieldA = a[sortField];
        fieldB = b[sortField];
      }
      
      // Handle string comparison
      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }
      
      // Apply sort direction
      if (sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });
    
    setFilteredClients(result);
  }, [clients, searchTerm, filters, sortField, sortDirection]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);
  
  // Toggle sort direction or change sort field
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're always shown
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  return (
    <div className="client-list-view">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button onClick={onNewClient} className="flex items-center gap-2">
          <PlusCircle size={16} />
          New Client
        </Button>
      </div>
      
      <div className="search-filter-bar flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-grow">
          <Input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="filter-sort-controls flex gap-2">
          <Button 
            variant={showFilters ? "default" : "outline"} 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter size={16} />
            Filters
          </Button>
          
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clientName">Client Name</SelectItem>
              <SelectItem value="primaryContact">Primary Contact</SelectItem>
              <SelectItem value="lastModified">Last Modified</SelectItem>
              <SelectItem value="createdDate">Created Date</SelectItem>
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
      
      {showFilters && (
        <FilterPanel 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          className="mb-6"
        />
      )}
      
      <div className="client-count text-sm text-gray-500 mb-4">
        Showing {currentClients.length} of {filteredClients.length} clients
      </div>
      
      {currentClients.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-gray-500 mb-4">No clients found</p>
            <Button onClick={onNewClient} className="flex items-center gap-2">
              <PlusCircle size={16} />
              Create New Client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="client-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentClients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              onSelect={() => onActivateClient(client.id)}
              onEdit={() => onEditClient(client.id)}
              onArchive={() => onArchiveClient(client.id)}
            />
          ))}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="pagination-controls mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          <div className="items-per-page flex items-center justify-end gap-2 mt-2">
            <span className="text-sm text-gray-500">Items per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientListView;

