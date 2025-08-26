import React from 'react'
import { Product, Category } from '@prisma/client'
import Image from 'next/image'

interface ProductGridProps {
  products: (Product & { category: Category | null })[]
  categories: Category[]
  themeColors: {
    primary: string
    secondary: string
    accent: string
  }
  layout?: 'grid' | 'category'
}

export function ProductGrid({ products, categories, themeColors, layout = 'category' }: ProductGridProps) {
  // Group products by category
  const productsByCategory = categories.map(category => ({
    category,
    products: products.filter(p => p.categoryId === category.id)
  })).filter(group => group.products.length > 0)

  const formatPrice = (price: number | null, currency: string = 'USD') => {
    if (!price) return 'Contact for Price'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(Number(price))
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 
          className="text-5xl font-bold mb-4"
          style={{ color: 'var(--theme-primary)' }}
        >
          Product
        </h1>
        <h2 className="text-6xl font-bold text-gray-900 mb-6">
          Category
        </h2>
        <div className="w-24 h-1 mx-auto" style={{ backgroundColor: 'var(--theme-primary)' }} />
      </div>

      {/* Product Categories */}
      <div className="space-y-16">
        {productsByCategory.map((group, groupIndex) => (
          <div key={group.category.id} className="">
            {/* Category Header */}
            <div className="flex items-center mb-8">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-4"
                style={{ backgroundColor: group.category.color || 'var(--theme-primary)' }}
              >
                {group.category.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {group.category.name}
                </h3>
                <p className="text-gray-600">
                  {group.products.length} {group.products.length === 1 ? 'Product' : 'Products'}
                </p>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {group.products.slice(0, 6).map((product) => (
                <div key={product.id} className="group">
                  {/* Product Image */}
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4 relative">
                    {product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                          <span className="text-sm">No Image</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Product Badge */}
                    {product.tags.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <span 
                          className="px-2 py-1 text-xs font-medium text-white rounded-full"
                          style={{ backgroundColor: 'var(--theme-primary)' }}
                        >
                          {product.tags[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">
                      {product.name}
                    </h4>
                    
                    {product.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Price and SKU */}
                    <div className="flex items-center justify-between">
                      {product.priceDisplay === 'show' && product.price ? (
                        <span 
                          className="font-bold text-lg"
                          style={{ color: 'var(--theme-primary)' }}
                        >
                          {formatPrice(Number(product.price), product.currency)}
                        </span>
                      ) : product.priceDisplay === 'contact' ? (
                        <span className="text-gray-600 text-sm font-medium">
                          Contact for Price
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm font-medium">
                          Price on Request
                        </span>
                      )}
                      
                      {product.sku && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {product.sku}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Show more indicator if there are more products */}
            {group.products.length > 6 && (
              <div className="mt-6 text-center">
                <span className="text-gray-500 text-sm">
                  +{group.products.length - 6} more {group.products.length - 6 === 1 ? 'product' : 'products'} in this category
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center p-8 rounded-lg" style={{ backgroundColor: 'var(--theme-accent)' }}>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Interested in our products?
        </h3>
        <p className="text-gray-600 mb-4">
          Contact us for detailed specifications, pricing, and availability
        </p>
        <div 
          className="inline-block px-6 py-3 rounded-lg text-white font-medium"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          Get in Touch
        </div>
      </div>
    </div>
  )
}

export default ProductGrid