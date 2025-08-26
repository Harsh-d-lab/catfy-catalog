'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/Header'
import { Loader2, ArrowRight, ArrowLeft, Check, User, Building, Sparkles, Zap, Shield, Globe, Users, Heart, Star } from 'lucide-react'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  fullName: string
  accountType: 'INDIVIDUAL' | 'BUSINESS'
  companyName?: string
}

const steps = [
  { id: 1, title: 'Welcome', description: 'Welcome to CatalogueAI' },
  { id: 2, title: 'How It Works', description: 'Simple 4-step process optimized for business workflows' },
  { id: 3, title: 'Business Features', description: 'Powerful business tools to enhance your workflow' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Fetch user profile to get account type
        try {
          const response = await fetch('/api/auth/profile')
          if (response.ok) {
            const data = await response.json()
            setProfile(data.profile)
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error)
        }
      } else {
        router.push('/auth/login')
      }
    }
    
    getUserAndProfile()
  }, [supabase, router])

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const completeOnboarding = async () => {
    setIsLoading(true)

    try {
      toast.success('Welcome to CatalogueAI! Your account is ready.')
      router.push('/dashboard')
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const progress = (currentStep / steps.length) * 100

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isBusinessAccount = profile.accountType === 'BUSINESS'
  const accountTypeLabel = isBusinessAccount ? 'Business' : 'Individual'
  const accountTypeColor = isBusinessAccount ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Onboarding" />
      
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">CatalogueAI</h1>
              <Badge variant="secondary" className={accountTypeColor}>
                {accountTypeLabel}
              </Badge>
            </div>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <span>Step {currentStep} of {steps.length}</span>
              <Badge variant="outline" className={isBusinessAccount ? 'border-blue-200 text-blue-700' : 'border-green-200 text-green-700'}>
                {isBusinessAccount ? 'Business Account' : 'Personal Account'}
              </Badge>
            </div>
          </div>

          <Card className="mt-8">
            <CardContent className="p-8">
              {/* Step 1: Welcome */}
              {currentStep === 1 && (
                <div className="text-center space-y-8">
                  <h1 className="text-4xl font-bold text-gray-900">
                    Welcome to CatalogueAI
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {isBusinessAccount 
                      ? 'Create stunning, AI-powered business catalogues in minutes'
                      : 'Create beautiful, AI-powered personal catalogues effortlessly'
                    }
                  </p>
                  
                  <div className={`w-24 h-24 ${isBusinessAccount ? 'bg-blue-600' : 'bg-green-600'} rounded-full flex items-center justify-center mx-auto relative`}>
                    {isBusinessAccount ? (
                      <Building className="h-12 w-12 text-white" />
                    ) : (
                      <User className="h-12 w-12 text-white" />
                    )}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">{isBusinessAccount ? '🏢' : '⭐'}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {isBusinessAccount 
                      ? 'Transform Your Business Showcase'
                      : 'Showcase Your Personal Collection'
                    }
                  </h2>
                  
                  <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    {isBusinessAccount 
                      ? 'Generate professional business catalogues with AI assistance, collaborate with your team, and export to PDF - all in one powerful platform designed for businesses.'
                      : 'Create stunning personal catalogues with AI-powered descriptions, beautiful themes, and easy sharing - perfect for showcasing your hobbies, collections, or personal projects.'
                    }
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                    <div className="text-center">
                      <div className={`w-16 h-16 ${isBusinessAccount ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Zap className={`h-8 w-8 ${isBusinessAccount ? 'text-blue-600' : 'text-green-600'}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
                      <p className="text-sm text-gray-600">
                        {isBusinessAccount 
                          ? 'Advanced AI descriptions and smart business categorization'
                          : 'Smart AI descriptions and intuitive personal categorization'
                        }
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className={`w-16 h-16 ${isBusinessAccount ? 'bg-green-100' : 'bg-purple-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {isBusinessAccount ? (
                          <Shield className="h-8 w-8 text-green-600" />
                        ) : (
                          <Heart className="h-8 w-8 text-purple-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {isBusinessAccount ? 'Professional' : 'Personal'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isBusinessAccount 
                          ? '5 business-ready themes with advanced branding'
                          : 'Beautiful themes designed for personal collections'
                        }
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className={`w-16 h-16 ${isBusinessAccount ? 'bg-purple-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {isBusinessAccount ? (
                          <Globe className="h-8 w-8 text-purple-600" />
                        ) : (
                          <Star className="h-8 w-8 text-blue-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {isBusinessAccount ? 'Export Ready' : 'Easy Sharing'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {isBusinessAccount 
                          ? 'High-res PDF export with team sharing capabilities'
                          : 'Simple PDF export and easy sharing with friends'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: How It Works */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      How It Works
                    </h1>
                    <p className="text-xl text-gray-600">
                      {isBusinessAccount 
                        ? 'Simple 4-step process optimized for business workflows'
                        : 'Easy 4-step process designed for personal use'
                      }
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${isBusinessAccount ? 'bg-blue-600' : 'bg-green-600'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold">1</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Choose Your Theme
                        </h3>
                        <p className="text-gray-600">
                          {isBusinessAccount 
                            ? 'Select from 5 professionally designed themes optimized for business presentations'
                            : 'Pick from beautiful themes designed for personal collections and hobbies'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${isBusinessAccount ? 'bg-green-600' : 'bg-blue-600'} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold">2</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {isBusinessAccount ? 'Add Your Products' : 'Add Your Items'}
                        </h3>
                        <p className="text-gray-600">
                          {isBusinessAccount 
                            ? 'Upload products with AI-generated descriptions and enterprise-grade categorization'
                            : 'Upload your items with AI-generated descriptions and smart categorization'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">3</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {isBusinessAccount ? 'Business Branding' : 'Personal Touch'}
                        </h3>
                        <p className="text-gray-600">
                          {isBusinessAccount 
                            ? 'Add company logo, business information, and advanced brand styling options'
                            : 'Customize with your personal style, colors, and collection information'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">4</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {isBusinessAccount ? 'Export & Collaborate' : 'Share & Export'}
                        </h3>
                        <p className="text-gray-600">
                          {isBusinessAccount 
                            ? 'Export professional PDFs and share with team members and clients'
                            : 'Export beautiful PDFs and share your collection with friends and family'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 3: Features */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      {isBusinessAccount ? 'Business Features' : 'Personal Features'}
                    </h1>
                    <p className="text-xl text-gray-600">
                      {isBusinessAccount 
                        ? 'Powerful business tools to enhance your workflow'
                        : 'Perfect tools for organizing your personal collections'
                      }
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    {isBusinessAccount ? (
                      <>
                        <Card className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Sparkles className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              Enterprise AI Descriptions
                            </h3>
                          </div>
                          <p className="text-gray-600 mb-4">
                            Generate professional product descriptions with business-focused language and industry terminology
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Enterprise-grade</Badge>
                            <Badge variant="secondary">Professional</Badge>
                            <Badge variant="secondary">Team-ready</Badge>
                          </div>
                        </Card>
                        
                        <Card className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              Team Collaboration
                            </h3>
                          </div>
                          <p className="text-gray-600 mb-4">
                            Collaborate with team members, assign roles, and manage catalogue creation together
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Collaborative</Badge>
                            <Badge variant="secondary">Smart</Badge>
                            <Badge variant="secondary">Multi-user</Badge>
                          </div>
                        </Card>
                      </>
                    ) : (
                      <>
                        <Card className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <Heart className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              Personal AI Descriptions
                            </h3>
                          </div>
                          <p className="text-gray-600 mb-4">
                            Generate beautiful, personalized descriptions for your collections with friendly, engaging language
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Personal</Badge>
                            <Badge variant="secondary">Friendly</Badge>
                            <Badge variant="secondary">Creative</Badge>
                          </div>
                        </Card>
                        
                        <Card className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Star className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              Easy Organization
                            </h3>
                          </div>
                          <p className="text-gray-600 mb-4">
                            Simple, intuitive tools to organize your personal collections and hobbies with beautiful themes
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Simple</Badge>
                            <Badge variant="secondary">Beautiful</Badge>
                            <Badge variant="secondary">Intuitive</Badge>
                          </div>
                        </Card>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {isBusinessAccount ? 'What you get with Business account:' : 'What you get with Personal account:'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isBusinessAccount ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Enterprise-level product descriptions and categorization</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Team collaboration and role management</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Advanced branding and customization options</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Priority support and dedicated account management</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">High-resolution exports with team sharing capabilities</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Beautiful AI-generated descriptions for personal items</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Easy organization and categorization tools</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Personal themes and customization options</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Simple sharing with friends and family</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">Beautiful PDF exports for your collections</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={isLoading}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={completeOnboarding}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  )
}