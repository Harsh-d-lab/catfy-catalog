import React from 'react'
import { Profile } from '@prisma/client'
import Image from 'next/image'
import { ColorCustomization } from '../types/ColorCustomization'

interface ContactPageProps {
  profile: Profile
  themeColors: {
    primary: string
    secondary: string
    accent: string
  }
  customColors?: ColorCustomization
}

export function ContactPage({ profile, themeColors, customColors }: ContactPageProps) {
  const contactInfo = [
    {
      icon: '📧',
      label: 'Email',
      value: profile.email,
      href: `mailto:${profile.email}`
    },
    {
      icon: '📱',
      label: 'Phone',
      value: profile.phone,
      href: profile.phone ? `tel:${profile.phone}` : undefined
    },
    {
      icon: '🌐',
      label: 'Website',
      value: profile.website,
      href: profile.website
    },
    {
      icon: '📍',
      label: 'Address',
      value: profile.address,
      href: undefined
    }
  ].filter(item => item.value)

  const socialLinks: any[] = []

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 
          className="text-5xl font-bold mb-4"
          style={{ color: customColors?.textColors.title || '#3b82f6' }}
        >
          Get in
        </h1>
        <h2 className="text-6xl font-bold text-gray-900 mb-6">
          Touch
        </h2>
        <div className="w-24 h-1 mx-auto" style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }} />
        <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
          Ready to explore our products? Contact us today for personalized assistance and detailed information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left Column - Company Info */}
        <div className="space-y-8">
          {/* Company Logo and Name */}
          <div className="text-center lg:text-left">
            {profile.avatarUrl && (
              <div className="mb-6">
                <Image
                  src={profile.avatarUrl}
                  alt={`${profile.companyName} logo`}
                  width={120}
                  height={120}
                  className="mx-auto lg:mx-0 rounded-lg shadow-lg"
                />
              </div>
            )}
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {profile.companyName}
            </h3>

          </div>



          {/* Contact Information */}
          <div className="">
            <h4 className="text-xl font-bold text-gray-900 mb-6">
              Contact Information
            </h4>
            <div className="space-y-4">
              {contactInfo.map((contact, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }}
                  >
                    {contact.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {contact.label}
                    </div>
                    {contact.href ? (
                      <a 
                        href={contact.href}
                        className="text-gray-600 hover:underline"
                        style={{ color: customColors?.textColors.title || '#3b82f6' }}
                      >
                        {contact.value}
                      </a>
                    ) : (
                      <div className="text-gray-600">
                        {contact.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          {socialLinks.length > 0 && (
            <div className="">
              <h4 className="text-xl font-bold text-gray-900 mb-6">
                Follow Us
              </h4>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl hover:scale-110 transition-transform duration-200"
                    style={{ backgroundColor: social.color }}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Contact Form / CTA */}
        <div className="">
          <div 
            className="rounded-2xl p-8 h-full flex flex-col justify-center"
            style={{ backgroundColor: customColors?.backgroundColors.categorySection || '#f3f4f6' }}
          >
            <div className="text-center">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-white text-3xl"
                style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }}
              >
                💬
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Start?
              </h3>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                We're here to help you find the perfect products for your needs. 
                Get in touch with our team for personalized recommendations, 
                bulk pricing, and technical support.
              </p>
              
              <div className="space-y-4">
                <div 
                  className="inline-block px-8 py-4 rounded-lg text-white font-medium text-lg cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  style={{ backgroundColor: customColors?.textColors.title || '#3b82f6' }}
                >
                  Contact Us Now
                </div>
                
                <div className="text-sm text-gray-600">
                  Response within 24 hours
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl mb-2">⚡</div>
                <div className="font-medium text-gray-900">Fast Response</div>
                <div className="text-sm text-gray-600">Within 24 hours</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-medium text-gray-900">Expert Advice</div>
                <div className="text-sm text-gray-600">Professional team</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-medium text-gray-900">Best Prices</div>
                <div className="text-sm text-gray-600">Competitive rates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🚚</div>
                <div className="font-medium text-gray-900">Fast Delivery</div>
                <div className="text-sm text-gray-600">Worldwide shipping</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center">
        <p className="text-gray-600">
          © {new Date().getFullYear()} {profile.companyName}. All rights reserved.
        </p>
        {profile.website && (
          <p className="text-sm text-gray-500 mt-2">
            Visit us at{' '}
            <a 
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: customColors?.textColors.title || '#3b82f6' }}
              className="hover:underline"
            >
              {profile.website}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

export default ContactPage