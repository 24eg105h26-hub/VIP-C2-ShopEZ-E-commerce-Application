# ShopEZ - System Design & Architecture

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  React.js (Vite)  │  Redux Toolkit  │  React Query  │ Tailwind  │
│  - Customer Portal (E-commerce)                                 │
│  - Seller Dashboard (Inventory Management)                      │
│  - Admin Panel (System Management)                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                    HTTPS + WebSocket (Socket.io)
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                       API LAYER (Express.js)                    │
├─────────────────────────────────────────────────────────────────┤
│  Routes Layer (API Endpoints)                                   │
│  ├── /api/auth (Authentication)                                │
│  ├── /api/products (Product Management)                        │
│  ├── /api/cart (Shopping Cart)                                │
│  ├── /api/orders (Order Management)                            │
│  ├── /api/sellers (Seller Management)                          │
│  ├── /api/reviews (Reviews & Ratings)                          │
│  ├── /api/wishlist (Wishlist Management)                       │
│  ├── /api/admin (Admin Functions)                              │
│  └── /api/notifications (Notifications)                        │
│                                                                 │
│  Middleware Layer                                               │
│  ├── Authentication (JWT Verification)                         │
│  ├── Authorization (Role-Based Access Control)                 │
│  ├── Validation (Input Sanitization)                           │
│  ├── Error Handling (Centralized)                              │
│  ├── Logging (Winston)                                         │
│  └── Rate Limiting (Express Rate Limit)                        │
│                                                                 │
│  Service Layer (Business Logic)                                │
│  ├── Auth Service (JWT, Password Hashing)                      │
│  ├── Product Service (Search, Filtering)                       │
│  ├── Order Service (Payment, Inventory)                        │
│  ├── Notification Service (Email, WebSocket)                   │
│  ├── Payment Service (Stripe, Razorpay)                        │
│  └── Email Service (Nodemailer)                                │
│                                                                 │
│  Data Access Layer                                              │
│  └── Mongoose Models (Database Queries)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                    MongoDB Connection Pool
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PERSISTENCE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Atlas (Cloud Database)                                 │
│  ├── Collections:                                               │
│  │   ├── users (Customers, Sellers, Admins)                    │
│  │   ├── products (Product Catalog)                            │
│  │   ├── variants (Product Variants)                           │
│  │   ├── categories (Product Categories)                       │
│  │   ├── orders (Order Records)                                │
│  │   ├── carts (Shopping Carts)                                │
│  │   ├── reviews (Product Reviews)                             │
│  │   ├── wishlists (Wishlist Items)                            │
│  │   ├── notifications (User Notifications)                    │
│  │   ├── coupons (Promotional Coupons)                         │
│  │   └── transactions (Payment Records)                        │
│  └── Indexes:                                                   │
│      ├── Text Search (Products)                                │
│      ├── Compound Indexes (Category + Seller)                  │
│      └── TTL Indexes (Sessions, Tokens)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Payment Gateway │  │ Cloud Storage   │  │  Email Service  │ │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤ │
│  │ - Stripe        │  │ - Cloudinary    │  │ - Nodemailer    │ │
│  │ - Razorpay      │  │   (Images)      │  │ - Gmail/Outlook │ │
│  │ - Webhooks      │  │   (CDN)         │  │ - Templates     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌──────────────────────────┐    ┌──────────────────────────┐  │
│  │  Real-time Communication │    │ Monitoring & Analytics   │  │
│  ├──────────────────────────┤    ├──────────────────────────┤  │
│  │ - Socket.io              │    │ - Winston Logger         │  │
│  │ - Namespace Isolation    │    │ - Error Tracking (Sentry)│  │
│  │ - Event-driven Updates   │    │ - Performance APM        │  │
│  └──────────────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### Frontend Components

#### Customer Portal Structure
```
App.jsx (Main Component)
├── Layout Components
│   ├── Header (Navigation, Search, Cart Icon)
│   ├── Sidebar (Categories, Filters)
│   └── Footer (Links, Info)
├── Auth Pages
│   ├── LoginPage
│   ├── SignupPage
│   ├── VerifyEmailPage
│   └── ForgotPasswordPage
├── Product Pages
│   ├── HomePage (Featured Products)
│   ├── ProductListPage (with Filters)
│   ├── ProductDetailPage (Images, Variants, Reviews)
│   └── SearchResultsPage
├── Shopping Pages
│   ├── CartPage (Cart Items, Summary)
│   ├── CheckoutPage (Shipping, Payment)
│   ├── OrderConfirmationPage
│   └── OrderTrackingPage
├── User Pages
│   ├── ProfilePage (User Info)
│   ├── OrderHistoryPage
│   ├── WishlistPage
│   └── ReviewsPage
└── Common Components
    ├── ProductCard (Reusable)
    ├── ReviewSection (Reusable)
    ├── NotificationBanner
    └── LoadingSkeletons
```

#### Seller Portal Structure
```
SellerApp.jsx
├── Dashboard (Overview, Analytics)
├── Products Management
│   ├── ProductList (with Filters)
│   ├── AddProduct Form
│   ├── EditProduct Form
│   └── ProductVariants Management
├── Inventory Management
│   ├── InventoryList
│   ├── StockAdjustment
│   └── Low Stock Alerts
├── Orders Management
│   ├── OrdersList (Filterable)
│   ├── OrderDetails (Status, Items)
│   └── OrderActions (Ship, Cancel)
├── Analytics
│   ├── SalesChart
│   ├── RevenueMetrics
│   ├── TopProducts
│   └── CustomerReviews
└── Settings
    ├── Store Profile
    ├── Bank Details
    └── Notifications Preferences
```

#### Admin Portal Structure
```
AdminApp.jsx
├── Dashboard (System Overview)
├── Users Management
│   ├── UsersList (Search, Filter)
│   ├── UserDetails
│   ├── BanUser Action
│   └── UserActivity Logs
├── Sellers Management
│   ├── PendingApplications
│   ├── ApprovedSellers
│   ├── SellerDetails
│   └── DisputeResolution
├── Orders Management
│   ├── AllOrders (Global View)
│   ├── OrderDetails
│   └── Refund Management
├── Products Management
│   ├── AllProducts (Moderation)
│   ├── FlaggedProducts
│   └── CategoryManagement
├── Analytics & Reports
│   ├── SalesAnalytics
│   ├── UserMetrics
│   ├── PaymentAnalytics
│   └── ReportGeneration
└── System Settings
    ├── Commission Management
    ├── Payment Gateway Config
    ├── Email Templates
    └── Security Settings
```

---

## 3. Database Schema Design

### Collection: users
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  name: String,
  role: String (enum: ['customer', 'seller', 'admin']),
  phone: String,
  avatar: String (Cloudinary URL),
  verified: Boolean,
  emailVerificationToken: String (expires),
  
  // Profile Info
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String (enum: ['M', 'F', 'Other']),
    bio: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  
  // Seller Specific
  seller: {
    storeName: String,
    storeDescription: String,
    storeImage: String,
    verified: Boolean,
    approvalDate: Date,
    commissionRate: Number,
    bankDetails: {
      accountHolder: String,
      accountNumber: String (encrypted),
      routingNumber: String (encrypted)
    },
    totalSales: Number,
    totalRevenue: Decimal,
    rating: Decimal,
    reviewCount: Number
  },
  
  // Account Status
  isActive: Boolean,
  isBanned: Boolean,
  banReason: String,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  
  // Security
  refreshTokens: [String],
  ipWhitelist: [String],
  
  timestamps: {
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date (soft delete)
  }
}
```

### Collection: products
```javascript
{
  _id: ObjectId,
  
  // Basic Info
  name: String (indexed, text search),
  slug: String (indexed, unique),
  description: String (text search),
  
  // Classification
  category: ObjectId (ref: 'Category'),
  subCategory: ObjectId (ref: 'Category'),
  tags: [String] (indexed),
  
  // Seller Info
  seller: ObjectId (ref: 'User'),
  
  // Media
  images: [{
    url: String (Cloudinary),
    alt: String,
    position: Number
  }],
  
  // Pricing
  basePrice: Decimal,
  maxPrice: Decimal,
  minPrice: Decimal,
  
  // Variants
  variants: [{
    _id: ObjectId,
    name: String (e.g., 'Size'),
    options: [String] (e.g., ['S', 'M', 'L']),
    priceModifier: Decimal,
    sku: String (unique across variants)
  }],
  
  // Inventory
  inventory: [{
    variantId: ObjectId,
    quantity: Number,
    reserved: Number (during checkout),
    sku: String,
    barcode: String
  }],
  
  // Ratings & Reviews
  averageRating: Decimal (0-5),
  totalReviews: Number,
  ratingBreakdown: {
    five: Number,
    four: Number,
    three: Number,
    two: Number,
    one: Number
  },
  
  // Product Status
  status: String (enum: ['active', 'inactive', 'flagged']),
  publishedAt: Date,
  
  // Metadata
  specifications: [{
    key: String,
    value: String
  }],
  returnPolicy: String,
  warranty: String,
  
  timestamps: {
    createdAt: Date,
    updatedAt: Date
  },
  
  // Indexes
  // - text index on name, description
  // - compound index on (category, seller, status)
  // - index on slug
}
```

### Collection: orders
```javascript
{
  _id: ObjectId,
  
  // Order Identification
  orderNumber: String (unique, indexed),
  customer: ObjectId (ref: 'User', indexed),
  
  // Items
  items: [{
    product: ObjectId (ref: 'Product'),
    seller: ObjectId (ref: 'User'),
    variant: {
      name: String,
      option: String
    },
    quantity: Number,
    pricePerUnit: Decimal,
    subtotal: Decimal
  }],
  
  // Pricing
  subtotal: Decimal,
  tax: Decimal,
  shipping: Decimal,
  discount: {
    couponCode: String,
    amount: Decimal
  },
  total: Decimal,
  
  // Shipping
  shippingAddress: {
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  shippingMethod: String (enum: ['standard', 'express', 'overnight']),
  trackingNumber: String,
  estimatedDelivery: Date,
  
  // Order Status
  status: String (enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String
  }],
  
  // Payment
  payment: {
    method: String (enum: ['stripe', 'razorpay', 'wallet']),
    transactionId: String (indexed),
    amount: Decimal,
    status: String (enum: ['pending', 'completed', 'failed', 'refunded']),
    paidAt: Date,
    refundAmount: Decimal,
    refundStatus: String,
    refundDate: Date
  },
  
  // Notes
  customerNotes: String,
  internalNotes: String,
  
  timestamps: {
    createdAt: Date,
    updatedAt: Date
  }
}
```

### Collection: reviews
```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: 'Product', indexed),
  customer: ObjectId (ref: 'User', indexed),
  order: ObjectId (ref: 'Order'),
  
  rating: Number (enum: [1, 2, 3, 4, 5], indexed),
  title: String,
  content: String,
  
  // Engagement
  helpful: Number,
  unhelpful: Number,
  verified: Boolean (purchased product),
  
  timestamps: {
    createdAt: Date,
    updatedAt: Date
  }
}
```

---

## 4. API Design

### Authentication Endpoints

#### POST /api/auth/register
```
Request Body:
{
  email: "user@example.com",
  password: "securePassword123",
  name: "John Doe",
  role: "customer" // or "seller"
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

#### POST /api/auth/login
```
Request Body:
{
  email: "user@example.com",
  password: "securePassword123"
}

Response (200):
{
  success: true,
  accessToken: "jwt_token",
  refreshToken: "refresh_token",
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

#### POST /api/auth/refresh
```
Request Header:
- Cookie: refreshToken=...

Response (200):
{
  accessToken: "new_jwt_token",
  refreshToken: "new_refresh_token"
}
```

#### POST /api/auth/logout
```
Response (200):
{
  success: true,
  message: "Logged out successfully"
}
```

### Product Endpoints

#### GET /api/products
```
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
      totalReviews: 120,
      seller: { _id: "sellerId", storeName: "Store" }
    }
  ],
  pagination: {
    total: 500,
    page: 1,
    limit: 20,
    pages: 25
  }
}
```

#### GET /api/products/:id
```
Response (200):
{
  success: true,
  data: {
    _id: "productId",
    name: "Product Name",
    description: "...",
    category: { _id: "catId", name: "Category" },
    seller: { _id: "sellerId", storeName: "Store", rating: 4.8 },
    price: 99.99,
    images: [{ url: "...", alt: "..." }],
    variants: [
      {
        name: "Size",
        options: ["S", "M", "L", "XL"],
        priceModifier: 0
      }
    ],
    inventory: [
      {
        variantId: "varId",
        sku: "SKU123",
        quantity: 50,
        available: 45
      }
    ],
    averageRating: 4.5,
    reviews: [
      {
        _id: "reviewId",
        rating: 5,
        title: "Great product!",
        content: "...",
        customer: { name: "John Doe" },
        createdAt: "2026-06-18T..."
      }
    ]
  }
}
```

### Order Endpoints

#### POST /api/orders/checkout
```
Request Body:
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
    phone: "+1234567890",
    street: "123 Main St",
    city: "City",
    state: "State",
    postalCode: "12345",
    country: "Country"
  },
  shippingMethod: "standard",
  paymentMethod: "stripe"
}

Response (200):
{
  success: true,
  clientSecret: "pi_1234567890", // For Stripe
  order: {
    _id: "orderId",
    orderNumber: "ORD-123456",
    total: 299.97,
    items: [...]
  }
}
```

#### GET /api/orders
```
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
      createdAt: "2026-06-18T...",
      estimatedDelivery: "2026-06-25T..."
    }
  ]
}
```

#### GET /api/orders/:id
```
Response (200):
{
  success: true,
  data: {
    _id: "orderId",
    orderNumber: "ORD-123456",
    customer: {...},
    items: [...],
    status: "shipped",
    statusHistory: [...],
    shippingAddress: {...},
    trackingNumber: "TRK123456",
    estimatedDelivery: "2026-06-25T...",
    payment: {...},
    total: 299.97
  }
}
```

---

## 5. Security Architecture

### Authentication Flow
```
1. User submits credentials
   ↓
2. Express validates input
   ↓
3. Query user from DB
   ↓
4. bcryptjs compares passwords
   ↓
5. JWT creates tokens (15 min + 7 days)
   ↓
6. Tokens stored in HttpOnly cookies
   ↓
7. Response with user data
```

### Authorization Flow
```
1. Request with access token (cookie)
   ↓
2. Middleware extracts token
   ↓
3. JWT verifies signature
   ↓
4. Extract user ID and role
   ↓
5. Check role-based permissions
   ↓
6. Allow or deny request
```

### Refresh Token Rotation
```
1. Client sends refresh token
   ↓
2. Verify refresh token exists in DB
   ↓
3. Check if token matches stored hash
   ↓
4. Generate new token pair
   ↓
5. Invalidate old refresh token
   ↓
6. Store new refresh token
   ↓
7. Return new tokens
```

### Rate Limiting
```
- Auth endpoints: 5 requests/minute per IP
- API endpoints: 100 requests/minute per user
- Search: 50 requests/minute per IP
- Uploads: 10 requests/minute per user
```

---

## 6. Error Handling Strategy

### Centralized Error Handler
```javascript
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(err);
  
  // Determine error type
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // Send consistent error response
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};
```

### Error Types
- **400**: Bad Request (validation error)
- **401**: Unauthorized (auth required)
- **403**: Forbidden (permission denied)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate entry)
- **422**: Unprocessable Entity (validation failed)
- **500**: Internal Server Error (server error)

---

## 7. Performance Considerations

### Database Optimization
- Text indexes on searchable fields
- Compound indexes for common queries
- Field projection to limit data transfer
- Connection pooling
- Query result caching (Phase 2)

### Frontend Optimization
- Code splitting by route
- Image optimization via Cloudinary
- Lazy loading components
- Virtual scrolling for lists
- Memoization of expensive computations

### API Optimization
- Response compression (gzip)
- Pagination for large datasets
- Selective field return
- Request validation early
- Rate limiting

---

## 8. Deployment Architecture

### Environment Separation
```
Development
├── Local MongoDB
├── Localhost servers
└── Test payment gateways

Staging
├── MongoDB Atlas (staging)
├── AWS EC2 instances
└── Sandbox payment gateways

Production
├── MongoDB Atlas (production)
├── AWS Load Balancer
├── Auto-scaling groups
└── Live payment gateways
```

---

**System Design Created**: 2026-06-18  
**Status**: ✅ Approved for Implementation  
**Next Phase**: Development & Coding
