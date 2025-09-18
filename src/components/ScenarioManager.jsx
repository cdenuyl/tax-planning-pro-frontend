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
  Copy, 
  Check, 
  Calendar, 
  FileText,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import ScenarioCard from './ScenarioCard.jsx';
import ScenarioComparisonView from './ScenarioComparisonView.jsx';

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

const ScenarioManager = ({ scenarios = [], onScenariosUpdate, appSettings }) => {
  // State for scenario operations
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioModalMode, setScenarioModalMode] = useState('create'); // 'create', 'edit'
  const [editingScenario, setEditingScenario] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showComparisonView, setShowComparisonView] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  
  // State for scenario form
  const [scenarioForm, setScenarioForm] = useState({
    name: '',
    description: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});
  
  // Handle new scenario
  const handleNewScenario = () => {
    setScenarioModalMode('create');
    setEditingScenario(null);
    setScenarioForm({
      name: '',
      description: '',
      tags: []
    });
    setErrors({});
    setShowScenarioModal(true);
  };
  
  // Handle edit scenario
  const handleEditScenario = (scenario) => {
    setScenarioModalMode('edit');
    setEditingScenario(scenario);
    setScenarioForm({
      name: scenario.name || '',
      description: scenario.description || '',
      tags: scenario.tags || []
    });
    setErrors({});
    setShowScenarioModal(true);
  };
  
  // Handle duplicate scenario
  const handleDuplicateScenario = (scenario) => {
    const newScenario = {
      ...scenario,
      id: Math.max(0, ...scenarios.map(s => s.id)) + 1,
      name: `${scenario.name} (Copy)`,
      isActive: false,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    onScenariosUpdate([...scenarios, newScenario]);
  };
  
  // Handle activate scenario
  const handleActivateScenario = (scenarioId) => {
    const updatedScenarios = scenarios.map(scenario => ({
      ...scenario,
      isActive: scenario.id === scenarioId
    }));
    
    onScenariosUpdate(updatedScenarios);
  };
  
  // Handle delete scenario
  const handleDeleteScenario = (scenarioId) => {
    // Don't allow deleting the last scenario
    if (scenarios.length <= 1) {
      return;
    }
    
    // Don't allow deleting the active scenario
    const isActive = scenarios.find(s => s.id === scenarioId)?.isActive;
    if (isActive) {
      return;
    }
    
    const updatedScenarios = scenarios.filter(scenario => scenario.id !== scenarioId);
    onScenariosUpdate(updatedScenarios);
    setShowDeleteConfirm(null);
  };
  
  // Handle save scenario
  const handleSaveScenario = () => {
    // Validate form
    const newErrors = {};
    if (!scenarioForm.name.trim()) {
      newErrors.name = 'Scenario name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    if (scenarioModalMode === 'create') {
      // Create new scenario
      const newScenario = {
        id: Math.max(0, ...scenarios.map(s => s.id)) + 1,
        name: scenarioForm.name,
        description: scenarioForm.description,
        tags: scenarioForm.tags,
        isActive: scenarios.length === 0, // Make active if it's the first scenario
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        data: {
          activeTab: 'people',
          ficaEnabled: false,
          taxpayer: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            age: null,
            filingStatus: 'single',
            state: 'Michigan',
            housing: {
              ownership: 'rent',
              propertyTaxValue: 0,
              propertyTaxesPaid: 0,
              michiganResident6Months: true
            }
          },
          spouse: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            age: null,
            housing: {
              ownership: 'rent',
              propertyTaxValue: 0,
              propertyTaxesPaid: 0,
              michiganResident6Months: true
            }
          },
          incomeSources: [],
          deductions: {
            itemized: {
              saltDeduction: 0,
              mortgageInterest: 0,
              charitableGiving: 0,
              medicalExpenses: 0,
              otherDeductions: 0
            },
            state: {
              michiganDeductions: 0,
              otherCredits: 0
            }
          },
          taxMapSettings: {
            incomeType: 'ordinary',
            jurisdiction: 'federal',
            view: 'detailed',
            methodology: 'incremental'
          },
          assets: []
        }
      };
      
      onScenariosUpdate([...scenarios, newScenario]);
    } else if (scenarioModalMode === 'edit') {
      // Update existing scenario
      const updatedScenarios = scenarios.map(scenario => {
        if (scenario.id === editingScenario.id) {
          return {
            ...scenario,
            name: scenarioForm.name,
            description: scenarioForm.description,
            tags: scenarioForm.tags,
            lastModified: new Date().toISOString()
          };
        }
        return scenario;
      });
      
      onScenariosUpdate(updatedScenarios);
    }
    
    setShowScenarioModal(false);
  };
  
  // Handle input change
  const handleInputChange = (field, value) => {
    setScenarioForm(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Handle add tag
  const handleAddTag = () => {
    if (newTag.trim() && !scenarioForm.tags.includes(newTag.trim())) {
      setScenarioForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  // Handle remove tag
  const handleRemoveTag = (tagToRemove) => {
    setScenarioForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle scenario selection for comparison
  const handleScenarioSelection = (scenarioId) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else {
        // Limit to 2 scenarios for comparison
        if (prev.length >= 2) {
          return [prev[1], scenarioId];
        }
        return [...prev, scenarioId];
      }
    });
  };
  
  // Handle comparison view toggle
  const handleComparisonToggle = () => {
    if (showComparisonView) {
      setShowComparisonView(false);
      setSelectedScenarios([]);
    } else {
      if (selectedScenarios.length === 2) {
        setShowComparisonView(true);
      }
    }
  };
  
  // Get selected scenarios for comparison
  const getSelectedScenariosForComparison = () => {
    return scenarios.filter(scenario => selectedScenarios.includes(scenario.id));
  };
  
  return (
    <div className="scenario-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Scenarios</h2>
          <p className="text-sm text-gray-500">
            {scenarios.length} {scenarios.length === 1 ? 'scenario' : 'scenarios'} available
          </p>
        </div>
        
        <div className="flex gap-2">
          {selectedScenarios.length === 2 && (
            <Button 
              variant={showComparisonView ? "default" : "outline"}
              onClick={handleComparisonToggle}
            >
              {showComparisonView ? "Exit Comparison" : "Compare Selected"}
            </Button>
          )}
          
          <Button onClick={handleNewScenario}>
            <Plus size={16} className="mr-2" />
            New Scenario
          </Button>
        </div>
      </div>
      
      {showComparisonView ? (
        <ScenarioComparisonView 
          scenarios={getSelectedScenariosForComparison()}
          onClose={() => setShowComparisonView(false)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map(scenario => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              isSelected={selectedScenarios.includes(scenario.id)}
              onSelect={() => handleScenarioSelection(scenario.id)}
              onEdit={() => handleEditScenario(scenario)}
              onDuplicate={() => handleDuplicateScenario(scenario)}
              onActivate={() => handleActivateScenario(scenario.id)}
              onDelete={() => setShowDeleteConfirm(scenario.id)}
              canDelete={!scenario.isActive && scenarios.length > 1}
            />
          ))}
          
          {scenarios.length === 0 && (
            <Card className="col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle size={48} className="text-gray-400 mb-4" />
                <p className="text-lg text-gray-500 mb-4">No scenarios available</p>
                <Button onClick={handleNewScenario}>
                  <Plus size={16} className="mr-2" />
                  Create First Scenario
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Scenario Modal */}
      <Dialog open={showScenarioModal} onOpenChange={setShowScenarioModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scenarioModalMode === 'create' ? 'Create New Scenario' : 'Edit Scenario'}
            </DialogTitle>
            <DialogDescription>
              {scenarioModalMode === 'create' 
                ? 'Create a new tax planning scenario for this client' 
                : 'Update the scenario details'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name *</Label>
              <Input
                id="scenario-name"
                value={scenarioForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Base Case, Roth Conversion Strategy"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scenario-description">Description</Label>
              <Textarea
                id="scenario-description"
                value={scenarioForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the purpose or details of this scenario..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {scenarioForm.tags.map(tag => (
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
            <Button variant="outline" onClick={() => setShowScenarioModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScenario}>
              {scenarioModalMode === 'create' ? 'Create Scenario' : 'Save Changes'}
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
              This will permanently delete the scenario. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteScenario(showDeleteConfirm)}
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

export default ScenarioManager;

