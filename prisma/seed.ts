import { PrismaClient, AccountType, CouponType, BillingCycle, CatalogueStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Skip test profile creation in production
  console.log('ℹ️ Skipping test profile creation')

  // Create FIRST100 coupon
  const first100Coupon = await prisma.coupon.upsert({
    where: { code: 'FIRST100' },
    update: {},
    create: {
      code: 'FIRST100',
      name: 'First 100 Customers',
      description: 'Special discount for our first 100 customers - 50% off yearly plans',
      type: CouponType.PERCENTAGE,
      value: 50.0,
      currency: 'USD',
      isActive: true,
      isPublic: true,
      limitTotal: 100,
      limitPerCustomer: 1,
      usedCount: 0,
      allowedBillingCycles: [BillingCycle.YEARLY],
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  })

  console.log('✅ Created FIRST100 coupon:', first100Coupon.code)

  // Create additional coupons for testing
  const welcomeCoupon = await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      name: 'Welcome Discount',
      description: '20% off your first month',
      type: CouponType.PERCENTAGE,
      value: 20.0,
      currency: 'USD',
      isActive: true,
      isPublic: false,
      limitTotal: null, // Unlimited
      limitPerCustomer: 1,
      usedCount: 0,
      allowedBillingCycles: [BillingCycle.MONTHLY, BillingCycle.YEARLY],
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    },
  })

  const fixedCoupon = await prisma.coupon.upsert({
    where: { code: 'SAVE10' },
    update: {},
    create: {
      code: 'SAVE10',
      name: 'Save $10',
      description: '$10 off any plan',
      type: CouponType.FIXED_AMOUNT,
      value: 10.0,
      currency: 'USD',
      isActive: true,
      isPublic: true,
      limitTotal: 500,
      limitPerCustomer: 1,
      usedCount: 0,
      allowedBillingCycles: [BillingCycle.MONTHLY, BillingCycle.YEARLY],
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  console.log('✅ Created additional coupons:', [welcomeCoupon.code, fixedCoupon.code])

  // Skip sample data creation in production
  console.log('ℹ️ Skipping sample catalogue and product creation')

  /*
  // Create sample catalogue
  const sampleCatalogue = await prisma.catalogue.upsert({
    where: { slug: 'tech-gadgets-collection' },
    update: {},
    create: {
      name: 'Tech Gadgets Collection',
      description: 'A curated collection of the latest tech gadgets and accessories',
      theme: 'modern',
      isPublic: true,
      slug: 'tech-gadgets-collection',
      status: CatalogueStatus.PUBLISHED,
      publishedAt: new Date(),
      profileId: testProfile.id,
      settings: {
        companyInfo: {
          companyName: 'Tech Store',
          companyDescription: 'Your trusted tech partner'
        },
        displaySettings: {
          showPrices: true,
          showCategories: true,
          allowSearch: true,
          showProductCodes: false
        }
      },
    },
  })

  // console.log('✅ Created sample catalogue:', sampleCatalogue.name)

  // Create categories
  /*
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Smartphones',
        description: 'Latest smartphones and mobile devices',
        color: '#EF4444',
        sortOrder: 1,
        catalogueId: sampleCatalogue.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Accessories',
        description: 'Phone cases, chargers, and other accessories',
        color: '#10B981',
        sortOrder: 2,
        catalogueId: sampleCatalogue.id,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Audio',
        description: 'Headphones, speakers, and audio equipment',
        color: '#8B5CF6',
        sortOrder: 3,
        catalogueId: sampleCatalogue.id,
      },
    }),
  ])

  console.log('✅ Created categories:', categories.map(c => c.name))

  // Create sample products
  const products = [
    {
      name: 'iPhone 15 Pro',
      description: 'The latest iPhone with titanium design and advanced camera system',
      price: 999.00,
      currency: 'USD',
      sku: 'IPH15PRO-128',
      images: [
        'https://example.com/iphone15pro-1.jpg',
        'https://example.com/iphone15pro-2.jpg',
      ],
      tags: ['smartphone', 'apple', 'premium', 'new'],
      categoryId: categories[0].id,
      sortOrder: 1,
    },
    {
      name: 'Samsung Galaxy S24',
      description: 'Flagship Android phone with AI-powered features',
      price: 899.00,
      currency: 'USD',
      sku: 'SGS24-256',
      images: [
        'https://example.com/galaxy-s24-1.jpg',
        'https://example.com/galaxy-s24-2.jpg',
      ],
      tags: ['smartphone', 'samsung', 'android', 'ai'],
      categoryId: categories[0].id,
      sortOrder: 2,
    },
    {
      name: 'MagSafe Wireless Charger',
      description: 'Fast wireless charging for iPhone with magnetic alignment',
      price: 39.00,
      currency: 'USD',
      sku: 'MAGSAFE-WC',
      images: ['https://example.com/magsafe-charger.jpg'],
      tags: ['charger', 'wireless', 'magsafe', 'apple'],
      categoryId: categories[1].id,
      sortOrder: 3,
    },
    {
      name: 'Premium Phone Case',
      description: 'Durable protection with elegant design',
      price: 29.99,
      currency: 'USD',
      sku: 'CASE-PREM-001',
      images: ['https://example.com/phone-case.jpg'],
      tags: ['case', 'protection', 'premium'],
      categoryId: categories[1].id,
      sortOrder: 4,
    },
    {
      name: 'AirPods Pro (3rd Gen)',
      description: 'Active noise cancellation with spatial audio',
      price: 249.00,
      currency: 'USD',
      sku: 'AIRPODS-PRO-3',
      images: [
        'https://example.com/airpods-pro-1.jpg',
        'https://example.com/airpods-pro-2.jpg',
      ],
      tags: ['headphones', 'wireless', 'apple', 'noise-cancelling'],
      categoryId: categories[2].id,
      sortOrder: 5,
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable speaker with 360-degree sound',
      price: 79.99,
      currency: 'USD',
      sku: 'SPEAKER-BT-360',
      images: ['https://example.com/bluetooth-speaker.jpg'],
      tags: ['speaker', 'bluetooth', 'portable', 'wireless'],
      categoryId: categories[2].id,
      sortOrder: 6,
    },
  ]

  const createdProducts = await Promise.all(
    products.map(product =>
      prisma.product.create({
        data: {
          ...product,
          catalogueId: sampleCatalogue.id,
        },
      })
    )
  )

  console.log('✅ Created products:', createdProducts.map(p => p.name))

  // Create a test subscription
  const testSubscription = await prisma.subscription.upsert({
    where: { stripeSubscriptionId: 'sub_test_123456789' },
    update: {},
    create: {
      profileId: testProfile.id,
      stripeSubscriptionId: 'sub_test_123456789',
      stripeCustomerId: 'cus_test_123456789',
      stripePriceId: 'price_test_yearly',
      status: 'ACTIVE',
      billingCycle: BillingCycle.YEARLY,
      amount: 99.00,
      currency: 'USD',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      couponId: first100Coupon.id,
    },
  })

  console.log('✅ Created test subscription:', testSubscription.id)

  // Create coupon usage record
  await prisma.couponUsage.upsert({
    where: {
      couponId_profileId: {
        couponId: first100Coupon.id,
        profileId: testProfile.id,
      },
    },
    update: {},
    create: {
      couponId: first100Coupon.id,
      profileId: testProfile.id,
      subscriptionId: testSubscription.id,
      ipAddress: '127.0.0.1',
      userAgent: 'Test User Agent',
    },
  })

  // Update coupon used count
  await prisma.coupon.update({
    where: { id: first100Coupon.id },
    data: { usedCount: 1 },
  })

  console.log('✅ Created coupon usage record')

  // Create some analytics events
  const analyticsEvents = [
    {
      event: 'USER_SIGNUP',
      metadata: { source: 'landing_page', accountType: 'BUSINESS' },
      profileId: testProfile.id,
      ipAddress: '127.0.0.1',
    },
    {
      event: 'CATALOGUE_CREATED',
      metadata: { catalogueId: sampleCatalogue.id, theme: 'modern' },
      profileId: testProfile.id,
      catalogueId: sampleCatalogue.id,
      ipAddress: '127.0.0.1',
    },
    {
      event: 'CATALOGUE_PUBLISHED',
      metadata: { catalogueId: sampleCatalogue.id, productCount: createdProducts.length },
      profileId: testProfile.id,
      catalogueId: sampleCatalogue.id,
      ipAddress: '127.0.0.1',
    },
    {
      event: 'COUPON_USED',
      metadata: { couponCode: 'FIRST100', discountAmount: 49.50 },
      profileId: testProfile.id,
      ipAddress: '127.0.0.1',
    },
  ]

  await Promise.all(
    analyticsEvents.map(event =>
      prisma.analytics.create({ data: event as any })
    )
  )

  console.log('✅ Created analytics events')

  */

  console.log('🎉 Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Created 3 coupons (including FIRST100)`)
  console.log('\n🎫 Test coupon: FIRST100 (50% off yearly, 100/100 remaining)')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })