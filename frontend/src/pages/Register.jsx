import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import API from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [storeName, setStoreName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name,
        email,
        password,
        role,
        ...(role === 'seller' && { storeName })
      };
      const res = await API.post('/auth/register', payload);
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-8 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold font-display">Create Account</h1>
        <p className="text-xs text-zinc-400">Join the zero-compromise premium marketplace</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-2xl text-xs space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">Verify Your Account</span>
          </div>
          <p className="leading-relaxed font-light">{success}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-700 transition"
          >
            Go to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none animate-none"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none"
              placeholder="e.g. john@example.com"
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

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Account Role</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition ${role === 'customer' ? 'border-premium-accent bg-premium-accent/5 font-bold' : 'border-zinc-200 dark:border-premium-border text-zinc-400'}`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`py-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition ${role === 'seller' ? 'border-premium-accent bg-premium-accent/5 font-bold' : 'border-zinc-200 dark:border-premium-border text-zinc-400'}`}
              >
                Seller
              </button>
            </div>
          </div>

          {role === 'seller' && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Store / Business Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none"
                placeholder="e.g. Elite Gadgets Inc."
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      )}

      {!success && (
        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500 font-light">
            Already have an account?{' '}
            <Link to="/login" className="text-premium-accent font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default Register;
