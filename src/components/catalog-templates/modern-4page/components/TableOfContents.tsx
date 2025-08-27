import React from 'react'
import { Product, Category } from '@prisma/client'
import Image from 'next/image'
import { ColorCustomization } from '../types/ColorCustomization'

interface TableOfContentsProps {
  categories: Category[]
  products: (Product & { category: Category | null })[]
  themeColors: {
    primary: string
    secondary: string
    accent: string
  }
  customColors?: ColorCustomization
}

export function TableOfContents({ categories, products, themeColors, customColors }: TableOfContentsProps) {
  // Group products by category for counting
  const categoryStats = categories.map(category => {
    const categoryProducts = products.filter(p => p.categoryId === category.id)
    return {
      ...category,
      productCount: categoryProducts.length,
      sampleProducts: categoryProducts.slice(0, 3) // Get first 3 products for preview
    }
  })

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 
          className="text-5xl font-bold mb-4"
          style={{ color: customColors?.textColors.title || '#3b82f6' }}
        >
          Table of
        </h1>
        <h2 className="text-6xl font-bold text-gray-900 mb-6">
          Content
        </h2>
        <div className="w-24 h-1 mx-auto" style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }} />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categoryStats.map((category, index) => (
          <div key={category.id} className="group">
            {/* Category Number and Image */}
            <div className="relative mb-6">
              {/* Category Preview Images */}
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                {category.sampleProducts.length > 0 && category.sampleProducts[0].images.length > 0 ? (
                  <Image
                    src={category.sampleProducts[0].images[0]}
                    alt={category.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-white text-4xl font-bold"
                    style={{ backgroundColor: category.color || customColors?.textColors.title || '#3b82f6' }}
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Category Number */}
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-4" style={{ borderColor: customColors?.textColors.title || '#3b82f6' }}>
                <span className="text-xl font-bold" style={{ color: customColors?.textColors.title || '#3b82f6' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Category Info */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                {category.name}
              </h3>
              <p className="text-lg font-medium" style={{ color: customColors?.textColors.title || '#3b82f6' }}>
                CATEGORY
              </p>
              
              {/* Product Count and Description */}
              <div className="space-y-2">
                <p className="text-gray-600">
                  • {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                </p>
                {category.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    • {category.description}
                  </p>
                )}
                <p className="text-gray-600 text-sm">
                  • Premium quality items
                </p>
                <p className="text-gray-600 text-sm">
                  • Competitive pricing
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stats */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold" style={{ color: customColors?.textColors.title || '#3b82f6' }}>
              {categories.length}
            </div>
            <div className="text-gray-600 uppercase tracking-wide text-sm">
              Categories
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: customColors?.textColors.title || '#3b82f6' }}>
              {products.length}
            </div>
            <div className="text-gray-600 uppercase tracking-wide text-sm">
              Products
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: customColors?.textColors.title || '#3b82f6' }}>
              100%
            </div>
            <div className="text-gray-600 uppercase tracking-wide text-sm">
              Quality
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableOfContents