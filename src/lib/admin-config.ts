// Admin configuration for CATFY
// This file contains the admin credentials and configuration

export const ADMIN_CONFIG = {
  // Admin credentials
  email: 'admin@catfy.com',
  password: 'CatfyAdmin2024!',
  
  // Admin user details
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    accountType: 'BUSINESS' as const,
    companyName: 'CATFY Administration',
    phone: '+1-555-ADMIN',
    website: 'https://catfy.com',
  },
  
  // Admin permissions
  permissions: {
    canAccessAdminDashboard: true,
    canManageUsers: true,
    canManageCatalogues: true,
    canViewAnalytics: true,
    canManageSettings: true,
  }
}

// List of admin emails (for backward compatibility)
export const ADMIN_EMAILS = [
  ADMIN_CONFIG.email,
  'test@catfy.com', // Keep test user for development
]

// Function to check if an email is an admin email
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email) || email.includes('admin')
}

// Function to validate admin credentials
export function validateAdminCredentials(email: string, password: string): boolean {
  // Check for main admin account
  if (email === ADMIN_CONFIG.email && password === ADMIN_CONFIG.password) {
    return true
  }
  
  // Check for test user (bypass password check)
  if (email === 'test@catfy.com') {
    return true
  }
  
  return false
}

// Get admin profile data
export function getAdminProfile(email: string) {
  if (email === ADMIN_CONFIG.email) {
    return {
      id: 'admin-profile-id',
      email: ADMIN_CONFIG.email,
      ...ADMIN_CONFIG.profile,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
  
  // Return test user profile for test@catfy.com
  if (email === 'test@catfy.com') {
    return {
      id: 'test-profile-id',
      email: 'test@catfy.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      accountType: 'BUSINESS' as const,
      companyName: 'Test Company Inc.',
      phone: '+1-555-0123',
      website: 'https://testcompany.com',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
  
  return null
}