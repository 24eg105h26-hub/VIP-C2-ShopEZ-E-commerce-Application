# ShopEZ - Technology Stack & Architecture

## Technology Stack Overview

### Backend Technologies

#### Framework & Runtime
- **Node.js** (v18+)
  - Rationale: High performance, non-blocking I/O, excellent for real-time applications
  - Supports: WebSockets, event-driven architecture
  
- **Express.js** (v4.19.2)
  - Rationale: Lightweight, flexible, industry-standard
  - Usage: HTTP server, routing, middleware management
  - Supports: Custom middleware for auth, validation, error handling

#### Database
- **MongoDB**
  - Rationale: Document-oriented, flexible schema, excellent for e-commerce
  - Advantages: JSON-like documents, rich queries, aggregation pipeline
  - Scaling: Supports horizontal scaling via sharding

- **Mongoose** (v8.4.1)
  - Rationale: ODM (Object Document Mapper) for MongoDB
  - Features: Schema validation, middleware hooks, query builders
  - Usage: Schema definition, validation, relationships

#### Authentication & Security
- **JWT (JSON Web Tokens)**
  - Implementation: jsonwebtoken (v9.0.2)
  - Features: Stateless authentication, refresh token rotation
  - Token Lifetime: Access (15 min), Refresh (7 days)

- **bcryptjs** (v2.4.3)
  - Rationale: Industry-standard password hashing
  - Salt Rounds: 12 (security vs performance balance)

- **Helmet.js** (v7.1.0)
  - Rationale: Security headers middleware
  - Protects: XSS, Clickjacking, CSRF (indirectly)

- **express-validator** (v7.1.0)
  - Rationale: Input validation and sanitization
  - Features: Schema validation, custom validators

#### Real-time Communication
- **Socket.io** (v4.7.5)
  - Rationale: Real-time bidirectional communication
  - Usage: Order notifications, inventory updates, chat (Phase 2)
  - Fallback: Long polling support

#### Payment Processing
- **Stripe** (v15.11.0)
  - Market: Global, 195+ countries
  - Features: Recurring billing, subscriptions, hosted checkout
  - Integration: Webhook verification, secure token handling

- **Razorpay** (v2.9.2)
  - Market: India-focused, excellent local support
  - Features: Multiple payment methods, settlements
  - Integration: Webhook verification, refund handling

#### File & Image Management
- **Cloudinary** (v2.2.0)
  - Rationale: Cloud image storage and CDN
  - Features: Image optimization, transformations, caching
  - Usage: Product images, user avatars, seller store images

#### Email Service
- **Nodemailer** (v6.9.13)
  - Rationale: Simple email delivery
  - Features: Template support, attachments
  - Usage: Verification emails, order confirmations, notifications

#### Logging & Monitoring
- **Winston** (v3.13.0)
  - Rationale: Production-grade logging
  - Features: Multiple transports, log levels, formatting
  - Usage: Error tracking, request logging, performance monitoring

#### Additional Backend Libraries
- **cors** (v2.8.5) - Cross-Origin Resource Sharing
- **cookie-parser** (v1.4.6) - Cookie handling
- **express-rate-limit** (v7.3.1) - Rate limiting
- **morgan** (v1.10.0) - HTTP request logging
- **dotenv** (v16.4.5) - Environment configuration

#### Testing & Development
- **Jest** (v29.7.0) - Unit testing framework
- **Supertest** (v7.0.0) - HTTP assertion library
- **mongodb-memory-server** (v11.2.0) - In-memory MongoDB for testing
- **Nodemon** (v3.1.3) - Auto-reload during development

---

### Frontend Technologies

#### Framework & Libraries
- **React** (v18.3.1)
  - Rationale: Component-based, virtual DOM, large ecosystem
  - Advantages: Reusable components, efficient rendering
  
- **Vite** (v5.2.11)
  - Rationale: Lightning-fast build tool
  - Advantages: Fast HMR (Hot Module Replacement), optimized builds
  - Build Time: < 500ms

#### State Management
- **Redux Toolkit** (v2.2.5)
  - Rationale: Predictable state container
  - Features: Redux store, slices, normalized state
  - Usage: Auth state, user data, app-wide settings

- **react-redux** (v9.1.2)
  - Rationale: Official React bindings for Redux

#### Data Fetching & Caching
- **React Query** (@tanstack/react-query v5.45.0)
  - Rationale: Server-state management
  - Features: Automatic caching, refetching, synchronization
  - Usage: API data, product listings, orders

- **Axios** (v1.7.2)
  - Rationale: HTTP client with interceptors
  - Features: Request/response interceptors, timeout handling
  - Usage: API calls with auth header injection

#### Styling
- **Tailwind CSS** (v3.4.4)
  - Rationale: Utility-first CSS framework
  - Advantages: Rapid development, consistent design, small bundle size
  - Configuration: Custom colors, responsive breakpoints

- **PostCSS** (v8.4.38) - CSS processing
- **Autoprefixer** (v10.4.19) - Vendor prefixes

#### UI & Animation
- **Framer Motion** (v11.2.10)
  - Rationale: Production-ready animation library
  - Usage: Page transitions, hover effects, loading animations
  - Performance: GPU-accelerated

- **Lucide React** (v0.395.0)
  - Rationale: Clean, consistent icon library
  - Features: 395+ icons, customizable sizing/colors

#### Real-time Communication
- **Socket.io-client** (v4.7.5)
  - Rationale: Client-side WebSocket library
  - Usage: Real-time notifications, order updates
  - Auto-reconnection: Built-in reconnection logic

#### Routing
- **react-router-dom** (v6.23.1)
  - Rationale: Client-side routing
  - Features: Nested routes, lazy loading, route protection
  - Usage: Multi-portal navigation (customer, seller, admin)

#### Development Tools
- **ESLint** (eslint.config.js) - Code quality
- **Vite Plugin React** - React support for Vite
- **Tailwind CSS IntelliSense** - IDE integration (recommended)

---

## System Architecture

### Architectural Pattern: Clean Architecture with Separation of Concerns

```
Frontend (React/Vite)
    ├── Pages (Portal-specific)
    ├── Components (Reusable UI)
    ├── Redux (State Management)
    ├── React Query (Server State)
    └── Services (API Client)
         ↓ (HTTPS/WebSocket)
    
Backend (Node.js/Express)
    ├── Routes (Endpoint definitions)
    ├── Controllers (Request handling)
    ├── Services (Business logic)
    ├── Models (Database schemas)
    ├── Middleware (Auth, validation, error)
    └── Config (Database, third-party)
         ↓ (MongoDB Connection)
    
Database (MongoDB)
    ├── Collections
    │   ├── users
    │   ├── products
    │   ├── orders
    │   ├── reviews
    │   └── ...
    └── Indexes (Text search, compound)

External Services
    ├── Stripe (Payments)
    ├── Razorpay (Payments)
    ├── Cloudinary (Images)
    ├── Nodemailer (Email)
    └── Socket.io (Real-time)
```

---

## Data Flow Architecture

### User Authentication Flow
```
Client (Login)
    ↓
Express Route → Auth Controller
    ↓
User Model (Query & Verify)
    ↓
bcryptjs (Password Hash Comparison)
    ↓
JWT (Generate Tokens)
    ↓
Response (Access + Refresh Tokens)
    ↓
Client (Store in HttpOnly Cookies)
```

### Product Search Flow
```
Client (Search Query)
    ↓
Express Route → Product Controller
    ↓
Express Validator (Sanitize Input)
    ↓
Product Model (Full-text Search + Filters)
    ↓
MongoDB Aggregation Pipeline
    ↓
Response (Paginated Results)
    ↓
React Query (Cache Results)
    ↓
Client (Display with Framer Motion)
```

### Real-time Notification Flow
```
Event Trigger (Order Status Change)
    ↓
Backend Service (Process Event)
    ↓
Socket.io (Emit to Connected Clients)
    ↓
WebSocket Connection
    ↓
Client Socket Listener
    ↓
Redux Action (Update State)
    ↓
React Component (Re-render)
    ↓
UI Update (Notification Display)
```

### Payment Processing Flow
```
Client (Checkout)
    ↓
Backend Route → Payment Controller
    ↓
Stripe/Razorpay API (Create Payment)
    ↓
Redirect to Payment Gateway
    ↓
Customer (Complete Payment)
    ↓
Webhook (Payment Confirmation)
    ↓
Backend (Verify & Update Order)
    ↓
Email Service (Send Confirmation)
    ↓
Socket.io (Notify Seller)
    ↓
Database (Order Created)
```

---

## Deployment Architecture

### Development Environment
- **Frontend**: `npm run dev` (Vite dev server on port 5173)
- **Backend**: `npm run dev` (Nodemon on port 5000)
- **Database**: Local MongoDB or MongoDB Atlas

### Production Environment
- **Frontend**: 
  - Build: `npm run build` → Optimized static files
  - Hosting: Vercel, Netlify, or AWS S3 + CloudFront
  - CDN: Cloudinary for images

- **Backend**:
  - Deployment: Heroku, Render, AWS EC2, or Railway
  - Process Manager: PM2 for process management
  - Reverse Proxy: Nginx for load balancing

- **Database**:
  - MongoDB Atlas (Managed cloud service)
  - Backup: Automated daily backups
  - Replication: 3-node replica set for HA

- **Real-time**:
  - Socket.io with Redis adapter for multi-instance scaling
  - Namespace separation (customer, seller, admin)

---

## Database Schema Overview

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String (customer/seller/admin),
  avatar: String (Cloudinary URL),
  verified: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Products
```javascript
{
  _id: ObjectId,
  name: String (indexed for text search),
  description: String,
  price: Decimal,
  category: ObjectId (ref: Category),
  seller: ObjectId (ref: User),
  images: [{ url, alt }],
  variants: [{ name, options: [String], price }],
  inventory: [{ variant, quantity }],
  rating: Decimal,
  reviewCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### Orders
```javascript
{
  _id: ObjectId,
  orderNumber: String (unique),
  customer: ObjectId (ref: User),
  items: [{ product, variant, quantity, price }],
  status: String (pending/confirmed/shipped/delivered),
  payment: { method, transactionId, amount, status },
  shipping: { address, method, estimatedDate },
  total: Decimal,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Considerations

### Authentication & Authorization
- JWT with HTTP-only cookies
- Refresh Token Rotation (RTR)
- Role-Based Access Control (RBAC)
- Password hashing with bcrypt

### Data Protection
- HTTPS enforcement
- Input validation (express-validator)
- SQL injection prevention (Mongoose ORM)
- XSS protection (input sanitization)
- CSRF protection (SameSite cookies)

### API Security
- Rate limiting (express-rate-limit)
- Security headers (Helmet.js)
- Secure password requirements
- Account lockout after failed attempts
- Token expiration and refresh rotation

### Sensitive Data
- PCI DSS compliance via Stripe/Razorpay (no card storage)
- Encrypted sensitive fields in DB
- Audit logging for admin actions
- GDPR compliant data deletion

---

## Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization via Cloudinary
- Caching with React Query
- Virtual scrolling for large lists
- Service Worker for offline support (Phase 2)

### Backend
- Database indexing (text search, compound indexes)
- Query optimization and pagination
- Response compression (gzip)
- Caching strategy (Redis Phase 2)
- Connection pooling for MongoDB

### Monitoring & Analytics
- Winston logging for errors and performance
- Real User Monitoring (Phase 2)
- Sentry for error tracking (Phase 2)
- Performance metrics dashboard (Phase 2)

---

**Technology Stack Document Created**: 2026-06-18
**Status**: ✅ Approved and Locked
**Next Phase**: System Design and Architecture Specifications
