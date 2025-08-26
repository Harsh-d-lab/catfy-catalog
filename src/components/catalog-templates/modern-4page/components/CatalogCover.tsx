import React from 'react'
import { Catalogue, Profile } from '@prisma/client'
import Image from 'next/image'

interface CatalogCoverProps {
  catalogue: Catalogue
  profile: Profile
  themeColors: {
    primary: string
    secondary: string
    accent: string
  }
}

export function CatalogCover({ catalogue, profile, themeColors }: CatalogCoverProps) {
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Background Design Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        />
        <div 
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Company Logo/Brand */}
        <div className="mb-12">
          {profile.avatarUrl ? (
            <div className="w-24 h-24 mx-auto mb-6 rounded-lg overflow-hidden shadow-lg">
              <Image 
                src={profile.avatarUrl} 
                alt={profile.companyName || 'Company Logo'}
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="w-24 h-24 mx-auto mb-6 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {(profile.companyName || profile.fullName || 'C').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Catalog Title */}
        <div className="space-y-4">
          <h1 
            className="text-6xl font-bold tracking-tight"
            style={{ color: 'var(--theme-primary)' }}
          >
            CATALOG
          </h1>
          <h2 className="text-3xl font-light text-gray-700 uppercase tracking-wider">
            {catalogue.name}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {catalogue.description || 'Modern • Unique • Products'}
          </p>
        </div>

        {/* Year */}
        <div className="pt-8">
          <div 
            className="text-4xl font-bold"
            style={{ color: 'var(--theme-primary)' }}
          >
            {currentYear}
          </div>
        </div>

        {/* Company Information */}
        <div className="pt-12 space-y-2">
          <p className="text-lg font-medium text-gray-800">
            by {profile.companyName || profile.fullName || 'Your Company'}
          </p>
          {profile.website && (
            <p className="text-gray-600">
              {profile.website.replace(/^https?:\/\//, '')}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Design Element */}
      <div className="absolute bottom-0 left-0 right-0 h-2" style={{ backgroundColor: 'var(--theme-primary)' }} />
    </div>
  )
}

export default CatalogCover