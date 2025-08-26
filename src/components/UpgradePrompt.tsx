'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, X } from 'lucide-react'
import { SubscriptionPlan } from '@prisma/client'
import { PLAN_FEATURES, formatPrice } from '@/lib/subscription'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: SubscriptionPlan
  feature: string
  title?: string
  description?: string
}

export function UpgradePrompt({
  isOpen,
  onClose,
  currentPlan,
  feature,
  title,
  description
}: UpgradePromptProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Determine the next plan to upgrade to
  const getNextPlan = (current: SubscriptionPlan): SubscriptionPlan => {
    switch (current) {
      case SubscriptionPlan.FREE:
        return SubscriptionPlan.STANDARD
      case SubscriptionPlan.STANDARD:
        return SubscriptionPlan.PROFESSIONAL
      case SubscriptionPlan.PROFESSIONAL:
        return SubscriptionPlan.BUSINESS
      default:
        return SubscriptionPlan.BUSINESS
    }
  }

  const nextPlan = getNextPlan(currentPlan)
  const nextPlanFeatures = PLAN_FEATURES[nextPlan]
  const currentPlanFeatures = PLAN_FEATURES[currentPlan]

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      // Redirect to pricing page or initiate upgrade flow
      router.push('/pricing')
    } catch (error) {
      console.error('Error initiating upgrade:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getComparisonFeatures = () => {
    const features = [
      {
        name: 'Catalogues',
        current: currentPlanFeatures.maxCatalogues === -1 ? 'Unlimited' : currentPlanFeatures.maxCatalogues,
        next: nextPlanFeatures.maxCatalogues === -1 ? 'Unlimited' : nextPlanFeatures.maxCatalogues
      },
      {
        name: 'Categories per catalogue',
        current: currentPlanFeatures.maxCategories === -1 ? 'Unlimited' : currentPlanFeatures.maxCategories,
        next: nextPlanFeatures.maxCategories === -1 ? 'Unlimited' : nextPlanFeatures.maxCategories
      },
      {
        name: 'Products per catalogue',
        current: currentPlanFeatures.maxProductsPerCatalogue === -1 ? 'Unlimited' : currentPlanFeatures.maxProductsPerCatalogue,
        next: nextPlanFeatures.maxProductsPerCatalogue === -1 ? 'Unlimited' : nextPlanFeatures.maxProductsPerCatalogue
      },
      {
        name: 'Monthly exports',
        current: currentPlanFeatures.maxExportsPerMonth === -1 ? 'Unlimited' : currentPlanFeatures.maxExportsPerMonth,
        next: nextPlanFeatures.maxExportsPerMonth === -1 ? 'Unlimited' : nextPlanFeatures.maxExportsPerMonth
      },
      {
        name: 'Storage',
        current: currentPlanFeatures.maxStorageGB === -1 ? 'Unlimited' : `${currentPlanFeatures.maxStorageGB}GB`,
        next: nextPlanFeatures.maxStorageGB === -1 ? 'Unlimited' : `${nextPlanFeatures.maxStorageGB}GB`
      }
    ]

    return features
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <DialogTitle>
              {title || `Upgrade to ${nextPlanFeatures.name}`}
            </DialogTitle>
          </div>
          <DialogDescription>
            {description || `You've reached the limit for ${feature}. Upgrade to ${nextPlanFeatures.name} to continue.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current vs Next Plan Comparison */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="font-medium text-gray-900">{currentPlanFeatures.name}</h3>
                <p className="text-sm text-gray-500">Current Plan</p>
                <div className="mt-2">
                  <span className="text-2xl font-bold">
                    {formatPrice(currentPlanFeatures.monthlyPrice)}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <h3 className="font-medium text-blue-900">{nextPlanFeatures.name}</h3>
                  <Badge className="bg-blue-500">Recommended</Badge>
                </div>
                <p className="text-sm text-blue-600">Upgrade to</p>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(nextPlanFeatures.monthlyPrice)}
                  </span>
                  <span className="text-blue-500">/month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">What you'll get:</h4>
            <div className="space-y-2">
              {getComparisonFeatures().map((feature, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{feature.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">{feature.current}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-blue-600">{feature.next}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Additional benefits:</h4>
            <div className="space-y-2">
              {nextPlanFeatures.included.slice(1, 4).map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Maybe Later
          </Button>
          <Button onClick={handleUpgrade} disabled={isLoading}>
            {isLoading ? 'Loading...' : `Upgrade to ${nextPlanFeatures.name}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing upgrade prompts
export function useUpgradePrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [promptData, setPromptData] = useState<{
    feature: string
    title?: string
    description?: string
  }>({ feature: '' })

  const showUpgradePrompt = (feature: string, title?: string, description?: string) => {
    setPromptData({ feature, title, description })
    setIsOpen(true)
  }

  const hideUpgradePrompt = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    promptData,
    showUpgradePrompt,
    hideUpgradePrompt
  }
}