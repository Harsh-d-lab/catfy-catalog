'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import type { Database } from '@/types/supabase'
// import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { FileUpload } from '@/components/ui/file-upload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Header } from '@/components/Header'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  FolderOpen,
  Settings,
  AlertTriangle,
  MoreVertical,
  Upload,
  Download,
  Palette
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { SubscriptionPlan } from '@prisma/client'

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
  _count: {
    products: number
  }
}

interface Product {
  isAvailable: any
  id: string
  name: string
  description: string
  price: number
  priceDisplay: 'show' | 'hide' | 'contact'
  imageUrl?: string
  categoryId: string
  isActive: boolean
}

export default function EditCataloguePage() {
  const router = useRouter()
  const params = useParams()
  const catalogueId = params.id as string
  const { currentPlan } = useSubscription()
  
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    isActive: true
  })
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  useEffect(() => {
    fetchCatalogue()
  }, [catalogueId])

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
      setError(error.message || 'Failed to load catalogue')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCatalogue = async () => {
    if (!catalogue) return
    
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/catalogues/${catalogueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: catalogue.name,
          description: catalogue.description,
          isPublic: catalogue.isPublic,
          theme: catalogue.theme
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save catalogue')
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
      isActive: product?.isActive ?? true
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
        ? `/api/categories/${editingCategory.id}`
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
        price: productForm.price,
        priceDisplay: productForm.priceDisplay,
        isActive: productForm.isActive
      }
      
      // Only include categoryId if it's not empty
      if (productForm.categoryId && productForm.categoryId.trim() !== '') {
        productData.categoryId = productForm.categoryId
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save product')
      }
      
      toast.success(`Product ${editingProduct ? 'updated' : 'created'} successfully!`)
      setShowProductDialog(false)
      setProductForm({
        name: '',
        description: '',
        price: 0,
        priceDisplay: 'show' as 'show' | 'hide' | 'contact',
        categoryId: '',
        isActive: true
      })
      setEditingProduct(null)
      await fetchCatalogue()
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Failed to save product')
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories ({catalogue.categories.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({catalogue.products.length})</TabsTrigger>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for managing your catalogue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button onClick={() => openCategoryDialog()} className="h-auto p-4 flex-col">
                    <Plus className="h-6 w-6 mb-2" />
                    <span className="font-medium">Add Category</span>
                    <span className="text-xs opacity-75">Organize your products</span>
                  </Button>
                  
                  <Button onClick={() => openProductDialog()} variant="outline" className="h-auto p-4 flex-col">
                    <Package className="h-6 w-6 mb-2" />
                    <span className="font-medium">Add Product</span>
                    <span className="text-xs opacity-75">Expand your catalogue</span>
                  </Button>
                  
                  <Button onClick={() => setShowEditDialog(true)} variant="outline" className="h-auto p-4 flex-col">
                    <Edit className="h-6 w-6 mb-2" />
                    <span className="font-medium">Edit Details</span>
                    <span className="text-xs opacity-75">Update branding & info</span>
                  </Button>
                  
                  <Button onClick={() => setShowSettingsDialog(true)} variant="outline" className="h-auto p-4 flex-col">
                    <Settings className="h-6 w-6 mb-2" />
                    <span className="font-medium">Edit Settings</span>
                    <span className="text-xs opacity-75">Configure display options</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Categories */}
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
                  <div className="space-y-3">
                    {catalogue.categories.slice(0, 3).map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{category.name}</h4>
                          <p className="text-sm text-gray-600">{category._count.products} products</p>
                        </div>
                        <Button onClick={() => openCategoryDialog(category)} variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                {catalogue.categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {category.description || 'No description'}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
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
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {category._count.products} products
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('products')
                          }}
                        >
                          View Products
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                  <Card key={product.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {product.description || 'No description'}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
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
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">{product.priceDisplay}</span>
                          <Badge variant={product.isAvailable ? 'default' : 'secondary'}>
                            {product.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        {product.categoryId && (
                          <p className="text-sm text-gray-600">
                            Category: {catalogue.categories.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Catalogue Settings</CardTitle>
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
          <DialogContent className="max-w-2xl overflow-auto h-full">
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
                <Textarea
                  id="productDescription"
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                  rows={3}
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
                    <select
                      id="productCategory"
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Enter category</option>
                      {catalogue.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="ghost" size="sm" className="text-xs">
                      Auto
                    </Button>
                  </div>
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
              
              {/* Theme Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4">Theme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'modern', name: 'Modern', description: 'Clean and contemporary' },
                    { id: 'classic', name: 'Classic', description: 'Traditional and elegant' },
                    { id: 'minimal', name: 'Minimal', description: 'Simple and focused' },
                    { id: 'bold', name: 'Bold', description: 'Vibrant and eye-catching' },
                    { id: 'elegant', name: 'Elegant', description: 'Sophisticated and refined' },
                    { id: 'tech', name: 'Tech', description: 'Modern and technical' }
                  ].map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        catalogue?.theme === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCatalogue(prev => prev ? { ...prev, theme: theme.id } : null)}
                    >
                      <h4 className="font-medium text-sm">{theme.name}</h4>
                      <p className="text-xs text-gray-600">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Media & Assets */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Media & Assets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Company Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setCatalogue(prev => prev ? {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              mediaAssets: {
                                ...prev.settings?.mediaAssets,
                                logoUrl: file.name
                              }
                            }
                          } : null)
                        }
                      }}
                      className="mt-2"
                    />
                    {catalogue?.settings?.mediaAssets?.logoUrl && (
                      <p className="text-sm text-gray-600 mt-1">Current: {catalogue.settings.mediaAssets.logoUrl}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label>Cover Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setCatalogue(prev => prev ? {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              mediaAssets: {
                                ...prev.settings?.mediaAssets,
                                coverImageUrl: file.name
                              }
                            }
                          } : null)
                        }
                      }}
                      className="mt-2"
                    />
                    {catalogue?.settings?.mediaAssets?.coverImageUrl && (
                      <p className="text-sm text-gray-600 mt-1">Current: {catalogue.settings.mediaAssets.coverImageUrl}</p>
                    )}
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
                          ...prev.settings,
                          contactDetails: {
                            ...prev.settings?.contactDetails,
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
                          ...prev.settings,
                          contactDetails: {
                            ...prev.settings?.contactDetails,
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
                          ...prev.settings,
                          contactDetails: {
                            ...prev.settings?.contactDetails,
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
                          ...prev.settings,
                          socialMedia: {
                            ...prev.settings?.socialMedia,
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
                          ...prev.settings,
                          socialMedia: {
                            ...prev.settings?.socialMedia,
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
                          ...prev.settings,
                          socialMedia: {
                            ...prev.settings?.socialMedia,
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
                          ...prev.settings,
                          socialMedia: {
                            ...prev.settings?.socialMedia,
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