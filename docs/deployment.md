# Deployment Guide

This guide covers deploying Catfy to various platforms including Vercel, Railway, and self-hosted solutions.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Supabase account
- Stripe account
- Domain name (optional)

## Vercel Deployment (Recommended)

Vercel provides the easiest deployment experience for Next.js applications.

### 1. Prepare Your Repository

```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Environment Variables

Add these environment variables in Vercel dashboard:

```env
# Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.vercel.app

# PDF Generation
PLAYWRIGHT_HEADLESS=true
```

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

### 5. Post-Deployment Setup

```bash
# Run database migrations
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed
```

### 6. Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

## Railway Deployment

Railway provides an excellent alternative with built-in PostgreSQL.

### 1. Setup Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init
```

### 2. Add PostgreSQL

```bash
# Add PostgreSQL service
railway add postgresql

# Get database URL
railway variables
```

### 3. Configure Environment Variables

```bash
# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set NEXT_PUBLIC_APP_URL=https://your-app.railway.app
railway variables set NEXTAUTH_SECRET=your-production-secret
railway variables set PLAYWRIGHT_HEADLESS=true
```

### 4. Deploy

```bash
# Deploy to Railway
railway up
```

### 5. Run Migrations

```bash
# Connect to Railway and run migrations
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

## Self-Hosted Deployment

### Using Docker

1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Playwright
RUN npx playwright install --with-deps chromium

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

2. **Create docker-compose.yml**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/catfy
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - PLAYWRIGHT_HEADLESS=true
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=catfy
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

3. **Deploy**

```bash
# Build and start services
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

### Using PM2 (Node.js Process Manager)

1. **Install PM2**

```bash
npm install -g pm2
```

2. **Create ecosystem.config.js**

```javascript
module.exports = {
  apps: [{
    name: 'catfy',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/catfy',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: 'postgresql://username:password@localhost:5432/catfy',
      // Add other environment variables
    },
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

3. **Deploy**

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## Database Setup

### Supabase (Recommended)

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your database URL from Settings > Database
3. Use the connection string as your `DATABASE_URL`

### Self-hosted PostgreSQL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE catfy;
CREATE USER catfy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE catfy TO catfy_user;
\q
```

## SSL/HTTPS Setup

### Using Cloudflare

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable "Always Use HTTPS"
4. Configure SSL/TLS to "Full (strict)"

### Using Let's Encrypt (Self-hosted)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Application Monitoring

- **Vercel**: Built-in analytics and monitoring
- **Railway**: Built-in metrics dashboard
- **Self-hosted**: Use tools like New Relic, DataDog, or Sentry

### Database Monitoring

- **Supabase**: Built-in dashboard
- **Self-hosted**: Use pgAdmin, or monitoring tools

### Log Management

```bash
# PM2 logs
pm2 logs catfy

# Docker logs
docker-compose logs -f app

# System logs
sudo journalctl -u your-service -f
```

## Backup Strategy

### Database Backups

```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d database_name > backup.sql

# Automated backup script
#!/bin/bash
DATE=$(date +"%Y%m%d_%H%M%S")
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > "backup_$DATE.sql"

# Upload to cloud storage (optional)
aws s3 cp "backup_$DATE.sql" s3://your-backup-bucket/
```

### File Backups

```bash
# Backup uploaded files (if using local storage)
tar -czf files_backup_$(date +%Y%m%d).tar.gz public/uploads/
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+)
   - Verify environment variables
   - Clear npm cache: `npm cache clean --force`

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure database is accessible

3. **PDF Generation Issues**
   - Install Playwright browsers: `npx playwright install`
   - Check PLAYWRIGHT_HEADLESS setting
   - Verify memory limits

4. **File Upload Issues**
   - Check Supabase storage configuration
   - Verify file size limits
   - Check CORS settings

### Performance Optimization

1. **Enable Caching**
   ```javascript
   // next.config.js
   module.exports = {
     experimental: {
       serverComponentsExternalPackages: ['@prisma/client']
     },
     images: {
       domains: ['your-supabase-url.supabase.co']
     }
   }
   ```

2. **Database Optimization**
   - Add database indexes
   - Use connection pooling
   - Optimize queries

3. **CDN Setup**
   - Use Vercel's built-in CDN
   - Or configure Cloudflare

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure environment variables
- [ ] Enable CORS properly
- [ ] Use strong database passwords
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Backup data regularly
- [ ] Use rate limiting
- [ ] Validate all inputs
- [ ] Sanitize user data

## Support

For deployment issues:
- Check the [troubleshooting guide](../README.md#troubleshooting)
- Open an issue on GitHub
- Contact support at support@catfy.com