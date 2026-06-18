import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { cartSuccess } from '../../redux/cartSlice';
import { useToast } from '../../context/ToastContext';
import API from '../../services/api';
import { formatPrice } from '../../utils/format';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { guestId } = useSelector((state) => state.cart);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    const defaultVariant = product.variants[0];
    if (!defaultVariant) return;

    try {
      const payload = {
        productId: product._id,
        variantSku: defaultVariant.sku,
        quantity: 1,
        ...(!isAuthenticated && { guestId })
      };
      const res = await API.post('/cart', payload);
      dispatch(cartSuccess(res.data.data));
      addToast(`${product.name} added to bag!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add item to bag', 'error');
    }
  };

  const handleAddWishlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Please sign in to save items to your wishlist.', 'info');
      return;
    }

    try {
      await API.post('/wishlist', { productId: product._id });
      addToast(`${product.name} added to wishlist!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add item to wishlist', 'error');
    }
  };

  return (
    <div className="group relative bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <Link to={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-zinc-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={handleAddWishlist}
            className="p-2 bg-white/80 dark:bg-premium-card/85 backdrop-blur-xs rounded-full shadow-sm hover:text-red-500 dark:hover:text-red-400 hover:bg-white transition"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">{product.brand}</span>
            <div className="flex items-center gap-0.5 text-premium-accent text-xs font-semibold">
              <Star className="h-3 w-3 fill-current" />
              <span>{product.ratings > 0 ? product.ratings : 'New'}</span>
            </div>
          </div>

          <Link to={`/products/${product.slug}`}>
            <h3 className="text-xs font-semibold text-zinc-950 dark:text-zinc-50 group-hover:text-premium-accent transition truncate">
              {product.name}
            </h3>
          </Link>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-zinc-400 dark:text-zinc-600 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0}
            className="p-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
