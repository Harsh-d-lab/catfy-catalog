'use client'

import React from 'react'
import { Catalogue, Product, Category, Profile } from '@prisma/client'
import { CatalogCover, TableOfContents, ProductGrid, ContactPage } from './components'

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
}

export function ModernCatalogTemplate({ catalogue, profile, themeColors }: ModernCatalogTemplateProps) {
  return (
    <div className="bg-white">
      {/* Page 1: Cover */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <CatalogCover 
          catalogue={catalogue}
          profile={profile}
          themeColors={themeColors}
        />
      </div>

      {/* Page 2: Table of Contents */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <TableOfContents 
          categories={catalogue.categories}
          products={catalogue.products}
          themeColors={themeColors}
        />
      </div>

      {/* Page 3: Product Grid */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <ProductGrid 
          products={catalogue.products}
          categories={catalogue.categories}
          themeColors={themeColors}
        />
      </div>

      {/* Page 4: Contact Page */}
      <div className="min-h-screen flex items-center justify-center p-8 page-break">
        <ContactPage 
          profile={profile}
          themeColors={themeColors}
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