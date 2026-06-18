import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { cartSuccess } from '../redux/cartSlice';
import { ShieldAlert } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const { loading, error } = useSelector((state) => state.auth);
  const { guestId } = useSelector((state) => state.cart);
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      // 1. Authenticate user
      const res = await API.post('/auth/login', { email, password });
      dispatch(loginSuccess(res.data));

      // 2. Perform Guest Cart Merge if active guestId exists
      try {
        const mergeRes = await API.post('/cart/merge', { guestId });
        dispatch(cartSuccess(mergeRes.data.data));
      } catch (mergeErr) {
        console.error('Failed to merge guest cart:', mergeErr);
      }

      // 3. Redirect user
      if (redirect === 'checkout') {
        navigate('/checkout');
      } else if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else if (res.data.user.role === 'seller') {
        navigate('/seller');
      } else {
        navigate('/');
      }
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Invalid credentials.'));
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-8 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-display">Welcome Back</h1>
        <p className="text-xs text-zinc-400">Sign in to your premium SHOPEZ portal account</p>
      </div>

      {/* Quick Login Buttons */}
      <div className="p-4 bg-zinc-50 dark:bg-premium-border/30 rounded-2xl border border-zinc-150 dark:border-premium-border/20 space-y-2.5">
        <p className="text-[10px] uppercase font-bold text-zinc-450 dark:text-zinc-350 text-center tracking-wider">Quick Login Demo Accounts</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setEmail('customer@shopez.com');
              setPassword('password123');
              addToast('Loaded customer credentials', 'info');
            }}
            className="py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border hover:border-premium-accent text-[10px] font-bold uppercase rounded-lg transition text-zinc-800 dark:text-zinc-200"
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('seller@shopez.com');
              setPassword('password123');
              addToast('Loaded seller credentials', 'info');
            }}
            className="py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border hover:border-premium-accent text-[10px] font-bold uppercase rounded-lg transition text-zinc-800 dark:text-zinc-200"
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@shopez.com');
              setPassword('password123');
              addToast('Loaded admin credentials', 'info');
            }}
            className="py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border hover:border-premium-accent text-[10px] font-bold uppercase rounded-lg transition text-zinc-800 dark:text-zinc-200"
          >
            Admin
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none"
            placeholder="e.g. buyer@shopez.com"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none"
            placeholder="Min 8 characters"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-zinc-500 font-light">
          Don't have an account?{' '}
          <Link to="/register" className="text-premium-accent font-semibold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
