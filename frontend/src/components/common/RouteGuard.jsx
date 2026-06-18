import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Protected path wrapper (requires login)
export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect customer/seller back to respective dashboard
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Public path wrapper (redirects logged-in users away from Login/Register)
export const PublicRoute = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'seller') return <Navigate to="/seller" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
