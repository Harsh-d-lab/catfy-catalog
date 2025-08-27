'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Palette, 
  Type, 
  Square, 
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react'

interface ColorCustomization {
  textColors: {
    title: string
    description: string
    productName: string
    productDescription: string
    companyName: string
  }
  backgroundColors: {
    cover: string
    productCard: string
    page: string
  }
  accentColors: {
    buttons: string
    borders: string
    highlights: string
  }
}

interface ColorCustomizerProps {
  isVisible: boolean
  onToggle: () => void
  currentColors: ColorCustomization
  onColorChange: (colors: ColorCustomization) => void
  onReset: () => void
}

const DEFAULT_COLORS: ColorCustomization = {
  textColors: {
    title: '#1f2937',
    description: '#6b7280',
    productName: '#111827',
    productDescription: '#4b5563',
    companyName: '#374151'
  },
  backgroundColors: {
    cover: '#ffffff',
    productCard: '#f9fafb',
    page: '#ffffff'
  },
  accentColors: {
    buttons: '#3b82f6',
    borders: '#e5e7eb',
    highlights: '#dbeafe'
  }
}

const PRESET_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af',
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#ffffff', '#f9fafb'
]

export function ColorCustomizer({ 
  isVisible, 
  onToggle, 
  currentColors, 
  onColorChange, 
  onReset 
}: ColorCustomizerProps) {
  const [activeTab, setActiveTab] = useState('text')
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const handleColorChange = (category: keyof ColorCustomization, element: string, color: string) => {
    const updatedColors = {
      ...currentColors,
      [category]: {
        ...currentColors[category],
        [element]: color
      }
    }
    onColorChange(updatedColors)
  }

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    category, 
    element 
  }: { 
    label: string
    value: string
    onChange: (color: string) => void
    category: keyof ColorCustomization
    element: string
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setSelectedElement(`${category}-${element}`)}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
      {selectedElement === `${category}-${element}` && (
        <div className="grid grid-cols-10 gap-1 p-2 border rounded">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color)
                setSelectedElement(null)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          className="rounded-full w-12 h-12 shadow-lg"
          size="sm"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 max-h-96 overflow-hidden shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Customizer
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
              <TabsTrigger value="text" className="text-xs">
                <Type className="h-3 w-3 mr-1" />
                Text
              </TabsTrigger>
              <TabsTrigger value="background" className="text-xs">
                <Square className="h-3 w-3 mr-1" />
                Background
              </TabsTrigger>
              <TabsTrigger value="accent" className="text-xs">
                <Palette className="h-3 w-3 mr-1" />
                Accent
              </TabsTrigger>
            </TabsList>
            
            <div className="max-h-64 overflow-y-auto px-4 pb-4">
              <TabsContent value="text" className="space-y-4 mt-0">
                <ColorPicker
                  label="Catalog Title"
                  value={currentColors.textColors.title}
                  onChange={(color) => handleColorChange('textColors', 'title', color)}
                  category="textColors"
                  element="title"
                />
                <ColorPicker
                  label="Catalog Description"
                  value={currentColors.textColors.description}
                  onChange={(color) => handleColorChange('textColors', 'description', color)}
                  category="textColors"
                  element="description"
                />
                <ColorPicker
                  label="Product Names"
                  value={currentColors.textColors.productName}
                  onChange={(color) => handleColorChange('textColors', 'productName', color)}
                  category="textColors"
                  element="productName"
                />
                <ColorPicker
                  label="Product Descriptions"
                  value={currentColors.textColors.productDescription}
                  onChange={(color) => handleColorChange('textColors', 'productDescription', color)}
                  category="textColors"
                  element="productDescription"
                />
                <ColorPicker
                  label="Company Name"
                  value={currentColors.textColors.companyName}
                  onChange={(color) => handleColorChange('textColors', 'companyName', color)}
                  category="textColors"
                  element="companyName"
                />
              </TabsContent>
              
              <TabsContent value="background" className="space-y-4 mt-0">
                <ColorPicker
                  label="Cover Background"
                  value={currentColors.backgroundColors.cover}
                  onChange={(color) => handleColorChange('backgroundColors', 'cover', color)}
                  category="backgroundColors"
                  element="cover"
                />
                <ColorPicker
                  label="Product Cards"
                  value={currentColors.backgroundColors.productCard}
                  onChange={(color) => handleColorChange('backgroundColors', 'productCard', color)}
                  category="backgroundColors"
                  element="productCard"
                />
                <ColorPicker
                  label="Page Background"
                  value={currentColors.backgroundColors.page}
                  onChange={(color) => handleColorChange('backgroundColors', 'page', color)}
                  category="backgroundColors"
                  element="page"
                />
              </TabsContent>
              
              <TabsContent value="accent" className="space-y-4 mt-0">
                <ColorPicker
                  label="Buttons"
                  value={currentColors.accentColors.buttons}
                  onChange={(color) => handleColorChange('accentColors', 'buttons', color)}
                  category="accentColors"
                  element="buttons"
                />
                <ColorPicker
                  label="Borders"
                  value={currentColors.accentColors.borders}
                  onChange={(color) => handleColorChange('accentColors', 'borders', color)}
                  category="accentColors"
                  element="borders"
                />
                <ColorPicker
                  label="Highlights"
                  value={currentColors.accentColors.highlights}
                  onChange={(color) => handleColorChange('accentColors', 'highlights', color)}
                  category="accentColors"
                  element="highlights"
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export { DEFAULT_COLORS }
export type { ColorCustomization }