import React, { useState, useCallback } from 'react'
import { Product, Category } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import Image from 'next/image'
import { ColorCustomization } from '../types/ColorCustomization'
import { FontCustomization, SpacingCustomization, AdvancedStyleCustomization } from './StyleCustomizer'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

interface ProductGridProps {
  products: (Product & { category: Category | null })[]
  categories: Category[]
  themeColors: {
    primary: string
    secondary: string
    accent: string
  }
  customColors?: ColorCustomization
  fontCustomization?: FontCustomization
  spacingCustomization?: SpacingCustomization
  advancedStyles?: AdvancedStyleCustomization
  layout?: 'grid' | 'category'
  isEditMode?: boolean
  catalogueId?: string
  onProductsReorder?: (products: (Product & { category: Category | null })[]) => void
  onProductUpdate?: (productId: string, updates: Partial<Product>) => void
}

// Sortable Product Item Component
function SortableProductItem({ 
  product, 
  themeColors, 
  customColors,
  fontCustomization,
  spacingCustomization,
  advancedStyles,
  formatPrice, 
  isEditMode,
  onProductUpdate
}: { 
  product: Product & { category: Category | null }, 
  themeColors: any, 
  customColors?: ColorCustomization,
  fontCustomization?: FontCustomization,
  spacingCustomization?: SpacingCustomization,
  advancedStyles?: AdvancedStyleCustomization,
  formatPrice: (price: Decimal | null, currency?: string) => string,
  isEditMode: boolean,
  onProductUpdate?: (productId: string, updates: Partial<Product>) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id })

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({
    name: product.name,
    description: product.description || ''
  })

  const handleFieldEdit = (field: string) => {
    if (isEditMode) {
      setEditingField(field)
    }
  }

  const handleFieldSave = (field: string) => {
    if (onProductUpdate) {
      onProductUpdate(product.id, { [field]: editValues[field as keyof typeof editValues] })
    }
    setEditingField(null)
  }

  const handleFieldCancel = () => {
    setEditValues({
      name: product.name,
      description: product.description || ''
    })
    setEditingField(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFieldSave(field)
    } else if (e.key === 'Escape') {
      handleFieldCancel()
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        border: `${advancedStyles?.borders?.productCard?.width || 0}px solid ${advancedStyles?.borders?.productCard?.color || 'transparent'}`,
        borderRadius: `${advancedStyles?.borders?.productCard?.radius || 8}px`,
        boxShadow: advancedStyles?.shadows?.productCard?.enabled 
          ? `0 4px ${advancedStyles.shadows.productCard.blur}px rgba(${parseInt(advancedStyles.shadows.productCard.color.slice(1, 3), 16)}, ${parseInt(advancedStyles.shadows.productCard.color.slice(3, 5), 16)}, ${parseInt(advancedStyles.shadows.productCard.color.slice(5, 7), 16)}, ${advancedStyles.shadows.productCard.opacity})` 
          : 'none',
        padding: `${spacingCustomization?.padding?.productCard || 16}px`
      }} 
      {...(isEditMode ? { ...attributes, ...listeners } : {})}
      className={`group ${isEditMode ? 'cursor-move select-none' : ''} ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
    >
      {/* Product Image */}
      <div 
        className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative"
        style={{
          marginBottom: `${spacingCustomization?.margin?.elements || 16}px`
        }}
      >
        {product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={300}
            height={300}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isEditMode ? '' : 'group-hover:scale-105'
            }`}
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
        {product.tags && product.tags.length > 0 && (
          <div className="absolute top-2 right-2">
            <span 
              className="px-2 py-1 text-xs font-medium text-white rounded-full"
              style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }}
            >
              {product.tags[0]}
            </span>
          </div>
        )}
        
        {/* Edit Mode Indicator */}
        {isEditMode && (
          <div className="absolute top-2 left-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {/* Category Badge */}
        {product.category && (
          <div className="flex items-center mb-2">
            <span 
              className="px-2 py-1 text-xs font-medium text-white rounded-full"
              style={{ 
                backgroundColor: product.category.color || customColors?.textColors.title || '#3b82f6',
                fontFamily: fontCustomization?.fontFamily?.categoryName || 'Inter, sans-serif',
                fontSize: `${fontCustomization?.fontSize?.categoryName || 12}px`,
                fontWeight: fontCustomization?.fontWeight?.categoryName || '500'
              }}
            >
              {product.category.name}
            </span>
          </div>
        )}
        
        {/* Editable Product Name */}
        {editingField === 'name' ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editValues.name}
              onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => handleKeyPress(e, 'name')}
              onBlur={() => handleFieldSave('name')}
              className="w-full font-bold text-gray-900 text-lg leading-tight bg-white border-2 border-blue-500 rounded px-2 py-1 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleFieldSave('name')}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={handleFieldCancel}
                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <h4 
            className={`font-bold text-lg leading-tight ${
              isEditMode ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-1' : ''
            }`}
            style={{ 
              color: customColors?.textColors.productName || '#111827',
              fontFamily: fontCustomization?.fontFamily?.productName || 'Inter, sans-serif',
              fontSize: `${fontCustomization?.fontSize?.productName || 18}px`,
              fontWeight: fontCustomization?.fontWeight?.productName || 'bold'
            }}
            onClick={() => handleFieldEdit('name')}
          >
            {product.name}
            {isEditMode && (
              <span className="ml-2 text-xs text-blue-500">✏️</span>
            )}
          </h4>
        )}
        
        {/* Editable Product Description */}
        {editingField === 'description' ? (
          <div className="space-y-2">
            <textarea
              value={editValues.description}
              onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={(e) => handleKeyPress(e, 'description')}
              onBlur={() => handleFieldSave('description')}
              className="w-full text-gray-600 text-sm bg-white border-2 border-blue-500 rounded px-2 py-1 focus:outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleFieldSave('description')}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={handleFieldCancel}
                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          (product.description || isEditMode) && (
            <p 
              className={`text-sm line-clamp-2 ${
                isEditMode ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-1 min-h-[2rem]' : ''
              }`}
              style={{ 
                color: customColors?.textColors.productDescription || '#4b5563',
                fontFamily: fontCustomization?.fontFamily?.productDescription || 'Inter, sans-serif',
                fontSize: `${fontCustomization?.fontSize?.productDescription || 14}px`,
                fontWeight: fontCustomization?.fontWeight?.productDescription || 'normal'
              }}
              onClick={() => handleFieldEdit('description')}
            >
              {product.description || (isEditMode ? 'Click to add description...' : '')}
              {isEditMode && (
                <span className="ml-2 text-xs text-blue-500">✏️</span>
              )}
            </p>
          )
        )}
        
        {/* Price and SKU */}
        <div className="flex items-center justify-between">
          {product.priceDisplay === 'show' && product.price ? (
            <span 
              className="font-bold text-lg"
              style={{ color: customColors?.textColors.productPrice || '#059669' }}
            >
              {formatPrice(product.price, product.currency)}
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
  )
}

export function ProductGrid({ 
  products, 
  categories, 
  themeColors, 
  customColors,
  fontCustomization,
  spacingCustomization,
  advancedStyles,
  layout = 'category', 
  isEditMode = false, 
  catalogueId, 
  onProductsReorder,
  onProductUpdate 
}: ProductGridProps) {
  const [localProducts, setLocalProducts] = useState(products)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update local products when props change
  React.useEffect(() => {
    setLocalProducts(products)
  }, [products])

  // Group products by category
  const productsByCategory = categories.map(category => ({
    category,
    products: localProducts.filter(p => p.categoryId === category.id).sort((a, b) => a.sortOrder - b.sortOrder)
  })).filter(group => group.products.length > 0)

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = localProducts.findIndex(p => p.id === active.id)
    const newIndex = localProducts.findIndex(p => p.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder products
    const reorderedProducts = arrayMove(localProducts, oldIndex, newIndex)
    
    // Update sort orders
    const updatedProducts = reorderedProducts.map((product, index) => ({
      ...product,
      sortOrder: index
    }))

    setLocalProducts(updatedProducts)
    onProductsReorder?.(updatedProducts)

    // Save to backend if catalogueId is provided
    if (catalogueId && isEditMode) {
      try {
        const productUpdates = updatedProducts.map(product => ({
          id: product.id,
          sortOrder: product.sortOrder
        }))

        const response = await fetch(`/api/catalogues/${catalogueId}/products/sort`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productUpdates }),
        })

        if (!response.ok) {
          throw new Error('Failed to update product order')
        }
      } catch (error) {
        console.error('Error updating product order:', error)
        // Revert local state on error
        setLocalProducts(products)
      }
    }

    // Call onProductsReorder if provided
    if (onProductsReorder) {
      onProductsReorder(updatedProducts)
    }
  }, [localProducts, catalogueId, isEditMode, onProductsReorder, products])

  const formatPrice = (price: Decimal | null, currency: string = 'USD') => {
    if (!price) return 'Contact for Price'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(Number(price.toString()))
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 
          className="text-5xl font-bold mb-4"
          style={{ color: customColors?.textColors.title || '#3b82f6' }}
        >
          Our
        </h1>
        <h2 className="text-6xl font-bold text-gray-900 mb-6">
          Products
        </h2>
        <div className="w-24 h-1 mx-auto" style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }} />
      </div>

      {/* Edit Mode Hint */}
      {isEditMode && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center text-blue-700">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            <span className="text-sm font-medium">Drag and drop products to reorder them</span>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {isEditMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localProducts.map(p => p.id)}
            strategy={rectSortingStrategy}
          >
            <div 
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2"
              style={{
                gap: `${spacingCustomization?.gap?.products || 32}px`
              }}
            >
              {localProducts.map((product) => (
                <SortableProductItem
                  key={product.id}
                  product={product}
                  themeColors={themeColors}
                  customColors={customColors}
                  fontCustomization={fontCustomization}
                  spacingCustomization={spacingCustomization}
                  advancedStyles={advancedStyles}
                  formatPrice={formatPrice}
                  isEditMode={isEditMode}
                  onProductUpdate={onProductUpdate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div 
          className="grid grid-cols-1  lg:grid-cols-2 xl:grid-cols-2"
          style={{
            gap: `${spacingCustomization?.gap?.products || 32}px`
          }}
        >
          {localProducts.map((product) => (
            <div 
              key={product.id} 
              className="group"
              style={{
                border: `${advancedStyles?.borders?.productCard?.width || 0}px solid ${advancedStyles?.borders?.productCard?.color || 'transparent'}`,
                borderRadius: `${advancedStyles?.borders?.productCard?.radius || 8}px`,
                boxShadow: advancedStyles?.shadows?.productCard?.enabled 
                  ? `0 4px ${advancedStyles.shadows.productCard.blur}px rgba(${parseInt(advancedStyles.shadows.productCard.color.slice(1, 3), 16)}, ${parseInt(advancedStyles.shadows.productCard.color.slice(3, 5), 16)}, ${parseInt(advancedStyles.shadows.productCard.color.slice(5, 7), 16)}, ${advancedStyles.shadows.productCard.opacity})` 
                  : 'none',
                padding: `${spacingCustomization?.padding?.productCard || 16}px`
              }}
            >
              {/* Product Image */}
              <div 
                className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative"
                style={{
                  marginBottom: `${spacingCustomization?.margin?.elements || 16}px`
                }}
              >
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
                {product.tags && product.tags.length > 0 && (
                  <div className="absolute top-2 right-2">
                    <span 
                      className="px-2 py-1 text-xs font-medium text-white rounded-full"
                      style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }}
                    >
                      {product.tags[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                {/* Category Badge */}
                {product.category && (
                  <div className="flex items-center mb-2">
                    <span 
                      className="px-2 py-1 text-xs font-medium text-white rounded-full"
                      style={{ 
                        backgroundColor: product.category.color || customColors?.textColors.title || '#3b82f6',
                        fontFamily: fontCustomization?.fontFamily?.categoryName || 'Inter, sans-serif',
                        fontSize: `${fontCustomization?.fontSize?.categoryName || 12}px`,
                        fontWeight: fontCustomization?.fontWeight?.categoryName || '500'
                      }}
                    >
                      {product.category.name}
                    </span>
                  </div>
                )}
                
                <h4 
                  className="font-bold text-lg leading-tight"
                  style={{ 
                    color: customColors?.textColors.productName || '#111827',
                    fontFamily: fontCustomization?.fontFamily?.productName || 'Inter, sans-serif',
                    fontSize: `${fontCustomization?.fontSize?.productName || 18}px`,
                    fontWeight: fontCustomization?.fontWeight?.productName || 'bold'
                  }}
                >
                  {product.name}
                </h4>
                
                {product.description && (
                  <p 
                    className="text-sm line-clamp-2"
                    style={{ 
                      color: customColors?.textColors.productDescription || '#4b5563',
                      fontFamily: fontCustomization?.fontFamily?.productDescription || 'Inter, sans-serif',
                      fontSize: `${fontCustomization?.fontSize?.productDescription || 14}px`,
                      fontWeight: fontCustomization?.fontWeight?.productDescription || 'normal'
                    }}
                  >
                    {product.description}
                  </p>
                )}
                      
                      {/* Price and SKU */}
                      <div className="flex items-center justify-between">
                        {product.priceDisplay === 'show' && product.price ? (
                          <span 
                            className="font-bold text-lg"
                            style={{ color: customColors?.textColors.productPrice || '#059669' }}
                          >
                            {formatPrice(product.price, product.currency)}
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
         )}

      {/* Bottom CTA */}
      <div className="mt-16 text-center p-8 rounded-lg" style={{ backgroundColor: customColors?.backgroundColors.categorySection || '#f3f4f6' }}>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Interested in our products?
        </h3>
        <p className="text-gray-600 mb-4">
          Contact us for detailed specifications, pricing, and availability
        </p>
        <div 
          className="inline-block px-6 py-3 rounded-lg text-white font-medium"
          style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }}
        >
          Get in Touch
        </div>
      </div>
    </div>
  )
}

export default ProductGrid