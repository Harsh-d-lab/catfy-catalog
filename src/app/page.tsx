import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Zap, Palette, Download, Users, Check } from 'lucide-react'
import { SubscriptionPlan } from '@prisma/client'
import { PLAN_FEATURES, formatPrice } from '@/lib/subscription'

const features = [
  {
    icon: Zap,
    title: 'AI-Powered',
    description: 'Generate stunning catalogues with AI assistance and smart recommendations.',
  },
  {
    icon: Palette,
    title: 'Beautiful Themes',
    description: 'Choose from professionally designed themes or customize your own.',
  },
  {
    icon: Download,
    title: 'Export Ready',
    description: 'Export to PDF, share online, or integrate with your existing systems.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together with your team to create the perfect catalogue.',
  },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechCorp',
    content: 'CATFY transformed how we present our products. The AI suggestions are spot-on!',
  },
  {
    name: 'Mike Chen',
    role: 'E-commerce Manager',
    company: 'StyleHub',
    content: 'Creating professional catalogues has never been this easy. Highly recommended!',
  },
  {
    name: 'Emily Davis',
    role: 'Small Business Owner',
    company: 'Artisan Crafts',
    content: 'The themes are beautiful and the export quality is outstanding.',
  },
]

const plans = [
  {
    plan: SubscriptionPlan.FREE,
    popular: false,
    buttonText: 'Get Started',
    buttonVariant: 'outline' as const
  },
  {
    plan: SubscriptionPlan.STANDARD,
    popular: true,
    buttonText: 'Start Free Trial',
    buttonVariant: 'default' as const
  },
  {
    plan: SubscriptionPlan.PROFESSIONAL,
    popular: false,
    buttonText: 'Start Free Trial',
    buttonVariant: 'outline' as const
  }
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">CATFY</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-6">
              <Link
                href="/pricing"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                About
              </Link>
            </nav>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth?mode=signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center space-y-8 py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          🚀 Now in Beta - Join Early Access
        </Badge>
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Create Stunning
          <br />
          <span className="text-primary">AI-Driven Catalogues</span>
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          Transform your products into beautiful, dynamic catalogues with AI assistance.
          Perfect for businesses of all sizes.
        </p>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/auth?mode=signup">
              Start Creating <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/demo">View Demo</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything you need
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Powerful features to help you create professional catalogues in minutes.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/50 py-24">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Loved by businesses
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
              See what our customers are saying about CATFY.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">"{testimonial.content}"</p>
                  <div className="mt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="container py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Choose Your Plan
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Start free and scale as you grow. All plans include our core features.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map(({ plan, popular, buttonText, buttonVariant }) => {
            const features = PLAN_FEATURES[plan]
            const displayPrice = features.monthlyPrice

            return (
              <Card key={plan} className={`relative ${popular ? 'ring-2 ring-primary scale-105' : ''}`}>
                {popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold">{features.name}</CardTitle>
                  <CardDescription>{features.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        {formatPrice(displayPrice)}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        /month
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Limits */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Catalogues</span>
                      <span className="font-medium">
                        {(features.maxCatalogues as number) === -1 ? 'Unlimited' : features.maxCatalogues}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Products per catalogue</span>
                      <span className="font-medium">
                        {features.maxProductsPerCatalogue === -1 ? 'Unlimited' : features.maxProductsPerCatalogue}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Monthly exports</span>
                      <span className="font-medium">
                        {(features.maxExportsPerMonth as number) === -1 ? 'Unlimited' : features.maxExportsPerMonth}
                      </span>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Top Features */}
                  <div className="space-y-2">
                    <ul className="space-y-1">
                      {features.included.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    variant={buttonVariant} 
                    className="w-full"
                    size="lg"
                    asChild
                  >
                    <Link href={plan === SubscriptionPlan.FREE ? '/auth?mode=signup' : '/pricing'}>
                      {buttonText}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
        <div className="text-center mt-8">
          <Button variant="ghost" asChild>
            <Link href="/pricing">
              View all plans and features <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-4 max-w-[600px] text-muted-foreground md:text-xl">
          Join thousands of businesses creating beautiful catalogues with CATFY.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild>
            <Link href="/auth?mode=signup">
              Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="font-semibold">Product</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/demo">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Company</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Support</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Legal</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 CATFY. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}