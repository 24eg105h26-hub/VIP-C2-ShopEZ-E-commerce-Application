import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { ProtectedRoute, PublicRoute } from './components/common/RouteGuard';

// Public pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import VerifyEmail from './pages/VerifyEmail';

// Guarded pages (Public Redirects if authenticated)
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';

// Protected pages (Requires login)
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import CustomerDashboard from './pages/CustomerDashboard';
import OrderSuccess from './pages/OrderSuccess';

// Protected portals (Requires role checks)
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Public Redirect Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Route>


        {/* Customer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['customer', 'seller', 'admin']} />}>
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<CustomerDashboard />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
        </Route>

        {/* Seller Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
          <Route path="/seller" element={<SellerDashboard />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all redirect to home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
}

export default App;
