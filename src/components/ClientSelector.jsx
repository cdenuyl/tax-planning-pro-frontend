import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';

const ClientSelector = ({ 
  clients = [], 
  activeClientId, 
  onClientChange = () => {}, 
  onNewClient = () => {}, 
  onClientSettings = () => {},
  onEditClient = () => {} 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const activeClient = clients?.find(c => c?.id === activeClientId);
  const activeScenario = activeClient?.scenarios?.find(s => s?.isActive);
  
  return (
    <div className="relative">
      {/* Client Selector Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="font-medium">
            {activeClient?.profile.clientName || 'No Client Selected'}
          </span>
          {activeScenario && (
            <span className="text-blue-200 text-sm">
              • {activeScenario.name}
            </span>
          )}
          <svg 
            className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {/* Quick Actions */}
        <Button
          onClick={() => {
            if (typeof onNewClient === 'function') {
              onNewClient();
            }
          }}
          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm"
        >
          + New Client
        </Button>
        
        {activeClient && (
          <Button
            onClick={() => {
              if (typeof onEditClient === 'function') {
                onEditClient(activeClient.id);
              }
            }}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm"
          >
            Edit Profile
          </Button>
        )}
      </div>
      
      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Select Client</h3>
            
            {/* Client List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {clients?.filter(c => !c?.profile?.isArchived).map(client => {
                const isActive = client?.id === activeClientId;
                const activeScenario = client?.scenarios?.find(s => s?.isActive);
                
                return (
                  <div
                    key={client?.id || Math.random()}
                    onClick={() => {
                      if (typeof onClientChange === 'function' && client?.id) {
                        onClientChange(client.id);
                      }
                      setShowDropdown(false);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-blue-50 border-blue-200 border' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {client?.profile?.clientName || 'Unnamed Client'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {client?.profile?.primaryContact || 'No contact info'}
                        </div>
                        {activeScenario && (
                          <div className="text-xs text-gray-500 mt-1">
                            Active: {activeScenario?.name || 'Unnamed Scenario'}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {client?.scenarios?.length || 0} scenario{(client?.scenarios?.length || 0) !== 1 ? 's' : ''}
                        </div>
                        {client?.profile?.tags && client.profile.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {client.profile.tags.slice(0, 2).map(tag => (
                              <span 
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* No Clients Message */}
            {clients?.filter(c => !c?.profile?.isArchived).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg mb-2">No clients yet</div>
                <div className="text-sm">Create your first client to get started</div>
              </div>
            )}
            
            {/* Actions */}
            <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
              <Button
                onClick={() => {
                  if (typeof onNewClient === 'function') {
                    onNewClient();
                  }
                  setShowDropdown(false);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                + New Client
              </Button>
              
              {activeClient && (
                <Button
                  onClick={() => {
                    if (typeof onClientSettings === 'function') {
                      onClientSettings(activeClient.id);
                    }
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm"
                >
                  Client Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ClientSelector;

