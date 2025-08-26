import { SubscriptionPlan } from '@prisma/client'

// Plan feature definitions based on pricing structure
export const PLAN_FEATURES = {
  [SubscriptionPlan.FREE]: {
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxCatalogues: 1,
    maxProductsPerCatalogue: -1, // unlimited
    maxCategories: -1, // unlimited
    maxExportsPerMonth: 5,
    maxStorageGB: 50, // 50 MB
    features: {
      customDomain: false,
      advancedAnalytics: false,
      whiteLabel: false,
      prioritySupport: false,
      apiAccess: false,
      customBranding: false,
      advancedExports: false,
      teamCollaboration: false,
      advancedSEO: false,
      customThemes: false,
    },
    included: [
      'Basic catalogue creation',
      'Standard templates',
      'PDF export',
      'Basic analytics',
      'Email support'
    ],
    excluded: [
      'Custom domain',
      'Advanced analytics',
      'White label',
      'Priority support',
      'API access'
    ]
  },
  [SubscriptionPlan.STANDARD]: {
    name: 'Standard',
    description: 'Great for small businesses',
    monthlyPrice: 599,
    yearlyPrice: 5391, // 25% off
    maxCatalogues: 5,
    maxProductsPerCatalogue: 50,
    maxCategories: -1, // unlimited
    maxExportsPerMonth: 50,
    maxStorageGB: 100, // 100 MB
    features: {
      customDomain: true,
      advancedAnalytics: true,
      whiteLabel: false,
      prioritySupport: false,
      apiAccess: false,
      customBranding: true,
      advancedExports: true,
      teamCollaboration: false,
      advancedSEO: true,
      customThemes: true,
    },
    included: [
      'Everything in Free',
      'Custom domain',
      'Advanced analytics',
      'Custom branding',
      'Advanced exports',
      'SEO optimization',
      'Custom themes'
    ],
    excluded: [
      'White label',
      'Priority support',
      'API access',
      'Team collaboration'
    ]
  },
  [SubscriptionPlan.PROFESSIONAL]: {
    name: 'Professional',
    description: 'Perfect for growing businesses',
    monthlyPrice: 1399,
    yearlyPrice: 12591, // 25% off
    maxCatalogues: 20,
    maxProductsPerCatalogue: 500,
    maxCategories: -1, // unlimited
    maxExportsPerMonth: 200,
    maxStorageGB: 500, // 500 MB
    features: {
      customDomain: true,
      advancedAnalytics: true,
      whiteLabel: true,
      prioritySupport: true,
      apiAccess: true,
      customBranding: true,
      advancedExports: true,
      teamCollaboration: true,
      advancedSEO: true,
      customThemes: true,
    },
    included: [
      'Everything in Standard',
      'White label',
      'Priority support',
      'API access',
      'Team collaboration',
      'Advanced integrations'
    ],
    excluded: [
      'Unlimited everything (see Business plan)'
    ]
  },
  [SubscriptionPlan.BUSINESS]: {
    name: 'Business',
    description: 'For large enterprises',
    monthlyPrice: 1499,
    yearlyPrice: 13491, // 25% off
    maxCatalogues: -1, // unlimited
    maxProductsPerCatalogue: -1, // unlimited
    maxCategories: -1, // unlimited
    maxExportsPerMonth: -1, // unlimited
    maxStorageGB: -1, // unlimited
    features: {
      customDomain: true,
      advancedAnalytics: true,
      whiteLabel: true,
      prioritySupport: true,
      apiAccess: true,
      customBranding: true,
      advancedExports: true,
      teamCollaboration: true,
      advancedSEO: true,
      customThemes: true,
    },
    included: [
      'Everything in Professional',
      'Unlimited catalogues',
      'Unlimited products',
      'Unlimited exports',
      'Unlimited storage',
      'Dedicated support',
      'Custom integrations'
    ],
    excluded: []
  }
} as const

// Utility functions for subscription management
export function getPlanFeatures(plan: SubscriptionPlan) {
  return PLAN_FEATURES[plan]
}

export function canCreateCatalogue(plan: SubscriptionPlan, currentCount: number, userEmail?: string): boolean {
  // Admin users have unlimited access
  if (userEmail === 'admin@catfy.com' || userEmail === 'test@catfy.com') {
    return true
  }
  
  const features = getPlanFeatures(plan)
  return features.maxCatalogues === -1 || currentCount < features.maxCatalogues
}

export function canAddProduct(plan: SubscriptionPlan, currentCount: number, userEmail?: string): boolean {
  // Admin users have unlimited access
  if (userEmail === 'admin@catfy.com' || userEmail === 'test@catfy.com') {
    return true
  }
  
  const features = getPlanFeatures(plan)
  return features.maxProductsPerCatalogue === -1 || currentCount < features.maxProductsPerCatalogue
}

export function canAddCategory(plan: SubscriptionPlan, currentCount: number, userEmail?: string): boolean {
  // Admin users have unlimited access
  if (userEmail === 'admin@catfy.com' || userEmail === 'test@catfy.com') {
    return true
  }
  
  const features = getPlanFeatures(plan)
  return features.maxCategories === -1 || currentCount < features.maxCategories
}

export function canExport(plan: SubscriptionPlan, monthlyExports: number): boolean {
  const features = getPlanFeatures(plan)
  return features.maxExportsPerMonth === -1 || monthlyExports < features.maxExportsPerMonth
}

export function hasFeature(plan: SubscriptionPlan, feature: string): boolean {
  const planFeatures = getPlanFeatures(plan)
  return (planFeatures.features as any)[feature] as boolean
}

export function getUpgradeMessage(plan: SubscriptionPlan, feature: string): string {
  const planNames = {
    [SubscriptionPlan.FREE]: 'Standard',
    [SubscriptionPlan.STANDARD]: 'Professional',
    [SubscriptionPlan.PROFESSIONAL]: 'Business',
    [SubscriptionPlan.BUSINESS]: 'Business'
  }
  
  const nextPlan = planNames[plan]
  return `Upgrade to ${nextPlan} plan to access ${feature}`
}

export function formatPrice(price: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(price)
}

export function calculateYearlySavings(monthlyPrice: number, yearlyPrice: number): number {
  return (monthlyPrice * 12) - yearlyPrice
}

export function getYearlySavingsPercentage(monthlyPrice: number, yearlyPrice: number): number {
  if (monthlyPrice === 0) return 0
  const savings = calculateYearlySavings(monthlyPrice, yearlyPrice)
  return Math.round((savings / (monthlyPrice * 12)) * 100)
}