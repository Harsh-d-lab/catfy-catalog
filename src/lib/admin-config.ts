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

// Function to check if an email is an admin email
export function isAdminEmail(email: string): boolean {
  return email === ADMIN_CONFIG.email
}

// Function to validate admin credentials
export function validateAdminCredentials(email: string, password: string): boolean {
  // Only allow the main admin account
  return email === ADMIN_CONFIG.email && password === ADMIN_CONFIG.password
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
  
  return null
}

// List of admin emails for compatibility
export const ADMIN_EMAILS = [ADMIN_CONFIG.email]