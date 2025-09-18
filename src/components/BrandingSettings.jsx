import React, { useState, useEffect } from 'react';
import HelpModal, { helpContent } from './HelpModal.jsx';
import { 
  loadBrandingData, 
  saveBrandingData, 
  addLogo, 
  addDisclosure, 
  removeLogo, 
  removeDisclosure,
  setDefaultLogo,
  setDefaultDisclosure,
  fileToBase64,
  validateImageFile,
  getInstitutionSuggestions
} from '../utils/brandingManagement.js';

const BrandingSettings = () => {
  const [brandingData, setBrandingData] = useState(null);
  const [activeTab, setActiveTab] = useState('logos');
  const [isUploading, setIsUploading] = useState(false);
  const [newDisclosure, setNewDisclosure] = useState({
    name: '',
    content: '',
    institution: '',
    crmTag: ''
  });
  const [institutionSuggestions, setInstitutionSuggestions] = useState([]);

  useEffect(() => {
    loadData();
    setInstitutionSuggestions(getInstitutionSuggestions());
  }, []);

  const loadData = () => {
    const data = loadBrandingData();
    setBrandingData(data);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      
      // Get institution and CRM tag from user
      const institution = prompt('Enter institution name (optional):') || '';
      const crmTag = prompt('Enter CRM tag for matching (optional):') || '';
      
      const logoData = {
        name: file.name.split('.')[0],
        file: base64,
        fileName: file.name,
        fileType: file.type,
        institution: institution,
        crmTag: crmTag
      };

      addLogo(logoData);
      loadData();
      setInstitutionSuggestions(getInstitutionSuggestions());
      
      // Clear the input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Error uploading logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDisclosure = () => {
    if (!newDisclosure.name.trim() || !newDisclosure.content.trim()) {
      alert('Please fill in both name and content fields.');
      return;
    }

    addDisclosure(newDisclosure);
    setNewDisclosure({
      name: '',
      content: '',
      institution: '',
      crmTag: ''
    });
    loadData();
    setInstitutionSuggestions(getInstitutionSuggestions());
  };

  const handleRemoveLogo = (logoId) => {
    if (confirm('Are you sure you want to remove this logo?')) {
      removeLogo(logoId);
      loadData();
    }
  };

  const handleRemoveDisclosure = (disclosureId) => {
    if (confirm('Are you sure you want to remove this disclosure?')) {
      removeDisclosure(disclosureId);
      loadData();
    }
  };

  const handleSetDefaultLogo = (logoId) => {
    setDefaultLogo(logoId);
    loadData();
  };

  const handleSetDefaultDisclosure = (disclosureId) => {
    setDefaultDisclosure(disclosureId);
    loadData();
  };

  if (!brandingData) {
    return <div className="text-center py-4">Loading branding settings...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Help */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-800">Branding & Disclosures</h4>
        <HelpModal 
          title="Branding System Help"
          content={helpContent.brandingSystem}
          triggerText="Help"
        />
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('logos')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'logos'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Logos ({brandingData.logos.length})
        </button>
        <button
          onClick={() => setActiveTab('disclosures')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'disclosures'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Disclosures ({brandingData.disclosures.length})
        </button>
      </div>

      {/* Logos Tab */}
      {activeTab === 'logos' && (
        <div className="space-y-4">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="text-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="text-blue-600 hover:text-blue-700">
                  {isUploading ? 'Uploading...' : '+ Upload Logo'}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, GIF, or SVG (max 5MB)
              </p>
            </div>
          </div>

          {/* Logo Library */}
          {brandingData.logos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">No logos uploaded yet</div>
              <div className="text-xs mt-1">Upload your first logo to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {brandingData.logos.map((logo) => (
                <div key={logo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <img
                      src={logo.file}
                      alt={logo.name}
                      className="w-12 h-12 object-contain bg-white rounded border"
                    />
                    <div>
                      <div className="font-medium text-sm">{logo.name}</div>
                      <div className="text-xs text-gray-500">
                        {logo.institution && <span>Institution: {logo.institution}</span>}
                        {logo.institution && logo.crmTag && <span> • </span>}
                        {logo.crmTag && <span>CRM Tag: {logo.crmTag}</span>}
                      </div>
                      <div className="text-xs text-gray-400">
                        Uploaded {new Date(logo.uploadDate).toLocaleDateString()}
                        {brandingData.defaultLogo === logo.id && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {brandingData.defaultLogo !== logo.id && (
                      <button
                        onClick={() => handleSetDefaultLogo(logo.id)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveLogo(logo.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclosures Tab */}
      {activeTab === 'disclosures' && (
        <div className="space-y-4">
          {/* Add New Disclosure */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-sm mb-3">Add New Disclosure</h5>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Disclosure Name *
                  </label>
                  <input
                    type="text"
                    value={newDisclosure.name}
                    onChange={(e) => setNewDisclosure(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard Investment Disclosure"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Institution Name
                  </label>
                  <input
                    type="text"
                    value={newDisclosure.institution}
                    onChange={(e) => setNewDisclosure(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="e.g., ABC Financial Services"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    list="institution-suggestions"
                  />
                  <datalist id="institution-suggestions">
                    {institutionSuggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  CRM Tag (for matching)
                </label>
                <input
                  type="text"
                  value={newDisclosure.crmTag}
                  onChange={(e) => setNewDisclosure(prev => ({ ...prev, crmTag: e.target.value }))}
                  placeholder="e.g., ABC_FINANCIAL, edward_jones"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This tag will be used to automatically match clients imported from your CRM
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Disclosure Content *
                </label>
                <textarea
                  value={newDisclosure.content}
                  onChange={(e) => setNewDisclosure(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the full disclosure text..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={handleAddDisclosure}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Add Disclosure
              </button>
            </div>
          </div>

          {/* Disclosure Library */}
          {brandingData.disclosures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">No disclosures created yet</div>
              <div className="text-xs mt-1">Add your first disclosure above</div>
            </div>
          ) : (
            <div className="space-y-3">
              {brandingData.disclosures.map((disclosure) => (
                <div key={disclosure.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{disclosure.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {disclosure.institution && <span>Institution: {disclosure.institution}</span>}
                        {disclosure.institution && disclosure.crmTag && <span> • </span>}
                        {disclosure.crmTag && <span>CRM Tag: {disclosure.crmTag}</span>}
                      </div>
                      <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border max-h-20 overflow-y-auto">
                        {disclosure.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Created {new Date(disclosure.createDate).toLocaleDateString()}
                        {brandingData.defaultDisclosure === disclosure.id && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-3">
                      {brandingData.defaultDisclosure !== disclosure.id && (
                        <button
                          onClick={() => handleSetDefaultDisclosure(disclosure.id)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveDisclosure(disclosure.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandingSettings;

