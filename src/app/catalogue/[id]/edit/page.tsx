'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// import { formatDistanceToNow } from 'date-fns'
import { Header } from '@/components/Header'
import { TeamManagement } from '@/components/TeamManagement'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileUpload } from '@/components/ui/file-upload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { smartSort } from '@/lib/sorting'
import { SubscriptionPlan } from '@prisma/client'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Crown,
  Edit,
  Eye,
  FolderOpen,
  Gem,
  Loader2,
  Monitor,
  MoreVertical,
  Package,
  Palette,
  Plus,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Catalogue {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  theme: string
  createdAt: string
  updatedAt: string
  categories: Category[]
  products: Product[]
  settings?: {
    companyInfo?: {
      companyName?: string
      companyDescription?: string
    }
    contactDetails?: {
      email?: string
      phone?: string
      website?: string
    }
    socialMedia?: {
      facebook?: string
      instagram?: string
      twitter?: string
      linkedin?: string
    }
    mediaAssets?: {
      logoUrl?: string
      coverImageUrl?: string
    }
    displaySettings?: {
      showPrices?: boolean
      showCategories?: boolean
      allowSearch?: boolean
      showProductCodes?: boolean
    }
  }
}

interface Category {
  id: string
  name: string
  description: string
  color?: string
  _count: {
    products: number
  }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  priceDisplay: 'show' | 'hide' | 'contact'
  imageUrl?: string
  categoryId: string
  isActive: boolean
  tags?: string[]
}

export default function EditCataloguePage() {
  const router = useRouter()
  const params = useParams()
  const catalogueId = params?.id as string || ''
  const { currentPlan } = useSubscription()

  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorTimeoutId, setErrorTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    priceDisplay: 'show' as 'show' | 'hide' | 'contact',
    categoryId: '',
    isActive: true,
    imageUrl: '',
    tags: [] as string[]
  })
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [selectedThemeCategory, setSelectedThemeCategory] = useState('all')
  const [selectedTheme, setSelectedTheme] = useState('modern')
  const [products, setProducts] = useState<Product[]>([])
  const [smartSortEnabled, setSmartSortEnabled] = useState(false)

  // Theme data matching the themes page
  const THEMES = [
    {
      id: 'modern',
      name: 'Modern Blue',
      description: 'Clean and contemporary design with blue accents',
      category: 'modern' as const,
      isPremium: false,
      previewImage: '/themes/modern-preview.jpg',
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#60A5FA',
        background: '#F8FAFC'
      },
      features: ['Responsive grid layout', 'Clean typography', 'Blue color scheme']
    },
    {
      id: 'classic',
      name: 'Classic Warm',
      description: 'Traditional design with warm, inviting colors',
      category: 'classic' as const,
      isPremium: false,
      previewImage: '/themes/classic-preview.jpg',
      colors: {
        primary: '#F59E0B',
        secondary: '#D97706',
        accent: '#FCD34D',
        background: '#FFFBEB'
      },
      features: ['Traditional layout', 'Warm color palette', 'Elegant typography']
    },
    {
      id: 'minimal',
      name: 'Minimal White',
      description: 'Ultra-clean minimalist design focusing on content',
      category: 'minimal' as const,
      isPremium: false,
      previewImage: '/themes/minimal-preview.jpg',
      colors: {
        primary: '#374151',
        secondary: '#111827',
        accent: '#6B7280',
        background: '#FFFFFF'
      },
      features: ['Minimalist design', 'Maximum whitespace', 'Content-focused']
    },
    {
      id: 'bold',
      name: 'Bold Purple',
      description: 'Eye-catching design with vibrant purple gradients',
      category: 'bold' as const,
      isPremium: true,
      previewImage: '/themes/bold-preview.jpg',
      colors: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#A78BFA',
        background: '#FAF5FF'
      },
      features: ['Gradient backgrounds', 'Bold typography', 'Purple color scheme', 'Premium animations']
    },
    {
      id: 'elegant',
      name: 'Elegant Gray',
      description: 'Sophisticated design with elegant gray tones',
      category: 'elegant' as const,
      isPremium: true,
      previewImage: '/themes/elegant-preview.jpg',
      colors: {
        primary: '#64748B',
        secondary: '#475569',
        accent: '#94A3B8',
        background: '#F8FAFC'
      },
      features: ['Sophisticated layout', 'Premium typography', 'Elegant spacing', 'Advanced animations']
    },
    {
      id: 'tech',
      name: 'Tech Cyan',
      description: 'Futuristic design perfect for tech products',
      category: 'tech' as const,
      isPremium: true,
      previewImage: '/themes/tech-preview.jpg',
      colors: {
        primary: '#06B6D4',
        secondary: '#0891B2',
        accent: '#67E8F9',
        background: '#ECFEFF'
      },
      features: ['Futuristic design', 'Tech-inspired elements', 'Cyan accents', 'Interactive components']
    }
  ]

  const THEME_ICONS = {
    modern: Monitor,
    classic: Palette,
    minimal: Sparkles,
    bold: Zap,
    elegant: Crown,
    tech: Gem
  }

  // Filter themes based on selected category
  const filteredThemesForCategory = THEMES.filter(theme => {
    if (selectedThemeCategory === 'all') return true
    if (selectedThemeCategory === 'free') return !theme.isPremium
    if (selectedThemeCategory === 'premium') return theme.isPremium
    return theme.category === selectedThemeCategory
  })

  // Handle theme selection
  const handleThemeSelect = async (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId)
    if (!theme) return

    // For now, assume user can only use free themes
    if (theme.isPremium) {
      toast.error('This is a premium theme. Upgrade your plan to use it.')
      return
    }

    setSelectedTheme(themeId)

    // Update catalogue theme
    if (catalogue) {
      setCatalogue(prev => prev ? { ...prev, theme: themeId } : null)

      // Save to localStorage for global theme application
      localStorage.setItem('selectedTheme', themeId)

      // Save to database
      try {
        const response = await fetch(`/api/catalogues/${catalogueId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme: themeId }),
        })

        if (!response.ok) {
          throw new Error('Failed to update theme')
        }

        // Track theme selection for analytics
        try {
          await fetch('/api/admin/theme-analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              themeId,
              themeName: theme.name,
              catalogueId,
            }),
          })
        } catch (analyticsError) {
          console.error('Failed to track theme selection:', analyticsError)
          // Don't show error to user as this is background tracking
        }

        toast.success('Theme updated successfully!')
      } catch (error) {
        console.error('Error updating theme:', error)
        toast.error('Failed to update theme')
      }
    }
  }

  useEffect(() => {
    fetchCatalogue()
  }, [catalogueId])

  // Load selected theme from localStorage and catalogue data
  useEffect(() => {
    if (catalogue) {
      // Set selected theme from catalogue data or localStorage
      const savedTheme = localStorage.getItem('selectedTheme')
      const themeToUse = catalogue.theme || savedTheme || 'modern'
      setSelectedTheme(themeToUse)

      // If catalogue doesn't have a theme but localStorage does, update catalogue
      if (!catalogue.theme && savedTheme) {
        setCatalogue(prev => prev ? { ...prev, theme: savedTheme } : null)
      }
    }
  }, [catalogue])

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      // Clear any existing timeout
      if (errorTimeoutId) {
        clearTimeout(errorTimeoutId)
      }

      // Set new timeout to clear error after 5 seconds
      const timeoutId = setTimeout(() => {
        setError(null)
        setErrorTimeoutId(null)
      }, 5000)

      setErrorTimeoutId(timeoutId)
    }

    // Cleanup timeout on unmount
    return () => {
      if (errorTimeoutId) {
        clearTimeout(errorTimeoutId)
      }
    }
  }, [error])

  // Helper function to set error with auto-dismiss
  const setErrorWithAutoDismiss = (errorMessage: string) => {
    setError(errorMessage)
  }

  const fetchCatalogue = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/catalogues/${catalogueId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch catalogue')
      }

      const data = await response.json()
      setCatalogue(data.catalogue)
    } catch (error: any) {
      console.error('Error fetching catalogue:', error)
      setErrorWithAutoDismiss(error.message || 'Failed to load catalogue')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCatalogue = async () => {
    console.log('saveCatalogue called, catalogue state:', catalogue)

    if (!catalogue) {
      console.error('Catalogue is null or undefined')
      toast.error('Catalogue data not loaded. Please refresh the page.')
      return
    }

    try {
      setIsSaving(true)

      const requestData = {
        name: catalogue.name,
        description: catalogue.description,
        isPublic: catalogue.isPublic,
        theme: catalogue.theme,
        settings: catalogue.settings
      }

      console.log('Saving catalogue with data:', requestData)
      console.log('Settings being saved:', catalogue.settings)

      const response = await fetch(`/api/catalogues/${catalogueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const responseData = await response.json()
      console.log('API response:', responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save catalogue')
      }

      toast.success('Catalogue saved successfully!')
      await fetchCatalogue()
    } catch (error: any) {
      console.error('Error saving catalogue:', error)
      toast.error(error.message || 'Failed to save catalogue')
    } finally {
      setIsSaving(false)
    }
  }

  const openCategoryDialog = (category?: Category) => {
    if (currentPlan === SubscriptionPlan.FREE && catalogue && catalogue.categories.length >= 3) {
      setShowUpgradePrompt(true)
      return
    }

    setEditingCategory(category || null)
    setCategoryForm({
      name: category?.name || '',
      description: category?.description || ''
    })
    setShowCategoryDialog(true)
  }

  const openProductDialog = (product?: Product) => {
    if (currentPlan === SubscriptionPlan.FREE && catalogue && catalogue.products.length >= 10) {
      setShowUpgradePrompt(true)
      return
    }

    setEditingProduct(product || null)
    setProductForm({
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      priceDisplay: (product?.priceDisplay as 'show' | 'hide' | 'contact') || 'show',
      categoryId: product?.categoryId || '',
      isActive: product?.isActive ?? true,
      imageUrl: product?.imageUrl || '',
      tags: product?.tags || []
    })
    setShowProductDialog(true)
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required')
      return
    }

    try {
      const url = editingCategory
        ? `/api/catalogues/${catalogueId}/categories/${editingCategory.id}`
        : `/api/catalogues/${catalogueId}/categories`

      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save category')
      }

      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully!`)
      setShowCategoryDialog(false)
      setCategoryForm({ name: '', description: '' })
      setEditingCategory(null)
      await fetchCatalogue()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast.error(error.message || 'Failed to save category')
    }
  }

  const saveProduct = async () => {
    if (!productForm.name.trim()) {
      toast.error('Product name is required')
      return
    }

    try {
      const url = editingProduct
        ? `/api/catalogues/${catalogueId}/products/${editingProduct.id}`
        : `/api/catalogues/${catalogueId}/products`

      const method = editingProduct ? 'PUT' : 'POST'

      const productData: any = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        priceDisplay: productForm.priceDisplay,
        isActive: productForm.isActive,
        imageUrl: productForm.imageUrl || undefined,
        tags: productForm.tags
      }

      // Only include categoryId if it's not empty
      if (productForm.categoryId && productForm.categoryId.trim() !== '') {
        productData.categoryId = productForm.categoryId
      }

      console.log('Saving product with data:', productData)
      console.log('Product form state:', productForm)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to save product')
      }

      const responseData = await response.json()
      console.log('Success response data:', responseData)

      toast.success(`Product ${editingProduct ? 'updated' : 'created'} successfully!`)
      setShowProductDialog(false)
      setProductForm({
        name: '',
        description: '',
        price: 0,
        priceDisplay: 'show' as 'show' | 'hide' | 'contact',
        categoryId: '',
        isActive: true,
        imageUrl: '',
        tags: []
      })
      setEditingProduct(null)
      await fetchCatalogue()
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Failed to save product')
    }
  }

  // AI Features
  const handleGenerateDescription = async (product: Product) => {
    setIsGeneratingDescription(true)

    try {
      const response = await fetch('/api/ai/description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: `${product.name} ${product.tags || ''}` }),
      })

      const data = await response.json()

      if (data.success && data.description) {
        setProductForm(prev => ({ ...prev, description: data.description }))
        toast.success('AI description generated successfully!')
      } else {
        throw new Error(data.error || 'Failed to generate description')
      }
    } catch (error) {
      console.error('AI Generation Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate description')
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handleSuggestCategory = async (product: Product) => {
    try {
      const response = await fetch('/api/ai/category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: `${product.name} ${product.description || ''}` }),
      })

      const data = await response.json()

      if (data.success && data.category) {
        setProductForm(prev => ({ ...prev, categoryId: data.category.id }))
        toast.success('AI category suggestion applied!')
      } else {
        throw new Error(data.error || 'Failed to suggest category')
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to suggest category')
    }
  }

  const toggleSmartSort = () => {
    setSmartSortEnabled(!smartSortEnabled)
    if (!smartSortEnabled) {
      // Use type assertion to ensure compatibility
      setCatalogue(prev => {
        if (!prev) return null;
        const sortedProducts = smartSort(prev.products) as typeof prev.products;
        return { ...prev, products: sortedProducts };
      });
    }
  }

  if (isLoading) {
    return (
      <>
        <Header title="Edit Catalogue" />
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!catalogue) {
    return (
      <>
        <Header title="Edit Catalogue" />
        <div className="container mx-auto py-8 px-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Catalogue not found or you don't have permission to edit it.
            </AlertDescription>
          </Alert>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Edit Catalogue" />
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-start gap-6">
            <Button variant="ghost" size="sm" className="mt-1" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>

            <div className="flex flex-col">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {catalogue.name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated {new Date(catalogue.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/catalogue/${catalogueId}/preview`}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>



            <Button onClick={saveCatalogue} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null)
                  if (errorTimeoutId) {
                    clearTimeout(errorTimeoutId)
                    setErrorTimeoutId(null)
                  }
                }}
                className="h-auto p-1 ml-2 hover:bg-red-100"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories ({catalogue.categories.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({catalogue.products.length})</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Categories</p>
                      <p className="text-2xl font-bold text-blue-900">{catalogue.categories.length}</p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Products</p>
                      <p className="text-2xl font-bold text-green-900">{catalogue.products.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Visibility</p>
                      <p className="text-lg font-bold text-purple-900">
                        {catalogue.isPublic ? 'Public' : 'Private'}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Theme</p>
                      <p className="text-lg font-bold text-orange-900 capitalize">{catalogue.theme}</p>
                    </div>
                    <Palette className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Categories and Quick Actions - Column Layout */}
            <div className="grid grid-cols-10 gap-6">
              {/* Recent Categories - 70% */}
              <div className="col-span-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Categories</CardTitle>
                    <CardDescription>Your latest category additions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {catalogue.categories.length === 0 ? (
                      <div className="text-center py-8">
                        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                        <p className="text-gray-600 mb-4">Create your first category to organize your products</p>
                        <Button onClick={() => openCategoryDialog()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Category
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {catalogue.categories.slice(0, 3).map((category) => {
                          // Get first product image from this category for preview
                          const categoryProducts = catalogue.products.filter(p => p.categoryId === category.id)
                          const previewImage = categoryProducts.find(p => p.imageUrl)?.imageUrl

                          return (
                            <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden border border-slate-200/60 bg-white shadow-sm">
                              {/* Compact Image Section */}
                              <div className="relative h-48 bg-slate-50 overflow-hidden">
                                {previewImage ? (
                                  <div className="absolute inset-0">
                                    <img
                                      src={previewImage}
                                      alt={category.name}
                                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                                  </div>
                                ) : (
                                  <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                                    <div
                                      className="w-12 h-12 rounded-lg flex items-center justify-center border"
                                      style={{
                                        backgroundColor: category.color ? `${category.color}10` : '#f8fafc',
                                        borderColor: category.color ? `${category.color}30` : '#e2e8f0'
                                      }}
                                    >
                                      <Package
                                        className="h-6 w-6"
                                        style={{ color: category.color || '#64748b' }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Action Button */}
                                <div className="absolute top-2 right-2">
                                  <Button
                                    onClick={() => openCategoryDialog(category)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-white/90 hover:bg-white backdrop-blur-sm border border-slate-200/60 shadow-sm"
                                  >
                                    <Edit className="h-3 w-3 text-slate-600" />
                                  </Button>
                                </div>
                              </div>

                              {/* Content Section */}
                              <div className="p-3 space-y-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-slate-800 text-sm truncate">{category.name}</h4>
                                    <div
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: category.color || '#10b981' }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-600 font-medium">
                                    {category._count.products} {category._count.products === 1 ? 'Product' : 'Products'}
                                  </span>
                                </div>

                                {/* Product Preview Thumbnails */}
                                {categoryProducts.length > 0 && (
                                  <div className="flex gap-1">
                                    {categoryProducts.slice(0, 3).map((product, idx) => (
                                      <div key={product.id} className="w-6 h-6 rounded border border-slate-200 overflow-hidden">
                                        {product.imageUrl ? (
                                          <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                            <Package className="h-3 w-3 text-slate-400" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {categoryProducts.length > 3 && (
                                      <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <span className="text-[9px] font-semibold text-slate-500">+{categoryProducts.length - 3}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}              </CardContent>
                </Card>
              </div>

              {/* Quick Actions - 30% */}
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks for managing your catalogue</CardDescription>
                  </CardHeader>
                  <CardContent className="p">
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => openCategoryDialog()}
                        className="group relative overflow-hidden rounded-lg border border-dashed border-gray-300 hover:border-gray-400 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-50 hover:to-blue-100 p-4 cursor-pointer transition-all duration-200 hover:shadow-md "
                      >
                        <div className="flex flex-row items-center justify-center text-center gap-3">
                          <div className="p-2 rounded-full bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                            <Plus className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">Add Category</p>
                            <p className="text-xs text-gray-600">Organize products</p>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => openProductDialog()}
                        className="group relative overflow-hidden rounded-lg border border-dashed border-gray-300 hover:border-gray-400 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-50 hover:to-blue-100 p-4 cursor-pointer transition-all duration-200 hover:shadow-md "
                      >
                        <div className="flex flex-row justify-center items-center text-center gap-3">
                          <div className="p-2 rounded-full bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">Add Product</p>
                            <p className="text-xs text-gray-600">Expand catalogue</p>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setShowEditDialog(true)}
                        className="group relative overflow-hidden rounded-lg border border-dashed border-gray-300 hover:border-gray-400 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-50 hover:to-blue-100 p-4 cursor-pointer transition-all duration-200 hover:shadow-md "
                      >
                        <div className="flex flex-row justify-center items-center text-center gap-3">
                          <div className="p-2 rounded-full bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                            <Edit className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">Edit Details</p>
                            <p className="text-xs text-gray-600">Update branding</p>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setShowSettingsDialog(true)}
                        className="group relative overflow-hidden rounded-lg border border-dashed border-gray-300 hover:border-gray-400 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-50 hover:to-blue-100 p-4 cursor-pointer transition-all duration-200 hover:shadow-md "
                      >
                        <div className="flex flex-row items-center text-center justify-center gap-3">
                          <div className="p-2 rounded-full bg-blue-500 text-white group-hover:bg-blue-600 transition-colors">
                            <Settings className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">Edit Settings</p>
                            <p className="text-xs text-gray-600">Display options</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Categories</h2>
              <Button onClick={() => openCategoryDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </div>

            {catalogue.categories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Create your first category to organize your products
                  </p>
                  <Button onClick={() => openCategoryDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Category
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogue.categories.map((category) => {
                  // Get first product image from this category for preview
                  const categoryProducts = catalogue.products.filter(p => p.categoryId === category.id)
                  const previewImage = categoryProducts.find(p => p.imageUrl)?.imageUrl

                  return (
                    <Card key={category.id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-200/60 bg-white shadow-sm hover:shadow-slate-200/40">
                      {/* Premium Header with Clean Image Display */}
                      <div className="relative h-48 bg-slate-50 overflow-hidden">
                        {/* Category Preview Image */}
                        {previewImage ? (
                          <div className="absolute inset-0">
                            <img
                              src={previewImage}
                              alt={category.name}
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-95"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
                          </div>
                        ) : (
                          // Clean fallback with subtle color accent
                          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                            <div
                              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm border-2"
                              style={{
                                backgroundColor: category.color ? `${category.color}10` : '#f8fafc',
                                borderColor: category.color ? `${category.color}30` : '#e2e8f0'
                              }}
                            >
                              <Package
                                className="h-8 w-8"
                                style={{ color: category.color || '#64748b' }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Subtle Corner Accent */}
                        <div
                          className="absolute top-0 right-0 w-20 h-20 opacity-15"
                          style={{
                            background: `radial-gradient(circle at top right, #64748b 0%, transparent 70%)`
                          }}
                        />

                        {/* Action Menu */}
                        <div className="absolute top-4 right-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 bg-white/95 hover:bg-white backdrop-blur-sm border border-slate-200/60 shadow-sm">
                                <MoreVertical className="h-4 w-4 text-slate-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openCategoryDialog(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Category Title - Clean Design */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="space-y-1">
                            <h3 className="text-slate-800 font-semibold text-xl leading-tight">
                              {category.name}
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                              {category.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Premium Content Section */}
                      <CardContent className="p-6 space-y-5">
                        {/* Stats Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: category.color || '#10b981' }}
                            />
                            <span className="text-sm font-semibold text-slate-700">
                              {category._count.products} {category._count.products === 1 ? 'Product' : 'Products'}
                            </span>
                          </div>

                          <Badge
                            variant="secondary"
                            className="bg-slate-50 text-slate-700 border-slate-200 font-medium px-3 py-1"
                          >
                            Active
                          </Badge>
                        </div>

                        {/* Product Preview Thumbnails */}
                        {categoryProducts.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Featured Products</p>
                            <div className="flex gap-2.5">
                              {categoryProducts.slice(0, 4).map((product, idx) => (
                                <div key={product.id} className="group/thumb">
                                  {product.imageUrl ? (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-all duration-200 group-hover/thumb:shadow-md group-hover/thumb:scale-105">
                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center transition-all duration-200 group-hover/thumb:bg-slate-100">
                                      <Package className="h-6 w-6 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                              ))}
                              {categoryProducts.length > 4 && (
                                <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-slate-500">+{categoryProducts.length - 4}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          variant="outline"
                          className="w-full bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium h-11 transition-all duration-200 hover:border-slate-300"
                          onClick={() => {
                            setActiveTab('products')
                          }}
                        >
                          <Eye className="mr-2.5 h-4 w-4" />
                          View Products
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Products</h2>
              <Button onClick={() => openProductDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>

            {catalogue.products.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Add your first product to start building your catalogue
                  </p>
                  <Button onClick={() => openProductDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catalogue.products.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                    {/* Image Section - Always show, with fallback */}
                    <div className="aspect-[4/3] relative bg-gray-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}

                      {/* Fallback placeholder */}
                      <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${product.imageUrl ? 'hidden' : 'flex'}`}>
                        <div className="text-center text-gray-400">
                          <Package className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm">No Image</p>
                        </div>
                      </div>

                      {/* Overlay actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openProductDialog(product)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-2 left-2">
                        <Badge variant={product.isActive ? 'default' : 'secondary'} className="bg-white/90 text-gray-800">
                          {product.isActive ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 space-y-3">
                      {/* Title and Description */}
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {product.description || 'No description available'}
                        </p>
                      </div>

                      <div className='flex justify-between'>
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <div className="text-xl font-bold text-gray-900">
                            {product.priceDisplay === 'show' && product.price ? (
                              `$${Number(product.price).toFixed(2)}`
                            ) : product.priceDisplay === 'contact' ? (
                              <span className="text-blue-600 text-base font-medium">Contact for Price</span>
                            ) : (
                              <span className="text-gray-500 text-base font-medium">Price Hidden</span>
                            )}
                          </div>
                        </div>

                        {/* Category */}
                        {product.categoryId && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Category:</span>
                            <Badge variant="outline" className="text-xs">
                              {catalogue.categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              +{product.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Catalogue Settings </CardTitle>
                <CardDescription>Configure your catalogue preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Public Visibility</Label>
                    <p className="text-sm text-gray-600">Make your catalogue visible to everyone</p>
                  </div>
                  <Switch
                    checked={catalogue.isPublic}
                    onCheckedChange={(checked) => setCatalogue(prev => prev ? { ...prev, isPublic: checked } : null)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team Management */}
            {catalogue && <TeamManagement catalogueId={catalogue.id} isOwner={true} />}
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-6">
            <div className="flex gap-6">
              {/* Sidebar */}
              <div className="w-64 space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-gray-900 mb-3">Categories</h3>
                  <div className="space-y-1">
                    {[
                      { id: 'all', label: 'All Themes', count: THEMES.length },
                      { id: 'free', label: 'Free', count: THEMES.filter(t => !t.isPremium).length },
                      { id: 'premium', label: 'Premium', count: THEMES.filter(t => t.isPremium).length },
                      { id: 'modern', label: 'Modern', count: THEMES.filter(t => t.category === 'modern').length },
                      { id: 'classic', label: 'Classic', count: THEMES.filter(t => t.category === 'classic').length },
                      { id: 'minimal', label: 'Minimal', count: THEMES.filter(t => t.category === 'minimal').length },
                      { id: 'bold', label: 'Bold', count: THEMES.filter(t => t.category === 'bold').length },
                      { id: 'elegant', label: 'Elegant', count: THEMES.filter(t => t.category === 'elegant').length },
                      { id: 'tech', label: 'Tech', count: THEMES.filter(t => t.category === 'tech').length }
                    ].map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedThemeCategory(category.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md text-left transition-colors ${selectedThemeCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100 text-gray-700'
                          }`}
                      >
                        <span>{category.label}</span>
                        <span className="text-gray-500">{category.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-900 mb-1">Current Plan</h4>
                    <p className="text-xs text-blue-700">Free Plan</p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <div className="mb-6">
                  <h3 className="font-medium text-lg capitalize">
                    {selectedThemeCategory === 'all' ? 'All Themes' : selectedThemeCategory} ({filteredThemesForCategory.length})
                  </h3>
                  <p className="text-sm text-gray-600">Choose from our collection of professionally designed themes</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredThemesForCategory.map((theme) => {
                    const IconComponent = THEME_ICONS[theme.category as keyof typeof THEME_ICONS] || Monitor
                    const isSelected = selectedTheme === theme.id

                    return (
                      <div
                        key={theme.id}
                        onClick={() => handleThemeSelect(theme.id)}
                        className={`relative border rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg group ${isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                      >
                        {/* Premium Badge */}
                        {theme.isPremium && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Premium
                            </div>
                          </div>
                        )}

                        {/* Selected Badge */}
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-blue-500 text-white rounded-full p-1.5">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-4">
                          {/* Theme Icon */}
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                            <IconComponent className="h-6 w-6 text-gray-600" />
                          </div>

                          {/* Theme Info */}
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900">{theme.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                          </div>

                          {/* Color Palette */}
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">Color Palette</p>
                            <div className="flex gap-2">
                              {Object.values(theme.colors).map((color, index) => (
                                <div
                                  key={index}
                                  className="w-8 h-8 rounded-lg border-2 border-white shadow-sm"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Features */}
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">Features</p>
                            <ul className="space-y-1">
                              {theme.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                              {theme.features.length > 3 && (
                                <li className="text-xs text-gray-500 italic">
                                  +{theme.features.length - 3} more features
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredThemesForCategory.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <Palette className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No themes found</h3>
                    <p className="text-gray-600">Try selecting a different category</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update category information' : 'Create a new category for your products'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveCategory}>
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Dialog */}
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-2xl overflow-auto h-full max-h-[95vh]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update product information' : 'Add a new product to your catalogue'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="productDescription">Description</Label>
                <div className="space-y-2">
                  <Textarea
                    id="productDescription"
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description"
                    rows={3}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="w-fit text-xs"
                    disabled={isGeneratingDescription || !productForm.name.trim()}
                    onClick={async () => {
                      if (!productForm.name.trim()) {
                        toast.error("Please enter a product name first");
                        return;
                      }

                      setIsGeneratingDescription(true);
                      
                      try {
                        const category = catalogue?.categories.find(cat => cat.id === productForm.categoryId);
                        
                        const response = await fetch('/api/ai/description', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            productName: productForm.name,
                            category: category?.name,
                            tags: productForm.tags,
                            price: productForm.price > 0 ? productForm.price : undefined
                          })
                        });

                        if (!response.ok) {
                          throw new Error(`Failed to generate description: ${response.status}`);
                        }

                        const data = await response.json();
                        
                        if (data.success && data.description) {
                          setProductForm(prev => ({ ...prev, description: data.description }));
                          toast.success("AI description generated successfully!");
                        } else {
                          throw new Error(data.error || 'Failed to generate description');
                        }
                      } catch (error) {
                        console.error('AI Generation Error:', error);
                        toast.error(error instanceof Error ? error.message : 'Failed to generate description');
                      } finally {
                        setIsGeneratingDescription(false);
                      }
                    }}
                  >
                    {isGeneratingDescription ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        🤖 AI Generate Description
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Product Image</Label>
                {!productForm.imageUrl ? (
                  <FileUpload
                    uploadType="product"
                    catalogueId={catalogueId}
                    productId={editingProduct?.id}
                    maxFiles={1}
                    accept={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                    onUpload={(files) => {
                      if (files.length > 0) {
                        setProductForm(prev => ({ ...prev, imageUrl: files[0].url }))
                      }
                    }}
                    onError={(error) => {
                      setErrorWithAutoDismiss(`Product image upload failed: ${error}`)
                    }}
                    className="mt-2"
                  />
                ) : (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                    <p className="text-sm text-gray-600 mb-2">Current image:</p>
                    <img
                      src={productForm.imageUrl}
                      alt="Product Image"
                      className="w-20 h-20 object-cover border rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductForm(prev => ({ ...prev, imageUrl: '' }))}
                      className="text-xs"
                    >
                      Change Image
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="productTags">Tags</Label>
                <Input
                  id="productTags"
                  value={productForm.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                    setProductForm(prev => ({ ...prev, tags: tagsArray }));
                  }}
                  placeholder="Enter tags separated by commas (e.g., electronics, gadgets, premium)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productPrice">Price</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="productPriceDisplay">Price Display</Label>
                  <Select
                    value={productForm.priceDisplay}
                    onValueChange={(value: 'show' | 'hide' | 'contact') => setProductForm(prev => ({ ...prev, priceDisplay: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price display" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="show">Show Price</SelectItem>
                      <SelectItem value="hide">Hide Price</SelectItem>
                      <SelectItem value="contact">Contact for Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productCategory">Category</Label>
                  <div className="flex items-center gap-2">
                    <Select value={productForm.categoryId} onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogue.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      disabled={!productForm.name || !productForm.description}
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/ai/category', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              text: `${productForm.name} ${productForm.description}`,
                              existingCategories: catalogue.categories
                            }),
                          });

                          const data = await response.json();

                          if (data.success && data.category) {
                            setProductForm(prev => ({ 
                              ...prev, 
                              categoryId: data.category.id 
                            }));
                            toast.success('Category suggested successfully!');
                          } else {
                            throw new Error(data.error || 'Failed to suggest category');
                          }
                        } catch (error) {
                          console.error('AI Category Suggestion Error:', error);
                          toast.error(error instanceof Error ? error.message : 'Failed to suggest category');
                        }
                      }}
                    >
                      {isGeneratingDescription ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Suggesting...
                        </>
                      ) : (
                        <>
                          🤖 Suggest Category
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter product name and description first for better category suggestions
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="productActive"
                    checked={productForm.isActive}
                    onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="productActive">Active</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProductDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveProduct}>
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Settings</DialogTitle>
              <DialogDescription>
                Configure display and visibility settings for your catalogue
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Display Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Display Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Show Prices</Label>
                    <p className="text-sm text-gray-600">Display product prices in the catalogue</p>
                  </div>
                  <Switch
                    checked={catalogue?.settings?.displaySettings?.showPrices || false}
                    onCheckedChange={(checked) => setCatalogue(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        displaySettings: {
                          ...prev.settings?.displaySettings,
                          showPrices: checked
                        }
                      }
                    } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Show Categories</Label>
                    <p className="text-sm text-gray-600">Group products by categories</p>
                  </div>
                  <Switch
                    checked={catalogue?.settings?.displaySettings?.showCategories || false}
                    onCheckedChange={(checked) => setCatalogue(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        displaySettings: {
                          ...prev.settings?.displaySettings,
                          showCategories: checked
                        }
                      }
                    } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Allow Search</Label>
                    <p className="text-sm text-gray-600">Enable search functionality</p>
                  </div>
                  <Switch
                    checked={catalogue?.settings?.displaySettings?.allowSearch || false}
                    onCheckedChange={(checked) => setCatalogue(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        displaySettings: {
                          ...prev.settings?.displaySettings,
                          allowSearch: checked
                        }
                      }
                    } : null)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Show Product Codes</Label>
                    <p className="text-sm text-gray-600">Display product SKU/codes</p>
                  </div>
                  <Switch
                    checked={catalogue?.settings?.displaySettings?.showProductCodes || false}
                    onCheckedChange={(checked) => setCatalogue(prev => prev ? {
                      ...prev,
                      settings: {
                        ...prev.settings,
                        displaySettings: {
                          ...prev.settings?.displaySettings,
                          showProductCodes: checked
                        }
                      }
                    } : null)}
                  />
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Visibility Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Catalogue Visibility</Label>
                    <p className="text-sm text-gray-600">Control who can see your catalogue</p>
                  </div>
                  <Switch
                    checked={catalogue?.isPublic || false}
                    onCheckedChange={(checked) => setCatalogue(prev => prev ? { ...prev, isPublic: checked } : null)}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {catalogue?.isPublic ? 'Public - Visible to everyone' : 'Private - Only visible to you'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowSettingsDialog(false)
                saveCatalogue()
              }}>
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Details Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Catalogue Details</DialogTitle>
              <DialogDescription>
                Update your catalogue branding and information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div>
                  <Label htmlFor="catalogueName">Catalogue Name</Label>
                  <Input
                    id="catalogueName"
                    value={catalogue?.name || ''}
                    onChange={(e) => setCatalogue(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter catalogue name"
                  />
                </div>

                <div>
                  <Label htmlFor="catalogueDescription">Description</Label>
                  <Textarea
                    id="catalogueDescription"
                    value={catalogue?.description || ''}
                    onChange={(e) => setCatalogue(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Describe your catalogue"
                    rows={3}
                  />
                </div>
              </div>



              {/* Media & Assets */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Media & Assets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Company Logo</Label>
                    {!catalogue?.settings?.mediaAssets?.logoUrl ? (
                      <FileUpload
                        uploadType="catalogue"
                        catalogueId={catalogueId}
                        maxFiles={1}
                        accept={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                        onUpload={(files) => {
                          if (files.length > 0) {
                            setCatalogue(prev => prev ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                mediaAssets: {
                                  ...prev.settings?.mediaAssets,
                                  logoUrl: files[0].url
                                }
                              }
                            } : null)
                          }
                        }}
                        onError={(error) => {
                          setErrorWithAutoDismiss(`Logo upload failed: ${error}`)
                        }}
                        className="mt-2"
                      />
                    ) : (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        <p className="text-sm text-gray-600 mb-2">Current logo:</p>
                        <img
                          src={catalogue.settings.mediaAssets.logoUrl}
                          alt="Company Logo"
                          className="w-20 h-20 object-contain border rounded"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCatalogue(prev => prev ? {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              mediaAssets: {
                                ...prev.settings?.mediaAssets,
                                logoUrl: ''
                              }
                            }
                          } : null)}
                          className="text-xs"
                        >
                          Change Logo
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Cover Image</Label>
                    {!catalogue?.settings?.mediaAssets?.coverImageUrl ? (
                      <FileUpload
                        uploadType="catalogue"
                        catalogueId={catalogueId}
                        maxFiles={1}
                        accept={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                        onUpload={(files) => {
                          if (files.length > 0) {
                            setCatalogue(prev => prev ? {
                              ...prev,
                              settings: {
                                ...prev.settings,
                                mediaAssets: {
                                  ...prev.settings?.mediaAssets,
                                  coverImageUrl: files[0].url
                                }
                              }
                            } : null)
                          }
                        }}
                        onError={(error) => {
                          setErrorWithAutoDismiss(`Cover image upload failed: ${error}`)
                        }}
                        className="mt-2"
                      />
                    ) : (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                        <p className="text-sm text-gray-600 mb-2">Current cover image:</p>
                        <img
                          src={catalogue.settings.mediaAssets.coverImageUrl}
                          alt="Cover Image"
                          className="w-full h-32 object-cover border rounded"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCatalogue(prev => prev ? {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              mediaAssets: {
                                ...prev.settings?.mediaAssets,
                                coverImageUrl: ''
                              }
                            }
                          } : null)}
                          className="text-xs"
                        >
                          Change Cover Image
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={catalogue?.settings?.companyInfo?.companyName || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          companyInfo: {
                            ...(prev.settings?.companyInfo || {}),
                            companyName: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="Enter your company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyDescription">Company Description</Label>
                    <Textarea
                      id="companyDescription"
                      value={catalogue?.settings?.companyInfo?.companyDescription || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          companyInfo: {
                            ...(prev.settings?.companyInfo || {}),
                            companyDescription: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="Describe your company"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={catalogue?.settings?.contactDetails?.email || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          contactDetails: {
                            ...(prev.settings?.contactDetails || {}),
                            email: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      value={catalogue?.settings?.contactDetails?.phone || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          contactDetails: {
                            ...(prev.settings?.contactDetails || {}),
                            phone: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactWebsite">Website</Label>
                    <Input
                      id="contactWebsite"
                      value={catalogue?.settings?.contactDetails?.website || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          contactDetails: {
                            ...(prev.settings?.contactDetails || {}),
                            website: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="https://www.company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Social Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="socialFacebook">Facebook</Label>
                    <Input
                      id="socialFacebook"
                      value={catalogue?.settings?.socialMedia?.facebook || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          socialMedia: {
                            ...(prev.settings?.socialMedia || {}),
                            facebook: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div>
                    <Label htmlFor="socialTwitter">Twitter</Label>
                    <Input
                      id="socialTwitter"
                      value={catalogue?.settings?.socialMedia?.twitter || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          socialMedia: {
                            ...(prev.settings?.socialMedia || {}),
                            twitter: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="socialInstagram">Instagram</Label>
                    <Input
                      id="socialInstagram"
                      value={catalogue?.settings?.socialMedia?.instagram || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          socialMedia: {
                            ...(prev.settings?.socialMedia || {}),
                            instagram: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>

                  <div>
                    <Label htmlFor="socialLinkedin">LinkedIn</Label>
                    <Input
                      id="socialLinkedin"
                      value={catalogue?.settings?.socialMedia?.linkedin || ''}
                      onChange={(e) => setCatalogue(prev => prev ? {
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          socialMedia: {
                            ...(prev.settings?.socialMedia || {}),
                            linkedin: e.target.value
                          }
                        }
                      } : null)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setShowEditDialog(false)
                saveCatalogue()
              }}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          feature="product and category management"
          currentPlan={currentPlan}
        />
      </div>
    </>
  )
}