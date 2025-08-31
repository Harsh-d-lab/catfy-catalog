'use client'

import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Book, 
  Search, 
  ChevronRight, 
  FileText, 
  Video, 
  Download, 
  ExternalLink,
  Lightbulb,
  Settings,
  Users,
  CreditCard,
  Palette,
  Share2,
  BarChart3,
  HelpCircle
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface DocSection {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  articles: DocArticle[]
}

interface DocArticle {
  id: string
  title: string
  description: string
  readTime: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  type: 'guide' | 'tutorial' | 'reference'
}

const docSections: DocSection[] = [
  {
    id: 'about-catfy',
    title: 'About Catfy',
    description: 'Learn what Catfy is and how it can transform your business',
    icon: <Lightbulb className="h-6 w-6" />,
    articles: [
      {
        id: 'what-is-catfy',
        title: 'What is Catfy?',
        description: 'Catfy is a powerful digital catalogue creation platform that helps businesses showcase their products professionally. Create stunning, interactive catalogues that can be shared digitally or exported as high-quality PDFs.',
        readTime: '3 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'key-features',
        title: 'Key Features',
        description: 'Discover Catfy\'s powerful features: drag-and-drop catalogue builder, customizable themes, product management, PDF export, sharing options, analytics, and team collaboration tools.',
        readTime: '5 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'who-uses-catfy',
        title: 'Who Uses Catfy?',
        description: 'Perfect for retailers, wholesalers, manufacturers, service providers, and any business that needs to showcase products or services in a professional digital format.',
        readTime: '2 min',
        difficulty: 'Beginner',
        type: 'guide'
      }
    ]
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of creating and managing your catalogues',
    icon: <Lightbulb className="h-6 w-6" />,
    articles: [
      {
        id: 'quick-start',
        title: 'Quick Start Guide',
        description: 'Sign up for Catfy, choose your account type (Individual or Business), complete your profile, and create your first catalogue in under 5 minutes using our intuitive interface.',
        readTime: '5 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'account-setup',
        title: 'Setting Up Your Account',
        description: 'Complete guide to account configuration: profile setup, business information, contact details, timezone settings, and subscription plan selection.',
        readTime: '8 min',
        difficulty: 'Beginner',
        type: 'tutorial'
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        description: 'Navigate your Catfy dashboard: view catalogue statistics, manage subscriptions, access quick actions, and understand the main navigation menu.',
        readTime: '6 min',
        difficulty: 'Beginner',
        type: 'guide'
      }
    ]
  },
  {
    id: 'creating-catalogues',
    title: 'Creating Catalogues',
    description: 'Step-by-step guide to building your first catalogue',
    icon: <FileText className="h-6 w-6" />,
    articles: [
      {
        id: 'create-new-catalogue',
        title: 'Creating a New Catalogue',
        description: 'Step 1: Click "Create New Catalogue" from your dashboard. Step 2: Choose a template or start from scratch. Step 3: Enter catalogue name and description. Step 4: Select your preferred layout and theme.',
        readTime: '8 min',
        difficulty: 'Beginner',
        type: 'tutorial'
      },
      {
        id: 'adding-products',
        title: 'Adding Products',
        description: 'Add products to your catalogue: upload product images (JPG, PNG, WebP), enter product details (name, description, price), organize products into categories, and set product visibility options.',
        readTime: '12 min',
        difficulty: 'Beginner',
        type: 'tutorial'
      },
      {
        id: 'product-details',
        title: 'Product Information Best Practices',
        description: 'Write compelling product descriptions, use high-quality images (minimum 1000x1000px), set accurate pricing, add product specifications, and include relevant tags for better organization.',
        readTime: '10 min',
        difficulty: 'Intermediate',
        type: 'guide'
      },
      {
        id: 'catalogue-organization',
        title: 'Organizing Your Catalogue',
        description: 'Create product categories, arrange products logically, use filters and search functionality, set up product hierarchies, and optimize catalogue navigation for better user experience.',
        readTime: '15 min',
        difficulty: 'Intermediate',
        type: 'guide'
      }
    ]
  },
  {
    id: 'catalogue-management',
    title: 'Advanced Catalogue Management',
    description: 'Advanced features for organizing and optimizing your catalogues',
    icon: <Settings className="h-6 w-6" />,
    articles: [
      {
        id: 'bulk-operations',
        title: 'Bulk Product Import',
        description: 'Import multiple products at once using CSV files: download the CSV template, fill in product information, upload the file, and review imported products before publishing.',
        readTime: '15 min',
        difficulty: 'Advanced',
        type: 'tutorial'
      },
      {
        id: 'catalogue-templates',
        title: 'Using Catalogue Templates',
        description: 'Choose from pre-designed templates: Modern, Classic, Minimalist, and Industry-specific templates. Customize colors, fonts, and layouts to match your brand identity.',
        readTime: '7 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'duplicate-catalogue',
        title: 'Duplicating Catalogues',
        description: 'Create copies of existing catalogues to save time: duplicate catalogue structure, modify products and details, and publish variations for different markets or seasons.',
        readTime: '5 min',
        difficulty: 'Beginner',
        type: 'guide'
      }
    ]
  },
  {
    id: 'customization',
    title: 'Design & Customization',
    description: 'Customize the look and feel of your catalogues',
    icon: <Palette className="h-6 w-6" />,
    articles: [
      {
        id: 'theme-customization',
        title: 'Theme Customization',
        description: 'Personalize your catalogue appearance: choose from Modern, Classic, or Minimalist themes. Customize primary and secondary colors, select fonts (Roboto, Open Sans, Lato), and adjust spacing and layout options.',
        readTime: '12 min',
        difficulty: 'Intermediate',
        type: 'tutorial'
      },
      {
        id: 'branding-guide',
        title: 'Adding Your Branding',
        description: 'Upload your company logo, set brand colors using hex codes or color picker, add custom headers and footers, and include contact information and social media links.',
        readTime: '8 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'layout-options',
        title: 'Layout Options',
        description: 'Choose from Grid, List, or Card layouts. Configure product display options: show/hide prices, descriptions, and product codes. Set up multi-column layouts and responsive design settings.',
        readTime: '6 min',
        difficulty: 'Beginner',
        type: 'reference'
      },
      {
        id: 'custom-css',
        title: 'Advanced Styling (Premium)',
        description: 'For premium users: add custom CSS for advanced styling, create unique layouts, implement custom animations, and build completely personalized catalogue designs.',
        readTime: '20 min',
        difficulty: 'Advanced',
        type: 'tutorial'
      }
    ]
  },
  {
    id: 'sharing-export',
    title: 'Sharing & Export',
    description: 'Share your catalogues and export in various formats',
    icon: <Share2 className="h-6 w-6" />,
    articles: [
      {
        id: 'sharing-options',
        title: 'Sharing Your Catalogue',
        description: 'Share via public link (copy and send to customers), generate QR codes for easy mobile access, share on social media platforms, or send via email directly from Catfy.',
        readTime: '5 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'pdf-export',
        title: 'PDF Export Guide',
        description: 'Export high-quality PDF catalogues: choose page size (A4, Letter, Custom), select orientation (Portrait/Landscape), include/exclude pricing, add watermarks, and optimize for print or digital viewing.',
        readTime: '7 min',
        difficulty: 'Beginner',
        type: 'tutorial'
      },
      {
        id: 'embed-options',
        title: 'Embedding Catalogues',
        description: 'Embed interactive catalogues on your website: copy embed code, customize iframe dimensions, set responsive options, and integrate with your existing website design.',
        readTime: '10 min',
        difficulty: 'Intermediate',
        type: 'tutorial'
      },
      {
        id: 'privacy-settings',
        title: 'Privacy & Access Control',
        description: 'Set catalogue visibility: public (anyone with link), private (password protected), or restricted (specific email domains). Configure download permissions and view tracking.',
        readTime: '8 min',
        difficulty: 'Intermediate',
        type: 'guide'
      }
    ]
  },
  {
    id: 'account-billing',
    title: 'Account & Billing',
    description: 'Manage your subscription and account settings',
    icon: <CreditCard className="h-6 w-6" />,
    articles: [
      {
        id: 'subscription-plans',
        title: 'Subscription Plans Explained',
        description: 'Free Plan: 1 catalogue, 10 products, basic themes. Monthly Plan ($9.99): Unlimited catalogues and products, premium themes, PDF export. Yearly Plan ($99.99): All monthly features plus priority support and advanced analytics.',
        readTime: '6 min',
        difficulty: 'Beginner',
        type: 'reference'
      },
      {
        id: 'billing-management',
        title: 'Managing Your Subscription',
        description: 'Update payment methods (credit card, PayPal), view billing history and invoices, upgrade or downgrade plans, cancel subscription, and manage automatic renewals.',
        readTime: '5 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'account-settings',
        title: 'Account Settings',
        description: 'Update profile information, change password, set notification preferences, configure timezone, manage team members (Business accounts), and export account data.',
        readTime: '4 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'team-collaboration',
        title: 'Team Collaboration (Business)',
        description: 'Invite team members, set user permissions (Admin, Editor, Viewer), manage workspace access, collaborate on catalogues, and track team activity.',
        readTime: '10 min',
        difficulty: 'Intermediate',
        type: 'guide'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    description: 'Track performance and gain insights from your catalogues',
    icon: <BarChart3 className="h-6 w-6" />,
    articles: [
      {
        id: 'analytics-overview',
        title: 'Analytics Dashboard',
        description: 'View catalogue performance metrics: total views, unique visitors, popular products, geographic data, device types, and engagement rates. Available for premium subscribers.',
        readTime: '8 min',
        difficulty: 'Intermediate',
        type: 'guide'
      },
      {
        id: 'tracking-views',
        title: 'Understanding Engagement Metrics',
        description: 'Track page views, time spent on catalogue, product click-through rates, PDF downloads, and sharing statistics. Use insights to optimize your catalogue performance.',
        readTime: '10 min',
        difficulty: 'Intermediate',
        type: 'tutorial'
      },
      {
        id: 'export-analytics',
        title: 'Exporting Analytics Data',
        description: 'Export analytics data as CSV or PDF reports, schedule automated reports, set up email notifications for milestones, and integrate with Google Analytics.',
        readTime: '12 min',
        difficulty: 'Advanced',
        type: 'tutorial'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting & FAQ',
    description: 'Common issues and solutions',
    icon: <HelpCircle className="h-6 w-6" />,
    articles: [
      {
        id: 'common-issues',
        title: 'Common Issues & Solutions',
        description: 'Resolve upload problems, fix display issues, troubleshoot PDF export errors, solve sharing problems, and handle payment issues. Step-by-step solutions for frequent problems.',
        readTime: '15 min',
        difficulty: 'Beginner',
        type: 'guide'
      },
      {
        id: 'browser-compatibility',
        title: 'Browser Compatibility',
        description: 'Catfy works best on Chrome, Firefox, Safari, and Edge. Learn about browser-specific features, mobile compatibility, and how to resolve browser-related issues.',
        readTime: '5 min',
        difficulty: 'Beginner',
        type: 'reference'
      },
      {
        id: 'data-backup',
        title: 'Data Backup & Recovery',
        description: 'Your data is automatically backed up daily. Learn how to export your catalogues, restore deleted items, and understand our data retention policies.',
        readTime: '8 min',
        difficulty: 'Intermediate',
        type: 'guide'
      }
    ]
  }
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-green-100 text-green-800'
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
    case 'Advanced': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'guide': return <Book className="h-4 w-4" />
    case 'tutorial': return <Video className="h-4 w-4" />
    case 'reference': return <FileText className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState('all')

  const filteredSections = docSections.filter(section => {
    if (selectedSection !== 'all' && section.id !== selectedSection) return false
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return section.title.toLowerCase().includes(searchLower) ||
             section.description.toLowerCase().includes(searchLower) ||
             section.articles.some(article => 
               article.title.toLowerCase().includes(searchLower) ||
               article.description.toLowerCase().includes(searchLower)
             )
    }
    
    return true
  })

  return (
    <>
      <Header title="Documentation" showBackButton backHref="/profile" />
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about creating amazing catalogues
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <Lightbulb className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Quick Start</h3>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <Video className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Video Tutorials</h3>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <Download className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">Downloads</h3>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <ExternalLink className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-sm">API Reference</h3>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSection === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSection('all')}
            >
              All Sections
            </Button>
            {docSections.map((section) => (
              <Button
                key={section.id}
                variant={selectedSection === section.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSection(section.id)}
              >
                {section.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {filteredSections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {section.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.articles.map((article) => (
                    <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-gray-600">
                              {getTypeIcon(article.type)}
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={getDifficultyColor(article.difficulty)}
                            >
                              {article.difficulty}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">{article.readTime}</span>
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {article.title}
                        </h4>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {article.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 capitalize">
                            {article.type}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No documentation found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or section filter
            </p>
          </div>
        )}

        {/* Additional Resources */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Additional Resources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Video className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Video Library</h3>
                <p className="text-gray-600 mb-4">
                  Watch step-by-step video tutorials
                </p>
                <Button variant="outline" className="w-full">
                  Browse Videos
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Download className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Downloads</h3>
                <p className="text-gray-600 mb-4">
                  Templates, guides, and resources
                </p>
                <Button variant="outline" className="w-full">
                  View Downloads
                </Button>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Community</h3>
                <p className="text-gray-600 mb-4">
                  Connect with other users
                </p>
                <Button variant="outline" className="w-full">
                  Join Community
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Still need help?
          </h3>
          <div className="flex justify-center space-x-4">
            <Button asChild>
              <Link href="/help">
                Contact Support
              </Link>
            </Button>
            <Button variant="outline">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}