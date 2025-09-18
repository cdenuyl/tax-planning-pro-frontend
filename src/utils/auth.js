/**
 * Authentication Utilities
 * Handles user authentication, session management, and security
 */

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  ADVISOR: 'advisor', 
  ASSISTANT: 'assistant',
  VIEWER: 'viewer'
};

export const PERMISSIONS = {
  // Client management permissions
  CREATE_CLIENTS: 'create_clients',
  EDIT_CLIENTS: 'edit_clients',
  DELETE_CLIENTS: 'delete_clients',
  VIEW_CLIENTS: 'view_clients',
  SHARE_CLIENTS: 'share_clients',
  
  // User management permissions
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data'
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.SHARE_CLIENTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.ADVISOR]: [
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.SHARE_CLIENTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.ASSISTANT]: [
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.EXPORT_DATA
  ],
  [USER_ROLES.VIEWER]: [
    PERMISSIONS.VIEW_CLIENTS
  ]
};

/**
 * Generate a unique user ID
 */
export const generateUserId = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Hash password (simplified for frontend - in production, use proper backend hashing)
 */
export const hashPassword = async (password) => {
  // In production, this would be handled by the backend
  // For now, we'll use a simple hash for demonstration
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'tax_planning_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Create user session
 */
export const createSession = (user) => {
  const session = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: ROLE_PERMISSIONS[user.role] || [],
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Store session in localStorage (in production, use secure session storage)
  localStorage.setItem('tax_planning_session', JSON.stringify(session));
  localStorage.setItem('current_user', JSON.stringify(user));
  
  return session;
};

/**
 * Get current session
 */
export const getCurrentSession = () => {
  try {
    const sessionData = localStorage.getItem('tax_planning_session');
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    
    // Check if session is expired (24 hours)
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      clearSession();
      return null;
    }
    
    // Update last activity
    session.lastActivity = new Date().toISOString();
    localStorage.setItem('tax_planning_session', JSON.stringify(session));
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('current_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Clear session and logout
 */
export const clearSession = () => {
  localStorage.removeItem('tax_planning_session');
  localStorage.removeItem('current_user');
};

/**
 * Check if user has permission
 */
export const hasPermission = (permission, userRole = null) => {
  const session = getCurrentSession();
  if (!session) return false;
  
  const role = userRole || session.role;
  const permissions = ROLE_PERMISSIONS[role] || [];
  
  return permissions.includes(permission);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return getCurrentSession() !== null;
};

/**
 * Get users from storage (in production, this would be an API call)
 */
export const getUsers = () => {
  try {
    const usersData = localStorage.getItem('tax_planning_users');
    return usersData ? JSON.parse(usersData) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

/**
 * Save users to storage (in production, this would be an API call)
 */
export const saveUsers = (users) => {
  try {
    localStorage.setItem('tax_planning_users', JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
};

/**
 * Create new user
 */
export const createUser = async (userData) => {
  try {
    const users = getUsers();
    
    // Check if email already exists
    if (users.find(user => user.email === userData.email)) {
      throw new Error('Email already exists');
    }
    
    // Validate email
    if (!validateEmail(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create user object
    const newUser = {
      id: generateUserId(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || USER_ROLES.ADVISOR,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      profile: {
        firmName: userData.firmName || '',
        phone: userData.phone || '',
        title: userData.title || '',
        licenseNumber: userData.licenseNumber || '',
        bio: userData.bio || ''
      },
      preferences: {
        theme: 'light',
        notifications: true,
        autoLogout: 24 // hours
      }
    };
    
    users.push(newUser);
    saveUsers(users);
    
    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Authenticate user
 */
export const authenticateUser = async (email, password) => {
  try {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.isActive);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const hashedPassword = await hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
    
    // Create session
    const session = createSession(user);
    
    return { success: true, user, session };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = (userId, updates) => {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update user data
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    saveUsers(users);
    
    // Update current user in localStorage if it's the current user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem('current_user', JSON.stringify(users[userIndex]));
    }
    
    return { success: true, user: users[userIndex] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Initialize default users (for demo/development)
 */
export const initializeDefaultUser = async () => {
  const users = getUsers();
  
  // If no users exist, create demo users
  if (users.length === 0) {
    const demoUsers = [
      {
        email: 'admin@taxplanning.com',
        password: 'TaxPlan123!',
        firstName: 'System',
        lastName: 'Administrator',
        role: USER_ROLES.ADMIN,
        firmName: 'Tax Planning Firm',
        title: 'Administrator'
      },
      {
        email: 'advisor@taxplanning.com',
        password: 'TaxPlan123!',
        firstName: 'John',
        lastName: 'Advisor',
        role: USER_ROLES.ADVISOR,
        firmName: 'Tax Planning Firm',
        title: 'Senior Tax Advisor'
      },
      {
        email: 'assistant@taxplanning.com',
        password: 'TaxPlan123!',
        firstName: 'Jane',
        lastName: 'Assistant',
        role: USER_ROLES.ASSISTANT,
        firmName: 'Tax Planning Firm',
        title: 'Tax Assistant'
      }
    ];
    
    for (const userData of demoUsers) {
      const result = await createUser(userData);
      if (result.success) {
        console.log(`Demo user created: ${result.user.email}`);
      }
    }
    
    return true;
  }
  
  return false;
};

/**
 * Client access control utilities
 */

/**
 * Get client access permissions for a user
 */
export const getClientAccess = (userId) => {
  try {
    const accessData = localStorage.getItem('client_access_permissions');
    const permissions = accessData ? JSON.parse(accessData) : {};
    return permissions[userId] || { ownedClients: [], sharedClients: [] };
  } catch (error) {
    console.error('Error getting client access:', error);
    return { ownedClients: [], sharedClients: [] };
  }
};

/**
 * Save client access permissions
 */
export const saveClientAccess = (permissions) => {
  try {
    localStorage.setItem('client_access_permissions', JSON.stringify(permissions));
    return true;
  } catch (error) {
    console.error('Error saving client access:', error);
    return false;
  }
};

/**
 * Share client with another user
 */
export const shareClientWithUser = (clientId, fromUserId, toUserId, permissions = ['view']) => {
  try {
    const accessData = localStorage.getItem('client_access_permissions');
    const allPermissions = accessData ? JSON.parse(accessData) : {};
    
    // Initialize user permissions if they don't exist
    if (!allPermissions[toUserId]) {
      allPermissions[toUserId] = { ownedClients: [], sharedClients: [] };
    }
    
    // Add shared client
    const existingShare = allPermissions[toUserId].sharedClients.find(
      share => share.clientId === clientId
    );
    
    if (existingShare) {
      // Update existing share
      existingShare.permissions = permissions;
      existingShare.sharedAt = new Date().toISOString();
    } else {
      // Add new share
      allPermissions[toUserId].sharedClients.push({
        clientId,
        sharedBy: fromUserId,
        permissions,
        sharedAt: new Date().toISOString()
      });
    }
    
    saveClientAccess(allPermissions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check if user can access client
 */
export const canAccessClient = (userId, clientId) => {
  const access = getClientAccess(userId);
  
  // Check if user owns the client
  if (access.ownedClients.includes(clientId)) {
    return { canAccess: true, accessType: 'owner', permissions: ['view', 'edit', 'delete', 'share'] };
  }
  
  // Check if client is shared with user
  const sharedClient = access.sharedClients.find(share => share.clientId === clientId);
  if (sharedClient) {
    return { canAccess: true, accessType: 'shared', permissions: sharedClient.permissions };
  }
  
  return { canAccess: false, accessType: null, permissions: [] };
};

/**
 * Get all accessible clients for a user
 */
export const getAccessibleClients = (userId, allClients) => {
  const access = getClientAccess(userId);
  const accessibleClients = [];
  
  // Add owned clients
  access.ownedClients.forEach(clientId => {
    const client = allClients.find(c => c.id === clientId);
    if (client) {
      accessibleClients.push({
        ...client,
        accessType: 'owner',
        permissions: ['view', 'edit', 'delete', 'share']
      });
    }
  });
  
  // Add shared clients
  access.sharedClients.forEach(share => {
    const client = allClients.find(c => c.id === share.clientId);
    if (client) {
      accessibleClients.push({
        ...client,
        accessType: 'shared',
        permissions: share.permissions,
        sharedBy: share.sharedBy,
        sharedAt: share.sharedAt
      });
    }
  });
  
  return accessibleClients;
};

