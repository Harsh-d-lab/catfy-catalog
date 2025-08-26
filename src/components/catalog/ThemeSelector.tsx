'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  Eye, 
  Palette, 
  Sparkles, 
  Zap, 
  Crown, 
  Monitor, 
  Gem
} from 'lucide-react'

interface Theme {
  id: string
  name: string
  description: string
  category: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant' | 'tech'
  isPremium: boolean
  previewImage: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  features: string[]
}

interface UserProfile {
  subscriptionPlan: 'free' | 'monthly' | 'yearly'
  subscriptionStatus: 'active' | 'inactive' | 'cancelled'
}

const THEMES: Theme[] = [
  {
    id: 'modern',
    name: 'Modern Blue',
    description: 'Clean and contemporary design with blue accents',
    category: 'modern',
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
    category: 'classic',
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
    category: 'minimal',
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
    category: 'bold',
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
    category: 'elegant',
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
    category: 'tech',
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

interface ThemeSelectorProps {
  selectedTheme: string
  onThemeSelect: (themeId: string) => void
  profile?: UserProfile | null
  onUpgradeRequired?: () => void
  compact?: boolean
}

export function ThemeSelector({ 
  selectedTheme, 
  onThemeSelect, 
  profile, 
  onUpgradeRequired,
  compact = false 
}: ThemeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const canUseTheme = (theme: Theme) => {
    if (!theme.isPremium) return true
    return profile?.subscriptionStatus === 'active' && profile?.subscriptionPlan !== 'free'
  }

  const handleThemeSelect = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId)
    if (!theme) return

    if (!canUseTheme(theme)) {
      onUpgradeRequired?.()
      return
    }

    onThemeSelect(themeId)
  }

  const filteredThemes = THEMES.filter(theme => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'free') return !theme.isPremium
    if (selectedCategory === 'premium') return theme.isPremium
    return theme.category === selectedCategory
  })

  const categories = [
    { id: 'all', name: 'All Themes', count: THEMES.length },
    { id: 'free', name: 'Free', count: THEMES.filter(t => !t.isPremium).length },
    { id: 'premium', name: 'Premium', count: THEMES.filter(t => t.isPremium).length },
  ]

  if (compact) {
    // Compact version for wizard
    return (
      <div className="space-y-4">
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="text-xs"
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredThemes.map((theme) => {
            const IconComponent = THEME_ICONS[theme.category]
            const canUse = canUseTheme(theme)
            
            return (
              <Card 
                key={theme.id} 
                className={`group cursor-pointer transition-all hover:shadow-md ${
                  !canUse ? 'opacity-75' : ''
                } ${selectedTheme === theme.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                {/* Preview */}
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <div 
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.primary}20 100%)`
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <IconComponent className="h-8 w-8 mx-auto mb-2" style={{ color: theme.colors.primary }} />
                        <div className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                          {theme.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Premium Badge */}
                  {theme.isPremium && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                        <Crown className="mr-1 h-2 w-2" />
                        Pro
                      </Badge>
                    </div>
                  )}
                  
                  {/* Selected Badge */}
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-500 text-white text-xs">
                        <Check className="mr-1 h-2 w-2" />
                        Selected
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        {theme.name}
                        {!canUse && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="flex gap-1 mt-2">
                    {Object.entries(theme.colors).slice(0, 4).map(([name, color]) => (
                      <div 
                        key={name}
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={`${name}: ${color}`}
                      />
                    ))}
                  </div>

                  {/* Preview Button */}
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs hover:bg-blue-50 hover:border-blue-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/preview/theme/${theme.id}?demo=true`, '_blank');
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Full version for standalone use
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="lg:w-64 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selectedCategory === category.id ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        {profile && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="text-sm">
                <div className="font-medium text-gray-900 mb-1">
                  Current Plan
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={profile.subscriptionPlan === 'free' ? 'secondary' : 'default'}>
                    {profile.subscriptionPlan === 'free' ? 'Free' : 
                     profile.subscriptionPlan === 'monthly' ? 'Pro Monthly' : 'Pro Yearly'}
                  </Badge>
                  {profile.subscriptionPlan === 'free' && (
                    <span className="text-xs text-gray-500">
                      Limited to free themes
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Themes Grid */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {selectedCategory === 'all' ? 'All Themes' : 
             categories.find(c => c.id === selectedCategory)?.name} 
            ({filteredThemes.length})
          </h2>
          <p className="text-gray-600">
            {selectedCategory === 'premium' 
              ? 'Premium themes with advanced features and animations'
              : selectedCategory === 'free'
              ? 'Free themes available to all users'
              : 'Choose from our collection of professionally designed themes'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => {
            const IconComponent = THEME_ICONS[theme.category]
            const canUse = canUseTheme(theme)
            
            return (
              <Card 
                key={theme.id} 
                className={`group cursor-pointer transition-all hover:shadow-lg ${
                  !canUse ? 'opacity-75' : ''
                } ${selectedTheme === theme.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                {/* Preview Image */}
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <div 
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.primary}20 100%)`
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <IconComponent className="h-12 w-12 mx-auto mb-2" style={{ color: theme.colors.primary }} />
                        <div className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                          {theme.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary">
                        <Eye className="mr-2 h-4 w-4" />
                        {canUse ? 'Select Theme' : 'Upgrade to Use'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Premium Badge */}
                  {theme.isPremium && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        <Crown className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  
                  {/* Selected Badge */}
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-500 text-white">
                        <Check className="mr-1 h-3 w-3" />
                        Selected
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {theme.name}
                        {!canUse && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {theme.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Color Palette */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Color Palette</div>
                    <div className="flex gap-2">
                      {Object.entries(theme.colors).map(([name, color]) => (
                        <div key={name} className="flex flex-col items-center">
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={`${name}: ${color}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Features</div>
                    <div className="space-y-1">
                      {theme.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </div>
                      ))}
                      {theme.features.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{theme.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Button */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm hover:bg-blue-50 hover:border-blue-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/preview/theme/${theme.id}?demo=true`, '_blank');
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Theme
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredThemes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No themes found
              </h3>
              <p className="text-gray-600">
                Try selecting a different category to see more themes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}