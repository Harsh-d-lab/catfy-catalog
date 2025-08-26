'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/Header'
import { 
  Crown, 
  Zap, 
  Check, 
  X, 
  CreditCard, 
  Calendar, 
  Download, 
  Users, 
  Shield, 
  Loader2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface UserProfile {
  id: string
  fullName: string
  accountType: 'INDIVIDUAL' | 'BUSINESS'
  subscription: {
    id: string
    plan: 'FREE' | 'MONTHLY' | 'YEARLY'
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE'
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
  } | null
}

interface PricingPlan {
  id: 'FREE' | 'MONTHLY' | 'YEARLY'
  name: string
  price: number
  interval: string
  description: string
  features: string[]
  limitations?: string[]
  popular?: boolean
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    interval: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 catalogue',
      'Up to 50 products per catalogue',
      'Basic themes',
      'PDF export',
      'Public sharing'
    ],
    limitations: [
      'Limited customization',
      'CATFY branding',
      'Basic support'
    ]
  },
  {
    id: 'MONTHLY',
    name: 'Pro Monthly',
    price: 9.99,
    interval: 'month',
    description: 'For growing businesses',
    features: [
      'Unlimited catalogues',
      'Unlimited products',
      'Premium themes',
      'Custom branding',
      'Advanced PDF export',
      'Analytics dashboard',
      'Priority support',
      'Custom domains'
    ],
    popular: true
  },
  {
    id: 'YEARLY',
    name: 'Pro Yearly',
    price: 99.99,
    interval: 'year',
    description: 'Best value for committed users',
    features: [
      'Everything in Pro Monthly',
      '2 months free',
      'Advanced analytics',
      'White-label options',
      'API access',
      'Dedicated support'
    ]
  }
]

export default function BillingPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/profile')
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      setError('Failed to load profile')
      console.error('Profile error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponDiscount(null)
      return
    }

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: couponCode }),
      })

      if (response.ok) {
        const data = await response.json()
        setCouponDiscount(data.discountAmount)
        toast.success(`Coupon applied! ${data.discountAmount}% discount`)
      } else {
        setCouponDiscount(null)
        const errorData = await response.json()
        toast.error(errorData.error || 'Invalid coupon code')
      }
    } catch (err) {
      setCouponDiscount(null)
      toast.error('Failed to validate coupon')
    }
  }

  const createCheckoutSession = async (planId: 'MONTHLY' | 'YEARLY') => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          couponCode: couponCode.trim() || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          toast.success('Subscription created successfully!')
          loadProfile()
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const openCustomerPortal = async () => {
    if (!profile?.subscription?.stripeCustomerId) {
      toast.error('No billing information found')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = data.url
      } else {
        throw new Error('Failed to open billing portal')
      }
    } catch (err) {
      toast.error('Failed to open billing portal')
    } finally {
      setIsProcessing(false)
    }
  }

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!couponDiscount) return originalPrice
    return originalPrice * (1 - couponDiscount / 100)
  }

  if (isLoading) {
    return (
      <>
        <Header title="Billing" />
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
      </>
    )
  }

  return (
    <>
      <Header title="Billing" />
      <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-gray-600">
          Manage your subscription and billing information
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {profile?.subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-600">Plan</Label>
                <div className="flex items-center gap-2 mt-1">
                  {profile.subscription.plan === 'FREE' ? (
                    <Zap className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-semibold">
                    {profile.subscription.plan === 'FREE' ? 'Free' : 
                     profile.subscription.plan === 'MONTHLY' ? 'Pro Monthly' : 'Pro Yearly'}
                  </span>
                  <Badge variant={profile.subscription.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {profile.subscription.status}
                  </Badge>
                </div>
              </div>
              
              {profile.subscription.plan !== 'FREE' && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Period</Label>
                    <div className="mt-1">
                      <div className="text-sm">
                        {format(new Date(profile.subscription.currentPeriodStart), 'MMM d, yyyy')} - 
                        {format(new Date(profile.subscription.currentPeriodEnd), 'MMM d, yyyy')}
                      </div>
                      {profile.subscription.cancelAtPeriodEnd && (
                        <div className="text-sm text-orange-600 mt-1">
                          Cancels at period end
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Actions</Label>
                    <div className="mt-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={openCustomerPortal}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="mr-2 h-4 w-4" />
                        )}
                        Manage Billing
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupon Code */}
      {(!profile?.subscription || profile.subscription.plan === 'FREE') && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Have a coupon code?</CardTitle>
            <CardDescription>
              Enter your coupon code to get a discount on your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onBlur={validateCoupon}
                />
              </div>
              <Button variant="outline" onClick={validateCoupon}>
                Apply
              </Button>
            </div>
            {couponDiscount && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">{couponDiscount}% discount applied!</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => {
          const isCurrentPlan = profile?.subscription?.plan === plan.id
          const discountedPrice = calculateDiscountedPrice(plan.price)
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular ? 'border-blue-500 shadow-lg' : ''
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white">
                    Current Plan
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.id === 'FREE' ? (
                    <Zap className="h-8 w-8 text-gray-500" />
                  ) : (
                    <Crown className="h-8 w-8 text-yellow-500" />
                  )}
                </div>
                
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold">
                      ${discountedPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>
                  
                  {couponDiscount && plan.price > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="line-through">${plan.price.toFixed(2)}</span>
                      <span className="ml-2 text-green-600 font-medium">
                        {couponDiscount}% off
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations?.map((limitation, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{limitation}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      <Check className="mr-2 h-4 w-4" />
                      Current Plan
                    </Button>
                  ) : plan.id === 'FREE' ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={profile?.subscription?.plan === 'FREE'}
                    >
                      {profile?.subscription?.plan === 'FREE' ? 'Current Plan' : 'Downgrade'}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => createCheckoutSession(plan.id as 'MONTHLY' | 'YEARLY')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {profile?.subscription?.plan === 'FREE' ? 'Upgrade' : 'Switch'} to {plan.name}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* FAQ or Additional Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Payment & Security</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Secure payments powered by Stripe</li>
                <li>• Cancel anytime, no hidden fees</li>
                <li>• 30-day money-back guarantee</li>
                <li>• Automatic billing on renewal date</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Need Help?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contact support for billing questions</li>
                <li>• View detailed invoices in billing portal</li>
                <li>• Update payment methods anytime</li>
                <li>• Download receipts for tax purposes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}