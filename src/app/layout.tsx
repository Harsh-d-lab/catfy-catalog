import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CATFY - AI-Driven Dynamic Catalogues',
  description: 'Create beautiful, dynamic product catalogues with AI assistance',
  keywords: ['catalogue', 'products', 'AI', 'dynamic', 'SaaS'],
  authors: [{ name: 'CATFY Team' }],
  creator: 'CATFY',
  publisher: 'CATFY',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'CATFY - AI-Driven Dynamic Catalogues',
    description: 'Create beautiful, dynamic product catalogues with AI assistance',
    url: '/',
    siteName: 'CATFY',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CATFY - AI-Driven Dynamic Catalogues',
    description: 'Create beautiful, dynamic product catalogues with AI assistance',
    creator: '@catfy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
