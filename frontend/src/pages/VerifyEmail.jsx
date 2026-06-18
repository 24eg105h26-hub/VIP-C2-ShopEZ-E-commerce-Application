import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader } from 'lucide-react';
import API from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const confirmVerification = async () => {
      if (!token) {
        setError('Verification token is missing. Please check your verification link.');
        setLoading(false);
        return;
      }
      try {
        const res = await API.post('/auth/verify-email', { token });
        setSuccess(res.data.message);
      } catch (err) {
        setError(err.response?.data?.message || 'Verification link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    confirmVerification();
  }, [token]);

  return (
    <div className="max-w-md w-full mx-auto my-16 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-8 rounded-3xl text-center space-y-6">
      <h1 className="text-xl font-bold font-display uppercase tracking-wider">Account Verification</h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-6">
          <Loader className="h-8 w-8 text-premium-accent animate-spin" />
          <p className="text-xs text-zinc-400">Verifying your email address, please hold...</p>
        </div>
      ) : success ? (
        <div className="space-y-4 py-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <p className="text-sm font-semibold">{success}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition"
          >
            Log In
          </button>
        </div>
      ) : (
        <div className="space-y-4 py-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-500">{error}</p>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3 border border-zinc-200 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-50 transition"
          >
            Try Registering Again
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
