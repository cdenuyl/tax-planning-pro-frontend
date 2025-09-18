/**
 * Household Management Utilities
 * 
 * This module provides functionality for managing households - linking clients together
 * as family units for tax planning purposes. Supports spouse relationships, dependents,
 * and other household member types.
 */

/**
 * Household member relationship types
 */
export const RELATIONSHIP_TYPES = {
  SPOUSE: 'spouse',
  DEPENDENT_CHILD: 'dependent_child',
  DEPENDENT_OTHER: 'dependent_other',
  PARENT: 'parent',
  SIBLING: 'sibling',
  OTHER: 'other'
};

/**
 * Household member roles for tax purposes
 */
export const TAX_ROLES = {
  PRIMARY_TAXPAYER: 'primary_taxpayer',
  SPOUSE: 'spouse',
  DEPENDENT: 'dependent',
  NON_DEPENDENT: 'non_dependent'
};

/**
 * Generate a unique household ID
 * @returns {string} Unique household ID
 */
export const generateHouseholdId = () => {
  return `household_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new household
 * @param {string} primaryClientId - ID of the primary client
 * @param {string} householdName - Name for the household
 * @returns {Object} New household object
 */
export const createHousehold = (primaryClientId, householdName = '') => {
  return {
    id: generateHouseholdId(),
    name: householdName,
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    primaryClientId,
    members: [
      {
        clientId: primaryClientId,
        relationship: RELATIONSHIP_TYPES.SPOUSE, // Primary is considered spouse for joint filing
        taxRole: TAX_ROLES.PRIMARY_TAXPAYER,
        isPrimary: true,
        addedDate: new Date().toISOString()
      }
    ],
    filingStatus: 'single', // Will be updated when spouse is added
    taxYear: new Date().getFullYear(),
    notes: ''
  };
};

/**
 * Add a member to a household
 * @param {Object} household - Household object
 * @param {string} clientId - ID of client to add
 * @param {string} relationship - Relationship type
 * @param {string} taxRole - Tax role
 * @returns {Object} Updated household object
 */
export const addHouseholdMember = (household, clientId, relationship, taxRole = TAX_ROLES.NON_DEPENDENT) => {
  // Check if client is already in household
  if (household.members.some(member => member.clientId === clientId)) {
    throw new Error('Client is already a member of this household');
  }

  const newMember = {
    clientId,
    relationship,
    taxRole,
    isPrimary: false,
    addedDate: new Date().toISOString()
  };

  const updatedHousehold = {
    ...household,
    members: [...household.members, newMember],
    lastModified: new Date().toISOString()
  };

  // Update filing status if spouse is added
  if (relationship === RELATIONSHIP_TYPES.SPOUSE) {
    updatedHousehold.filingStatus = 'marriedFilingJointly';
  }

  return updatedHousehold;
};

/**
 * Remove a member from a household
 * @param {Object} household - Household object
 * @param {string} clientId - ID of client to remove
 * @returns {Object} Updated household object
 */
export const removeHouseholdMember = (household, clientId) => {
  const memberToRemove = household.members.find(member => member.clientId === clientId);
  
  if (!memberToRemove) {
    throw new Error('Client is not a member of this household');
  }

  if (memberToRemove.isPrimary) {
    throw new Error('Cannot remove primary household member');
  }

  const updatedMembers = household.members.filter(member => member.clientId !== clientId);
  
  const updatedHousehold = {
    ...household,
    members: updatedMembers,
    lastModified: new Date().toISOString()
  };

  // Update filing status if spouse is removed
  if (memberToRemove.relationship === RELATIONSHIP_TYPES.SPOUSE) {
    updatedHousehold.filingStatus = 'single';
  }

  return updatedHousehold;
};

/**
 * Update a household member's relationship or tax role
 * @param {Object} household - Household object
 * @param {string} clientId - ID of client to update
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated household object
 */
export const updateHouseholdMember = (household, clientId, updates) => {
  const memberIndex = household.members.findIndex(member => member.clientId === clientId);
  
  if (memberIndex === -1) {
    throw new Error('Client is not a member of this household');
  }

  const updatedMembers = [...household.members];
  updatedMembers[memberIndex] = {
    ...updatedMembers[memberIndex],
    ...updates
  };

  const updatedHousehold = {
    ...household,
    members: updatedMembers,
    lastModified: new Date().toISOString()
  };

  // Update filing status based on relationships
  const hasSpouse = updatedMembers.some(member => 
    member.relationship === RELATIONSHIP_TYPES.SPOUSE && !member.isPrimary
  );
  updatedHousehold.filingStatus = hasSpouse ? 'marriedFilingJointly' : 'single';

  return updatedHousehold;
};

/**
 * Get household members by role
 * @param {Object} household - Household object
 * @param {string} role - Tax role to filter by
 * @returns {Array} Array of members with the specified role
 */
export const getHouseholdMembersByRole = (household, role) => {
  return household.members.filter(member => member.taxRole === role);
};

/**
 * Get household members by relationship
 * @param {Object} household - Household object
 * @param {string} relationship - Relationship type to filter by
 * @returns {Array} Array of members with the specified relationship
 */
export const getHouseholdMembersByRelationship = (household, relationship) => {
  return household.members.filter(member => member.relationship === relationship);
};

/**
 * Get the primary taxpayer of a household
 * @param {Object} household - Household object
 * @returns {Object|null} Primary taxpayer member or null
 */
export const getPrimaryTaxpayer = (household) => {
  return household.members.find(member => member.isPrimary) || null;
};

/**
 * Get the spouse of the primary taxpayer
 * @param {Object} household - Household object
 * @returns {Object|null} Spouse member or null
 */
export const getSpouse = (household) => {
  return household.members.find(member => 
    member.relationship === RELATIONSHIP_TYPES.SPOUSE && !member.isPrimary
  ) || null;
};

/**
 * Get all dependents in a household
 * @param {Object} household - Household object
 * @returns {Array} Array of dependent members
 */
export const getDependents = (household) => {
  return household.members.filter(member => 
    member.taxRole === TAX_ROLES.DEPENDENT
  );
};

/**
 * Check if a household can file jointly
 * @param {Object} household - Household object
 * @returns {boolean} True if household can file jointly
 */
export const canFileJointly = (household) => {
  const spouse = getSpouse(household);
  return spouse !== null;
};

/**
 * Get recommended filing status for a household
 * @param {Object} household - Household object
 * @returns {string} Recommended filing status
 */
export const getRecommendedFilingStatus = (household) => {
  if (canFileJointly(household)) {
    return 'marriedFilingJointly';
  }
  return 'single';
};

/**
 * Validate household structure
 * @param {Object} household - Household object
 * @returns {Object} Validation result with isValid and errors
 */
export const validateHousehold = (household) => {
  const errors = [];
  
  // Must have at least one member
  if (!household.members || household.members.length === 0) {
    errors.push('Household must have at least one member');
  }
  
  // Must have exactly one primary taxpayer
  const primaryMembers = household.members.filter(member => member.isPrimary);
  if (primaryMembers.length === 0) {
    errors.push('Household must have a primary taxpayer');
  } else if (primaryMembers.length > 1) {
    errors.push('Household can only have one primary taxpayer');
  }
  
  // Can have at most one spouse
  const spouses = getHouseholdMembersByRelationship(household, RELATIONSHIP_TYPES.SPOUSE);
  const nonPrimarySpouses = spouses.filter(spouse => !spouse.isPrimary);
  if (nonPrimarySpouses.length > 1) {
    errors.push('Household can only have one spouse');
  }
  
  // All members must have valid relationship types
  const validRelationships = Object.values(RELATIONSHIP_TYPES);
  household.members.forEach((member, index) => {
    if (!validRelationships.includes(member.relationship)) {
      errors.push(`Member ${index + 1} has invalid relationship type: ${member.relationship}`);
    }
  });
  
  // All members must have valid tax roles
  const validTaxRoles = Object.values(TAX_ROLES);
  household.members.forEach((member, index) => {
    if (!validTaxRoles.includes(member.taxRole)) {
      errors.push(`Member ${index + 1} has invalid tax role: ${member.taxRole}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Search for potential household members
 * @param {Array} allClients - Array of all clients
 * @param {string} searchTerm - Search term
 * @param {Array} excludeClientIds - Client IDs to exclude from results
 * @returns {Array} Array of matching clients
 */
export const searchPotentialMembers = (allClients, searchTerm, excludeClientIds = []) => {
  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return allClients.filter(client => {
    // Exclude already included clients
    if (excludeClientIds.includes(client.id)) {
      return false;
    }
    
    // Search in client name, primary contact, email
    const searchableText = [
      client.profile.clientName,
      client.profile.primaryContact,
      client.profile.email,
      ...(client.profile.tags || [])
    ].join(' ').toLowerCase();
    
    return searchableText.includes(lowerSearchTerm);
  });
};

/**
 * Get household summary for display
 * @param {Object} household - Household object
 * @param {Array} allClients - Array of all clients for name lookup
 * @returns {Object} Household summary
 */
export const getHouseholdSummary = (household, allClients) => {
  const clientLookup = {};
  allClients.forEach(client => {
    clientLookup[client.id] = client;
  });
  
  const membersWithDetails = household.members.map(member => {
    const client = clientLookup[member.clientId];
    return {
      ...member,
      clientName: client ? client.profile.clientName : 'Unknown Client',
      clientEmail: client ? client.profile.email : '',
      clientPhone: client ? client.profile.phone : ''
    };
  });
  
  const primary = membersWithDetails.find(member => member.isPrimary);
  const spouse = membersWithDetails.find(member => 
    member.relationship === RELATIONSHIP_TYPES.SPOUSE && !member.isPrimary
  );
  const dependents = membersWithDetails.filter(member => 
    member.taxRole === TAX_ROLES.DEPENDENT
  );
  
  return {
    id: household.id,
    name: household.name || (primary ? primary.clientName : 'Unnamed Household'),
    primaryTaxpayer: primary,
    spouse: spouse,
    dependents: dependents,
    memberCount: household.members.length,
    canFileJointly: canFileJointly(household),
    recommendedFilingStatus: getRecommendedFilingStatus(household),
    lastModified: household.lastModified
  };
};

/**
 * Export household data for backup/import
 * @param {Array} households - Array of households
 * @returns {string} JSON string of household data
 */
export const exportHouseholds = (households) => {
  return JSON.stringify(households, null, 2);
};

/**
 * Import household data from backup
 * @param {string} householdData - JSON string of household data
 * @returns {Array} Array of household objects
 */
export const importHouseholds = (householdData) => {
  try {
    const households = JSON.parse(householdData);
    
    // Validate each household
    households.forEach((household, index) => {
      const validation = validateHousehold(household);
      if (!validation.isValid) {
        throw new Error(`Invalid household at index ${index}: ${validation.errors.join(', ')}`);
      }
    });
    
    return households;
  } catch (error) {
    throw new Error(`Failed to import households: ${error.message}`);
  }
};

