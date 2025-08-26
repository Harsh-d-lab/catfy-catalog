'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileUpload } from '@/components/ui/file-upload'
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Loader2, 
  Palette, 
  Settings, 
  Globe, 
  Lock,
  AlertTriangle,
  Crown,
  Zap,
  CheckCircle,
  Image,
  Mail,
  Share2
} from 'lucide-react'
import { toast } from 'sonner'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { ThemeSelector } from './ThemeSelector'

interface CatalogueData {
  name: string
  description: string
  theme: string
  isPublic: boolean
  settings: {
    showPrices: boolean
    showCategories: boolean
    allowSearch: boolean
    showProductCodes: boolean
    companyInfo: {
      companyName: string
      companyDescription: string
    }
    mediaAssets: {
      logoUrl: string
      coverImageUrl: string
    }
    contactDetails: {
      email: string
      phone: string
      website: string
    }
    socialMedia: {
      facebook: string
      twitter: string
      instagram: string
      linkedin: string
    }
  }
}

interface UserProfile {
  subscriptionPlan: 'free' | 'monthly' | 'yearly'
  subscriptionStatus: 'active' | 'inactive' | 'cancelled'
  subscription: {
    plan: 'FREE' | 'MONTHLY' | 'YEARLY'
    status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE'
  } | null
}



interface CreateCatalogWizardProps {
  onComplete?: (catalogId: string) => void
}

export function CreateCatalogWizard({ onComplete }: CreateCatalogWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<CatalogueData>({
    name: '',
    description: '',
    theme: 'modern',
    isPublic: false,
    settings: {
      showPrices: true,
      showCategories: true,
      allowSearch: true,
      showProductCodes: false,
      companyInfo: {
        companyName: '',
        companyDescription: '',
      },
      mediaAssets: {
        logoUrl: '',
        coverImageUrl: '',
      },
      contactDetails: {
        email: '',
        phone: '',
        website: '',
      },
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
      },
    },
  })
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const { currentPlan, canCreateCatalogue } = useSubscription()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setIsLoading(true)
      
      // Load user profile
      const profileResponse = await fetch('/api/auth/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setProfile(profileData.profile)
        
        // Pre-fill branding info from profile
        setData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            companyInfo: {
              companyName: profileData.profile?.companyName || '',
              companyDescription: profileData.profile?.companyDescription || '',
            },
            mediaAssets: {
              logoUrl: profileData.profile?.logoUrl || '',
              coverImageUrl: profileData.profile?.coverImageUrl || '',
            },
            contactDetails: {
              email: profileData.user?.email || '',
              phone: profileData.profile?.phone || '',
              website: profileData.profile?.website || '',
            },
            socialMedia: {
              facebook: profileData.profile?.facebook || '',
              twitter: profileData.profile?.twitter || '',
              instagram: profileData.profile?.instagram || '',
              linkedin: profileData.profile?.linkedin || '',
            },
          },
        }))
      }
    } catch (err) {
      setError('Failed to load user data')
      console.error('Load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child, grandchild] = field.split('.')
      setData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CatalogueData] as any),
          [child]: grandchild ? {
            ...((prev[parent as keyof CatalogueData] as any)[child] || {}),
            [grandchild]: value,
          } : value,
        },
      }))
    } else {
      setData(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!data.name.trim()) {
          setError('Catalogue name is required')
          return false
        }
        break
      case 2:
        // Theme selection is always valid as we have a default
        break
      case 3:
        // Branding step is optional
        break
      case 4:
        if (!canCreateCatalogue()) {
          setShowUpgradePrompt(true)
          return false
        }
        break
    }
    setError('')
    return true
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError('')
  }

  const saveCatalogue = async () => {
    if (!validateStep(4)) return
    
    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/catalogues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Catalogue created successfully!')
        if (onComplete) {
          onComplete(result.catalogue.id)
        } else {
          router.push(`/catalogue/${result.catalogue.id}/edit`)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create catalogue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create catalogue')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Catalogue
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Step {currentStep} of 4
              </p>
            </div>
            
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
          
          {/* Progress Bar */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-3 transition-all duration-300 ${
                  step < currentStep 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 border-green-500 text-white shadow-lg'
                    : step === currentStep
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 text-white shadow-lg scale-110'
                    : 'bg-white border-gray-300 text-gray-500 shadow-sm'
                }`}>
                  {step < currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-bold">{step}</span>
                  )}
                </div>
                {step < 4 && (
                  <div className={`w-20 h-2 mx-3 rounded-full transition-all duration-300 ${
                    step < currentStep ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Step Labels */}
          <div className="flex justify-center mt-6 space-x-8">
            <div className="text-center">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                currentStep >= 1 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Basic Info
              </span>
            </div>
            <div className="text-center">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                currentStep >= 2 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Choose Theme
              </span>
            </div>
            <div className="text-center">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                currentStep >= 3 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Branding
              </span>
            </div>
            <div className="text-center">
              <span className={`text-sm font-medium transition-colors duration-300 ${
                currentStep >= 4 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Configuration
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        {/* Plan Limit Warning */}
        {!canCreateCatalogue() && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have reached the catalogue limit for your current plan. 
              <button 
                onClick={() => setShowUpgradePrompt(true)}
                className="underline ml-1 hover:no-underline"
              >
                Upgrade your plan
              </button> to create more catalogues.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="max-w-3xl mx-auto">
          {currentStep === 1 && (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="text-xl text-gray-800">Basic Information</CardTitle>
                <CardDescription className="text-gray-600">
                  Let's start with the basic details for your catalogue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">Catalogue Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => updateData('name', e.target.value)}
                    placeholder="Enter catalogue name"
                    className="mt-2"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => updateData('description', e.target.value)}
                    placeholder="Describe your catalogue and what products it contains"
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                  <Palette className="h-6 w-6" />
                  Choose Your Theme
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Select a theme that matches your brand and style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSelector
                   selectedTheme={data.theme}
                   onThemeSelect={(themeId) => updateData('theme', themeId)}
                   profile={profile}
                   onUpgradeRequired={() => setShowUpgradePrompt(true)}
                   compact={true}
                 />
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Media & Assets */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Image className="h-6 w-6" />
                    Media & Assets
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Upload your logo and cover image to brand your catalogue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                     <Label>Company Logo</Label>
                     <Input
                       type="file"
                       accept="image/*"
                       onChange={(e) => {
                         const file = e.target.files?.[0]
                         if (file) {
                           // For now, just store the file name
                           updateData('settings.mediaAssets.logoUrl', file.name)
                         }
                       }}
                       className="mt-2"
                     />
                     {data.settings.mediaAssets?.logoUrl && (
                       <p className="text-sm text-gray-600 mt-1">Selected: {data.settings.mediaAssets.logoUrl}</p>
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
                           // For now, just store the file name
                         updateData('settings.mediaAssets.coverImageUrl', file.name)
                         }
                       }}
                       className="mt-2"
                     />
                     {data.settings.mediaAssets?.coverImageUrl && (
                       <p className="text-sm text-gray-600 mt-1">Selected: {data.settings.mediaAssets.coverImageUrl}</p>
                     )}
                   </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Mail className="h-6 w-6" />
                    Contact Details
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Add your contact information to help customers reach you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                     <Label htmlFor="email">Email</Label>
                     <Input
                       id="email"
                       type="email"
                       value={data.settings.contactDetails?.email || ''}
                       onChange={(e) => updateData('settings.contactDetails.email', e.target.value)}
                       placeholder="contact@company.com"
                       className="mt-2"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="phone">Phone</Label>
                     <Input
                       id="phone"
                       value={data.settings.contactDetails?.phone || ''}
                       onChange={(e) => updateData('settings.contactDetails.phone', e.target.value)}
                       placeholder="+1 (555) 123-4567"
                       className="mt-2"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="website">Website</Label>
                     <Input
                       id="website"
                       value={data.settings.contactDetails?.website || ''}
                       onChange={(e) => updateData('settings.contactDetails.website', e.target.value)}
                       placeholder="https://www.company.com"
                       className="mt-2"
                     />
                   </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Share2 className="h-6 w-6" />
                    Social Media
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Connect your social media profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                     <Label htmlFor="facebook">Facebook</Label>
                     <Input
                       id="facebook"
                       value={data.settings.socialMedia?.facebook || ''}
                       onChange={(e) => updateData('settings.socialMedia', { ...data.settings.socialMedia, facebook: e.target.value })}
                       placeholder="https://facebook.com/yourpage"
                       className="mt-2"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="twitter">Twitter</Label>
                     <Input
                       id="twitter"
                       value={data.settings.socialMedia?.twitter || ''}
                       onChange={(e) => updateData('settings.socialMedia', { ...data.settings.socialMedia, twitter: e.target.value })}
                       placeholder="https://twitter.com/yourhandle"
                       className="mt-2"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="instagram">Instagram</Label>
                     <Input
                       id="instagram"
                       value={data.settings.socialMedia?.instagram || ''}
                       onChange={(e) => updateData('settings.socialMedia', { ...data.settings.socialMedia, instagram: e.target.value })}
                       placeholder="https://instagram.com/yourhandle"
                       className="mt-2"
                     />
                   </div>
                   
                   <div>
                     <Label htmlFor="linkedin">LinkedIn</Label>
                     <Input
                       id="linkedin"
                       value={data.settings.socialMedia?.linkedin || ''}
                       onChange={(e) => updateData('settings.socialMedia', { ...data.settings.socialMedia, linkedin: e.target.value })}
                       placeholder="https://linkedin.com/company/yourcompany"
                       className="mt-2"
                     />
                   </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Display Settings */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                    <Settings className="h-6 w-6" />
                    Display Settings
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Configure how your catalogue will be displayed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Prices</Label>
                      <p className="text-sm text-gray-600">Display product prices in the catalogue</p>
                    </div>
                    <Switch
                      checked={data.settings.showPrices}
                      onCheckedChange={(checked) => updateData('settings.showPrices', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Categories</Label>
                      <p className="text-sm text-gray-600">Group products by categories</p>
                    </div>
                    <Switch
                      checked={data.settings.showCategories}
                      onCheckedChange={(checked) => updateData('settings.showCategories', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Search</Label>
                      <p className="text-sm text-gray-600">Enable search functionality</p>
                    </div>
                    <Switch
                      checked={data.settings.allowSearch}
                      onCheckedChange={(checked) => updateData('settings.allowSearch', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Product Codes</Label>
                      <p className="text-sm text-gray-600">Display SKU or product codes</p>
                    </div>
                    <Switch
                      checked={data.settings.showProductCodes}
                      onCheckedChange={(checked) => updateData('settings.showProductCodes', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Visibility Settings */}
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="text-xl text-gray-800">Visibility</CardTitle>
                  <CardDescription className="text-gray-600">
                    Control who can access your catalogue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        !data.isPublic
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateData('isPublic', false)}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium">Private</h4>
                          <p className="text-sm text-gray-600">Only you can access</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        data.isPublic
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => updateData('isPublic', true)}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-600" />
                        <div>
                          <h4 className="font-medium">Public</h4>
                          <p className="text-sm text-gray-600">Anyone with link can view</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="max-w-3xl mx-auto mt-10">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button 
                onClick={nextStep}
                className="px-6 py-3 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Next
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={saveCatalogue} 
                disabled={isSaving}
                className="px-6 py-3 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Create Catalogue
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt 
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="catalogue creation"
        currentPlan={currentPlan}
      />
    </div>
  )
}