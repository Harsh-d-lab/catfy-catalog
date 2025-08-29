'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { 
  Palette, 
  Type, 
  Layout, 
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { ColorCustomization } from '../types/ColorCustomization'

interface FontCustomization {
  fontFamily: {
    title: string
    description: string
    productName: string
    productDescription: string
    companyName: string
    categoryName: string
  }
  fontSize: {
    title: number
    description: number
    productName: number
    productDescription: number
    companyName: number
    categoryName: number
  }
  fontWeight: {
    title: string
    description: string
    productName: string
    productDescription: string
    companyName: string
    categoryName: string
  }
}

interface SpacingCustomization {
  padding: {
    page: number
    productCard: number
    section: number
  }
  margin: {
    elements: number
    sections: number
  }
  gap: {
    products: number
    content: number
  }
}

interface AdvancedStyleCustomization {
  borders: {
    productCard: {
      width: number
      style: string
      color: string
      radius: number
    }
    buttons: {
      width: number
      style: string
      color: string
      radius: number
    }
  }
  shadows: {
    productCard: {
      enabled: boolean
      blur: number
      spread: number
      color: string
      opacity: number
    }
    buttons: {
      enabled: boolean
      blur: number
      spread: number
      color: string
      opacity: number
    }
  }
}

interface StyleCustomizerProps {
  isVisible: boolean
  onToggle: () => void
  customColors: ColorCustomization
  onColorsChange: (colors: ColorCustomization) => void
  fontCustomization?: FontCustomization
  onFontChange?: (fonts: FontCustomization) => void
  spacingCustomization?: SpacingCustomization
  onSpacingChange?: (spacing: SpacingCustomization) => void
  advancedStyles?: AdvancedStyleCustomization
  onAdvancedStylesChange?: (styles: AdvancedStyleCustomization) => void
}

const DEFAULT_FONT_CUSTOMIZATION: FontCustomization = {
  fontFamily: {
    title: 'Inter, sans-serif',
    description: 'Inter, sans-serif',
    productName: 'Inter, sans-serif',
    productDescription: 'Inter, sans-serif',
    companyName: 'Inter, sans-serif',
    categoryName: 'Inter, sans-serif'
  },
  fontSize: {
    title: 24,
    description: 16,
    productName: 18,
    productDescription: 14,
    companyName: 20,
    categoryName: 22
  },
  fontWeight: {
    title: '700',
    description: '400',
    productName: '600',
    productDescription: '400',
    companyName: '600',
    categoryName: '600'
  }
}

const DEFAULT_SPACING_CUSTOMIZATION: SpacingCustomization = {
  padding: {
    page: 24,
    productCard: 16,
    section: 32
  },
  margin: {
    elements: 8,
    sections: 24
  },
  gap: {
    products: 16,
    content: 12
  }
}

const DEFAULT_ADVANCED_STYLES: AdvancedStyleCustomization = {
  borders: {
    productCard: {
      width: 1,
      style: 'solid',
      color: '#e5e7eb',
      radius: 8
    },
    buttons: {
      width: 1,
      style: 'solid',
      color: '#3b82f6',
      radius: 6
    }
  },
  shadows: {
    productCard: {
      enabled: true,
      blur: 10,
      spread: 0,
      color: '#000000',
      opacity: 0.1
    },
    buttons: {
      enabled: false,
      blur: 4,
      spread: 0,
      color: '#000000',
      opacity: 0.25
    }
  }
}

const PRESET_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#ffffff', '#f9fafb'
]

const FONT_FAMILIES = [
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
  'Montserrat, sans-serif',
  'Poppins, sans-serif',
  'Playfair Display, serif',
  'Merriweather, serif',
  'Georgia, serif',
  'Times New Roman, serif'
]

// Function to get readable font name from font family string
const getFontDisplayName = (fontValue: string): string => {
  const fontMap: { [key: string]: string } = {
    'Inter, sans-serif': 'Inter',
    'Roboto, sans-serif': 'Roboto',
    'Open Sans, sans-serif': 'Open Sans',
    'Lato, sans-serif': 'Lato',
    'Montserrat, sans-serif': 'Montserrat',
    'Poppins, sans-serif': 'Poppins',
    'Playfair Display, serif': 'Playfair Display',
    'Merriweather, serif': 'Merriweather',
    'Georgia, serif': 'Georgia',
    'Times New Roman, serif': 'Times New Roman',
    // Handle legacy CSS variable format for backward compatibility
    'var(--font-inter)': 'Inter',
    'var(--font-roboto)': 'Roboto',
    'var(--font-open-sans)': 'Open Sans',
    'var(--font-lato)': 'Lato',
    'var(--font-montserrat)': 'Montserrat',
    'var(--font-poppins)': 'Poppins',
    'var(--font-playfair-display)': 'Playfair Display',
    'var(--font-merriweather)': 'Merriweather'
  }
  return fontMap[fontValue] || fontValue.split(',')[0]
}

export function StyleCustomizer({
  isVisible,
  onToggle,
  customColors,
  onColorsChange,
  fontCustomization = DEFAULT_FONT_CUSTOMIZATION,
  onFontChange,
  spacingCustomization = DEFAULT_SPACING_CUSTOMIZATION,
  onSpacingChange,
  advancedStyles = DEFAULT_ADVANCED_STYLES,
  onAdvancedStylesChange
}: StyleCustomizerProps) {
  const [selectedColorElement, setSelectedColorElement] = useState<string | null>(null)
  const [showFontDialog, setShowFontDialog] = useState(false)

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    elementKey 
  }: { 
    label: string
    value: string
    onChange: (color: string) => void
    elementKey: string
  }) => (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
          style={{ backgroundColor: value }}
          onClick={() => setSelectedColorElement(elementKey)}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs font-mono bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          placeholder="#000000"
        />
      </div>
      {selectedColorElement === elementKey && (
        <div className="grid grid-cols-10 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className="w-7 h-7 rounded-md border border-gray-200 hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color)
                setSelectedColorElement(null)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )

  const handleColorChange = (category: 'textColors' | 'backgroundColors', colors: any) => {
    console.log('StyleCustomizer handleColorChange called:', category, colors)
    onColorsChange({
      ...customColors,
      [category]: colors
    })
  }

  const handleFontChange = (property: string, value: any) => {
    console.log('StyleCustomizer handleFontChange called:', property, value)
    if (!onFontChange) return
    
    const keys = property.split('.')
    if (keys.length === 1) {
      onFontChange({
        ...fontCustomization,
        [property]: value
      })
    } else {
      const currentValue = fontCustomization[keys[0] as keyof FontCustomization]
      onFontChange({
        ...fontCustomization,
        [keys[0]]: {
          ...(typeof currentValue === 'object' ? currentValue : {}),
          [keys[1]]: value
        }
      })
    }
  }

  const handleSpacingChange = (property: string, value: number) => {
    if (!onSpacingChange) return
    
    const keys = property.split('.')
    if (keys.length === 2) {
      onSpacingChange({
        ...spacingCustomization,
        [keys[0]]: {
          ...spacingCustomization[keys[0] as keyof SpacingCustomization],
          [keys[1]]: value
        }
      })
    }
  }

  const handleAdvancedStyleChange = (property: string, value: any) => {
    if (!onAdvancedStylesChange) return
    
    const keys = property.split('.')
    if (keys.length === 3) {
      const [section, subsection, prop] = keys
      if (section === 'borders' || section === 'shadows') {
        onAdvancedStylesChange({
          ...advancedStyles,
          [section]: {
            ...advancedStyles[section],
            [subsection]: {
              ...advancedStyles[section][subsection as keyof typeof advancedStyles[typeof section]],
              [prop]: value
            }
          }
        })
      }
    } else if (keys.length === 2) {
      const [section, prop] = keys
      if (section === 'borders' || section === 'shadows') {
        onAdvancedStylesChange({
          ...advancedStyles,
          [section]: {
            ...advancedStyles[section],
            [prop]: value
          }
        })
      }
    }
  }

  return (
    <div className="h-full">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pb-4 z-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Style Customizer</h2>
          </div>
          <Button
            onClick={() => {
              onColorsChange({
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
              if (onFontChange) onFontChange(DEFAULT_FONT_CUSTOMIZATION)
              if (onSpacingChange) onSpacingChange(DEFAULT_SPACING_CUSTOMIZATION)
              if (onAdvancedStylesChange) onAdvancedStylesChange(DEFAULT_ADVANCED_STYLES)
            }}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset All
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-2 grid-rows-2 gap-1 h-auto p-1">
            <TabsTrigger value="colors" className="flex items-center justify-center gap-1 text-xs py-2 px-2">
              <Palette className="h-3 w-3" />
              <span className="hidden sm:inline">Colors</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center justify-center gap-1 text-xs py-2 px-2">
              <Type className="h-3 w-3" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="spacing" className="flex items-center justify-center gap-1 text-xs py-2 px-2">
              <Layout className="h-3 w-3" />
              <span className="hidden sm:inline">Spacing</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center justify-center gap-1 text-xs py-2 px-2">
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-3">
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-700">Text Colors</h4>
                <ColorPicker
                  label="Company Name"
                  value={customColors.textColors?.companyName || '#1f2937'}
                  onChange={(color) => handleColorChange('textColors', { ...customColors.textColors, companyName: color })}
                  elementKey="companyName"
                />
                <ColorPicker
                  label="Catalog Title"
                  value={customColors.textColors?.title || '#1f2937'}
                  onChange={(color) => handleColorChange('textColors', { ...customColors.textColors, title: color })}
                  elementKey="title"
                />
                <ColorPicker
                  label="Description Text"
                  value={customColors.textColors?.description || '#6b7280'}
                  onChange={(color) => handleColorChange('textColors', { ...customColors.textColors, description: color })}
                  elementKey="description"
                />
                <ColorPicker
                  label="Product Name"
                  value={customColors.textColors?.productName || '#1f2937'}
                  onChange={(color) => handleColorChange('textColors', { ...customColors.textColors, productName: color })}
                  elementKey="productName"
                />
                <ColorPicker
                  label="Product Description"
                  value={customColors.textColors?.productDescription || '#6b7280'}
                  onChange={(color) => handleColorChange('textColors', { ...customColors.textColors, productDescription: color })}
                  elementKey="productDescription"
                />
                <ColorPicker
                  label="Product Price"
                  value={customColors.textColors?.productPrice || '#059669'}
                  onChange={(color) => handleColorChange('textColors', { ...customColors.textColors, productPrice: color })}
                  elementKey="productPrice"
                />
                <ColorPicker
                  label="Category Name"
                  value={customColors.textColors?.categoryName || '#1f2937'}
                  onChange={(color) => handleColorChange('textColors', { ...customColors.textColors, categoryName: color })}
                  elementKey="categoryName"
                />
              </div>
              
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-700">Background Colors</h4>
                <ColorPicker
                  label="Main Background"
                  value={customColors.backgroundColors?.main || '#ffffff'}
                  onChange={(color) => handleColorChange('backgroundColors', { ...customColors.backgroundColors, main: color })}
                  elementKey="main"
                />
                <ColorPicker
                  label="Cover Background"
                  value={customColors.backgroundColors?.cover || '#f9fafb'}
                  onChange={(color) => handleColorChange('backgroundColors', { ...customColors.backgroundColors, cover: color })}
                  elementKey="cover"
                />
                <ColorPicker
                  label="Product Card Background"
                  value={customColors.backgroundColors?.productCard || '#ffffff'}
                  onChange={(color) => handleColorChange('backgroundColors', { ...customColors.backgroundColors, productCard: color })}
                  elementKey="productCard"
                />
                <ColorPicker
                  label="Category Section Background"
                  value={customColors.backgroundColors?.categorySection || '#f3f4f6'}
                  onChange={(color) => handleColorChange('backgroundColors', { ...customColors.backgroundColors, categorySection: color })}
                  elementKey="categorySection"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-2">
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Font Family</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-600">Title</Label>
                    <Select
                      value={fontCustomization.fontFamily?.title || 'Inter, sans-serif'}
                      onValueChange={(value) => handleFontChange('fontFamily.title', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={getFontDisplayName(fontCustomization.fontFamily?.title || 'Inter, sans-serif')} />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{getFontDisplayName(font)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Company Name</Label>
                    <Select
                      value={fontCustomization.fontFamily?.companyName || 'Inter, sans-serif'}
                      onValueChange={(value) => handleFontChange('fontFamily.companyName', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={getFontDisplayName(fontCustomization.fontFamily?.companyName || 'Inter, sans-serif')} />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{getFontDisplayName(font)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Product Name</Label>
                    <Select
                      value={fontCustomization.fontFamily?.productName || 'Inter, sans-serif'}
                      onValueChange={(value) => handleFontChange('fontFamily.productName', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={getFontDisplayName(fontCustomization.fontFamily?.productName || 'Inter, sans-serif')} />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{getFontDisplayName(font)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Product Description</Label>
                    <Select
                      value={fontCustomization.fontFamily?.productDescription || 'Inter, sans-serif'}
                      onValueChange={(value) => handleFontChange('fontFamily.productDescription', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={getFontDisplayName(fontCustomization.fontFamily?.productDescription || 'Inter, sans-serif')} />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{getFontDisplayName(font)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Description</Label>
                    <Select
                      value={fontCustomization.fontFamily?.description || 'Inter, sans-serif'}
                      onValueChange={(value) => handleFontChange('fontFamily.description', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={getFontDisplayName(fontCustomization.fontFamily?.description || 'Inter, sans-serif')} />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{getFontDisplayName(font)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Category Name</Label>
                    <Select
                      value={fontCustomization.fontFamily?.categoryName || 'Inter, sans-serif'}
                      onValueChange={(value) => handleFontChange('fontFamily.categoryName', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={getFontDisplayName(fontCustomization.fontFamily?.categoryName || 'Inter, sans-serif')} />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font} value={font}>
                            <span style={{ fontFamily: font }}>{getFontDisplayName(font)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Font Size</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-600">Title: {fontCustomization.fontSize?.title || 24}px</Label>
                    <Slider
                      value={[fontCustomization.fontSize?.title || 24]}
                      onValueChange={([value]) => handleFontChange('fontSize.title', value)}
                      min={16}
                      max={48}
                      step={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Company Name: {fontCustomization.fontSize?.companyName || 20}px</Label>
                    <Slider
                      value={[fontCustomization.fontSize?.companyName || 20]}
                      onValueChange={([value]) => handleFontChange('fontSize.companyName', value)}
                      min={14}
                      max={32}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Product Name: {fontCustomization.fontSize?.productName || 18}px</Label>
                    <Slider
                      value={[fontCustomization.fontSize?.productName || 18]}
                      onValueChange={([value]) => handleFontChange('fontSize.productName', value)}
                      min={12}
                      max={28}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Product Description: {fontCustomization.fontSize?.productDescription || 14}px</Label>
                    <Slider
                      value={[fontCustomization.fontSize?.productDescription || 14]}
                      onValueChange={([value]) => handleFontChange('fontSize.productDescription', value)}
                      min={10}
                      max={20}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Description: {fontCustomization.fontSize?.description || 16}px</Label>
                    <Slider
                      value={[fontCustomization.fontSize?.description || 16]}
                      onValueChange={([value]) => handleFontChange('fontSize.description', value)}
                      min={12}
                      max={24}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Category Name: {fontCustomization.fontSize?.categoryName || 22}px</Label>
                    <Slider
                      value={[fontCustomization.fontSize?.categoryName || 22]}
                      onValueChange={([value]) => handleFontChange('fontSize.categoryName', value)}
                      min={14}
                      max={32}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Font Weight</h3>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-600">Title: {fontCustomization.fontWeight?.title || '700'}</Label>
                    <Slider
                      value={[parseInt(fontCustomization.fontWeight?.title || '700')]}
                      onValueChange={([value]) => handleFontChange('fontWeight.title', value.toString())}
                      min={100}
                      max={900}
                      step={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Company Name: {fontCustomization.fontWeight?.companyName || '600'}</Label>
                    <Slider
                      value={[parseInt(fontCustomization.fontWeight?.companyName || '600')]}
                      onValueChange={([value]) => handleFontChange('fontWeight.companyName', value.toString())}
                      min={100}
                      max={900}
                      step={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Product Name: {fontCustomization.fontWeight?.productName || '600'}</Label>
                    <Slider
                      value={[parseInt(fontCustomization.fontWeight?.productName || '600')]}
                      onValueChange={([value]) => handleFontChange('fontWeight.productName', value.toString())}
                      min={100}
                      max={900}
                      step={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Product Description: {fontCustomization.fontWeight?.productDescription || '400'}</Label>
                    <Slider
                      value={[parseInt(fontCustomization.fontWeight?.productDescription || '400')]}
                      onValueChange={([value]) => handleFontChange('fontWeight.productDescription', value.toString())}
                      min={100}
                      max={900}
                      step={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Description: {fontCustomization.fontWeight?.description || '400'}</Label>
                    <Slider
                      value={[parseInt(fontCustomization.fontWeight?.description || '400')]}
                      onValueChange={([value]) => handleFontChange('fontWeight.description', value.toString())}
                      min={100}
                      max={900}
                      step={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Category Name: {fontCustomization.fontWeight?.categoryName || '600'}</Label>
                    <Slider
                      value={[parseInt(fontCustomization.fontWeight?.categoryName || '600')]}
                      onValueChange={([value]) => handleFontChange('fontWeight.categoryName', value.toString())}
                      min={100}
                      max={900}
                      step={100}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="spacing" className="space-y-3">
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Padding</h3>
                <div>
                  <Label className="text-xs text-gray-600">Page: {spacingCustomization.padding.page}px</Label>
                  <Slider
                    value={[spacingCustomization.padding.page]}
                    onValueChange={([value]) => handleSpacingChange('padding.page', value)}
                    min={0}
                    max={100}
                    step={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Product Card: {spacingCustomization.padding.productCard}px</Label>
                  <Slider
                    value={[spacingCustomization.padding.productCard]}
                    onValueChange={([value]) => handleSpacingChange('padding.productCard', value)}
                    min={0}
                    max={50}
                    step={2}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Margins</h3>
                <div>
                  <Label className="text-xs text-gray-600">Elements: {spacingCustomization.margin.elements}px</Label>
                  <Slider
                    value={[spacingCustomization.margin.elements]}
                    onValueChange={([value]) => handleSpacingChange('margin.elements', value)}
                    min={0}
                    max={50}
                    step={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Sections: {spacingCustomization.margin.sections}px</Label>
                  <Slider
                    value={[spacingCustomization.margin.sections]}
                    onValueChange={([value]) => handleSpacingChange('margin.sections', value)}
                    min={0}
                    max={100}
                    step={4}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Gaps</h3>
                <div>
                  <Label className="text-xs text-gray-600">Products: {spacingCustomization.gap.products}px</Label>
                  <Slider
                    value={[spacingCustomization.gap.products]}
                    onValueChange={([value]) => handleSpacingChange('gap.products', value)}
                    min={0}
                    max={50}
                    step={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Content: {spacingCustomization.gap.content}px</Label>
                  <Slider
                    value={[spacingCustomization.gap.content]}
                    onValueChange={([value]) => handleSpacingChange('gap.content', value)}
                    min={0}
                    max={30}
                    step={2}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-3">
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Borders</h3>
                <div>
                  <Label className="text-xs text-gray-600">Product Card Border Radius: {advancedStyles.borders.productCard.radius}px</Label>
                  <Slider
                    value={[advancedStyles.borders.productCard.radius]}
                    onValueChange={([value]) => handleAdvancedStyleChange('borders.productCard.radius', value)}
                    min={0}
                    max={30}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Button Border Radius: {advancedStyles.borders.buttons.radius}px</Label>
                  <Slider
                    value={[advancedStyles.borders.buttons.radius]}
                    onValueChange={([value]) => handleAdvancedStyleChange('borders.buttons.radius', value)}
                    min={0}
                    max={20}
                    step={1}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700">Shadows</h3>
                <div>
                  <Label className="text-xs text-gray-600">Product Card Shadow Blur: {advancedStyles.shadows.productCard.blur}px</Label>
                  <Slider
                    value={[advancedStyles.shadows.productCard.blur]}
                    onValueChange={([value]) => handleAdvancedStyleChange('shadows.productCard.blur', value)}
                    min={0}
                    max={30}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Shadow Opacity: {Math.round(advancedStyles.shadows.productCard.opacity * 100)}%</Label>
                  <Slider
                    value={[advancedStyles.shadows.productCard.opacity]}
                    onValueChange={([value]) => handleAdvancedStyleChange('shadows.productCard.opacity', value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default StyleCustomizer
export { DEFAULT_FONT_CUSTOMIZATION, DEFAULT_SPACING_CUSTOMIZATION, DEFAULT_ADVANCED_STYLES }
export type { FontCustomization, SpacingCustomization, AdvancedStyleCustomization }