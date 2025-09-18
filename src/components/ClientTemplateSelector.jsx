import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';

const ClientTemplateSelector = ({ onSelectTemplate, onCancel }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('individual');
  
  const templates = [
    {
      id: 'individual',
      name: 'Individual Client',
      description: 'Single taxpayer with basic income sources',
      icon: '👤',
      features: [
        'Single filing status',
        'Basic income sources setup',
        'Standard deductions',
        'Individual tax planning'
      ],
      scenarios: ['Base Case'],
      estimatedSetupTime: '5 minutes'
    },
    {
      id: 'couple',
      name: 'Married Couple',
      description: 'Married filing jointly with combined planning',
      icon: '👫',
      features: [
        'Married filing jointly',
        'Dual income sources',
        'Joint tax planning',
        'Spousal benefit optimization'
      ],
      scenarios: ['Base Case'],
      estimatedSetupTime: '8 minutes'
    },
    {
      id: 'retiree',
      name: 'Retiree Client',
      description: 'Retirement-focused with Social Security and withdrawals',
      icon: '🏖️',
      features: [
        'Social Security benefits',
        'Retirement account withdrawals',
        'RMD planning',
        'Medicare considerations'
      ],
      scenarios: ['Current Retirement Plan', 'Optimized Withdrawal Strategy'],
      estimatedSetupTime: '10 minutes'
    },
    {
      id: 'business',
      name: 'Business Owner',
      description: 'Self-employed with business income and deductions',
      icon: '💼',
      features: [
        'Schedule C business income',
        'Self-employment tax',
        'Business deductions',
        'Retirement plan contributions'
      ],
      scenarios: ['Current Business Structure'],
      estimatedSetupTime: '12 minutes'
    },
    {
      id: 'high-net-worth',
      name: 'High Net Worth',
      description: 'Complex planning with multiple income streams',
      icon: '💎',
      features: [
        'Multiple income sources',
        'Investment income',
        'Tax optimization strategies',
        'Estate planning considerations'
      ],
      scenarios: ['Base Case', 'Tax Optimization', 'Estate Planning'],
      estimatedSetupTime: '15 minutes'
    },
    {
      id: 'custom',
      name: 'Custom Setup',
      description: 'Start with blank template for custom configuration',
      icon: '⚙️',
      features: [
        'Blank template',
        'Full customization',
        'Manual setup required',
        'Advanced users'
      ],
      scenarios: ['Base Case'],
      estimatedSetupTime: '20+ minutes'
    }
  ];
  
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Choose Client Template
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Selection */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Template Type</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{template.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            ⏱️ {template.estimatedSetupTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Template Preview */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Preview</h3>
              
              {selectedTemplateData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-3xl">{selectedTemplateData.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedTemplateData.name}</h4>
                      <p className="text-sm text-gray-600">{selectedTemplateData.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Features */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Included Features</h5>
                      <ul className="space-y-1">
                        {selectedTemplateData.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Scenarios */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Pre-configured Scenarios</h5>
                      <ul className="space-y-1">
                        {selectedTemplateData.scenarios.map((scenario, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{scenario}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Setup Time */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Estimated Setup Time</h5>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{selectedTemplateData.estimatedSetupTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              You can customize all settings after creating the client
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              
              <Button
                onClick={() => onSelectTemplate(selectedTemplate)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue with {selectedTemplateData?.name}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientTemplateSelector;

