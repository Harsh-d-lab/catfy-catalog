'use client'

import React, { useState } from 'react'
import { Catalogue, Product, Category, Profile } from '@prisma/client'
import { CatalogCover, TableOfContents, ProductGrid, ContactPage } from './components'
import { ColorCustomization } from './types/ColorCustomization'

interface ModernCatalogTemplateProps {
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
  customColors?: ColorCustomization
  fontCustomization?: any
  spacingCustomization?: any
  advancedStyles?: any
}

const DEFAULT_COLORS: ColorCustomization = {
  textColors: {
    companyName: '#1f2937',
    title: '#1f2937',
    description: '#6b7280',
    productName: '#1f2937',
    productDescription: '#6b7280',
    productPrice: '#059669',
    categoryName: '#1f2937'
  },
  backgroundColors: {
    main: '#ffffff',
    cover: '#f9fafb',
    productCard: '#ffffff',
    categorySection: '#f3f4f6'
  }
}

export function ModernCatalogTemplate({ 
  catalogue, 
  profile, 
  themeColors, 
  isEditMode, 
  catalogueId, 
  onProductsReorder, 
  onCatalogueUpdate, 
  onProductUpdate,
  customColors = DEFAULT_COLORS,
  fontCustomization,
  spacingCustomization,
  advancedStyles
}: ModernCatalogTemplateProps) {

  return (
    <div 
      className="bg-white catalog-template"
    >
      {/* Page 1: Cover */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <CatalogCover 
            catalogue={catalogue} 
            profile={profile} 
            themeColors={themeColors}
            customColors={customColors}
            fontCustomization={fontCustomization}
            spacingCustomization={spacingCustomization}
            advancedStyles={advancedStyles}
            isEditMode={isEditMode}
            onCatalogueUpdate={onCatalogueUpdate}
          />
      </div>

      {/* Page 2: Table of Contents */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <TableOfContents 
          categories={catalogue.categories}
          products={catalogue.products}
          themeColors={themeColors}
          customColors={customColors}
          fontCustomization={fontCustomization}
        />
      </div>

      {/* Page 3: Product Grid */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <ProductGrid
          products={catalogue.products}
          categories={catalogue.categories}
          themeColors={themeColors}
          customColors={customColors}
          fontCustomization={fontCustomization}
          spacingCustomization={spacingCustomization}
          advancedStyles={advancedStyles}
          layout="category"
          isEditMode={isEditMode}
          catalogueId={catalogueId}
          onProductsReorder={onProductsReorder}
          onProductUpdate={onProductUpdate}
        />
      </div>

      {/* Page 4: Contact Page */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <ContactPage 
          profile={profile}
          catalogue={catalogue}
          themeColors={themeColors}
          customColors={customColors}
          fontCustomization={fontCustomization}
        />
      </div>



      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          
          .page-break:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}

export default ModernCatalogTemplate