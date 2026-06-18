<<<<<<< HEAD
# shopEZ - B2C E-Commerce Marketplace (MERN Stack)

shopEZ is a zero-compromise B2C e-commerce marketplace featuring fully isolated Customer, Seller, and Admin portals. The system supports full-text search, variant inventory locks, JWT auth with refresh token rotation, and Stripe/Razorpay checkouts.

---

## 1. System Architecture

- **Frontend**: React.js, Tailwind CSS, Redux Toolkit (client states), React Query (server cache), Framer Motion (premium visuals)
- **Backend**: Node.js, Express.js, Clean Architecture isolation, Winston logger, Express Rate Limit, Helmet security headers
- **Database**: MongoDB (Mongoose schemas, compound text indexing, pre-validate slugifiers, aggregation hooks)
- **Notifications**: WebSocket alerts via Socket.io, Nodemailer email verification / invoices

---

## 2. Directory Layout

```
d:/kailash
├── backend/                  # Node/Express API Server
│   ├── src/
│   │   ├── config/          # Connection setups (db, nodemailer)
│   │   ├── controllers/     # Route logic
│   │   ├── middleware/      # Guards, centralized error handlers
│   │   ├── models/          # Mongoose schema definitions
│   │   ├── routes/          # Express route endpoints
│   │   ├── services/        # Third party APIs (Stripe, Razorpay, Socket)
│   │   └── utils/           # Winston logger, helpers, tokens
│   ├── tests/               # Jest & Supertest scripts
│   ├── .env.example
│   └── package.json
├── frontend/                 # React client SPA (Vite)
│   ├── src/
│   │   ├── components/      # UI templates (Header, layout, skeleton)
│   │   ├── context/         # Socket clients
│   │   ├── redux/           # Slices (auth, cart)
│   │   ├── pages/           # Portals and Home screen views
│   │   └── services/        # Axios API client interceptor
│   ├── index.html
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 3. Configuration & Startup

### Step A: Configuration files
Copy environment blueprints to local configuration files:
- Backend: copy `backend/.env.example` to `backend/.env`
- Frontend: copy `frontend/.env.example` to `frontend/.env`

### Step B: Install dependencies
Run install in both monorepo folders:
```bash
# Inside backend/
npm install

# Inside frontend/
npm install
```

### Step C: Seed Database
Seed initial mock categories, products with variants, and verification user accounts:
```bash
# Inside backend/
npm run seed
```

This generates these test credentials:
- **Administrator**: `admin@shopez.com` / `password123`
- **Seller Store**: `seller@shopez.com` / `password123`
- **Customer**: `customer@shopez.com` / `password123`

### Step D: Running Locally
Launch both servers:
```bash
# Start backend server (port 5000)
# Inside backend/
npm run dev

# Start frontend Vite server (port 5173)
# Inside frontend/
npm run dev
```

---

## 4. Primary API Endpoints

### Auth Endpoint (`/api/auth`)
- `POST /register` - Register customer / seller
- `POST /login` - Sign in user, sets cookies and access tokens
- `POST /refresh` - Session rotation checks (RTR)
- `POST /verify-email` - Confirm signup
- `POST /logout` - Invalidate tokens
- `DELETE /account` - Invalidate credentials

### Product Catalog (`/api/products`)
- `GET /` - Dynamic filter, text search, sorting, and pagination
- `GET /:slug` - Product item specifications
- `GET /:slug/related` - Related product arrays
- `GET /search/autocomplete` - Match queries

### Cart & Checkout (`/api/cart` & `/api/orders`)
- `GET /cart` - Retrieve shopping bag items
- `POST /cart` - Increment counts / verify stock
- `POST /orders` - Place order (COD / Stripe / Razorpay order)
- `POST /orders/verify-razorpay` - Razorpay HMAC signatures confirmation

---

## 5. Verification & Tests
Verify API calls and route schemas:
```bash
# Inside backend/
npm run test
```
The test runner executes Jest integration suites on Express routing maps.
