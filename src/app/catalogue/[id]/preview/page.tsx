'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getTemplateComponent, getTemplateById } from '@/components/catalog-templates'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Share2, Download, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { StyleCustomizer, DEFAULT_FONT_CUSTOMIZATION, DEFAULT_SPACING_CUSTOMIZATION, DEFAULT_ADVANCED_STYLES, FontCustomization, SpacingCustomization, AdvancedStyleCustomization } from '@/components/catalog-templates/modern-4page/components/StyleCustomizer'
import { ColorCustomization } from '@/components/catalog-templates/modern-4page/types/ColorCustomization'
import { Catalogue as PrismaCatalogue, Product as PrismaProduct, Category as PrismaCategory } from '@prisma/client'

type Catalogue = PrismaCatalogue & {
  categories: PrismaCategory[]
  products: (PrismaProduct & { category: PrismaCategory | null })[]
  profile?: {
    fullName: string
    companyName: string | null
    phone: string | null
    email: string | null
    website: string | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
  }
}

type Category = PrismaCategory
type Product = PrismaProduct & { category: PrismaCategory | null }

export default function CataloguePreviewPage() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [showStyleCustomizer, setShowStyleCustomizer] = useState(false)
  const [customColors, setCustomColors] = useState<ColorCustomization>({
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
  })
  const [fontCustomization, setFontCustomization] = useState<FontCustomization>(DEFAULT_FONT_CUSTOMIZATION)
  const [spacingCustomization, setSpacingCustomization] = useState<SpacingCustomization>(DEFAULT_SPACING_CUSTOMIZATION)
  const [advancedStyles, setAdvancedStyles] = useState<AdvancedStyleCustomization>(DEFAULT_ADVANCED_STYLES)
  
  const params = useParams()
  const catalogueId = params.id as string

  const loadCatalogue = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/catalogues/${catalogueId}`)
      
      if (response.ok) {
        const data = await response.json()
        setCatalogue(data.catalogue)
      } else if (response.status === 404) {
        setError('Catalogue not found')
      } else {
        setError('Failed to load catalogue')
      }
    } catch (err) {
      setError('Failed to load catalogue')
      console.error('Load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductsReorder = async (updatedProducts: (PrismaProduct & { category: PrismaCategory | null })[]) => {
    if (!catalogueId) return
    
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/products/sort`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productUpdates: updatedProducts.map((product, index) => ({
            id: product.id,
            sortOrder: index
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reorder products')
      }

      // Update local state
      setCatalogue(prev => {
        if (!prev) return prev
        return {
          ...prev,
          products: updatedProducts
        }
      })
    } catch (error) {
      console.error('Error reordering products:', error)
    }
  }

  const handleCatalogueUpdate = async (catalogueId: string, updates: Partial<PrismaCatalogue>) => {
    try {
      console.log('Attempting to update catalogue:', catalogueId, updates)
      const response = await fetch(`/api/catalogues/${catalogueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to update catalogue: ${response.status} ${errorText}`)
      }

      const responseData = await response.json()
      console.log('Successfully updated catalogue:', responseData)
      
      // Extract the catalogue data from the response
      const updatedCatalogue = responseData.catalogue || responseData
      
      // Update the catalogue state with the new data
      setCatalogue(prev => {
        if (!prev) return null
        return {
          ...prev,
          ...updatedCatalogue,
          // Ensure settings are properly merged
          settings: {
            ...(prev.settings as object || {}),
            ...(updatedCatalogue.settings as object || {})
          }
        }
      })
    } catch (error) {
      console.error('Error updating catalogue:', error)
    }
  }

  const handleProductUpdate = async (productId: string, updates: Partial<PrismaProduct>) => {
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update product')
      }

      const responseData = await response.json()
      console.log('Successfully updated product:', responseData)
      
      // Extract the product data from the response
      const updatedProduct = responseData.product || responseData
      
      setCatalogue(prev => {
        if (!prev) return prev
        return {
          ...prev,
          products: prev.products.map(product => 
            product.id === productId ? { ...product, ...updatedProduct } : product
          )
        }
      })
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const handleColorChange = async (colors: ColorCustomization) => {
    setCustomColors(colors)
    
    // Save to database
    if (catalogue?.id) {
      await handleCatalogueUpdate(catalogue.id, {
        settings: {
          ...(catalogue.settings as object || {}),
          customColors: colors
        } as any
      })
    }
  }

  const handleColorReset = () => {
    setCustomColors({
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
    })
  }

  const handleFontChange = async (fontCustomization: FontCustomization) => {
    setFontCustomization(fontCustomization)
    
    // Save to database
    if (catalogue?.id) {
      await handleCatalogueUpdate(catalogue.id, {
        settings: {
          ...(catalogue.settings as object || {}),
          fontCustomization
        } as any
      })
    }
  }

  const handleSpacingChange = async (spacingCustomization: SpacingCustomization) => {
    setSpacingCustomization(spacingCustomization)
    
    // Save to database
    if (catalogue?.id) {
      await handleCatalogueUpdate(catalogue.id, {
        settings: {
          ...(catalogue.settings as object || {}),
          spacingCustomization
        } as any
      })
    }
  }

  const handleAdvancedStylesChange = async (advancedStyles: AdvancedStyleCustomization) => {
    setAdvancedStyles(advancedStyles)
    
    // Save to database
    if (catalogue?.id) {
      await handleCatalogueUpdate(catalogue.id, {
        settings: {
          ...(catalogue.settings as object || {}),
          advancedStyles
        } as any
      })
    }
  }

  useEffect(() => {
    if (catalogueId) {
      loadCatalogue()
    }
  }, [catalogueId])

  // Initialize customizations from catalogue settings when catalogue is loaded
  useEffect(() => {
    if (catalogue?.settings) {
      const settings = catalogue.settings as any
      
      // Initialize custom colors from saved settings
      if (settings.customColors) {
        setCustomColors(settings.customColors)
      }
      
      // Initialize font customization from saved settings
      if (settings.fontCustomization) {
        setFontCustomization(settings.fontCustomization)
      }
      
      // Initialize spacing customization from saved settings
      if (settings.spacingCustomization) {
        setSpacingCustomization(settings.spacingCustomization)
      }
      
      // Initialize advanced styles from saved settings
      if (settings.advancedStyles) {
        setAdvancedStyles(settings.advancedStyles)
      }
    }
  }, [catalogue])

  // Reload catalogue data when the page becomes visible (e.g., when navigating back)
  // but preserve edit mode state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && catalogueId && !isEditMode) {
        loadCatalogue()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [catalogueId, isEditMode])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm print:hidden">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-32" />
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !catalogue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Catalogue not found'}
          </h1>
          <p className="text-gray-600 mb-4">
            The catalogue you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }
    
  const settings = catalogue.settings as any || {}
  const templateId = settings.templateId || 'modern-4page' // Default to modern template
  
  // Get the template component
  const TemplateComponent = getTemplateComponent(templateId)
  const templateConfig = getTemplateById(templateId)
  
  // Get theme colors
  const themeColors = {
    primary: getThemeColors(catalogue.theme || 'modern').primary,
    secondary: getThemeColors(catalogue.theme || 'modern').secondary,
    accent: '#f1f5f9'
  }
  
  // Transform profile data to match expected structure
  const profileData = {
    id: catalogue.profileId || '',
    email: catalogue.profile?.email || '',
    fullName: catalogue.profile?.fullName || null,
    firstName: null,
    lastName: null,
    avatarUrl: null,
    accountType: 'INDIVIDUAL' as const,
    companyName: catalogue.profile?.companyName || null,
    phone: catalogue.profile?.phone || null,
    website: catalogue.profile?.website || null,
    address: catalogue.profile?.address || null,
    city: catalogue.profile?.city || null,
    state: catalogue.profile?.state || null,
    country: catalogue.profile?.country || null,
    postalCode: null,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b shadow-sm print:hidden ">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/catalogue/${catalogue.id}/edit`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Edit
                </Link>
              </Button>
              <div>
                <h1 className="font-semibold text-gray-900">{catalogue.name}</h1>
                <p className="text-sm text-gray-600">Preview Mode</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={isEditMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="relative"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? 'Exit Edit Mode' : 'Edit Mode'}
                {isEditMode && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                )}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/catalogue/${catalogue.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Full Edit
                </Link>
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div className="flex bg-gray-100 min-h-[calc(100vh-73px)] relative">
        {/* Template Content - PDF Export Size Preview */}
        <div className={`flex justify-center py-1 transition-all duration-300 overflow-x-hidden overflow-y-auto h-[calc(100vh-73px)] ${
          isEditMode ? 'w-[calc(100vw-320px)]' : 'w-full'
        }`}>
          <div className="overflow-x-hidden">
            <div 
              className="bg-white shadow-lg transition-all duration-200 relative group"
              style={{
                '--theme-primary': themeColors.primary,
                '--theme-secondary': themeColors.secondary,
                '--theme-accent': themeColors.accent,
                // A4 size dimensions (210mm x 297mm) at 96 DPI
                width: '794px', // 210mm at 96 DPI
                minHeight: '1123px', // 297mm at 96 DPI
                maxWidth: '794px',
                transform: 'scale(1)', // Larger scale for better visibility
                transformOrigin: 'top center',
                margin: '0 auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                border: isEditMode ? '2px solid #3b82f6' : '2px solid transparent',
              } as React.CSSProperties}
            >
              {TemplateComponent && templateConfig ? (
                <TemplateComponent 
                  key={`${JSON.stringify(customColors)}-${JSON.stringify(fontCustomization)}-${JSON.stringify(spacingCustomization)}-${JSON.stringify(advancedStyles)}`}
                  catalogue={{
                    ...catalogue,
                    status: 'PUBLISHED',
                    slug: null,
                    viewCount: 0,
                    exportCount: 0,
                    shareCount: 0,
                    lastViewedAt: null,
                    lastExportedAt: null,
                    lastSharedAt: null,
                    settings: catalogue?.settings || {},
                    categories: catalogue?.categories || [],
                    products: catalogue?.products || [],
                    profile: catalogue?.profile || null
                  } as any}
                  profile={profileData}
                  themeColors={themeColors}
                  isEditMode={isEditMode}
                  catalogueId={catalogueId}
                  onProductsReorder={handleProductsReorder}
                  onCatalogueUpdate={handleCatalogueUpdate}
                  onProductUpdate={handleProductUpdate}
                  customColors={customColors}
                  fontCustomization={fontCustomization}
                  spacingCustomization={spacingCustomization}
                  advancedStyles={advancedStyles}
                />
              ) : (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h2>
                    <p className="text-gray-600">The selected template could not be loaded.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - StyleCustomizer */}
        {isEditMode && (
          <div className="fixed right-0 top-[69px] h-[calc(100vh-69px)] w-96 bg-white shadow-xl border-l border-gray-200 z-10 overflow-y-auto">
            <div className="p-4">
              <StyleCustomizer
                isVisible={true}
                onToggle={() => {}}
                customColors={customColors}
                onColorsChange={handleColorChange}
                fontCustomization={fontCustomization}
                onFontChange={handleFontChange}
                spacingCustomization={spacingCustomization}
                onSpacingChange={handleSpacingChange}
                advancedStyles={advancedStyles}
                onAdvancedStylesChange={handleAdvancedStylesChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getThemeColors(theme: string) {
  switch (theme) {
    case 'modern':
      return { primary: '#3b82f6', secondary: '#1e40af' }
    case 'classic':
      return { primary: '#f59e0b', secondary: '#d97706' }
    case 'minimal':
      return { primary: '#6b7280', secondary: '#4b5563' }
    case 'bold':
      return { primary: '#8b5cf6', secondary: '#7c3aed' }
    case 'elegant':
      return { primary: '#64748b', secondary: '#475569' }
    case 'tech':
      return { primary: '#06b6d4', secondary: '#0891b2' }
    default:
      return { primary: '#3b82f6', secondary: '#1e40af' }
  }
}