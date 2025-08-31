'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/Header'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Share2,
  Calendar,
  Package,
  Users,
  TrendingUp,
  Crown,
  Zap,
  Palette,
  FolderOpen
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradePrompt } from '@/components/UpgradePrompt'

interface Catalogue {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  theme: string
  createdAt: string
  updatedAt: string
  _count: {
    products: number
    categories: number
  }
}

interface UserProfile {
  id: string
  fullName: string
  accountType: 'INDIVIDUAL' | 'BUSINESS'
  subscription: {
    plan: 'FREE' | 'MONTHLY' | 'YEARLY'
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE'
    currentPeriodEnd: string | null
  } | null
}

interface DashboardStats {
  totalCatalogues: number
  totalProducts: number
  totalViews: number
  totalExports: number
}

export default function DashboardPage() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load user profile
      const profileResponse = await fetch('/api/auth/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData.profile)
      }

      // Load catalogues
      const cataloguesResponse = await fetch('/api/catalogues')
      if (cataloguesResponse.ok) {
        const cataloguesData = await cataloguesResponse.json()
        setCatalogues(cataloguesData.catalogues)
        
        // Calculate basic stats
        const totalProducts = cataloguesData.catalogues.reduce(
          (sum: number, cat: Catalogue) => sum + (cat._count?.products || 0), 0
        )
        setStats({
          totalCatalogues: cataloguesData.catalogues.length,
          totalProducts,
          totalViews: 0, // Would come from analytics
          totalExports: 0, // Would come from exports table
        })
      }
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error('Dashboard error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCatalogue = async (catalogueId: string) => {
    if (!confirm('Are you sure you want to delete this catalogue? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/catalogues/${catalogueId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCatalogues(prev => prev.filter(cat => cat.id !== catalogueId))
        toast.success('Catalogue deleted successfully')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete catalogue')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete catalogue')
    }
  }

  const shareCatalogue = async (catalogue: Catalogue) => {
    if (!catalogue.isPublic) {
      toast.error('Only public catalogues can be shared')
      return
    }

    const shareUrl = `${window.location.origin}/preview/${catalogue.id}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Share link copied to clipboard!')
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('Share link copied to clipboard!')
    }
  }

  const exportToPDF = async (catalogueId: string) => {
    if (!canExport()) {
      setShowUpgradePrompt(true)
      return
    }

    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' })
      
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          catalogueId,
          theme: 'modern',
          format: 'A4',
          orientation: 'portrait'
        }),
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/pdf')) {
          // Direct PDF download for public catalogues
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `catalogue-${catalogueId}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          toast.success('PDF exported successfully!', { id: 'pdf-export' })
        } else {
          // JSON response with download URL for authenticated users
          const data = await response.json()
          if (data.export?.downloadUrl) {
            // Open download URL in new tab
            window.open(data.export.downloadUrl, '_blank')
            toast.success('PDF exported successfully!', { id: 'pdf-export' })
          } else {
            throw new Error('No download URL received')
          }
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export PDF')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export PDF', { id: 'pdf-export' })
    }
  }

  const filteredCatalogues = catalogues.filter(catalogue => {
    const matchesSearch = catalogue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         catalogue.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'public' && catalogue.isPublic) ||
                         (filterType === 'private' && !catalogue.isPublic)
    
    return matchesSearch && matchesFilter
  })

  const { currentPlan, canCreateCatalogue, canExport } = useSubscription()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  if (isLoading) {
    return (
      <>
        <Header title="Dashboard" />
        <div className="container mx-auto py-8 px-4">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Dashboard" />
      <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.fullName?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-600">
            Manage your catalogues and track your progress
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {profile?.subscription && (
            <Badge variant={profile.subscription.plan === 'FREE' ? 'secondary' : 'default'}>
              {profile.subscription.plan === 'FREE' ? (
                <><Zap className="mr-1 h-3 w-3" /> Free Plan</>
              ) : (
                <><Crown className="mr-1 h-3 w-3" /> {profile.subscription.plan} Plan</>
              )}
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Catalogues</p>
                  <p className="text-2xl font-bold">{stats.totalCatalogues}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Exports</p>
                  <p className="text-2xl font-bold">{stats.totalExports}</p>
                </div>
                <Download className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Catalogues Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">Your Catalogues</h2>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search catalogues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => {
                if (canCreateCatalogue()) {
                  router.push('/catalogue/new')
                } else {
                  setShowUpgradePrompt(true)
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Catalogue
            </Button>
          </div>
        </div>

        {/* Catalogues Grid */}
        {filteredCatalogues.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {catalogues.length === 0 ? 'No catalogues yet' : 'No catalogues found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {catalogues.length === 0 
                  ? 'Create your first catalogue to get started'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {catalogues.length === 0 && (
                <Button 
                  onClick={() => {
                    if (canCreateCatalogue()) {
                      router.push('/catalogue/new')
                    } else {
                      setShowUpgradePrompt(true)
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Catalogue
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalogues.map((catalogue) => (
              <Card key={catalogue.id} className="group hover:shadow-xl transition-all duration-500 overflow-hidden border-0 bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1">
                {/* Simplified Header with Clean Design */}
                 <div className="relative h-40 bg-gradient-to-br from-indigo-200 via-blue-50 to-blue-50 overflow-hidden">
                   {/* Subtle Background Pattern */}
                   <div className="absolute inset-0 opacity-40">
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.08)_0%,transparent_50%)]" />
                   </div>
                   
                   {/* Content */}
                   <div className="relative h-full p-6 flex flex-col justify-center text-center">
                     {/* Catalogue Name */}
                     <h3 className="text-2xl font-bold text-gray-800 leading-tight group-hover:text-indigo-700 transition-colors duration-300 mb-3">
                       {catalogue.name}
                     </h3>
                     
                     {/* Description */}
                     <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 max-w-sm mx-auto">
                       {catalogue.description || 'A beautifully crafted catalogue showcasing premium products and categories with modern design.'}
                     </p>
                   </div>
                  
                  {/* Action Menu */}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white backdrop-blur-sm border border-slate-200/60 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => router.push(`/catalogue/${catalogue.id}/preview`)}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push(`/catalogue/${catalogue.id}/edit`)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Catalogue
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => shareCatalogue(catalogue)}
                          className="cursor-pointer"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => exportToPDF(catalogue.id)}
                          disabled={!canExport()}
                          className="cursor-pointer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export PDF
                          {!canExport() && <Crown className="ml-auto h-3 w-3" />}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => deleteCatalogue(catalogue.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge 
                      variant={catalogue.isPublic ? 'default' : 'secondary'} 
                      className="bg-white/90 text-slate-800 border border-slate-200/60 text-xs px-2 py-1"
                    >
                      {catalogue.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-6 bg-white">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-xl font-bold text-indigo-600">{catalogue._count?.categories || 0}</div>
                      <div className="text-xs text-gray-500 font-medium">Categories</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{catalogue._count?.products || 0}</div>
                      <div className="text-xs text-gray-500 font-medium">Products</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Badge variant="outline" className="text-xs px-2 py-1 bg-purple-100 border-purple-200 text-purple-700">
                        <Palette className="h-3 w-3 mr-1" />
                        {catalogue.theme || 'Modern'}
                      </Badge>
                      <div className="text-xs text-gray-500 pt-2 font-medium">Theme</div>
                    </div>
                  </div>
                  
                  {/* Update Info */}
                  <div className="flex items-center justify-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Updated {formatDistanceToNow(new Date(catalogue.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="catalogue creation"
        currentPlan={currentPlan}
      />
      </div>
    </>
  )
}