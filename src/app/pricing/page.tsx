'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'
import { SubscriptionPlan } from '@prisma/client'
import { PLAN_FEATURES, formatPrice, getYearlySavingsPercentage } from '@/lib/subscription'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      plan: SubscriptionPlan.FREE,
      popular: false,
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const
    },
    {
      plan: SubscriptionPlan.STANDARD,
      popular: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'default' as const
    },
    {
      plan: SubscriptionPlan.PROFESSIONAL,
      popular: false,
      buttonText: 'Start Free Trial',
      buttonVariant: 'outline' as const
    },
    {
      plan: SubscriptionPlan.BUSINESS,
      popular: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start free and scale as you grow. All plans include our core features.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map(({ plan, popular, buttonText, buttonVariant }) => {
            const features = PLAN_FEATURES[plan]
            const price = billingCycle === 'monthly' ? features.monthlyPrice : features.yearlyPrice
            const displayPrice = billingCycle === 'yearly' ? price / 12 : price
            const savings = billingCycle === 'yearly' ? getYearlySavingsPercentage(features.monthlyPrice, features.yearlyPrice) : 0

            return (
              <Card key={plan} className={`relative ${popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold">{features.name}</CardTitle>
                  <CardDescription>{features.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        {formatPrice(displayPrice)}
                      </span>
                      <span className="text-gray-500 ml-1">
                        /{billingCycle === 'yearly' ? 'mo' : 'month'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && features.monthlyPrice > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Billed annually • Save {savings}%
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Limits */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Catalogues</span>
                      <span className="font-medium">
                        {features.maxCatalogues === -1 ? 'Unlimited' : features.maxCatalogues}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Products per catalogue</span>
                      <span className="font-medium">
                        {features.maxProductsPerCatalogue === -1 ? 'Unlimited' : features.maxProductsPerCatalogue}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Monthly exports</span>
                      <span className="font-medium">
                        {features.maxExportsPerMonth === -1 ? 'Unlimited' : features.maxExportsPerMonth}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Storage</span>
                      <span className="font-medium">
                        {features.maxStorageGB === -1 ? 'Unlimited' : `${features.maxStorageGB}GB`}
                      </span>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Included Features */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-900">✓ Included:</h4>
                    <ul className="space-y-1">
                      {features.included.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-green-800">
                          <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Excluded Features */}
                  {features.excluded.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-600">✗ Not included:</h4>
                      <ul className="space-y-1">
                        {features.excluded.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-500">
                            <X className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button 
                    variant={buttonVariant} 
                    className="w-full"
                    size="lg"
                  >
                    {buttonText}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">
                Yes, all paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}