import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../redux/authSlice';
import { cartSuccess } from '../redux/cartSlice';
import { ShieldAlert, ShieldCheck, Key } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const { loading, error } = useSelector((state) => state.auth);
  const { guestId } = useSelector((state) => state.cart);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      // 1. Authenticate user
      const res = await API.post('/auth/login', { email, password });
      
      // 2. Role validation: Must be admin
      if (res.data.user.role !== 'admin') {
        dispatch(loginFailure('Access denied. Only administrators are allowed.'));
        addToast('Access denied. You are not an administrator.', 'error');
        return;
      }

      dispatch(loginSuccess(res.data));
      addToast('Welcome to the admin control panel!', 'success');

      // 3. Guest Cart Merge
      try {
        const mergeRes = await API.post('/cart/merge', { guestId });
        dispatch(cartSuccess(mergeRes.data.data));
      } catch (mergeErr) {
        console.error('Failed to merge guest cart:', mergeErr);
      }

      navigate('/admin');
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || 'Invalid admin credentials.'));
      addToast(err.response?.data?.message || 'Invalid admin credentials.', 'error');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-zinc-950 text-white border border-zinc-800 p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative premium accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500"></div>

      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-premium-accent/10 border border-premium-accent/40 flex items-center justify-center mx-auto mb-2 text-premium-accent">
          <Key className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Portal</h1>
        <p className="text-xs text-zinc-400">Secure entry for shopEZ marketplace administrators</p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-850/50 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Login Buttons */}
      <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-2.5">
        <p className="text-[10px] uppercase font-bold text-zinc-500 text-center tracking-wider">Quick Fill Admin</p>
        <button
          type="button"
          onClick={() => {
            setEmail('admin@shopez.com');
            setPassword('password123');
            addToast('Loaded admin credentials', 'info');
          }}
          className="w-full py-2 bg-zinc-800 border border-zinc-700 hover:border-premium-accent text-[10px] font-bold uppercase rounded-lg transition text-white"
        >
          admin@shopez.com (password123)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Admin Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-xs px-4 py-3 bg-zinc-900 border border-zinc-850 text-white rounded-xl focus:ring-1 focus:ring-premium-accent outline-none"
            placeholder="e.g. admin@shopez.com"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Secret Passkey</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-xs px-4 py-3 bg-zinc-900 border border-zinc-850 text-white rounded-xl focus:ring-1 focus:ring-premium-accent outline-none"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-100 text-xs font-bold uppercase tracking-widest rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? 'Authorizing Access...' : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Secure Login
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-zinc-500 font-light">
          Are you a customer or seller?{' '}
          <Link to="/login" className="text-premium-accent font-semibold hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
