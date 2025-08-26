'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Star, Heart, Share2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Dummy catalog data for preview
const DUMMY_CATALOG = {
  name: 'Sample Electronics Store',
  description: 'Your one-stop shop for the latest electronics and gadgets',
  logo: '/api/placeholder/120/120',
  coverImage: '/api/placeholder/800/300',
  email: 'contact@samplestore.com',
  phone: '+1 (555) 123-4567',
  website: 'www.samplestore.com',
  facebook: 'samplestore',
  instagram: 'samplestore',
  twitter: 'samplestore',
  linkedin: 'samplestore',
  products: [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium quality wireless headphones with noise cancellation',
      price: 199.99,
      image: '/api/placeholder/300/300',
      category: 'Audio',
      featured: true
    },
    {
      id: '2',
      name: 'Smart Watch Pro',
      description: 'Advanced fitness tracking and smart notifications',
      price: 299.99,
      image: '/api/placeholder/300/300',
      category: 'Wearables',
      featured: true
    },
    {
      id: '3',
      name: 'Portable Speaker',
      description: 'Waterproof portable speaker with 12-hour battery life',
      price: 89.99,
      image: '/api/placeholder/300/300',
      category: 'Audio',
      featured: false
    },
    {
      id: '4',
      name: 'Wireless Charger',
      description: 'Fast wireless charging pad for all compatible devices',
      price: 39.99,
      image: '/api/placeholder/300/300',
      category: 'Accessories',
      featured: false
    },
    {
      id: '5',
      name: 'Gaming Mouse',
      description: 'High-precision gaming mouse with RGB lighting',
      price: 79.99,
      image: '/api/placeholder/300/300',
      category: 'Gaming',
      featured: true
    },
    {
      id: '6',
      name: 'USB-C Hub',
      description: 'Multi-port USB-C hub with HDMI and ethernet',
      price: 59.99,
      image: '/api/placeholder/300/300',
      category: 'Accessories',
      featured: false
    }
  ],
  categories: ['Audio', 'Wearables', 'Gaming', 'Accessories']
}

// Theme configurations
const THEMES = {
  modern: {
    name: 'Modern',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  },
  elegant: {
    name: 'Elegant',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#f59e0b',
      background: '#fafafa',
      text: '#374151'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter'
    }
  },
  minimal: {
    name: 'Minimal',
    colors: {
      primary: '#000000',
      secondary: '#6b7280',
      accent: '#ef4444',
      background: '#ffffff',
      text: '#111827'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  },
  vibrant: {
    name: 'Vibrant',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#fef7ff',
      text: '#1f2937'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter'
    }
  },
  professional: {
    name: 'Professional',
    colors: {
      primary: '#1e40af',
      secondary: '#475569',
      accent: '#059669',
      background: '#f8fafc',
      text: '#0f172a'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  },
  creative: {
    name: 'Creative',
    colors: {
      primary: '#f59e0b',
      secondary: '#ef4444',
      accent: '#8b5cf6',
      background: '#fffbeb',
      text: '#92400e'
    },
    fonts: {
      heading: 'Comfortaa',
      body: 'Inter'
    }
  }
}

export default function ThemePreviewPage() {
  const params = useParams()
  const themeId = params.themeId as string
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  const theme = THEMES[themeId as keyof typeof THEMES] || THEMES.modern
  
  const filteredProducts = selectedCategory === 'All' 
    ? DUMMY_CATALOG.products 
    : DUMMY_CATALOG.products.filter(product => product.category === selectedCategory)
  
  const featuredProducts = DUMMY_CATALOG.products.filter(product => product.featured)

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/themes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Themes
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-semibold" style={{ color: theme.colors.primary }}>
                {theme.name} Theme Preview
              </h1>
              <p className="text-sm text-gray-500">Preview with sample catalog data</p>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div 
          className="h-64 bg-gradient-to-r flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` 
          }}
        >
          <div className="text-center text-white">
            <h1 
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: theme.fonts.heading }}
            >
              {DUMMY_CATALOG.name}
            </h1>
            <p className="text-xl opacity-90">{DUMMY_CATALOG.description}</p>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-8 py-4">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'All'
                  ? 'text-white'
                  : 'hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: selectedCategory === 'All' ? theme.colors.primary : 'transparent',
                color: selectedCategory === 'All' ? 'white' : theme.colors.text
              }}
            >
              All Products
            </button>
            {DUMMY_CATALOG.categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'text-white'
                    : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: selectedCategory === category ? theme.colors.primary : 'transparent',
                  color: selectedCategory === category ? 'white' : theme.colors.text
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Featured Products */}
      {selectedCategory === 'All' && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 
              className="text-3xl font-bold mb-8 text-center"
              style={{ 
                fontFamily: theme.fonts.heading,
                color: theme.colors.primary
              }}
            >
              Featured Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="w-full h-48 object-cover"
                    />
                    <Badge 
                      className="absolute top-2 right-2"
                      style={{ backgroundColor: theme.colors.accent }}
                    >
                      Featured
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 
                      className="font-semibold text-lg mb-2"
                      style={{ color: theme.colors.text }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-2xl font-bold"
                        style={{ color: theme.colors.primary }}
                      >
                        ${product.price}
                      </span>
                      <Button 
                        size="sm"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 
            className="text-3xl font-bold mb-8 text-center"
            style={{ 
              fontFamily: theme.fonts.heading,
              color: theme.colors.primary
            }}
          >
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  {product.featured && (
                    <Badge 
                      className="absolute top-2 right-2"
                      style={{ backgroundColor: theme.colors.accent }}
                    >
                      Featured
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 
                    className="font-semibold mb-2"
                    style={{ color: theme.colors.text }}
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-xl font-bold"
                      style={{ color: theme.colors.primary }}
                    >
                      ${product.price}
                    </span>
                    <Button 
                      size="sm"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-12 mt-12"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div>
              <h3 className="text-xl font-bold mb-4">{DUMMY_CATALOG.name}</h3>
              <p className="opacity-90">{DUMMY_CATALOG.description}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-2 opacity-90">
                <p>{DUMMY_CATALOG.email}</p>
                <p>{DUMMY_CATALOG.phone}</p>
                <p>{DUMMY_CATALOG.website}</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <Star className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}