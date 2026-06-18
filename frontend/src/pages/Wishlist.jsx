import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { cartSuccess } from '../redux/cartSlice';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { guestId } = useSelector((state) => state.cart);
  const { addToast } = useToast();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await API.get('/wishlist');
      setWishlistItems(res.data.data.products || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await API.delete(`/wishlist/${productId}`);
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
      addToast('Product removed from wishlist.', 'success');
    } catch (err) {
      addToast('Failed to remove item.', 'error');
    }
  };

  const handleMoveToCart = async (product) => {
    const defaultVariant = product.variants[0];
    if (!defaultVariant) return;

    try {
      // Add to cart
      const cartRes = await API.post('/cart', {
        productId: product._id,
        variantSku: defaultVariant.sku,
        quantity: 1
      });
      dispatch(cartSuccess(cartRes.data.data));

      // Remove from wishlist
      await API.delete(`/wishlist/${product._id}`);
      setWishlistItems(prev => prev.filter(item => item._id !== product._id));

      addToast('Item moved to bag!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add item to bag.', 'error');
    }
  };


  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider">Your Wishlist</h1>
        <p className="text-xs text-zinc-400 mt-1">Saved items you wish to purchase later</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-zinc-400">Loading wishlist...</div>
      ) : wishlistItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl">
          <Heart className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold">Your wishlist is empty</p>
          <p className="text-xs text-zinc-400 mt-1">Explore our product catalogs and click the heart icon to save products.</p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-4 px-5 py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition"
          >
            Explore Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlistItems.map((prod) => (
            <div key={prod._id} className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
              
              <div className="relative aspect-square bg-zinc-100 overflow-hidden">
                <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemove(prod._id)}
                  className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-premium-card/85 backdrop-blur-xs rounded-full shadow-xs text-zinc-600 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{prod.brand}</span>
                  <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 truncate mt-0.5">{prod.name}</h3>
                  <p className="text-xs font-bold mt-2">{formatPrice(prod.price)}</p>
                </div>
                <button
                  onClick={() => handleMoveToCart(prod)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase rounded-lg hover:opacity-90 transition"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Move to Bag
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
