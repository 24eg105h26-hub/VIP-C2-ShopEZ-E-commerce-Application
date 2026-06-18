# ShopEZ - Functional Requirements Document

## 1. Authentication & Authorization

### FR-1.1: User Registration
- **Description**: Allow users to register as Customer or Seller
- **Actors**: Anonymous Users
- **Preconditions**: User is not registered
- **Steps**:
  1. User navigates to signup page
  2. Selects role (Customer/Seller)
  3. Enters email, password, full name
  4. Validates input
  5. Creates user record with hashed password
  6. Sends verification email
- **Postconditions**: User account created in pending state
- **Acceptance Criteria**:
  - Password minimum 8 characters
  - Email format validation
  - Unique email validation
  - Verification email sent within 5 seconds

### FR-1.2: Email Verification
- **Description**: Verify user email address
- **Actors**: Registered Users
- **Preconditions**: User has received verification email
- **Steps**:
  1. User clicks verification link in email
  2. System validates token
  3. Marks email as verified
  4. Enables login access
- **Postconditions**: User can now login
- **Acceptance Criteria**:
  - Token valid for 24 hours
  - One-time use token
  - Clear error messages

### FR-1.3: User Login
- **Description**: Authenticate user with email and password
- **Actors**: Registered Users
- **Preconditions**: Email verified
- **Steps**:
  1. User enters email and password
  2. System validates credentials
  3. Creates JWT access token (15 min validity)
  4. Creates refresh token (7 days validity)
  5. Sets secure HTTP-only cookies
- **Postconditions**: User authenticated and logged in
- **Acceptance Criteria**:
  - Login < 500ms
  - Secure cookie flags set
  - Failed attempts logged
  - Rate limited to 5 attempts per minute

### FR-1.4: Refresh Token Rotation
- **Description**: Refresh access token using refresh token
- **Actors**: Authenticated Users
- **Preconditions**: Refresh token valid
- **Steps**:
  1. Client sends refresh token
  2. System validates token
  3. Generates new access token
  4. Generates new refresh token (reuse detection)
  5. Invalidates old refresh token
- **Postconditions**: New tokens issued, old token invalidated
- **Acceptance Criteria**:
  - Process < 100ms
  - Detects token reuse (security)
  - Returns new token set

### FR-1.5: User Logout
- **Description**: Invalidate user tokens and end session
- **Actors**: Authenticated Users
- **Preconditions**: User authenticated
- **Steps**:
  1. User clicks logout
  2. System invalidates refresh token
  3. Clears session cookies
  4. Logs logout event
- **Postconditions**: User session terminated
- **Acceptance Criteria**:
  - Immediate effect
  - Token blacklisted
  - Cannot reuse old tokens

### FR-1.6: Account Deletion
- **Description**: Allow users to delete their account
- **Actors**: Authenticated Users
- **Preconditions**: User authenticated, confirmed action
- **Steps**:
  1. User confirms deletion
  2. System verifies password
  3. Marks account as deleted
  4. Anonymizes user data
  5. Removes personal information
- **Postconditions**: User data anonymized, account inactive
- **Acceptance Criteria**:
  - Requires password confirmation
  - Deletes personal data
  - Keeps transaction records (anonymized)

---

## 2. Product Management

### FR-2.1: View Products
- **Description**: Display products with filters and search
- **Actors**: All Users
- **Preconditions**: Products exist in database
- **Steps**:
  1. User navigates to products page
  2. System fetches products with pagination
  3. Displays product cards with images
  4. Shows price and availability
- **Postconditions**: Products displayed with pagination
- **Acceptance Criteria**:
  - Load < 2 seconds
  - Pagination 20 items/page
  - Real-time availability
  - Image caching

### FR-2.2: Product Search
- **Description**: Full-text search across products
- **Actors**: All Users
- **Preconditions**: Products exist
- **Steps**:
  1. User enters search query
  2. System performs full-text search
  3. Returns matching products
  4. Ranks by relevance
- **Postconditions**: Search results displayed
- **Acceptance Criteria**:
  - Response < 500ms
  - Searches name, description, category
  - Case-insensitive matching
  - Typo tolerance (Phase 2)

### FR-2.3: Advanced Filtering
- **Description**: Filter products by multiple criteria
- **Actors**: All Users
- **Preconditions**: Products exist
- **Steps**:
  1. User selects filter criteria (category, price, rating)
  2. System applies filters
  3. Updates product results
  4. Shows filter options dynamically
- **Postconditions**: Filtered results displayed
- **Acceptance Criteria**:
  - Multiple filter combinations
  - Price range filtering
  - Category filtering
  - Rating filtering

### FR-2.4: Product Details
- **Description**: Display detailed product information
- **Actors**: All Users
- **Preconditions**: Product exists
- **Steps**:
  1. User clicks on product
  2. System fetches product details
  3. Displays images, variants, reviews
  4. Shows seller information
  5. Displays in-stock variants
- **Postconditions**: Product details page rendered
- **Acceptance Criteria**:
  - Multiple image gallery
  - All variants displayed
  - Reviews section
  - Seller details with rating

### FR-2.5: Product Variants
- **Description**: Display product variants (size, color, etc)
- **Actors**: All Users
- **Preconditions**: Product has variants
- **Steps**:
  1. User views product page
  2. System displays available variants
  3. Shows stock status per variant
  4. Updates price for selected variant
  5. Prevents out-of-stock selection
- **Postconditions**: Variant selection enabled
- **Acceptance Criteria**:
  - Shows all available variants
  - Real-time stock updates
  - Prevents stock overselling
  - Clear variant differences

---

## 3. Shopping Cart & Checkout

### FR-3.1: Add to Cart
- **Description**: Add product variants to cart
- **Actors**: All Users
- **Preconditions**: User authenticated, product available
- **Steps**:
  1. User selects variant
  2. Enters quantity
  3. Clicks add to cart
  4. System validates stock
  5. Updates cart count
  6. Shows confirmation
- **Postconditions**: Item added to cart
- **Acceptance Criteria**:
  - Prevents stock overselling
  - Persists in database
  - Updates UI immediately
  - Quantity limits per variant

### FR-3.2: View Cart
- **Description**: Display all items in shopping cart
- **Actors**: Authenticated Users
- **Preconditions**: Items in cart
- **Steps**:
  1. User clicks cart icon
  2. System fetches cart items
  3. Displays items with prices
  4. Shows total and subtotal
  5. Allows quantity adjustment
- **Postconditions**: Cart displayed with all details
- **Acceptance Criteria**:
  - Real-time price updates
  - Quantity adjustment
  - Remove item option
  - Stock status check

### FR-3.3: Checkout Process
- **Description**: Complete purchase transaction
- **Actors**: Authenticated Customers
- **Preconditions**: Items in cart, user authenticated
- **Steps**:
  1. User reviews cart
  2. Enters shipping address
  3. Selects shipping method
  4. Enters payment details
  5. Reviews order summary
  6. Confirms purchase
  7. Payment processed
  8. Order created
- **Postconditions**: Order created, payment processed
- **Acceptance Criteria**:
  - Address validation
  - Inventory lock during checkout
  - Payment processing < 5 seconds
  - Order confirmation email

### FR-3.4: Multiple Payment Options
- **Description**: Support Stripe and Razorpay payments
- **Actors**: Customers at checkout
- **Preconditions**: Checkout initiated
- **Steps**:
  1. User selects payment method
  2. Redirected to payment gateway
  3. Completes payment
  4. Webhook confirms transaction
  5. Order finalized
- **Postconditions**: Payment completed, order confirmed
- **Acceptance Criteria**:
  - Both gateways functional
  - Secure payment processing
  - Clear success/failure messages
  - Webhook verification

---

## 4. Order Management

### FR-4.1: Create Order
- **Description**: Create order from cart checkout
- **Actors**: Customers
- **Preconditions**: Successful payment
- **Steps**:
  1. Payment confirmed
  2. System creates order record
  3. Generates order number
  4. Sends confirmation email
  5. Notifies seller
  6. Clears cart
- **Postconditions**: Order created and confirmed
- **Acceptance Criteria**:
  - Order number generated
  - Email within 5 seconds
  - Real-time notification
  - Cart cleared

### FR-4.2: View Order Details
- **Description**: Display customer order details
- **Actors**: Customers, Sellers, Admin
- **Preconditions**: Order exists
- **Steps**:
  1. User navigates to orders
  2. Selects order
  3. System displays details
  4. Shows status and timeline
  5. Displays tracking information
- **Postconditions**: Order details displayed
- **Acceptance Criteria**:
  - All order information
  - Status timeline
  - Payment details
  - Shipping address

### FR-4.3: Order Status Tracking
- **Description**: Real-time order status updates
- **Actors**: Customers, Sellers
- **Preconditions**: Order exists
- **Steps**:
  1. Order status changes
  2. System updates status
  3. Sends notification
  4. Updates order timeline
  5. Notifies relevant parties
- **Postconditions**: Status updated and notified
- **Acceptance Criteria**:
  - Real-time updates (WebSocket)
  - Status options: Pending, Confirmed, Processing, Shipped, Delivered
  - Timestamp for each status

### FR-4.4: Cancel Order
- **Description**: Allow order cancellation within timeframe
- **Actors**: Customers
- **Preconditions**: Order not shipped
- **Steps**:
  1. User selects order to cancel
  2. System validates cancellation eligibility
  3. Processes refund
  4. Updates order status
  5. Notifies seller and customer
- **Postconditions**: Order cancelled, refund initiated
- **Acceptance Criteria**:
  - Cancellable within 24 hours
  - Automatic refund processing
  - Notification sent

---

## 5. Review & Rating System

### FR-5.1: Create Review
- **Description**: Allow customers to review products
- **Actors**: Customers (who purchased)
- **Preconditions**: Customer has purchased product
- **Steps**:
  1. User navigates to product
  2. Clicks write review
  3. Enters rating (1-5 stars)
  4. Writes review text
  5. Submits review
  6. System validates and stores
- **Postconditions**: Review created and published
- **Acceptance Criteria**:
  - Rating 1-5 stars
  - Review text optional
  - Only verified buyers can review
  - Reviews moderated

### FR-5.2: View Reviews
- **Description**: Display product reviews and ratings
- **Actors**: All Users
- **Preconditions**: Reviews exist
- **Steps**:
  1. User views product
  2. System displays reviews
  3. Shows average rating
  4. Displays review count
  5. Shows individual reviews with ratings
- **Postconditions**: Reviews displayed
- **Acceptance Criteria**:
  - Shows average rating
  - Sorts by helpful/newest
  - Displays customer name, rating, text
  - Shows review date

---

## 6. Wishlist Management

### FR-6.1: Add to Wishlist
- **Description**: Save products to wishlist
- **Actors**: Authenticated Users
- **Preconditions**: Product exists, user authenticated
- **Steps**:
  1. User clicks wishlist icon
  2. System adds to wishlist
  3. Shows confirmation
  4. Icon updates
- **Postconditions**: Product in wishlist
- **Acceptance Criteria**:
  - Immediate UI update
  - Database persisted
  - Icon state change
  - One click action

### FR-6.2: View Wishlist
- **Description**: Display saved wishlist items
- **Actors**: Authenticated Users
- **Preconditions**: Wishlist items exist
- **Steps**:
  1. User clicks wishlist
  2. System fetches items
  3. Displays product cards
  4. Shows current prices
  5. Shows stock status
- **Postconditions**: Wishlist displayed
- **Acceptance Criteria**:
  - Shows all saved items
  - Current prices updated
  - Add to cart option
  - Remove option

### FR-6.3: Remove from Wishlist
- **Description**: Remove products from wishlist
- **Actors**: Authenticated Users
- **Preconditions**: Items in wishlist
- **Steps**:
  1. User clicks remove
  2. System deletes wishlist entry
  3. Updates UI
  4. Shows confirmation
- **Postconditions**: Item removed from wishlist
- **Acceptance Criteria**:
  - Immediate removal
  - Icon update
  - Confirmation message

---

## 7. Seller Management

### FR-7.1: Seller Registration
- **Description**: Allow users to register as sellers
- **Actors**: Users
- **Preconditions**: User account created
- **Steps**:
  1. User navigates to seller registration
  2. Provides store information
  3. Uploads documents
  4. Submits for approval
  5. Admin reviews application
  6. Approval notification sent
- **Postconditions**: Seller account created/pending
- **Acceptance Criteria**:
  - Document validation
  - Background check (Phase 2)
  - Clear approval process
  - Notification system

### FR-7.2: Seller Dashboard
- **Description**: Seller-specific analytics and management
- **Actors**: Sellers
- **Preconditions**: Seller authenticated
- **Steps**:
  1. Seller logs in
  2. System displays dashboard
  3. Shows sales metrics
  4. Displays orders
  5. Shows product analytics
- **Postconditions**: Dashboard displayed
- **Acceptance Criteria**:
  - Real-time sales data
  - Order management interface
  - Product management interface
  - Analytics charts

### FR-7.3: Manage Products
- **Description**: Sellers can create/edit/delete products
- **Actors**: Sellers
- **Preconditions**: Seller authenticated
- **Steps**:
  1. Seller navigates to product management
  2. Creates new product (name, description, price)
  3. Adds variants and stock
  4. Uploads product images
  5. Sets categories and tags
  6. Publishes product
- **Postconditions**: Product listed
- **Acceptance Criteria**:
  - Image upload and optimization
  - Variant management
  - Stock tracking
  - Category assignment
  - SEO fields

### FR-7.4: Manage Inventory
- **Description**: Track and manage product inventory
- **Actors**: Sellers
- **Preconditions**: Products created
- **Steps**:
  1. Seller views inventory
  2. Adjusts stock levels
  3. Sets low stock alerts
  4. Views stock history
  5. Manages variants
- **Postconditions**: Inventory updated
- **Acceptance Criteria**:
  - Real-time stock updates
  - Bulk operations
  - Stock alerts
  - Variant stock tracking

---

## 8. Admin Functions

### FR-8.1: User Management
- **Description**: Admin can manage users
- **Actors**: Administrators
- **Preconditions**: Admin authenticated
- **Steps**:
  1. Admin navigates to user management
  2. Views all users
  3. Can activate/deactivate accounts
  4. Can view user details
  5. Can handle disputes
- **Postconditions**: User status updated
- **Acceptance Criteria**:
  - User search and filter
  - Status management
  - Ban functionality
  - Activity logs

### FR-8.2: Seller Approval
- **Description**: Review and approve seller applications
- **Actors**: Administrators
- **Preconditions**: Seller applications pending
- **Steps**:
  1. Admin views applications
  2. Reviews seller information
  3. Approves or rejects
  4. Sends notification
- **Postconditions**: Application processed
- **Acceptance Criteria**:
  - Application queue
  - Document verification
  - Email notification
  - Approval workflow

### FR-8.3: Platform Analytics
- **Description**: View platform-wide analytics
- **Actors**: Administrators
- **Preconditions**: Admin authenticated
- **Steps**:
  1. Admin navigates to analytics
  2. System displays metrics
  3. Shows sales trends
  4. Displays user statistics
  5. Shows system health
- **Postconditions**: Analytics dashboard displayed
- **Acceptance Criteria**:
  - Real-time data
  - Customizable reports
  - Export functionality
  - Performance metrics

---

## 9. Notification System

### FR-9.1: Real-time Notifications
- **Description**: Send real-time notifications via WebSocket
- **Actors**: All Users
- **Preconditions**: User authenticated, event triggered
- **Steps**:
  1. Event occurs (order status, new message, etc)
  2. System sends notification via Socket.io
  3. Client receives and displays
  4. Notification logged
- **Postconditions**: Notification delivered
- **Acceptance Criteria**:
  - Real-time delivery < 1 second
  - Multiple notification types
  - Client-side persistence
  - Badge updates

### FR-9.2: Email Notifications
- **Description**: Send email notifications for key events
- **Actors**: All Users
- **Preconditions**: Event triggered
- **Steps**:
  1. Event occurs
  2. Email queued
  3. Nodemailer sends email
  4. Delivery confirmed
- **Postconditions**: Email sent
- **Acceptance Criteria**:
  - Sent within 5 seconds
  - Clear formatting
  - Unsubscribe option (Phase 2)
  - HTML templates

---

## Non-Functional Requirements

### NFR-1: Performance
- Page load time < 2 seconds
- Search response < 500ms
- API response < 200ms (95th percentile)
- WebSocket latency < 100ms

### NFR-2: Security
- All passwords hashed with bcrypt
- HTTPS enforced
- CSRF protection
- XSS protection (input validation)
- Rate limiting (5 requests/min per IP)
- SQL injection prevention
- Secure headers (Helmet.js)

### NFR-3: Scalability
- Support 10,000 concurrent users
- Horizontal scaling capable
- Database indexing optimized
- Caching strategy implemented

### NFR-4: Reliability
- 99.9% uptime target
- Automated backups
- Error logging and monitoring
- Graceful error handling

### NFR-5: Maintainability
- Clean code architecture
- Comprehensive documentation
- Unit test coverage > 80%
- Modular component design

---

**Requirements Document Created**: 2026-06-18
**Status**: ✅ Complete and Approved for Design Phase
**Next Step**: System Design and Architecture
