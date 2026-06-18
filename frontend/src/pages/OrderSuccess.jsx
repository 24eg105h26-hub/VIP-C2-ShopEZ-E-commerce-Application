import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, Check } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/orders/${orderId}`);
        setOrder(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch order info:', err);
        setError(err.response?.data?.message || 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    addToast('Order ID copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-premium-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-zinc-400">Fetching transaction status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-3xl p-8 shadow-xl">
        <h2 className="text-lg font-bold uppercase tracking-wider text-red-500">Order Not Found</h2>
        <p className="text-xs text-zinc-400">{error || 'We could not verify this transaction.'}</p>
        <button
          onClick={() => navigate('/catalog')}
          className="w-full py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl"
        >
          Go to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      {/* Transaction Success Card */}
      <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-8 rounded-[32px] text-center space-y-6 shadow-xl relative overflow-hidden">
        
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 dark:bg-green-950/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-500 stroke-[1.5]" />
        </div>

        {/* Headers */}
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-bold font-display text-zinc-900 dark:text-white">
            Order Dispatched Successfully!
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Thank you for shopping with ShopEZ. Your simulated transaction has completed, and inventory stocks have been updated.
          </p>
        </div>

        {/* Transaction Invoice Panel */}
        <div className="p-5 bg-zinc-50 dark:bg-premium-border/10 rounded-2xl border border-zinc-100 dark:border-premium-border/10 text-left space-y-3">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            Transaction Invoice
          </h3>
          
          <div className="space-y-2.5 text-xs text-zinc-650 dark:text-zinc-350">
            {/* Order ID block */}
            <div className="flex items-center justify-between">
              <span>Order ID</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono bg-purple-50 dark:bg-purple-950/35 text-premium-accent px-2 py-0.5 rounded font-semibold text-[11px]">
                  {order._id}
                </span>
                <button 
                  onClick={handleCopy} 
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-premium-border rounded transition text-zinc-400 hover:text-zinc-650"
                  title="Copy Order ID"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Shipping Mode */}
            <div className="flex justify-between">
              <span>Shipping Mode</span>
              <span className="font-semibold text-zinc-850 dark:text-zinc-100">
                ShopEZ Standard Express (FREE)
              </span>
            </div>

            {/* Amount Paid */}
            <div className="flex justify-between">
              <span>Amount Paid</span>
              <span className="font-bold text-zinc-900 dark:text-white text-sm">
                {formatPrice(order.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons Action Group */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => navigate('/profile?tab=orders')}
            className="w-full py-3.5 bg-premium-accent hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-premium-accent/20 flex items-center justify-center"
          >
            Track Order Status
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className="w-full py-3.5 bg-zinc-100 dark:bg-premium-border hover:bg-zinc-200 dark:hover:bg-premium-border/80 text-zinc-800 dark:text-zinc-200 text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center"
          >
            Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;
