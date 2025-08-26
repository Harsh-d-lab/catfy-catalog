# Catfy - Digital Catalogue Platform

A modern, full-stack digital catalogue platform built with Next.js, TypeScript, and Supabase. Create, manage, and share beautiful product catalogues with PDF export capabilities.

## Features

### Core Features
- 🏪 **Multi-tenant Catalogue Management** - Create and manage multiple product catalogues
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Customizable Themes** - Multiple pre-built themes with customization options
- 📄 **PDF Export** - Generate high-quality PDF catalogues using Playwright
- 🖼️ **Image Management** - Upload, resize, and optimize product images
- 🏷️ **Coupon System** - Create and manage discount coupons with advanced validation
- 💳 **Stripe Integration** - Secure payment processing for subscriptions
- 📊 **Analytics** - Track catalogue views, exports, and user engagement

### Technical Features
- ⚡ **Server-Side Rendering** - Fast page loads with Next.js 14
- 🔐 **Authentication** - Secure auth with Supabase
- 🗄️ **Database** - PostgreSQL with Prisma ORM
- 🎯 **Type Safety** - Full TypeScript coverage
- 🧪 **Testing** - Unit and integration tests with Vitest
- 🚀 **CI/CD** - Automated testing and deployment with GitHub Actions

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **PDF Generation**: Playwright
- **Testing**: Vitest, React Testing Library
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- Stripe account (for payments)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/catfy.git
   cd catfy
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/catfy?schema=public"
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   
   # Stripe
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   
   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed the database
   npm run db:seed
   ```

5. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
catfy/
├── src/
│   ├── app/                 # Next.js 14 app directory
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # Dashboard pages
│   │   ├── catalogue/       # Catalogue management
│   │   └── preview/         # PDF preview pages
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   └── forms/           # Form components
│   ├── lib/                 # Utility functions
│   └── types/               # TypeScript type definitions
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
├── tests/                   # Test files
└── docs/                    # Documentation
```

## API Documentation

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Catalogues
- `GET /api/catalogues` - List user catalogues
- `POST /api/catalogues` - Create new catalogue
- `GET /api/catalogues/[id]` - Get catalogue details
- `PUT /api/catalogues/[id]` - Update catalogue
- `DELETE /api/catalogues/[id]` - Delete catalogue

### Products
- `GET /api/catalogues/[id]/products` - List catalogue products
- `POST /api/catalogues/[id]/products` - Add product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### File Upload
- `POST /api/upload` - Upload images
- `DELETE /api/upload` - Delete uploaded files

### PDF Export
- `POST /api/export/pdf` - Generate PDF catalogue
- `GET /api/export/pdf` - Get export history

### Coupons
- `POST /api/coupons/validate` - Validate coupon
- `POST /api/coupons/use` - Use coupon

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database
```

### Testing

Run the test suite:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Database Management

View your data with Prisma Studio:
```bash
npm run db:studio
```

Reset the database:
```bash
npm run db:reset
```

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up production database**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret | Yes |
| `PLAYWRIGHT_HEADLESS` | Run Playwright in headless mode | No |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@catfy.com or join our [Discord community](https://discord.gg/catfy).