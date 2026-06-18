# ShopEZ - Full System Documentation

## Executive Summary

**Project**: ShopEZ - B2C E-Commerce Marketplace  
**Version**: 1.0.0  
**Status**: Development Phase  
**Last Updated**: 2026-06-18  

ShopEZ is a production-ready, fully isolated B2C e-commerce marketplace built with the MERN stack (MongoDB, Express.js, React.js, Node.js). The platform features separate portals for Customers, Sellers, and Administrators with enterprise-grade security, real-time notifications, and multiple payment gateway integration.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [API Documentation](#api-documentation)
6. [Frontend Components](#frontend-components)
7. [Deployment](#deployment)
8. [Security](#security)
9. [Performance](#performance)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Key Features

#### Customer Portal
- Browse and search products with advanced filters
- Product variant selection (size, color, specifications)
- Shopping cart management with real-time updates
- Secure checkout with multiple payment options (Stripe, Razorpay)
- Order tracking with real-time status updates
- Product reviews and ratings
- Wishlist management
- User profile and order history
- Email notifications for order updates
- Real-time WebSocket notifications

#### Seller Portal
- Seller registration and approval workflow
- Product management with variant support
- Inventory tracking with stock warnings
- Order management and fulfillment
- Sales analytics and revenue metrics
- Customer review management
- Store customization and branding
- Real-time sales notifications

#### Admin Portal
- User account management and moderation
- Seller application review and approval
- Product moderation and flagging
- Global order management
- Platform analytics and reporting
- Commission rate management
- Payment gateway configuration
- System health monitoring
- Dispute resolution tools

### Core Capabilities

| Feature | Status | Details |
|---------|--------|---------|
| User Authentication | ✅ Complete | JWT with RTR, email verification |
| Product Catalog | ✅ Complete | Full-text search, variants, inventory |
| Shopping Cart | ✅ Complete | Real-time sync, inventory locking |
| Checkout Process | ✅ Complete | Multiple payment methods, webhooks |
| Order Management | ✅ Complete | Status tracking, refunds, history |
| Reviews & Ratings | ✅ Complete | Verified buyer reviews, average ratings |
| Real-time Notifications | ✅ Complete | WebSocket via Socket.io |
| Email Notifications | ✅ Complete | Transactional emails via Nodemailer |
| Admin Dashboard | ✅ Complete | Analytics, user management, moderation |
| Seller Dashboard | ✅ Complete | Inventory, orders, analytics |

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND LAYER (React.js)                      │
│  Customer Portal │ Seller Portal │ Admin Portal │ Common Layout  │
└─────────────────────────────────────────────────────────────────┘
                 ↓ HTTPS + WebSocket ↑
┌─────────────────────────────────────────────────────────────────┐
│                  API LAYER (Express.js)                          │
│  Routes → Controllers → Services → Models → Mongoose             │
│  Middleware: Auth, Validation, Error Handling, Logging           │
└─────────────────────────────────────────────────────────────────┘
                 ↓ MongoDB Connection ↑
┌─────────────────────────────────────────────────────────────────┐
│                DATABASE LAYER (MongoDB)                          │
│  Collections: users, products, orders, reviews, notifications    │
│  Indexes: Text search, compound, TTL                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓↑
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES LAYER                             │
│  Stripe │ Razorpay │ Cloudinary │ Nodemailer │ Socket.io        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### User Registration Flow
```
User Input → Validation → Hash Password → Create User Record 
→ Send Verification Email → Store in DB → Response
```

#### Product Search Flow
```
Search Query → Validate Input → Full-text Search (MongoDB) 
→ Apply Filters → Pagination → Return Results → Cache (React Query)
```

#### Order Processing Flow
```
Checkout → Validate Inventory → Lock Stock → Create Order Record 
→ Process Payment → Confirm with Payment Gateway → Send Email 
→ Notify Seller (WebSocket) → Clear Cart
```

#### Real-time Notification Flow
```
Event (Order Update) → Server Process → Emit via Socket.io 
→ Client Receive → Redux Update → UI Re-render → Display Notification
```

---

## Technology Stack

### Backend Technologies

#### Runtime & Framework
- **Node.js** v18+ - JavaScript runtime
- **Express.js** v4.19.2 - Web framework
- **Mongoose** v8.4.1 - MongoDB ODM

#### Database
- **MongoDB Atlas** - Cloud database
- **Mongoose Schemas** - Data validation
- **Aggregation Pipeline** - Complex queries

#### Authentication & Security
- **JWT** (jsonwebtoken) - Token-based auth
- **bcryptjs** - Password hashing
- **Helmet.js** - Security headers
- **express-validator** - Input validation
- **express-rate-limit** - Rate limiting
- **dotenv** - Environment variables

#### Real-time Communication
- **Socket.io** - WebSocket communication
- **Socket.io Namespaces** - Namespace isolation

#### Payment Processing
- **Stripe** - Primary payment processor
- **Razorpay** - Alternative processor (India)
- **Webhook Verification** - Secure callbacks

#### File & Image Management
- **Cloudinary** - Image hosting and CDN
- **Multer** - File upload handling (Phase 2)

#### Email Service
- **Nodemailer** - Email delivery
- **HTML Templates** - Email formatting

#### Logging & Monitoring
- **Winston** - Structured logging
- **Morgan** - HTTP request logging
- **Sentry** - Error tracking (Phase 2)

#### Testing
- **Jest** - Unit testing framework
- **Supertest** - HTTP assertion
- **mongodb-memory-server** - In-memory DB testing

### Frontend Technologies

#### Framework & Build
- **React** v18.3.1 - UI framework
- **Vite** v5.2.11 - Build tool
- **React Router** v6.23.1 - Routing

#### State Management
- **Redux Toolkit** v2.2.5 - Global state
- **React Query** v5.45.0 - Server state caching
- **Axios** v1.7.2 - HTTP client

#### Styling & UI
- **Tailwind CSS** v3.4.4 - Utility CSS
- **Framer Motion** v11.2.10 - Animations
- **Lucide React** v0.395.0 - Icons
- **PostCSS** - CSS processing

#### Real-time Communication
- **Socket.io-client** v4.7.5 - WebSocket client

#### Development & Testing
- **ESLint** - Code quality
- **Prettier** - Code formatting (Phase 2)
- **Jest** - Component testing
- **React Testing Library** - UI testing

---

## Database Design

### Collections Overview

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  role: String (customer/seller/admin),
  profile: {
    avatar: String (Cloudinary URL),
    address: { street, city, state, postalCode, country },
    phone: String
  },
  seller: { // Only for sellers
    storeName: String,
    storeDescription: String,
    verified: Boolean,
    rating: Decimal,
    totalSales: Number,
    bankDetails: { accountNumber, routingNumber } // Encrypted
  },
  isActive: Boolean,
  isBanned: Boolean,
  refreshTokens: [String], // Token blacklist
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection
```javascript
{
  _id: ObjectId,
  name: String (indexed, text search),
  slug: String (indexed),
  description: String,
  category: ObjectId (ref: Category),
  seller: ObjectId (ref: User),
  basePrice: Decimal,
  images: [{ url: String, alt: String }],
  variants: [{
    name: String,
    options: [String],
    priceModifier: Decimal
  }],
  inventory: [{
    variantId: ObjectId,
    quantity: Number,
    reserved: Number
  }],
  averageRating: Decimal,
  totalReviews: Number,
  status: String (active/inactive/flagged),
  createdAt: Date,
  updatedAt: Date
}
```

#### Orders Collection
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique, indexed),
  customer: ObjectId (ref: User),
  items: [{
    product: ObjectId,
    variant: { name, option },
    quantity: Number,
    pricePerUnit: Decimal
  }],
  total: Decimal,
  status: String (pending/confirmed/shipped/delivered),
  statusHistory: [{ status, timestamp, note }],
  payment: {
    method: String (stripe/razorpay),
    transactionId: String (indexed),
    status: String,
    paidAt: Date
  },
  shippingAddress: { name, street, city, state, postalCode },
  trackingNumber: String,
  estimatedDelivery: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Reviews Collection
```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: Product, indexed),
  customer: ObjectId (ref: User),
  order: ObjectId (ref: Order),
  rating: Number (1-5),
  title: String,
  content: String,
  verified: Boolean (purchased product),
  helpful: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- Text index on `products.name` and `products.description`
- Compound index on `products` (category, seller, status)
- Unique index on `users.email` and `products.slug`
- Index on `orders.orderNumber` and `orders.customer`
- Index on `reviews.product` and `reviews.customer`

---

## API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.shopez.com/api
```

### Authentication Endpoints

#### Register
```
POST /auth/register
Content-Type: application/json

Request:
{
  email: "user@example.com",
  password: "SecurePass123!",
  name: "John Doe",
  role: "customer"
}

Response (201):
{
  success: true,
  message: "Registration successful. Check your email.",
  user: {
    id: "userId",
    email: "user@example.com",
    role: "customer"
  }
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  email: "user@example.com",
  password: "SecurePass123!"
}

Response (200):
{
  success: true,
  accessToken: "jwt_token",
  user: {
    id: "userId",
    email: "user@example.com",
    role: "customer",
    name: "John Doe"
  }
}

Headers Set:
- Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict
- Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
```

#### Refresh Token
```
POST /auth/refresh
Headers:
- Cookie: refreshToken=...

Response (200):
{
  accessToken: "new_jwt_token",
  refreshToken: "new_refresh_token"
}
```

#### Logout
```
POST /auth/logout
Headers:
- Authorization: Bearer {accessToken}

Response (200):
{
  success: true,
  message: "Logged out successfully"
}
```

### Product Endpoints

#### List Products
```
GET /products
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20, max: 100)
- search: string
- category: string (ObjectId)
- minPrice: number
- maxPrice: number
- rating: number (min rating)
- sort: string (price_asc, price_desc, newest, popular)

Response (200):
{
  success: true,
  data: [
    {
      _id: "productId",
      name: "Product Name",
      price: 99.99,
      image: "url",
      averageRating: 4.5,
      totalReviews: 120
    }
  ],
  pagination: {
    total: 500,
    page: 1,
    limit: 20
  }
}
```

#### Get Product Details
```
GET /products/:id

Response (200):
{
  success: true,
  data: {
    _id: "productId",
    name: "Product Name",
    description: "...",
    price: 99.99,
    images: [...],
    variants: [...],
    inventory: [...],
    reviews: [...],
    seller: { _id, storeName, rating }
  }
}
```

### Order Endpoints

#### Create Order (Checkout)
```
POST /orders/checkout
Headers:
- Authorization: Bearer {accessToken}

Request:
{
  items: [
    {
      productId: "productId",
      variantId: "variantId",
      quantity: 2
    }
  ],
  shippingAddress: {
    name: "John Doe",
    street: "123 Main St",
    city: "City",
    state: "State",
    postalCode: "12345",
    country: "Country"
  },
  paymentMethod: "stripe"
}

Response (200):
{
  success: true,
  clientSecret: "pi_1234567890",
  order: { _id, orderNumber, total }
}
```

#### Get Orders
```
GET /orders
Headers:
- Authorization: Bearer {accessToken}

Query Parameters:
- page: number
- limit: number
- status: string

Response (200):
{
  success: true,
  data: [
    {
      _id: "orderId",
      orderNumber: "ORD-123456",
      status: "shipped",
      total: 299.97,
      createdAt: "2026-06-18T..."
    }
  ]
}
```

#### Get Order Details
```
GET /orders/:id
Headers:
- Authorization: Bearer {accessToken}

Response (200):
{
  success: true,
  data: {
    _id: "orderId",
    orderNumber: "ORD-123456",
    customer: {...},
    items: [...],
    status: "shipped",
    payment: {...},
    shippingAddress: {...},
    trackingNumber: "TRK123456",
    estimatedDelivery: "2026-06-25T...",
    total: 299.97
  }
}
```

### Review Endpoints

#### Create Review
```
POST /reviews
Headers:
- Authorization: Bearer {accessToken}

Request:
{
  productId: "productId",
  orderId: "orderId",
  rating: 5,
  title: "Great product!",
  content: "Excellent quality and fast shipping."
}

Response (201):
{
  success: true,
  data: {
    _id: "reviewId",
    rating: 5,
    title: "Great product!",
    content: "...",
    verified: true,
    createdAt: "2026-06-18T..."
  }
}
```

#### Get Reviews
```
GET /reviews?productId=productId&page=1&limit=10

Response (200):
{
  success: true,
  data: [
    {
      _id: "reviewId",
      rating: 5,
      title: "Great product!",
      content: "...",
      customer: { name: "John Doe" },
      helpful: 25,
      createdAt: "2026-06-18T..."
    }
  ]
}
```

---

## Frontend Components

### Page Structure

#### Customer Portal
- **HomePage**: Featured products, promotions, categories
- **ProductsPage**: Product listing with filters and pagination
- **ProductDetailPage**: Full product information with reviews
- **CartPage**: Shopping cart with item management
- **CheckoutPage**: Address, shipping, and payment information
- **OrdersPage**: Order history and tracking
- **WishlistPage**: Saved items for later
- **ProfilePage**: User account and preferences

#### Seller Portal
- **DashboardPage**: Sales metrics and overview
- **ProductsPage**: Inventory management
- **OrdersPage**: Order fulfillment management
- **AnalyticsPage**: Sales and revenue charts
- **SettingsPage**: Store configuration

#### Admin Portal
- **DashboardPage**: Platform overview and metrics
- **UsersPage**: User account management
- **SellersPage**: Seller approval and management
- **OrdersPage**: Global order management
- **ProductsPage**: Product moderation
- **AnalyticsPage**: Platform analytics

### Key Components

#### Reusable Components
- `ProductCard`: Product display with image and price
- `ReviewSection`: Product reviews display
- `RatingComponent`: Star rating display
- `NotificationBanner`: Toast notifications
- `LoadingSpinner`: Loading indicator
- `CartSummary`: Order total calculation
- `Header`: Navigation and search
- `Footer`: Links and information

---

## Deployment

### Development Environment
```bash
# Backend
npm run dev  # Starts on port 5000

# Frontend
npm run dev  # Starts on port 5173
```

### Production Deployment

#### Backend Deployment
- **Platform**: Heroku, Render, or AWS EC2
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **Environment**: .env with production variables
- **Database**: MongoDB Atlas
- **Monitoring**: Winston logs, Sentry (Phase 2)

#### Frontend Deployment
- **Build**: `npm run build` → optimized static files
- **Hosting**: Vercel, Netlify, or AWS S3 + CloudFront
- **CDN**: Cloudinary for images
- **SSL**: Let's Encrypt HTTPS

#### Database Setup
```javascript
// MongoDB Atlas
- Cluster: Production (3-node replica set)
- Connection: Managed Cloud
- Backup: Daily automated
- Monitoring: MongoDB Cloud Monitoring
```

---

## Security

### Authentication Security
- JWT with 15-minute expiration
- Refresh Token Rotation (RTR)
- HttpOnly, Secure, SameSite cookies
- Password hashing with bcrypt (12 salt rounds)
- Email verification for new accounts

### API Security
- HTTPS enforcement
- CORS configured
- Rate limiting (5-100 requests/minute)
- Input validation and sanitization
- CSRF protection via SameSite cookies
- Security headers (Helmet.js)
- Request signature verification (payments)

### Data Security
- Sensitive fields encrypted in database
- Passwords never logged
- PCI DSS compliance via Stripe/Razorpay
- GDPR-compliant data deletion
- Audit logging for admin actions
- Secure file uploads (Cloudinary)

### Payment Security
- No card data stored (PCI DSS)
- Webhook signature verification
- Idempotency keys for payment requests
- Failed payment handling
- Refund verification

---

## Performance

### Optimization Strategies

#### Frontend Performance
- Code splitting by route
- Lazy loading components
- Image optimization (Cloudinary)
- Virtual scrolling for lists
- React Query caching
- Memoization of expensive components

#### Backend Performance
- Database indexing (text, compound)
- Query optimization and pagination
- Response compression (gzip)
- Connection pooling
- Async processing for heavy operations

#### Monitoring Targets
- Page load time: < 2 seconds
- API response: < 200ms (95th percentile)
- Search response: < 500ms
- WebSocket latency: < 100ms
- Lighthouse score: > 90

---

## Troubleshooting

### Common Issues

#### Authentication Issues
- **Problem**: "Invalid token" error
  - **Solution**: Check token expiration, refresh token
  - **Verify**: Token payload in JWT.io

#### Database Connection Issues
- **Problem**: "MongoDB connection failed"
  - **Solution**: Check MONGODB_URI in .env
  - **Verify**: Connection string format and IP whitelist

#### Payment Processing Issues
- **Problem**: Stripe webhook not triggering
  - **Solution**: Check webhook signing secret
  - **Verify**: Stripe dashboard webhook logs

#### Real-time Notification Issues
- **Problem**: Socket.io connection dropping
  - **Solution**: Check CORS configuration
  - **Verify**: Socket.io version compatibility

---

## Support & Maintenance

### Regular Maintenance Tasks
- [ ] Database backups (daily)
- [ ] Log rotation (weekly)
- [ ] Security updates (as released)
- [ ] Performance monitoring (daily)
- [ ] Error tracking review (weekly)
- [ ] User feedback analysis (bi-weekly)

### Escalation Procedure
1. **Level 1**: Application errors - Check logs
2. **Level 2**: Database issues - Check connection
3. **Level 3**: Infrastructure - Contact cloud provider
4. **Level 4**: Third-party - Contact service provider

---

## Additional Resources

### Documentation Files
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Project vision and scope
- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Timeline and milestones
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) - Architecture details
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Implementation guide
- [FUNCTIONAL_REQUIREMENTS.md](./FUNCTIONAL_REQUIREMENTS.md) - Feature specifications
- [TECHNICAL_STACK.md](./TECHNICAL_STACK.md) - Technology selection

### Quick Links
- **GitHub**: [Repository URL]
- **API Docs**: Postman collection included
- **Database**: MongoDB Atlas Dashboard
- **Hosting**: Vercel/Heroku Dashboard
- **Monitoring**: Sentry/DataDog

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-06-18  
**Status**: ✅ Complete and Approved  
**Maintained By**: Development Team  
**Next Review**: 2026-07-18
