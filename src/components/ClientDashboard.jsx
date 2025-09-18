import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { formatCurrency, formatPercentage } from '../utils/taxCalculations.js';

const ClientDashboard = ({
  client,
  onEditProfile,
  onArchiveClient,
  onDuplicateClient,
  onExportClient,
  onGenerateReport,
  onCreateScenario,
  onSelectScenario,
  currentScenario,
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  if (!client) return null;

  // Adapt client data from Supabase schema
  const taxpayerFirstName = client.taxpayer_first_name || '';
  const taxpayerLastName = client.taxpayer_last_name || '';
  const clientFullName = `${taxpayerFirstName} ${taxpayerLastName}`.trim();
  const primaryContactEmail = client.taxpayer_email || 'N/A';
  const clientStatus = client.status || 'prospect';
  const clientCreatedAt = client.created_at;
  const clientUpdatedAt = client.updated_at;
  const clientNotes = client.notes;

  // Scenarios are now directly on the client object from useClientData
  const allScenarios = client.scenarios || [];
  const activeScenario = currentScenario; // use currentScenario from props
  const totalScenarios = allScenarios.length;

  // Calculate quick stats from active scenario
  const getQuickStats = () => {
    if (!activeScenario) return null;

    // Assuming scenario data is stored as JSONB in Supabase and accessed directly
    const { taxpayer_data, spouse_data, income_sources } = activeScenario;

    const totalIncome = (income_sources || []).reduce((sum, source) =>
      source.enabled ? sum + (source.amount || 0) : sum, 0
    );

    return {
      totalIncome,
      taxpayerAge: taxpayer_data?.age, // Assuming age is part of taxpayer_data
      spouseAge: spouse_data?.age, // Assuming age is part of spouse_data
      filingStatus: taxpayer_data?.filing_status, // Assuming filing_status is part of taxpayer_data
      incomeSourceCount: (income_sources || []).filter(s => s.enabled).length
    };
  };

  const stats = getQuickStats();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getClientTypeIcon = (type) => {
    // Client type is not directly in the schema, using status as a proxy or defaulting
    switch (type) {
      case 'individual': return '👤';
      case 'couple': return '👫';
      case 'business': return '💼';
      case 'trust': return '🏛️';
      default: return '👤'; // Default icon
    }
  };

  const getRiskProfileColor = (profile) => {
    // Risk profile is not directly in the schema, defaulting
    switch (profile) {
      case 'conservative': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'aggressive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">{getClientTypeIcon(clientStatus)}</div> {/* Using clientStatus as a proxy for type */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{clientFullName}</h2>
            <p className="text-gray-600">{primaryContactEmail}</p>
            {/* Phone and other profile fields are not in the current Supabase schema */}
            {/* {client.profile.phone && (
              <p className="text-sm text-gray-500">{client.profile.phone}</p>
            )} */}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            Quick Actions
          </Button>
          <Button
            onClick={() => onEditProfile(client.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Quick Actions Dropdown */}
      {showQuickActions && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => onGenerateReport(client.id)}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              📊 Generate Report
            </Button>
            <Button
              onClick={() => onCreateScenario(client.id)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm"
            >
              📋 New Scenario
            </Button>
            <Button
              onClick={() => onDuplicateClient(client.id)}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm"
            >
              📄 Duplicate Client
            </Button>
            <Button
              onClick={() => onExportClient(client.id)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            >
              💾 Export Data
            </Button>
          </div>
        </div>
      )}

      {/* Client Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Client Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{getClientTypeIcon(clientStatus)}</span>
            </div>
            {/* Risk Profile is not in the current Supabase schema */}
            {/* <div className="flex justify-between">
              <span className="text-gray-600">Risk Profile:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskProfileColor(client.profile.riskProfile)}`}>
                {client.profile.riskProfile}
              </span>
            </div> */}
            <div className="flex justify-between">
              <span className="text-gray-600">Client Since:</span>
              <span className="font-medium">
                {formatDate(clientCreatedAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Modified:</span>
              <span className="font-medium">{formatDate(clientUpdatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Current Scenario Stats */}
        {stats && activeScenario && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Current Scenario</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Scenario:</span>
                <span className="font-medium">{activeScenario.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Income:</span>
                <span className="font-medium text-green-600">{formatCurrency(stats.totalIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filing Status:</span>
                <span className="font-medium capitalize">{stats.filingStatus?.replace('-', ' ') || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Income Sources:</span>
                <span className="font-medium">{stats.incomeSourceCount}</span>
              </div>
              {stats.taxpayerAge && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ages:</span>
                  <span className="font-medium">
                    {stats.taxpayerAge}{stats.spouseAge ? ` & ${stats.spouseAge}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Planning Goals & Tags */}
        {/* These fields are not directly in the current Supabase schema */}
        {/* <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Planning Focus</h3>

          {client.profile.planningGoals && client.profile.planningGoals.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Goals</h4>
              <div className="flex flex-wrap gap-1">
                {client.profile.planningGoals.slice(0, 3).map(goal => (
                  <span 
                    key={goal}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded capitalize"
                  >
                    {goal.replace('-', ' ')}
                  </span>
                ))}
                {client.profile.planningGoals.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{client.profile.planningGoals.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {client.profile.tags && client.profile.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {client.profile.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {client.profile.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{client.profile.tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div> */}
      </div>

      {/* Scenarios Overview */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Scenarios ({totalScenarios})</h3>
          <Button
            onClick={() => onCreateScenario(client.id)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            + New Scenario
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allScenarios.map(scenario => (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)} // Make scenario clickable
              className={`p-4 rounded-lg border-2 cursor-pointer ${
                scenario.id === activeScenario?.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                {scenario.id === activeScenario?.id && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    Active
                  </span>
                )}
              </div>

              {scenario.taxpayer_data && (
                <div className="text-sm text-gray-600">
                  <div>Income Sources: {scenario.income_sources?.length || 0}</div>
                  <div>Filing: {scenario.taxpayer_data?.filing_status?.replace('-', ' ') || 'Not set'}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Professional Information */}
      {/* Not directly in the current Supabase schema */}
      {/* {(client.profile.advisorName || client.profile.firmName) && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {client.profile.advisorName && (
              <div>
                <span className="text-gray-600">Advisor:</span>
                <span className="ml-2 font-medium">{client.profile.advisorName}</span>
              </div>
            )}
            {client.profile.firmName && (
              <div>
                <span className="text-gray-600">Firm:</span>
                <span className="ml-2 font-medium">{client.profile.firmName}</span>
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* Notes */}
      {clientNotes && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
            {clientNotes}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;


