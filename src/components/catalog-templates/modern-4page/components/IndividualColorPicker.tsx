import React, { useState } from 'react'
import { ColorCustomization } from '../types/ColorCustomization'

interface IndividualColorPickerProps {
  customColors: ColorCustomization
  onColorsChange: (colors: ColorCustomization) => void
}

interface ColorPickerInputProps {
  label: string
  value: string
  onChange: (color: string) => void
}

const ColorPickerInput: React.FC<ColorPickerInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

export const IndividualColorPicker: React.FC<IndividualColorPickerProps> = ({
  customColors,
  onColorsChange
}) => {
  const [activeSection, setActiveSection] = useState<'text' | 'background'>('text')

  const updateTextColor = (key: keyof ColorCustomization['textColors'], color: string) => {
    onColorsChange({
      ...customColors,
      textColors: {
        ...customColors.textColors,
        [key]: color
      }
    })
  }

  const updateBackgroundColor = (key: keyof ColorCustomization['backgroundColors'], color: string) => {
    onColorsChange({
      ...customColors,
      backgroundColors: {
        ...customColors.backgroundColors,
        [key]: color
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSection('text')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'text'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Text Colors
        </button>
        <button
          onClick={() => setActiveSection('background')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeSection === 'background'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Background Colors
        </button>
      </div>

      {/* Text Colors Section */}
      {activeSection === 'text' && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Text Colors</h4>
          
          <ColorPickerInput
            label="Company Name"
            value={customColors.textColors.companyName}
            onChange={(color) => updateTextColor('companyName', color)}
          />
          
          <ColorPickerInput
            label="Catalog Title"
            value={customColors.textColors.title}
            onChange={(color) => updateTextColor('title', color)}
          />
          
          <ColorPickerInput
            label="Description"
            value={customColors.textColors.description}
            onChange={(color) => updateTextColor('description', color)}
          />
          
          <ColorPickerInput
            label="Product Name"
            value={customColors.textColors.productName}
            onChange={(color) => updateTextColor('productName', color)}
          />
          
          <ColorPickerInput
            label="Product Description"
            value={customColors.textColors.productDescription}
            onChange={(color) => updateTextColor('productDescription', color)}
          />
          
          <ColorPickerInput
            label="Product Price"
            value={customColors.textColors.productPrice}
            onChange={(color) => updateTextColor('productPrice', color)}
          />
          
          <ColorPickerInput
            label="Category Name"
            value={customColors.textColors.categoryName}
            onChange={(color) => updateTextColor('categoryName', color)}
          />
        </div>
      )}

      {/* Background Colors Section */}
      {activeSection === 'background' && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Background Colors</h4>
          
          <ColorPickerInput
            label="Main Background"
            value={customColors.backgroundColors.main}
            onChange={(color) => updateBackgroundColor('main', color)}
          />
          
          <ColorPickerInput
            label="Cover Background"
            value={customColors.backgroundColors.cover}
            onChange={(color) => updateBackgroundColor('cover', color)}
          />
          
          <ColorPickerInput
            label="Product Card"
            value={customColors.backgroundColors.productCard}
            onChange={(color) => updateBackgroundColor('productCard', color)}
          />
          
          <ColorPickerInput
            label="Category Section"
            value={customColors.backgroundColors.categorySection}
            onChange={(color) => updateBackgroundColor('categorySection', color)}
          />
        </div>
      )}

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
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
          }}
          className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Reset to Default Colors
        </button>
      </div>
    </div>
  )
}

export default IndividualColorPicker