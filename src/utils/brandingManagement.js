// Branding management utilities for logos and disclosures with CRM integration

// Storage keys
const BRANDING_STORAGE_KEY = 'tax-on-a-me-branding';

// Default branding structure
const getDefaultBranding = () => ({
  logos: [],
  disclosures: [],
  defaultLogo: null,
  defaultDisclosure: null
});

// Load branding data from localStorage
export function loadBrandingData() {
  try {
    const stored = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading branding data:', error);
  }
  return getDefaultBranding();
}

// Save branding data to localStorage
export function saveBrandingData(brandingData) {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(brandingData));
    return true;
  } catch (error) {
    console.error('Error saving branding data:', error);
    return false;
  }
}

// Add a new logo to the branding library
export function addLogo(logoData) {
  const branding = loadBrandingData();
  const newLogo = {
    id: Date.now().toString(),
    name: logoData.name,
    file: logoData.file, // Base64 encoded image data
    fileName: logoData.fileName,
    fileType: logoData.fileType,
    institution: logoData.institution || '', // Institution name for CRM matching
    crmTag: logoData.crmTag || '', // Alternative CRM tag for matching
    uploadDate: new Date().toISOString()
  };
  
  branding.logos.push(newLogo);
  
  // Set as default if it's the first logo
  if (branding.logos.length === 1) {
    branding.defaultLogo = newLogo.id;
  }
  
  saveBrandingData(branding);
  return newLogo;
}

// Remove a logo from the branding library
export function removeLogo(logoId) {
  const branding = loadBrandingData();
  branding.logos = branding.logos.filter(logo => logo.id !== logoId);
  
  // Clear default if this was the default logo
  if (branding.defaultLogo === logoId) {
    branding.defaultLogo = branding.logos.length > 0 ? branding.logos[0].id : null;
  }
  
  saveBrandingData(branding);
  return true;
}

// Add a new disclosure to the branding library
export function addDisclosure(disclosureData) {
  const branding = loadBrandingData();
  const newDisclosure = {
    id: Date.now().toString(),
    name: disclosureData.name,
    content: disclosureData.content,
    institution: disclosureData.institution || '', // Institution name for CRM matching
    crmTag: disclosureData.crmTag || '', // Alternative CRM tag for matching
    createDate: new Date().toISOString()
  };
  
  branding.disclosures.push(newDisclosure);
  
  // Set as default if it's the first disclosure
  if (branding.disclosures.length === 1) {
    branding.defaultDisclosure = newDisclosure.id;
  }
  
  saveBrandingData(branding);
  return newDisclosure;
}

// Remove a disclosure from the branding library
export function removeDisclosure(disclosureId) {
  const branding = loadBrandingData();
  branding.disclosures = branding.disclosures.filter(disclosure => disclosure.id !== disclosureId);
  
  // Clear default if this was the default disclosure
  if (branding.defaultDisclosure === disclosureId) {
    branding.defaultDisclosure = branding.disclosures.length > 0 ? branding.disclosures[0].id : null;
  }
  
  saveBrandingData(branding);
  return true;
}

// Update disclosure content
export function updateDisclosure(disclosureId, updates) {
  const branding = loadBrandingData();
  const disclosureIndex = branding.disclosures.findIndex(d => d.id === disclosureId);
  
  if (disclosureIndex !== -1) {
    branding.disclosures[disclosureIndex] = {
      ...branding.disclosures[disclosureIndex],
      ...updates,
      updateDate: new Date().toISOString()
    };
    saveBrandingData(branding);
    return branding.disclosures[disclosureIndex];
  }
  
  return null;
}

// Set default logo
export function setDefaultLogo(logoId) {
  const branding = loadBrandingData();
  branding.defaultLogo = logoId;
  saveBrandingData(branding);
  return true;
}

// Set default disclosure
export function setDefaultDisclosure(disclosureId) {
  const branding = loadBrandingData();
  branding.defaultDisclosure = disclosureId;
  saveBrandingData(branding);
  return true;
}

// Get logo by ID
export function getLogoById(logoId) {
  const branding = loadBrandingData();
  return branding.logos.find(logo => logo.id === logoId) || null;
}

// Get disclosure by ID
export function getDisclosureById(disclosureId) {
  const branding = loadBrandingData();
  return branding.disclosures.find(disclosure => disclosure.id === disclosureId) || null;
}

// Get all logos
export function getAllLogos() {
  const branding = loadBrandingData();
  return branding.logos;
}

// Get all disclosures
export function getAllDisclosures() {
  const branding = loadBrandingData();
  return branding.disclosures;
}

// Get default logo
export function getDefaultLogo() {
  const branding = loadBrandingData();
  if (branding.defaultLogo) {
    return getLogoById(branding.defaultLogo);
  }
  return branding.logos.length > 0 ? branding.logos[0] : null;
}

// Get default disclosure
export function getDefaultDisclosure() {
  const branding = loadBrandingData();
  if (branding.defaultDisclosure) {
    return getDisclosureById(branding.defaultDisclosure);
  }
  return branding.disclosures.length > 0 ? branding.disclosures[0] : null;
}

// CRM Institution Matching Functions
export function findMatchingLogo(clientInstitution) {
  if (!clientInstitution) return null;
  
  const branding = loadBrandingData();
  const institution = clientInstitution.toLowerCase().trim();
  
  // Try exact match first (institution or crmTag)
  let match = branding.logos.find(logo => 
    logo.institution.toLowerCase().trim() === institution ||
    logo.crmTag.toLowerCase().trim() === institution
  );
  
  // Try partial match if no exact match
  if (!match) {
    match = branding.logos.find(logo => {
      const logoInstitution = logo.institution.toLowerCase();
      const logoCrmTag = logo.crmTag.toLowerCase();
      
      return logoInstitution.includes(institution) ||
             institution.includes(logoInstitution) ||
             logoCrmTag.includes(institution) ||
             institution.includes(logoCrmTag);
    });
  }
  
  return match;
}

export function findMatchingDisclosure(clientInstitution) {
  if (!clientInstitution) return null;
  
  const branding = loadBrandingData();
  const institution = clientInstitution.toLowerCase().trim();
  
  // Try exact match first (institution or crmTag)
  let match = branding.disclosures.find(disclosure => 
    disclosure.institution.toLowerCase().trim() === institution ||
    disclosure.crmTag.toLowerCase().trim() === institution
  );
  
  // Try partial match if no exact match
  if (!match) {
    match = branding.disclosures.find(disclosure => {
      const disclosureInstitution = disclosure.institution.toLowerCase();
      const disclosureCrmTag = disclosure.crmTag.toLowerCase();
      
      return disclosureInstitution.includes(institution) ||
             institution.includes(disclosureInstitution) ||
             disclosureCrmTag.includes(institution) ||
             institution.includes(disclosureCrmTag);
    });
  }
  
  return match;
}

// Auto-assign branding to clients based on institution
export function autoAssignBranding(clients) {
  const updatedClients = clients.map(client => {
    if (client.institution && !client.branding?.manualOverride) {
      const matchingLogo = findMatchingLogo(client.institution);
      const matchingDisclosure = findMatchingDisclosure(client.institution);
      
      if (matchingLogo || matchingDisclosure) {
        return {
          ...client,
          branding: {
            logoId: matchingLogo?.id || client.branding?.logoId || null,
            disclosureId: matchingDisclosure?.id || client.branding?.disclosureId || null,
            autoAssigned: true,
            manualOverride: false,
            lastUpdated: new Date().toISOString()
          }
        };
      }
    }
    return client;
  });
  
  return updatedClients;
}

// Re-assign branding when new logos/disclosures are added
export function reassignBrandingForInstitution(clients, institutionName) {
  const matchingLogo = findMatchingLogo(institutionName);
  const matchingDisclosure = findMatchingDisclosure(institutionName);
  
  const updatedClients = clients.map(client => {
    if (client.institution && 
        !client.branding?.manualOverride &&
        (client.institution.toLowerCase().includes(institutionName.toLowerCase()) ||
         institutionName.toLowerCase().includes(client.institution.toLowerCase()))) {
      
      return {
        ...client,
        branding: {
          logoId: matchingLogo?.id || client.branding?.logoId || null,
          disclosureId: matchingDisclosure?.id || client.branding?.disclosureId || null,
          autoAssigned: true,
          manualOverride: false,
          lastUpdated: new Date().toISOString()
        }
      };
    }
    return client;
  });
  
  return updatedClients;
}

// Get branding for a specific client (with fallback to defaults)
export function getClientBranding(client) {
  const branding = loadBrandingData();
  
  let logo = null;
  let disclosure = null;
  
  // Try to get client-specific branding first
  if (client && client.branding) {
    if (client.branding.logoId) {
      logo = getLogoById(client.branding.logoId);
    }
    if (client.branding.disclosureId) {
      disclosure = getDisclosureById(client.branding.disclosureId);
    }
  }
  
  // Auto-match based on institution if no manual branding set
  if ((!logo || !disclosure) && client.institution && !client.branding?.manualOverride) {
    if (!logo) {
      const matchingLogo = findMatchingLogo(client.institution);
      if (matchingLogo) logo = matchingLogo;
    }
    if (!disclosure) {
      const matchingDisclosure = findMatchingDisclosure(client.institution);
      if (matchingDisclosure) disclosure = matchingDisclosure;
    }
  }
  
  // Fallback to defaults if still not found
  if (!logo) {
    logo = getDefaultLogo();
  }
  if (!disclosure) {
    disclosure = getDefaultDisclosure();
  }
  
  return {
    logo,
    disclosure
  };
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Validate image file
export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please select a valid image file (JPEG, PNG, GIF, or SVG)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file must be less than 5MB' };
  }
  
  return { valid: true };
}

// Update client branding settings
export function updateClientBranding(clientId, brandingSettings) {
  return {
    logoId: brandingSettings.logoId || null,
    disclosureId: brandingSettings.disclosureId || null,
    manualOverride: brandingSettings.manualOverride || false,
    autoAssigned: !brandingSettings.manualOverride,
    lastUpdated: new Date().toISOString()
  };
}

// Export branding data for backup
export function exportBrandingData() {
  return loadBrandingData();
}

// Import branding data from backup
export function importBrandingData(brandingData) {
  try {
    // Validate the structure
    if (!brandingData.logos || !brandingData.disclosures) {
      throw new Error('Invalid branding data structure');
    }
    
    saveBrandingData(brandingData);
    return true;
  } catch (error) {
    console.error('Error importing branding data:', error);
    return false;
  }
}

// Get institution suggestions for autocomplete
export function getInstitutionSuggestions() {
  const branding = loadBrandingData();
  const institutions = new Set();
  
  branding.logos.forEach(logo => {
    if (logo.institution) institutions.add(logo.institution);
    if (logo.crmTag) institutions.add(logo.crmTag);
  });
  
  branding.disclosures.forEach(disclosure => {
    if (disclosure.institution) institutions.add(disclosure.institution);
    if (disclosure.crmTag) institutions.add(disclosure.crmTag);
  });
  
  return Array.from(institutions).sort();
}

