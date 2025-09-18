import React, { useState, useEffect } from 'react';

/**
 * TemplateCustomizer component for customizing report templates
 */
export const TemplateCustomizer = ({ 
  onTemplateChange, 
  currentTemplate = {},
  className = ""
}) => {
  const [template, setTemplate] = useState({
    // Branding options
    companyName: '',
    companyLogo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    
    // Layout options
    headerStyle: 'standard',
    footerIncluded: true,
    pageNumbers: true,
    
    // Content options
    includeDisclaimer: true,
    includeExecutiveSummary: true,
    includeCharts: true,
    includeDetailedTables: true,
    
    // Formatting options
    fontSize: 'medium',
    fontFamily: 'Arial',
    spacing: 'normal',
    
    // Custom sections
    customHeader: '',
    customFooter: '',
    customDisclaimer: '',
    
    ...currentTemplate
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (onTemplateChange) {
      onTemplateChange(template);
    }
  }, [template, onTemplateChange]);

  const updateTemplate = (key, value) => {
    setTemplate(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setTemplate({
      companyName: '',
      companyLogo: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1F2937',
      headerStyle: 'standard',
      footerIncluded: true,
      pageNumbers: true,
      includeDisclaimer: true,
      includeExecutiveSummary: true,
      includeCharts: true,
      includeDetailedTables: true,
      fontSize: 'medium',
      fontFamily: 'Arial',
      spacing: 'normal',
      customHeader: '',
      customFooter: '',
      customDisclaimer: ''
    });
  };

  const saveTemplate = () => {
    const templateName = prompt('Enter a name for this template:');
    if (templateName) {
      const savedTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '{}');
      savedTemplates[templateName] = template;
      localStorage.setItem('reportTemplates', JSON.stringify(savedTemplates));
      alert(`Template "${templateName}" saved successfully!`);
    }
  };

  const loadTemplate = () => {
    const savedTemplates = JSON.parse(localStorage.getItem('reportTemplates') || '{}');
    const templateNames = Object.keys(savedTemplates);
    
    if (templateNames.length === 0) {
      alert('No saved templates found.');
      return;
    }

    const templateName = prompt(`Choose a template to load:\n${templateNames.join('\n')}`);
    if (templateName && savedTemplates[templateName]) {
      setTemplate(savedTemplates[templateName]);
      alert(`Template "${templateName}" loaded successfully!`);
    }
  };

  return (
    <div className={`template-customizer bg-gray-50 border rounded-lg ${className}`}>
      <div className="p-4 border-b bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Template Customization</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Customize'}
          </button>
        </div>
        
        {!isExpanded && (
          <div className="mt-2 text-sm text-gray-600">
            Current template: {template.companyName || 'Default'} • {template.fontFamily} • {template.fontSize}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Template Management */}
          <div className="flex gap-2 pb-4 border-b">
            <button
              onClick={saveTemplate}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Save Template
            </button>
            <button
              onClick={loadTemplate}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Load Template
            </button>
            <button
              onClick={resetToDefaults}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Branding Section */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Branding</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={template.companyName}
                  onChange={(e) => updateTemplate('companyName', e.target.value)}
                  placeholder="Your Company Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="text"
                  value={template.companyLogo}
                  onChange={(e) => updateTemplate('companyLogo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={template.primaryColor}
                    onChange={(e) => updateTemplate('primaryColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={template.primaryColor}
                    onChange={(e) => updateTemplate('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={template.secondaryColor}
                    onChange={(e) => updateTemplate('secondaryColor', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={template.secondaryColor}
                    onChange={(e) => updateTemplate('secondaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Layout Section */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Layout Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Header Style</label>
                <select
                  value={template.headerStyle}
                  onChange={(e) => updateTemplate('headerStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="minimal">Minimal</option>
                  <option value="detailed">Detailed</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="footerIncluded"
                    checked={template.footerIncluded}
                    onChange={(e) => updateTemplate('footerIncluded', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="footerIncluded" className="ml-2 text-sm text-gray-700">Include Footer</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pageNumbers"
                    checked={template.pageNumbers}
                    onChange={(e) => updateTemplate('pageNumbers', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="pageNumbers" className="ml-2 text-sm text-gray-700">Page Numbers</label>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Content Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeDisclaimer"
                  checked={template.includeDisclaimer}
                  onChange={(e) => updateTemplate('includeDisclaimer', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includeDisclaimer" className="ml-2 text-sm text-gray-700">Include Disclaimer</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeExecutiveSummary"
                  checked={template.includeExecutiveSummary}
                  onChange={(e) => updateTemplate('includeExecutiveSummary', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includeExecutiveSummary" className="ml-2 text-sm text-gray-700">Executive Summary</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeCharts"
                  checked={template.includeCharts}
                  onChange={(e) => updateTemplate('includeCharts', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includeCharts" className="ml-2 text-sm text-gray-700">Include Charts</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeDetailedTables"
                  checked={template.includeDetailedTables}
                  onChange={(e) => updateTemplate('includeDetailedTables', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="includeDetailedTables" className="ml-2 text-sm text-gray-700">Detailed Tables</label>
              </div>
            </div>
          </div>

          {/* Formatting Section */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Formatting</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                <select
                  value={template.fontSize}
                  onChange={(e) => updateTemplate('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                <select
                  value={template.fontFamily}
                  onChange={(e) => updateTemplate('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spacing</label>
                <select
                  value={template.spacing}
                  onChange={(e) => updateTemplate('spacing', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="relaxed">Relaxed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Text Sections */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-3">Custom Text</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Header Text</label>
                <textarea
                  value={template.customHeader}
                  onChange={(e) => updateTemplate('customHeader', e.target.value)}
                  placeholder="Additional header information..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Footer Text</label>
                <textarea
                  value={template.customFooter}
                  onChange={(e) => updateTemplate('customFooter', e.target.value)}
                  placeholder="Additional footer information..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Disclaimer</label>
                <textarea
                  value={template.customDisclaimer}
                  onChange={(e) => updateTemplate('customDisclaimer', e.target.value)}
                  placeholder="Custom disclaimer text..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t">
            <h4 className="text-md font-semibold text-gray-800 mb-3">Preview</h4>
            <div 
              className="p-4 border rounded-lg bg-white"
              style={{ 
                fontFamily: template.fontFamily,
                fontSize: template.fontSize === 'small' ? '12px' : template.fontSize === 'large' ? '16px' : '14px',
                color: template.secondaryColor
              }}
            >
              <div 
                className="text-center pb-2 mb-4 border-b"
                style={{ color: template.primaryColor }}
              >
                <h3 className="text-lg font-bold">{template.companyName || 'Your Company Name'}</h3>
                <p className="text-sm">Tax Planning Report Preview</p>
              </div>
              <div className="space-y-2">
                <p><strong>Client:</strong> John and Jane Doe</p>
                <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>Total Income:</strong> $150,000</p>
                <p><strong>Total Tax:</strong> $25,000</p>
              </div>
              {template.customFooter && (
                <div className="mt-4 pt-2 border-t text-xs text-gray-600">
                  {template.customFooter}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateCustomizer;

