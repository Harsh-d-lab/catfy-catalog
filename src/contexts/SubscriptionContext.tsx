'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { SubscriptionPlan } from '@prisma/client'
import { PLAN_FEATURES, getPlanFeatures, hasFeature } from '@/lib/subscription'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan
  planFeatures: typeof PLAN_FEATURES[SubscriptionPlan]
  isLoading: boolean
  
  // Usage tracking
  usage: {
    catalogues: number
    monthlyExports: number
  }
  
  // Limit checking functions
  canCreateCatalogue: () => boolean
  canAddProduct: (catalogueId: string) => Promise<boolean>
  canAddCategory: (catalogueId: string) => Promise<boolean>
  canExport: () => boolean
  hasFeatureAccess: (feature: string) => boolean
  
  // Upgrade functions
  getUpgradeUrl: () => string
  showUpgradeModal: (feature: string) => void
  
  // Refresh subscription data
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE)
  const [usage, setUsage] = useState({ catalogues: 0, monthlyExports: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()

  const planFeatures = getPlanFeatures(currentPlan)

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's subscription from your API
      const response = await fetch('/api/subscription/current')
      if (response.ok) {
        const data = await response.json()
        setCurrentPlan(data.plan || SubscriptionPlan.FREE)
        setUsage(data.usage || { catalogues: 0, monthlyExports: 0 })
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if user can create a new catalogue
  const canCreateCatalogue = () => {
    // If still loading subscription data, allow the action (don't block)
    if (isLoading) {
      return true
    }
    
    if (planFeatures.maxCatalogues === -1) return true
    return usage.catalogues < planFeatures.maxCatalogues
  }

  // Check if user can add a product to a catalogue
  const canAddProduct = async (catalogueId: string): Promise<boolean> => {
    // If still loading subscription data, allow the action (don't block)
    if (isLoading) {
      return true
    }
    
    if (planFeatures.maxProductsPerCatalogue === -1) return true
    
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/products/count`)
      if (response.ok) {
        const { count } = await response.json()
        return count < planFeatures.maxProductsPerCatalogue
      }
    } catch (error) {
      console.error('Error checking product count:', error)
    }
    return false
  }

  // Check if user can add a category to a catalogue
  const canAddCategory = async (catalogueId: string): Promise<boolean> => {
    // If still loading subscription data, allow the action (don't block)
    if (isLoading) {
      return true
    }
    
    if (planFeatures.maxCategories === -1) return true
    
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/categories/count`)
      if (response.ok) {
        const { count } = await response.json()
        return count < planFeatures.maxCategories
      }
    } catch (error) {
      console.error('Error checking category count:', error)
    }
    return false
  }

  // Check if user can export
  const canExport = () => {
    if (planFeatures.maxExportsPerMonth === -1) return true
    return usage.monthlyExports < planFeatures.maxExportsPerMonth
  }

  // Check if user has access to a specific feature
  const hasFeatureAccess = (feature: string) => {
    return hasFeature(currentPlan, feature as any)
  }

  // Get upgrade URL
  const getUpgradeUrl = () => {
    return '/pricing'
  }

  // Show upgrade modal (you can implement a modal component)
  const showUpgradeModal = (feature: string) => {
    // This could trigger a modal or redirect to pricing
    console.log(`Upgrade required for: ${feature}`)
    // You can implement a toast notification or modal here
  }

  // Refresh subscription data
  const refreshSubscription = async () => {
    await fetchSubscriptionData()
  }

  useEffect(() => {
    fetchSubscriptionData()
  }, [])

  const value: SubscriptionContextType = {
    currentPlan,
    planFeatures,
    isLoading,
    usage,
    canCreateCatalogue,
    canAddProduct,
    canAddCategory,
    canExport,
    hasFeatureAccess,
    getUpgradeUrl,
    showUpgradeModal,
    refreshSubscription,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

// Hook for checking limits with automatic upgrade prompts
export function useSubscriptionLimit() {
  const subscription = useSubscription()

  const checkLimit = async (
    action: 'create_catalogue' | 'add_product' | 'add_category' | 'export',
    catalogueId?: string
  ): Promise<boolean> => {
    let canPerform = false
    let featureName = ''

    switch (action) {
      case 'create_catalogue':
        canPerform = subscription.canCreateCatalogue()
        featureName = 'additional catalogues'
        break
      case 'add_product':
        if (catalogueId) {
          canPerform = await subscription.canAddProduct(catalogueId)
          featureName = 'more products'
        }
        break
      case 'add_category':
        if (catalogueId) {
          canPerform = await subscription.canAddCategory(catalogueId)
          featureName = 'more categories'
        }
        break
      case 'export':
        canPerform = subscription.canExport()
        featureName = 'more exports this month'
        break
    }

    if (!canPerform) {
      subscription.showUpgradeModal(featureName)
    }

    return canPerform
  }

  return { checkLimit }
}