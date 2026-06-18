import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { cartSuccess, cartFailure } from '../../redux/cartSlice';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';
import { formatPrice } from '../../utils/format';

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const { items, guestId } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const fetchCart = async () => {
    try {
      const endpoint = isAuthenticated ? '/cart' : `/cart?guestId=${guestId}`;
      const res = await API.get(endpoint);
      dispatch(cartSuccess(res.data.data));
    } catch (err) {
      dispatch(cartFailure(err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, isAuthenticated]);

  const handleUpdateQty = async (productId, variantSku, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;

    try {
      const payload = {
        productId,
        variantSku,
        quantity: newQty,
        ...(!isAuthenticated && { guestId })
      };
      const res = await API.put('/cart', payload);
      dispatch(cartSuccess(res.data.data));
      addToast(amount > 0 ? 'Bag quantity increased!' : 'Bag quantity decreased!', 'info');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error updating quantity', 'error');
    }
  };

  const handleRemoveItem = async (productId, variantSku) => {
    try {
      const res = await API.delete('/cart', {
        data: {
          productId,
          variantSku,
          ...(!isAuthenticated && { guestId })
        }
      });
      dispatch(cartSuccess(res.data.data));
      addToast('Item removed from bag.', 'info');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error removing item', 'error');
    }
  };

  const handleCheckoutClick = () => {
    onClose();
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login?redirect=checkout');
    }
  };

  const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white dark:bg-premium-card shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-zinc-200 dark:border-premium-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-premium-accent" />
                <span className="font-semibold uppercase tracking-wider">Your Bag</span>
                <span className="bg-zinc-100 dark:bg-premium-border text-xs px-2 py-0.5 rounded-full font-medium">
                  {items.length}
                </span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-premium-border rounded-full transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <ShoppingBag className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-sm font-semibold">Your bag is empty</p>
                  <p className="text-xs text-zinc-400 mt-1">Add items from the store to see them here.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`${item.product._id}-${item.variantSku}`} className="flex gap-3 p-3 border border-zinc-100 dark:border-premium-border/40 rounded-xl hover:shadow-sm transition">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover bg-zinc-50 border border-zinc-100 dark:border-premium-border/10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-zinc-955 dark:text-zinc-50">{item.product.name}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">{item.variantSku}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        
                        <div className="flex items-center border border-zinc-200 dark:border-premium-border rounded-full">
                          <button
                            onClick={() => handleUpdateQty(item.product._id, item.variantSku, item.quantity, -1)}
                            className="p-1.5 hover:bg-zinc-50 dark:hover:bg-premium-border rounded-full transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.product._id, item.variantSku, item.quantity, 1)}
                            className="p-1.5 hover:bg-zinc-50 dark:hover:bg-premium-border rounded-full transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.product._id, item.variantSku)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-full transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-zinc-200 dark:border-premium-border bg-zinc-50 dark:bg-[#0B0F19]/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Subtotal</span>
                  <span className="text-base font-bold">{formatPrice(subtotal)}</span>
                </div>
                <button
                  onClick={handleCheckoutClick}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold rounded-xl text-xs uppercase tracking-wider hover:opacity-95 transition"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
