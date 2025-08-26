import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, constructWebhookEvent } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { BillingCycle, SubscriptionStatus, Prisma, WebhookSource } from '@prisma/client'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Processing Stripe webhook:', event.type)

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log webhook event
    await prisma.webhookEvent.create({
      data: {
        source: WebhookSource.STRIPE,
        eventType: event.type,
        processed: true,
        data: event.data.object as any,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { customer, subscription, metadata } = session

  if (!customer || !subscription || !metadata?.profileId) {
    console.error('Missing required data in checkout session')
    return
  }

  try {
    // Get the subscription details
    if (!stripe) {
      console.error('Stripe is not configured')
      return
    }
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription as string)
    
    // Map Stripe status to our enum
    const mapStripeStatus = (status: string): SubscriptionStatus => {
      switch (status) {
        case 'active':
          return 'ACTIVE'
        case 'past_due':
          return 'PAST_DUE'
        case 'canceled':
          return 'CANCELED'
        case 'unpaid':
          return 'UNPAID'
        case 'incomplete':
        case 'incomplete_expired':
          return 'INCOMPLETE'
        case 'trialing':
          return 'TRIALING'
        default:
          return 'INCOMPLETE'
      }
    }

    // Determine billing cycle from price
    const priceId = stripeSubscription.items.data[0]?.price.id
    const billingCycle = priceId?.includes('yearly') ? BillingCycle.YEARLY : BillingCycle.MONTHLY

    await prisma.$transaction(async (tx) => {
      // Update profile with Stripe customer ID if not set
      await tx.profile.update({
        where: { id: metadata.profileId },
        data: {
          stripeCustomerId: customer as string,
        },
      })

      // Create or update subscription
      await tx.subscription.upsert({
        where: {
          stripeSubscriptionId: stripeSubscription.id,
        },
        create: {
          profileId: metadata.profileId,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: customer as string,
          stripePriceId: priceId || '',
          status: mapStripeStatus(stripeSubscription.status),
          amount: new Prisma.Decimal(0), // Will be updated when we get the actual amount
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          billingCycle,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
        update: {
          status: mapStripeStatus(stripeSubscription.status),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
      })

      // Handle coupon usage if present
      if (metadata.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: metadata.couponCode.toUpperCase() },
        })

        if (coupon) {
          const subscription = await tx.subscription.findUnique({
            where: { stripeSubscriptionId: stripeSubscription.id },
          })

          if (subscription) {
            // Check if usage already exists
            const existingUsage = await tx.couponUsage.findFirst({
              where: {
                couponId: coupon.id,
                profileId: metadata.profileId,
                subscriptionId: subscription.id,
              },
            })

            if (!existingUsage) {
              await tx.couponUsage.create({
                data: {
                  couponId: coupon.id,
                  profileId: metadata.profileId,
                  subscriptionId: subscription.id,
                },
              })

              await tx.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
              })
            }
          }
        }
      }
    })

    console.log('Checkout session completed successfully')
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // This is usually handled by checkout.session.completed
  console.log('Subscription created:', subscription.id)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const mapStripeStatus = (status: string): SubscriptionStatus => {
      switch (status) {
        case 'active':
          return 'ACTIVE'
        case 'past_due':
          return 'PAST_DUE'
        case 'canceled':
          return 'CANCELED'
        case 'unpaid':
          return 'UNPAID'
        case 'incomplete':
        case 'incomplete_expired':
          return 'INCOMPLETE'
        case 'trialing':
          return 'TRIALING'
        default:
          return 'INCOMPLETE'
      }
    }

    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })

    console.log('Subscription updated successfully')
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: false,
      },
    })

    console.log('Subscription deleted successfully')
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: invoice.subscription as string,
        },
        data: {
          status: 'ACTIVE',
        },
      })
    }

    console.log('Invoice payment succeeded')
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: invoice.subscription as string,
        },
        data: {
          status: 'PAST_DUE',
        },
      })
    }

    console.log('Invoice payment failed')
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}