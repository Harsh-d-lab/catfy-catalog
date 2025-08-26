import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_PLANS = {
  monthly: {
    priceId: 'price_monthly_placeholder',
    amount: 29,
    currency: 'usd',
    interval: 'month' as const,
    name: 'Monthly Plan',
  },
  yearly: {
    priceId: 'price_yearly_placeholder',
    amount: 290,
    currency: 'usd',
    interval: 'year' as const,
    name: 'Yearly Plan',
  },
} as const

export type StripePlan = keyof typeof STRIPE_PLANS

export async function createCustomer({
  email,
  name,
  metadata = {},
}: {
  email: string
  name?: string
  metadata?: Record<string, string>
}) {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  })
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  couponId,
  metadata = {},
}: {
  customerId?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  couponId?: string
  metadata?: Record<string, string>
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
  }

  if (customerId) {
    sessionParams.customer = customerId
  } else {
    sessionParams.customer_creation = 'always'
  }

  if (couponId) {
    sessionParams.discounts = [
      {
        coupon: couponId,
      },
    ]
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

export async function createSubscription({
  customerId,
  priceId,
  couponId,
  metadata = {},
}: {
  customerId: string
  priceId: string
  couponId?: string
  metadata?: Record<string, string>
}) {
  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    metadata,
    expand: ['latest_invoice.payment_intent'],
  }

  if (couponId) {
    subscriptionParams.coupon = couponId
  }

  return await stripe.subscriptions.create(subscriptionParams)
}

export async function cancelSubscription(subscriptionId: string, atPeriodEnd = true) {
  if (atPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  } else {
    return await stripe.subscriptions.cancel(subscriptionId)
  }
}

export async function updateSubscription({
  subscriptionId,
  priceId,
  couponId,
}: {
  subscriptionId: string
  priceId?: string
  couponId?: string
}) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  const updateParams: Stripe.SubscriptionUpdateParams = {}

  if (priceId) {
    updateParams.items = [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ]
  }

  if (couponId) {
    updateParams.coupon = couponId
  }

  return await stripe.subscriptions.update(subscriptionId, updateParams)
}

export async function createStripeCoupon({
  id,
  name,
  percentOff,
  amountOff,
  currency = 'usd',
  duration = 'once',
  maxRedemptions,
  redeemBy,
}: {
  id: string
  name: string
  percentOff?: number
  amountOff?: number
  currency?: string
  duration?: 'once' | 'repeating' | 'forever'
  maxRedemptions?: number
  redeemBy?: number
}) {
  const couponParams: Stripe.CouponCreateParams = {
    id,
    name,
    duration,
  }

  if (percentOff) {
    couponParams.percent_off = percentOff
  } else if (amountOff) {
    couponParams.amount_off = amountOff
    couponParams.currency = currency
  }

  if (maxRedemptions) {
    couponParams.max_redemptions = maxRedemptions
  }

  if (redeemBy) {
    couponParams.redeem_by = redeemBy
  }

  return await stripe.coupons.create(couponParams)
}

export async function getCustomerPortalUrl(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session.url
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}