import type { Metadata } from 'next'
import { Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins, Playfair_Display, Merriweather } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const roboto = Roboto({ subsets: ['latin'], weight: ['300', '400', '500', '700'], variable: '--font-roboto' })
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })
const lato = Lato({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-lato' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const poppins = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-poppins' })
const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' })
const merriweather = Merriweather({ subsets: ['latin'], weight: ['300', '400', '700'], variable: '--font-merriweather' })

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
      <body className={`${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${poppins.variable} ${playfairDisplay.variable} ${merriweather.variable} ${inter.className}`}>
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
