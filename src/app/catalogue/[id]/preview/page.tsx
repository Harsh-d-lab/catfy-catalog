'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getTemplateComponent, getTemplateById } from '@/components/catalog-templates'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Share2, Download, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Catalogue {
  id: string
  name: string
  description: string | null
  theme: string
  isPublic: boolean
  settings: any
  createdAt: string
  updatedAt: string
  profileId: string
  categories: Category[]
  products: Product[]
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

interface Category {
  id: string
  name: string
  description: string | null
  sortOrder: number
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number | null
  sku: string | null
  imageUrl: string | null
  categoryId: string | null
  category: Category | null
  isActive: boolean
  sortOrder: number
}

export default function CataloguePreviewPage() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
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

  useEffect(() => {
    if (catalogueId) {
      loadCatalogue()
    }
  }, [catalogueId])

  // Reload catalogue data when the page becomes visible (e.g., when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && catalogueId) {
        loadCatalogue()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [catalogueId])

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
      <div className="bg-white border-b shadow-sm print:hidden">
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
              <Button variant="outline" size="sm" asChild>
                <Link href={`/catalogue/${catalogue.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
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

      {/* Template Content */}
      <div 
        className="bg-white"
        style={{
          '--theme-primary': themeColors.primary,
          '--theme-secondary': themeColors.secondary,
          '--theme-accent': themeColors.accent,
        } as React.CSSProperties}
      >
        {TemplateComponent && templateConfig ? (
          <TemplateComponent 
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