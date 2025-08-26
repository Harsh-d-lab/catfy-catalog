import { PrismaClient, SubscriptionPlan } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPlans() {
  console.log('Seeding plan features...')

  // Delete existing plan features
  await prisma.planFeature.deleteMany()

  // Create plan features based on the pricing structure
  const planFeatures = [
    {
      plan: SubscriptionPlan.FREE,
      name: 'Free Plan',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxCatalogues: 1,
      maxProductsPerCatalogue: 50,
      maxCategories: 5,
      maxExportsPerMonth: 5,
      maxStorageGB: 1,
      hasCustomDomain: false,
      hasAdvancedAnalytics: false,
      hasWhiteLabel: false,
      hasPrioritySupport: false,
      hasAPIAccess: false,
      hasCustomBranding: false,
      hasAdvancedExports: false,
      hasTeamCollaboration: false,
      hasAdvancedSEO: false,
      hasCustomThemes: false,
    },
    {
      plan: SubscriptionPlan.STANDARD,
      name: 'Standard Plan',
      description: 'Great for small businesses',
      monthlyPrice: 19,
      yearlyPrice: 190, // 2 months free
      maxCatalogues: 5,
      maxProductsPerCatalogue: 500,
      maxCategories: 20,
      maxExportsPerMonth: 50,
      maxStorageGB: 10,
      hasCustomDomain: true,
      hasAdvancedAnalytics: true,
      hasWhiteLabel: false,
      hasPrioritySupport: false,
      hasAPIAccess: false,
      hasCustomBranding: true,
      hasAdvancedExports: true,
      hasTeamCollaboration: false,
      hasAdvancedSEO: true,
      hasCustomThemes: true,
    },
    {
      plan: SubscriptionPlan.PROFESSIONAL,
      name: 'Professional Plan',
      description: 'Perfect for growing businesses',
      monthlyPrice: 49,
      yearlyPrice: 490, // 2 months free
      maxCatalogues: 20,
      maxProductsPerCatalogue: 2000,
      maxCategories: 50,
      maxExportsPerMonth: 200,
      maxStorageGB: 50,
      hasCustomDomain: true,
      hasAdvancedAnalytics: true,
      hasWhiteLabel: true,
      hasPrioritySupport: true,
      hasAPIAccess: true,
      hasCustomBranding: true,
      hasAdvancedExports: true,
      hasTeamCollaboration: true,
      hasAdvancedSEO: true,
      hasCustomThemes: true,
    },
    {
      plan: SubscriptionPlan.BUSINESS,
      name: 'Business Plan',
      description: 'For large enterprises',
      monthlyPrice: 99,
      yearlyPrice: 990, // 2 months free
      maxCatalogues: -1, // unlimited
      maxProductsPerCatalogue: -1, // unlimited
      maxCategories: -1, // unlimited
      maxExportsPerMonth: -1, // unlimited
      maxStorageGB: -1, // unlimited
      hasCustomDomain: true,
      hasAdvancedAnalytics: true,
      hasWhiteLabel: true,
      hasPrioritySupport: true,
      hasAPIAccess: true,
      hasCustomBranding: true,
      hasAdvancedExports: true,
      hasTeamCollaboration: true,
      hasAdvancedSEO: true,
      hasCustomThemes: true,
    },
  ]

  for (const feature of planFeatures) {
    await prisma.planFeature.create({
      data: feature,
    })
    console.log(`Created plan feature for ${feature.name}`)
  }

  console.log('Plan features seeded successfully!')
}

seedPlans()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })