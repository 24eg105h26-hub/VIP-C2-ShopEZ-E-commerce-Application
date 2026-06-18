import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, ShoppingCart, Heart, ShieldAlert, Award, Reply, Check, ChevronDown, ChevronUp, Sparkles, MapPin } from 'lucide-react';
import { cartSuccess } from '../redux/cartSlice';
import { DetailSkeleton } from '../components/common/SkeletonScreen';
import ProductCard from '../components/common/ProductCard';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { guestId } = useSelector((state) => state.cart);
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Epic Sale countdown state
  const [countdown, setCountdown] = useState({ hrs: 8, mins: 49, secs: 28 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hrs > 0) return { hrs: prev.hrs - 1, mins: 59, secs: 59 };
        return { hrs: 8, mins: 49, secs: 28 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Pincode validation states
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  
  const handlePincodeCheck = (e) => {
    e.preventDefault();
    if (!pincode) return;
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      setPincodeStatus({
        success: true,
        message: 'Fast Delivery by tomorrow & Cash on Delivery available!'
      });
      addToast('Delivery is available for this pincode.', 'success');
    } else {
      setPincodeStatus({
        success: false,
        message: 'Please enter a valid 6-digit Indian pincode.'
      });
      addToast('Invalid pincode.', 'error');
    }
  };

  // Bank offer states
  const [appliedOffer, setAppliedOffer] = useState(null);
  const handleApplyOffer = (bankName, discountStr) => {
    setAppliedOffer(bankName);
    addToast(`Wow Deal: ${bankName} card discount of ${discountStr} applied to this item!`, 'success');
  };

  // Buy Now direct checkout redirect
  const handleBuyNow = async () => {
    if (!product || !selectedVariant) return;
    try {
      const payload = {
        productId: product._id,
        variantSku: selectedVariant.sku,
        quantity: qty,
        ...(!isAuthenticated && { guestId })
      };
      const res = await API.post('/cart', payload);
      dispatch(cartSuccess(res.data.data));
      addToast('Direct checkout initiated!', 'success');
      navigate('/checkout');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error processing Buy Now', 'error');
    }
  };

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/products/${slug}`);
      const prod = res.data.data;
      setProduct(prod);
      setActiveImage(prod.images[0]);
      if (prod.variants && prod.variants.length > 0) {
        setSelectedVariant(prod.variants[0]);
      }

      // Fetch reviews
      const revRes = await API.get(`/reviews/${prod._id}`);
      setReviews(revRes.data.data);

      // Fetch related products
      const relatedRes = await API.get(`/products/${slug}/related`);
      setRelatedProducts(relatedRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [slug]);

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    if (variant.images && variant.images.length > 0) {
      setActiveImage(variant.images[0]);
    }
    setQty(1);
  };

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;

    try {
      const payload = {
        productId: product._id,
        variantSku: selectedVariant.sku,
        quantity: qty,
        ...(!isAuthenticated && { guestId })
      };
      const res = await API.post('/cart', payload);
      dispatch(cartSuccess(res.data.data));
      addToast('Product added to bag!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error adding to bag', 'error');
    }
  };

  const handleAddWishlist = async () => {
    if (!isAuthenticated) {
      addToast('Please sign in to save items to your wishlist.', 'info');
      return;
    }
    try {
      await API.post('/wishlist', { productId: product._id });
      addToast('Product saved to wishlist!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error saving to wishlist', 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    try {
      await API.post(`/reviews/${product._id}`, {
        rating: newRating,
        comment: newComment
      });
      setNewComment('');
      addToast('Thank you for your feedback! Review submitted.', 'success');
      fetchProductDetails(); // refresh listings
    } catch (err) {
      setReviewError(err.response?.data?.message || 'You must purchase this product to review it.');
    }
  };

  if (loading) {
    return <DetailSkeleton />;

  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-semibold text-zinc-400">Product details could not be found.</p>
        <button onClick={() => navigate('/catalog')} className="mt-4 text-xs font-bold text-premium-accent uppercase">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-12">
      
      {/* Product Information Card Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Visual Assets */}
        <div className="space-y-4">
          <div className="aspect-square w-full overflow-hidden bg-zinc-100 rounded-2xl border border-zinc-200 dark:border-premium-border/40">
            <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={`w-16 h-16 rounded-lg overflow-hidden border transition ${activeImage === img ? 'border-premium-accent scale-95' : 'border-zinc-200 dark:border-premium-border'}`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Descriptions & Actions */}
        <div className="space-y-6">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">{product.brand}</span>
            <h1 className="text-2xl md:text-3xl font-bold mt-1 text-zinc-950 dark:text-zinc-50">{product.name}</h1>
            <div className="flex items-center gap-1.5 mt-2 text-premium-accent text-xs font-semibold">
              <Star className="h-4 w-4 fill-current" />
              <span>{product.ratings > 0 ? `${product.ratings} Stars` : 'No reviews'}</span>
              <span className="text-zinc-400 font-light">({product.numReviews} ratings)</span>
            </div>
          </div>

          {/* Epic sale ends countdown banner */}
          <div className="bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-bold tracking-wide text-purple-700 dark:text-purple-300 uppercase text-[10px]">
              ⚡ Epic sale ends in
            </span>
            <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
              <span className="bg-purple-600 text-white px-2 py-0.5 rounded font-mono text-xs">{String(countdown.hrs).padStart(2, '0')}</span> Hrs :
              <span className="bg-purple-600 text-white px-2 py-0.5 rounded font-mono text-xs">{String(countdown.mins).padStart(2, '0')}</span> Min :
              <span className="bg-purple-600 text-white px-2 py-0.5 rounded font-mono text-xs">{String(countdown.secs).padStart(2, '0')}</span> Sec
            </div>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed font-light">{product.description}</p>

          <hr className="border-zinc-200 dark:border-premium-border" />

          {/* Overhauled Variant Selector */}
          {product.variants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Select Variant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {product.variants.map((v) => {
                  const vDiscountPercent = v.compareAtPrice && v.compareAtPrice > v.price ? Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100) : 0;
                  const isSelected = selectedVariant?.sku === v.sku;
                  return (
                    <button
                      key={v.sku}
                      type="button"
                      onClick={() => handleVariantSelect(v)}
                      className={`p-3 text-left border rounded-xl transition flex flex-col justify-between min-h-[90px] ${isSelected ? 'border-premium-accent bg-premium-accent/5 font-semibold text-zinc-950 dark:text-zinc-50' : 'border-zinc-200 dark:border-premium-border text-zinc-500 hover:bg-zinc-50 dark:hover:bg-premium-border/20'}`}
                    >
                      <span className="font-bold text-[10px] text-zinc-800 dark:text-zinc-200 uppercase truncate">{v.size || v.color}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {vDiscountPercent > 0 && (
                          <span className="text-green-600 dark:text-green-400 font-extrabold text-[10px]">
                            ↓{vDiscountPercent}%
                          </span>
                        )}
                        {v.compareAtPrice && (
                          <span className="text-[10px] text-zinc-400 line-through">
                            {formatPrice(v.compareAtPrice)}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-xs text-zinc-950 dark:text-zinc-50 mt-1">
                        {formatPrice(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing Details */}
          {(() => {
            const currentPrice = selectedVariant ? selectedVariant.price : product.price;
            const compareAtPrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice;
            const discountPercent = compareAtPrice && compareAtPrice > currentPrice ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100) : 0;
            return (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {discountPercent > 0 && (
                    <span className="text-green-600 dark:text-green-400 font-extrabold text-lg flex items-center gap-0.5">
                      ↓{discountPercent}%
                    </span>
                  )}
                  {compareAtPrice && (
                    <span className="text-sm text-zinc-400 line-through">
                      {formatPrice(compareAtPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-extrabold text-zinc-950 dark:text-zinc-50">
                    {formatPrice(currentPrice)}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-light">+₹89 Protect Promise Fee included</span>
              </div>
            );
          })()}

          {/* WOW DEAL Accordion widget */}
          {(() => {
            const currentPrice = selectedVariant ? selectedVariant.price : product.price;
            const lowestPrice = Math.round(currentPrice * 0.95);
            const emiPrice = Math.round(currentPrice / 3);
            return (
              <div className="border border-purple-500/20 dark:border-premium-border/40 rounded-2xl overflow-hidden bg-white dark:bg-premium-card shadow-sm">
                {/* Accordion header */}
                <div className="bg-purple-600/10 dark:bg-premium-border/10 px-4 py-3 flex items-center justify-between border-b border-purple-500/10 dark:border-premium-border/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                    <Sparkles className="h-4 w-4 shrink-0 text-premium-accent animate-pulse" />
                    <span>WOW DEAL! Apply offers for maximum savings</span>
                  </div>
                </div>

                <div className="p-4 space-y-4 text-xs">
                  {/* Lowest price & EMI */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-premium-border/20">
                    <div>
                      <p className="font-extrabold text-sm text-zinc-900 dark:text-white">{formatPrice(lowestPrice)}</p>
                      <p className="text-[10px] text-zinc-400 font-light">Lowest price for you with bank offer</p>
                    </div>
                    <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-zinc-200 dark:border-premium-border/20 pl-3 sm:pl-0 sm:pr-3">
                      <p className="font-extrabold text-sm text-zinc-900 dark:text-white">OR {formatPrice(emiPrice)} x 3m</p>
                      <p className="text-[10px] text-zinc-400 font-light">Pay {formatPrice(currentPrice)} &bull; No Cost EMI</p>
                    </div>
                  </div>

                  {/* Pincode checker */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-zinc-400">Verify Delivery Details</label>
                    <form onSubmit={handlePincodeCheck} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit Pincode"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="w-full text-xs pl-8 pr-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent outline-none text-zinc-900 dark:text-zinc-50"
                        />
                        <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition shrink-0"
                      >
                        Check
                      </button>
                    </form>
                    {pincodeStatus && (
                      <p className={`text-[10px] font-semibold ${pincodeStatus.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                        {pincodeStatus.success ? '✓' : '✗'} {pincodeStatus.message}
                      </p>
                    )}
                  </div>

                  {/* Bank offers list */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Available Bank offers</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { bank: 'Flipkart Axis', discount: '₹950 off', val: 950 },
                        { bank: 'ICICI Bank', discount: '₹170 off', val: 170 },
                        { bank: 'Flipkart SBI', discount: '₹950 off', val: 950 },
                        { bank: 'HDFC Bank', discount: '₹170 off', val: 170 }
                      ].map((offer) => {
                        const isApplied = appliedOffer === offer.bank;
                        return (
                          <div
                            key={offer.bank}
                            className={`p-2.5 border rounded-lg flex items-center justify-between text-[11px] transition ${isApplied ? 'border-green-500 bg-green-500/5 text-green-700 dark:text-green-400' : 'border-zinc-200 dark:border-premium-border/40 bg-zinc-50/50 dark:bg-premium-border/5 text-zinc-500'}`}
                          >
                            <div>
                              <span className="font-extrabold text-zinc-900 dark:text-zinc-200">{offer.discount}</span>
                              <span className="text-[10px] font-light block">{offer.bank} Card</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyOffer(offer.bank, offer.discount)}
                              className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded transition ${isApplied ? 'bg-green-600 text-white' : 'text-premium-accent hover:underline'}`}
                            >
                              {isApplied ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quantity and Actions */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-4">
              {/* Quantity adjustment */}
              {selectedVariant && (
                <div className="flex items-center border border-zinc-200 dark:border-premium-border rounded-xl bg-zinc-50/50 dark:bg-premium-border/5">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3.5 py-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(selectedVariant.stock, qty + 1))}
                    className="px-3.5 py-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition font-bold"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Add to wishlist */}
              <button
                onClick={handleAddWishlist}
                className="flex-1 sm:flex-initial p-3 border border-zinc-200 dark:border-premium-border rounded-xl hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-50 transition flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </button>
            </div>

            {/* CTA panel buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Add to Bag (outline button) */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-premium-border/20 transition disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Bag
              </button>

              {/* Yellow Buy Now Button */}
              <button
                onClick={handleBuyNow}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-yellow-400 dark:bg-yellow-400 hover:bg-yellow-500 dark:hover:bg-yellow-500 text-zinc-950 font-extrabold rounded-xl text-xs uppercase tracking-widest transition disabled:opacity-50 shadow-md shadow-yellow-400/10"
              >
                Buy Now at {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.price)}
              </button>
            </div>
          </div>

          {selectedVariant && (
            <p className="text-[10px] text-zinc-400">
              Variant SKU: <strong className="text-zinc-500 font-mono">{selectedVariant.sku}</strong> | Stock: <strong className={selectedVariant.stock < 5 ? 'text-red-500 font-bold' : 'text-zinc-500 font-bold'}>{selectedVariant.stock} left</strong>
            </p>
          )}

        </div>
      </section>

      {/* Specifications and Policies Fillers */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-zinc-200 dark:border-premium-border/30 pt-12">
        {/* Specifications */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Technical Specifications</h3>
          <div className="border border-zinc-200 dark:border-premium-border/40 rounded-2xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-premium-border/30 p-3 bg-zinc-50 dark:bg-premium-border/10">
              <span className="font-semibold text-zinc-400">Attribute</span>
              <span className="col-span-2 font-bold text-zinc-850 dark:text-zinc-250">Details</span>
            </div>
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-premium-border/30 p-3">
              <span className="font-medium text-zinc-500">Brand</span>
              <span className="col-span-2 text-zinc-700 dark:text-zinc-300 font-semibold">{product.brand}</span>
            </div>
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-premium-border/30 p-3">
              <span className="font-medium text-zinc-500">Category</span>
              <span className="col-span-2 text-zinc-700 dark:text-zinc-300 capitalize">{product.category?.name || 'N/A'}</span>
            </div>
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-premium-border/30 p-3">
              <span className="font-medium text-zinc-500">Active SKU</span>
              <span className="col-span-2 text-zinc-750 dark:text-zinc-300 font-mono">{selectedVariant ? selectedVariant.sku : 'N/A'}</span>
            </div>
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-premium-border/30 p-3">
              <span className="font-medium text-zinc-500">Inventory Status</span>
              <span className="col-span-2 text-zinc-700 dark:text-zinc-300">
                {product.stock > 0 ? (
                  <span className="text-green-600 font-bold uppercase tracking-wider text-[10px]">In Stock ({product.stock} units)</span>
                ) : (
                  <span className="text-red-500 font-bold uppercase tracking-wider text-[10px]">Out Of Stock</span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 p-3">
              <span className="font-medium text-zinc-500">Tags</span>
              <span className="col-span-2 text-zinc-700 dark:text-zinc-300 truncate">{product.tags?.join(', ') || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Guarantees and Policies */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Shipping & Return Policies</h3>
          <div className="space-y-3">
            <div className="p-4 bg-zinc-50 dark:bg-premium-border/10 rounded-2xl border border-zinc-150 dark:border-premium-border/20 text-xs">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase text-[9px] tracking-wider text-premium-accent">Free Standard Express Delivery</h4>
              <p className="text-zinc-400 mt-1 font-light leading-relaxed">We ship order packages using tracked express priority couriers. Average transit duration is 3 to 4 business days to any destination.</p>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-premium-border/10 rounded-2xl border border-zinc-150 dark:border-premium-border/20 text-xs">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase text-[9px] tracking-wider text-premium-accent">30-Day Escrow Returns Protection</h4>
              <p className="text-zinc-400 mt-1 font-light leading-relaxed">Shop with absolute trust. If your product is not as described, return it inside 30 days for an instant, full refund.</p>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-premium-border/10 rounded-2xl border border-zinc-150 dark:border-premium-border/20 text-xs">
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase text-[9px] tracking-wider text-premium-accent">Genuine Authenticity Certification</h4>
              <p className="text-zinc-400 mt-1 font-light leading-relaxed">All products undergo strict moderation checks by the ShopEZ administration team to verify quality and brand origin legitimacy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="space-y-8 border-t border-zinc-200 dark:border-premium-border pt-12">
        <h2 className="text-lg md:text-xl font-bold">Customer Reviews ({reviews.length})</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Reviews Form block */}
          <div className="space-y-4 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl h-fit">
            <h3 className="text-xs font-bold uppercase tracking-widest">Write a Review</h3>
            {reviewError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Rating</label>
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent"
                >
                  <option value={5}>5 Stars (Excellent)</option>
                  <option value={4}>4 Stars (Very Good)</option>
                  <option value={3}>3 Stars (Average)</option>
                  <option value={2}>2 Stars (Poor)</option>
                  <option value={1}>1 Star (Unacceptable)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Your Feedback</label>
                <textarea
                  rows={4}
                  placeholder="Share details of your experience with this product..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl"
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Reviews List block */}
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-400">
                No reviews yet for this product. Be the first to share your thoughts.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev._id} className="p-5 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 font-bold text-xs flex items-center justify-center border border-zinc-200 dark:border-premium-border">
                        {rev.user?.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{rev.user?.name}</p>
                        <p className="text-[10px] text-zinc-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-premium-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < rev.rating ? 'fill-current' : 'text-zinc-200 dark:text-premium-border'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.isVerified && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider rounded">
                      <Award className="h-3 w-3" />
                      Verified Purchase
                    </span>
                  )}

                  <p className="text-xs text-zinc-500 leading-relaxed font-light">{rev.comment}</p>

                  {/* Seller Reply */}
                  {rev.sellerReply && (
                    <div className="bg-zinc-50 dark:bg-premium-border/30 p-3 rounded-xl border-l-2 border-premium-accent flex gap-2.5 mt-2">
                      <Reply className="h-4 w-4 text-premium-accent shrink-0 rotate-180" />
                      <div>
                        <p className="text-[10px] font-bold text-premium-accent uppercase tracking-wider">Store Response</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-300 font-light mt-0.5">{rev.sellerReply}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 border-t border-zinc-200 dark:border-premium-border pt-12">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Related Products</h2>
            <p className="text-xs text-zinc-400 mt-1">Customers who viewed this item also looked at these</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetail;
