# API Documentation

This document provides comprehensive documentation for the Catfy API endpoints.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

Catfy uses Supabase authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "message": "Success message"
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Authentication Endpoints

### Sign Up

```http
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "accountType": "INDIVIDUAL" // or "BUSINESS"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

### Sign In

```http
POST /api/auth/signin
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Sign Out

```http
POST /api/auth/signout
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Profile Endpoints

### Get Profile

```http
GET /api/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "accountType": "INDIVIDUAL",
    "companyName": null,
    "phone": "+1234567890",
    "website": "https://example.com",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Profile

```http
PUT /api/profile
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "website": "https://example.com",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA"
}
```

## Catalogue Endpoints

### List Catalogues

```http
GET /api/catalogues
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `status` (optional): Filter by status (DRAFT, PUBLISHED)

**Response:**
```json
{
  "success": true,
  "data": {
    "catalogues": [
      {
        "id": "uuid",
        "title": "My Catalogue",
        "description": "Catalogue description",
        "status": "PUBLISHED",
        "theme": "modern",
        "coverImage": "https://example.com/image.jpg",
        "productCount": 25,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### Create Catalogue

```http
POST /api/catalogues
```

**Request Body:**
```json
{
  "title": "My New Catalogue",
  "description": "Catalogue description",
  "theme": "modern",
  "coverImage": "https://example.com/image.jpg",
  "settings": {
    "showPrices": true,
    "showCategories": true,
    "contactInfo": {
      "email": "contact@example.com",
      "phone": "+1234567890"
    }
  }
}
```

### Get Catalogue

```http
GET /api/catalogues/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Catalogue",
    "description": "Catalogue description",
    "status": "PUBLISHED",
    "theme": "modern",
    "coverImage": "https://example.com/image.jpg",
    "settings": {},
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "description": "Product description",
        "price": 99.99,
        "images": ["https://example.com/image.jpg"],
        "category": {
          "id": "uuid",
          "name": "Category Name"
        }
      }
    ],
    "categories": [
      {
        "id": "uuid",
        "name": "Category Name",
        "description": "Category description",
        "order": 1
      }
    ]
  }
}
```

### Update Catalogue

```http
PUT /api/catalogues/{id}
```

### Delete Catalogue

```http
DELETE /api/catalogues/{id}
```

### Publish Catalogue

```http
POST /api/catalogues/{id}/publish
```

## Product Endpoints

### List Products

```http
GET /api/catalogues/{catalogueId}/products
```

### Create Product

```http
POST /api/catalogues/{catalogueId}/products
```

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "sku": "PROD-001",
  "images": ["https://example.com/image.jpg"],
  "categoryId": "uuid",
  "specifications": {
    "weight": "1kg",
    "dimensions": "10x10x10cm"
  },
  "tags": ["electronics", "gadget"]
}
```

### Get Product

```http
GET /api/products/{id}
```

### Update Product

```http
PUT /api/products/{id}
```

### Delete Product

```http
DELETE /api/products/{id}
```

## Category Endpoints

### List Categories

```http
GET /api/catalogues/{catalogueId}/categories
```

### Create Category

```http
POST /api/catalogues/{catalogueId}/categories
```

**Request Body:**
```json
{
  "name": "Category Name",
  "description": "Category description",
  "order": 1
}
```

### Update Category

```http
PUT /api/categories/{id}
```

### Delete Category

```http
DELETE /api/categories/{id}
```

## File Upload Endpoints

### Upload Files

```http
POST /api/upload
```

**Request:** Multipart form data
- `files`: File(s) to upload
- `type`: Upload type ("catalogue", "product", "profile")
- `catalogueId` (optional): Catalogue ID for catalogue/product uploads
- `productId` (optional): Product ID for product uploads

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "uuid",
        "filename": "image.jpg",
        "originalName": "my-image.jpg",
        "url": "https://storage.supabase.co/object/public/uploads/image.jpg",
        "size": 1024000,
        "mimeType": "image/jpeg"
      }
    ]
  }
}
```

### Delete File

```http
DELETE /api/upload
```

**Request Body:**
```json
{
  "fileId": "uuid"
}
```

## PDF Export Endpoints

### Generate PDF

```http
POST /api/export/pdf
```

**Request Body:**
```json
{
  "catalogueId": "uuid",
  "options": {
    "format": "A4", // A4, A3, Letter
    "orientation": "portrait", // portrait, landscape
    "theme": "modern", // modern, classic, minimal
    "includeCategories": true,
    "includePrices": true,
    "includeDescriptions": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "status": "PROCESSING",
    "estimatedTime": 30 // seconds
  }
}
```

### Get Export Status

```http
GET /api/export/pdf/{exportId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "COMPLETED", // PENDING, PROCESSING, COMPLETED, FAILED
    "fileUrl": "https://storage.supabase.co/object/public/exports/catalogue.pdf",
    "fileName": "my-catalogue.pdf",
    "fileSize": 2048000,
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:01:00Z"
  }
}
```

### List Exports

```http
GET /api/export/pdf
```

## Coupon Endpoints

### Validate Coupon

```http
POST /api/coupons/validate
```

**Request Body:**
```json
{
  "code": "FIRST100",
  "subscriptionType": "BASIC", // BASIC, PRO, ENTERPRISE
  "billingCycle": "MONTHLY" // MONTHLY, YEARLY
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "coupon": {
      "id": "uuid",
      "code": "FIRST100",
      "type": "PERCENTAGE",
      "value": 20,
      "description": "20% off for new users"
    },
    "discount": {
      "amount": 1.99,
      "percentage": 20,
      "finalAmount": 7.99
    }
  }
}
```

### Use Coupon

```http
POST /api/coupons/use
```

**Request Body:**
```json
{
  "couponId": "uuid",
  "subscriptionId": "uuid"
}
```

### Get Coupon Usage History

```http
GET /api/coupons/use
```

## Subscription Endpoints

### Create Subscription

```http
POST /api/subscriptions/create
```

**Request Body:**
```json
{
  "priceId": "price_stripe_id",
  "couponId": "uuid" // optional
}
```

### Get Subscriptions

```http
GET /api/subscriptions
```

### Cancel Subscription

```http
POST /api/subscriptions/{id}/cancel
```

## Checkout Endpoints

### Create Checkout Session

```http
POST /api/checkout/session
```

**Request Body:**
```json
{
  "priceId": "price_stripe_id",
  "couponId": "uuid", // optional
  "successUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_stripe_session_id",
    "url": "https://checkout.stripe.com/pay/cs_..."
  }
}
```

## Analytics Endpoints

### Get Analytics

```http
GET /api/analytics
```

**Query Parameters:**
- `startDate`: Start date (ISO string)
- `endDate`: End date (ISO string)
- `catalogueId` (optional): Filter by catalogue
- `event` (optional): Filter by event type

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalViews": 1250,
      "totalExports": 45,
      "totalCatalogues": 12,
      "totalProducts": 156
    },
    "events": [
      {
        "event": "CATALOGUE_CREATED",
        "count": 5,
        "date": "2024-01-01"
      }
    ],
    "topCatalogues": [
      {
        "id": "uuid",
        "title": "My Catalogue",
        "views": 125,
        "exports": 12
      }
    ]
  }
}
```

## Webhook Endpoints

### Stripe Webhook

```http
POST /api/webhooks/stripe
```

Handles Stripe webhook events for subscription management.

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |
| `PAYMENT_REQUIRED` | Subscription required |
| `QUOTA_EXCEEDED` | Usage quota exceeded |

## Rate Limiting

API endpoints are rate limited:

- **Authentication**: 5 requests per minute
- **File Upload**: 10 requests per minute
- **PDF Export**: 3 requests per minute
- **General**: 100 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response:**
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Filtering and Sorting

**Query Parameters:**
- `search`: Search term
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`
- `filter[field]`: Filter by field value

**Example:**
```
GET /api/catalogues?search=electronics&sortBy=createdAt&sortOrder=desc&filter[status]=PUBLISHED
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Install: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get authenticated user
const { data: { user } } = await supabase.auth.getUser()

// Make API request
const response = await fetch('/api/catalogues', {
  headers: {
    'Authorization': `Bearer ${user?.access_token}`,
    'Content-Type': 'application/json'
  }
})

const data = await response.json()
```

### Python

```python
import requests

class CatfyAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_catalogues(self):
        response = requests.get(
            f'{self.base_url}/api/catalogues',
            headers=self.headers
        )
        return response.json()
    
    def create_catalogue(self, data):
        response = requests.post(
            f'{self.base_url}/api/catalogues',
            json=data,
            headers=self.headers
        )
        return response.json()

# Usage
api = CatfyAPI('https://your-domain.com', 'your-jwt-token')
catalogues = api.get_catalogues()
```

## Testing

Use the provided test data and endpoints:

```bash
# Seed test data
npm run db:seed

# Test API endpoints
curl -X GET "http://localhost:3000/api/catalogues" \
  -H "Authorization: Bearer your-jwt-token"
```

## Support

For API support:
- Check the [troubleshooting guide](../README.md#troubleshooting)
- Open an issue on GitHub
- Contact API support at api-support@catfy.com