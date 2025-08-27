import { Catalogue, Product, Category, Profile } from '@prisma/client'
import { ModernCatalogTemplate } from './modern-4page/ModernCatalogTemplate'

// Template interface that all catalog templates must implement
export interface CatalogTemplateProps {
  catalogue: Catalogue & {
    products: (Product & { category: Category | null })[]
    categories: Category[]
  }
  profile: Profile
  themeColors: {
    primary: string
    secondary: string
    accent: string
  }
  isEditMode?: boolean
  catalogueId?: string
  onProductsReorder?: (products: (Product & { category: Category | null })[]) => void
  onCatalogueUpdate?: (catalogueId: string, updates: Partial<Catalogue>) => void
  onProductUpdate?: (productId: string, updates: Partial<Product>) => void
  customColors?: any
  fontCustomization?: any
  spacingCustomization?: any
  advancedStyles?: any
}

// Template configuration interface
export interface TemplateConfig {
  id: string
  name: string
  description: string
  category: 'modern' | 'classic' | 'minimal' | 'creative'
  isPremium: boolean
  previewImage: string
  component: React.ComponentType<CatalogTemplateProps>
  features: string[]
  pageCount: number
  supportedFields: {
    products: string[]
    categories: string[]
    profile: string[]
  }
}

// Available catalog templates
export const CATALOG_TEMPLATES: TemplateConfig[] = [
  {
    id: 'modern-4page',
    name: 'Modern 4-Page Catalog',
    description: 'A sleek, modern catalog design with 4 pages featuring cover, table of contents, product grid, and contact information.',
    category: 'modern',
    isPremium: false,
    previewImage: '/templates/modern-4page-preview.jpg',
    component: ModernCatalogTemplate,
    features: [
      '4-page layout',
      'Modern design',
      'Product categorization',
      'Contact information',
      'Responsive grid',
      'Print-optimized'
    ],
    pageCount: 4,
    supportedFields: {
      products: ['name', 'description', 'price', 'images', 'sku', 'tags', 'currency', 'priceDisplay'],
      categories: ['name', 'description', 'color'],
      profile: ['companyName', 'logo', 'email', 'phone', 'website', 'address', 'description', 'tagline', 'socialLinks']
    }
  }
  // Future templates can be added here:
  // {
  //   id: 'classic-brochure',
  //   name: 'Classic Brochure',
  //   description: 'Traditional tri-fold brochure style catalog',
  //   category: 'classic',
  //   isPremium: true,
  //   previewImage: '/templates/classic-brochure-preview.jpg',
  //   component: ClassicBrochureTemplate,
  //   features: ['Tri-fold layout', 'Classic typography', 'Professional design'],
  //   pageCount: 3,
  //   supportedFields: { ... }
  // }
]

// Helper function to get template by ID
export function getTemplateById(templateId: string): TemplateConfig | undefined {
  return CATALOG_TEMPLATES.find(template => template.id === templateId)
}

// Helper function to get template component
export function getTemplateComponent(templateId: string): React.ComponentType<CatalogTemplateProps> | undefined {
  const template = getTemplateById(templateId)
  return template?.component
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: TemplateConfig['category']): TemplateConfig[] {
  return CATALOG_TEMPLATES.filter(template => template.category === category)
}

// Helper function to get free templates
export function getFreeTemplates(): TemplateConfig[] {
  return CATALOG_TEMPLATES.filter(template => !template.isPremium)
}

// Helper function to get premium templates
export function getPremiumTemplates(): TemplateConfig[] {
  return CATALOG_TEMPLATES.filter(template => template.isPremium)
}

// Export the modern template for backward compatibility
export { ModernCatalogTemplate }