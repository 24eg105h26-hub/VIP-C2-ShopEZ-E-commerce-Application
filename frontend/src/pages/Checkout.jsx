import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShieldCheck, CreditCard, ChevronRight, Award, Trash2, Smartphone, Wallet, Truck, ArrowLeft, Coins, CheckCircle } from 'lucide-react';
import { clearCart } from '../redux/cartSlice';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();

  // States
  const [step, setStep] = useState(1); // 1: Address & Details, 2: Payment, 3: Confirmation
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('stripe'); // cod, stripe, razorpay
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paymentTab, setPaymentTab] = useState('card'); // 'card', 'upi', 'wallet', 'cod'
  const [cardHolder, setCardHolder] = useState('');
  const [upiTimer, setUpiTimer] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    if (paymentTab === 'card') setPaymentMethod('stripe');
    else if (paymentTab === 'upi') setPaymentMethod('razorpay');
    else if (paymentTab === 'wallet') setPaymentMethod('stripe');
    else if (paymentTab === 'cod') setPaymentMethod('cod');
  }, [paymentTab]);

  useEffect(() => {
    let interval = null;
    if (step === 2 && paymentTab === 'upi') {
      interval = setInterval(() => {
        setUpiTimer((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
    } else {
      setUpiTimer(300);
    }
    return () => clearInterval(interval);
  }, [step, paymentTab]);

  const formatUpiTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const [createdOrderId, setCreatedOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  useEffect(() => {
    if (createdOrderId) {
      API.get(`/orders/${createdOrderId}`)
        .then(res => {
          setPlacedOrderDetails(res.data.data);
        })
        .catch(err => console.error(err));
    }
  }, [createdOrderId]);

  useEffect(() => {
    if (items.length === 0 && step <= 2) {
      navigate('/catalog');
    }
    // Set default user address if present
    if (user?.addresses && user.addresses.length > 0) {
      const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setStreet(def.street);
      setCity(def.city);
      setState(def.state);
      setPostalCode(def.postalCode);
      setCountry(def.country);
      setPhone(def.phone);
      setSelectedAddressId(def._id);
    }
  }, [items, user, step]);

  const subtotal = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    try {
      const res = await API.post('/orders/coupon/validate', {
        couponCode: couponCode.trim(),
        subtotal
      });
      const { code, discountAmount } = res.data.coupon;
      setAppliedCoupon(code);
      setDiscountValue(discountAmount);
      addToast(`Promo code ${code} applied successfully! Discount: ${formatPrice(discountAmount)}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid or expired coupon code.', 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountValue(0);
    setCouponCode('');
  };

  const shippingPrice = subtotal > 999 ? 0 : 99;
  const taxPrice = Math.round(subtotal * 0.18); // 18% GST in India
  const total = subtotal + shippingPrice + taxPrice - discountValue;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const addressPayload = { street, city, state, postalCode, country, phone };
      const orderPayload = {
        cartItems: items.map(item => ({
          product: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          variantSku: item.variantSku
        })),
        shippingAddress: addressPayload,
        paymentMethod,
        couponCode: appliedCoupon
      };

      // 1. Submit Order
      const res = await API.post('/orders', orderPayload);
      setCreatedOrderId(res.data.orderId);

      // 2. Perform Payment simulation if not COD
      if (paymentMethod === 'stripe') {
        // Mock Stripe PaymentIntent resolution
        await API.post('/orders/webhook/stripe', {
          type: 'payment_intent.succeeded',
          data: {
            object: {
              metadata: { orderId: res.data.orderId }
            }
          }
        });
      } else if (paymentMethod === 'razorpay') {
        // Verify signature emulation
        await API.post('/orders/verify-razorpay', {
          orderId: res.data.orderId,
          razorpayOrderId: res.data.razorpayOrderId,
          razorpayPaymentId: 'pay_rzp_mock_123',
          razorpaySignature: 'sig_rzp_mock_123'
        });
      }

      // 3. Clear cart in store & redirect to success page
      dispatch(clearCart());
      addToast('Order placed successfully!', 'success');
      navigate(`/order-success/${res.data.orderId}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to place order. Check stock levels.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Steps bar */}
      <div className="flex items-center justify-center gap-2 md:gap-4 p-4 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl">
        <span className={`text-xs font-bold uppercase tracking-wider ${step >= 1 ? 'text-premium-accent' : 'text-zinc-400'}`}>1. Details</span>
        <ChevronRight className="h-4 w-4 text-zinc-400" />
        <span className={`text-xs font-bold uppercase tracking-wider ${step >= 2 ? 'text-premium-accent' : 'text-zinc-400'}`}>2. Payment</span>
        <ChevronRight className="h-4 w-4 text-zinc-400" />
        <span className={`text-xs font-bold uppercase tracking-wider ${step >= 3 ? 'text-premium-accent' : 'text-zinc-400'}`}>3. Review</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Flow Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {step === 1 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest pb-3 border-b border-zinc-100 dark:border-premium-border">Shipping Address</h3>
              
              {/* Saved Addresses list */}
              {user?.addresses && user.addresses.length > 0 && (
                <div className="space-y-3 pb-4 border-b border-zinc-100 dark:border-premium-border/40">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400">Choose Saved Destination</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {user.addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id || 
                        (street === addr.street && city === addr.city && state === addr.state && postalCode === addr.postalCode && country === addr.country && phone === addr.phone);
                      return (
                        <button
                          key={addr._id}
                          type="button"
                          onClick={() => {
                            setStreet(addr.street);
                            setCity(addr.city);
                            setState(addr.state);
                            setPostalCode(addr.postalCode);
                            setCountry(addr.country);
                            setPhone(addr.phone);
                            setSelectedAddressId(addr._id);
                          }}
                          className={`p-3 text-left border rounded-xl text-xs transition flex flex-col gap-1.5 ${isSelected ? 'border-premium-accent bg-premium-accent/5 font-semibold text-zinc-950 dark:text-zinc-50' : 'border-zinc-200 dark:border-premium-border text-zinc-500 hover:bg-zinc-50 dark:hover:bg-premium-border/20'}`}
                        >
                          <span className="font-bold text-[8px] tracking-wider text-premium-accent uppercase">Saved Address</span>
                          <span className="truncate font-semibold">{addr.street}, {addr.city}</span>
                          <span className="text-[10px] text-zinc-400">{addr.state} {addr.postalCode}, {addr.country}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStreet('');
                      setCity('');
                      setState('');
                      setPostalCode('');
                      setCountry('');
                      setPhone('');
                      setSelectedAddressId('new');
                    }}
                    className="text-[10px] uppercase font-bold text-premium-accent hover:underline mt-1"
                  >
                    Ship to a new address
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none text-zinc-850 dark:text-zinc-50"
                    placeholder="Street, appt number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none text-zinc-850 dark:text-zinc-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none text-zinc-850 dark:text-zinc-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none text-zinc-850 dark:text-zinc-50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none text-zinc-850 dark:text-zinc-50"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent outline-none text-zinc-850 dark:text-zinc-50"
                    placeholder="+1555..."
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (street && city && state && postalCode && country && phone) {
                    setStep(2);
                  } else {
                    addToast('Please fill out all address details.', 'info');
                  }
                }}
                className="w-full py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition mt-4"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-3xl space-y-6 shadow-xl">
              
              {/* Simulator Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-premium-border/40">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-premium-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Gateway Payment Simulator</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-premium-accent hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Edit Order
                </button>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'card', label: 'Credit Card', icon: CreditCard },
                  { id: 'upi', label: 'UPI QR', icon: Smartphone },
                  { id: 'wallet', label: 'Shop Wallet', icon: Wallet },
                  { id: 'cod', label: 'Cash On Delivery', icon: Coins }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = paymentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaymentTab(tab.id)}
                      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition text-center ${isActive ? 'border-premium-accent bg-premium-accent/5 font-extrabold text-premium-accent shadow-sm' : 'border-zinc-200 dark:border-premium-border text-zinc-400 hover:bg-zinc-55 dark:hover:bg-premium-border/10'}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] uppercase font-bold tracking-wide">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Sub-Panels based on selected tab */}
              <div className="space-y-6">
                
                {/* 1. CREDIT CARD Panel */}
                {paymentTab === 'card' && (
                  <div className="space-y-6">
                    {/* Visual Shopez Premium Card */}
                    <div className="relative w-full max-w-xs sm:max-w-sm mx-auto aspect-[1.586] rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white p-6 shadow-xl flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold tracking-widest text-[11px] sm:text-xs italic bg-white/10 px-2 py-0.5 rounded-md">SHOPEZ PREMIUM</span>
                        <CreditCard className="h-5 w-5 stroke-[1.5]" />
                      </div>
                      
                      {/* Chip */}
                      <div className="w-9 h-7 bg-amber-400/80 rounded-md border border-amber-300/40 relative overflow-hidden mt-1">
                        <div className="absolute inset-x-2 top-0 bottom-0 border-x border-zinc-950/20" />
                        <div className="absolute inset-y-2 left-0 right-0 border-y border-zinc-950/20" />
                      </div>

                      {/* Card Number block */}
                      <div className="text-lg sm:text-xl font-mono tracking-widest text-center my-3 font-semibold select-none">
                        {(() => {
                          const cleaned = cardNum.replace(/\s?/g, '');
                          const padded = cleaned.padEnd(16, '•');
                          const parts = padded.match(/.{1,4}/g) || [];
                          return parts.join(' ');
                        })()}
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-end text-[9px] uppercase font-mono tracking-wider">
                        <div className="min-w-0 flex-1 pr-4">
                          <span className="text-[8px] opacity-70 block mb-0.5">Card Holder</span>
                          <span className="font-bold text-xs truncate block">{cardHolder.trim() || 'YOUR FULL NAME'}</span>
                        </div>
                        <div className="flex gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[8px] opacity-70 block mb-0.5">Expires</span>
                            <span className="font-bold text-xs">{cardExpiry || 'MM/YY'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] opacity-70 block mb-0.5">CVV</span>
                            <span className="font-bold text-xs">{cardCvc ? '•••' : '•••'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sandbox Alert Info */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200/40 dark:border-purple-900/30 rounded-2xl text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2.5">
                      <CheckCircle className="h-4.5 w-4.5 text-premium-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold uppercase tracking-wider text-[9px] mb-1">💳 Sandbox Validations Info</p>
                        <p className="font-light">Type mock credentials to complete payment (e.g. Card: <strong>4242 4242 4242 4242</strong>, Expiry: <strong>12/29</strong>, CVV: <strong>123</strong>).</p>
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Card Number</label>
                        <input
                          type="text"
                          maxLength={16}
                          placeholder="e.g. 4242424242424242"
                          value={cardNum}
                          onChange={(e) => setCardNum(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Expiry MM/YY</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="e.g. 12/29"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">CVV / CVC</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="e.g. 123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-3 bg-zinc-50 dark:bg-premium-border border-none rounded-xl focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. UPI QR Scanner Panel */}
                {paymentTab === 'upi' && (
                  <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-premium-border/10 rounded-2xl border border-zinc-200 dark:border-premium-border/30 max-w-sm mx-auto space-y-4 shadow-sm">
                    <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">UPI Scan & Pay Simulator</span>
                    <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-md">
                      <svg className="w-44 h-44 text-zinc-950" viewBox="0 0 100 100">
                        <rect x="0" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="5" />
                        <rect x="5" y="5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" />
                        <rect x="0" y="75" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="5" />
                        <rect x="5" y="80" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" />
                        <rect x="75" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="5" />
                        <rect x="80" y="5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path d="M 35,5 H 45 V 15 H 35 Z M 50,5 H 60 V 10 H 50 Z M 65,5 H 70 V 20 H 65 Z M 35,25 H 40 V 35 H 35 Z M 45,30 H 55 V 35 H 45 Z M 60,25 H 70 V 30 H 60 Z M 5,35 H 15 V 45 H 5 Z M 20,35 H 30 V 40 H 20 Z M 35,45 H 40 V 55 H 35 Z M 45,45 H 55 V 50 H 45 Z M 60,45 H 65 V 55 H 60 Z M 70,45 H 75 V 60 H 70 Z M 80,35 H 90 V 45 H 80 Z M 5,55 H 10 V 65 H 5 Z M 15,55 H 25 V 60 H 15 Z M 25,60 H 30 V 70 H 25 Z M 35,65 H 45 V 70 H 35 Z M 50,60 H 55 V 75 H 50 Z M 60,65 H 65 V 80 H 60 Z M 75,70 H 90 V 75 H 75 Z M 75,80 H 80 V 90 H 75 Z M 85,85 H 90 V 90 H 85 Z" fill="currentColor" />
                        <rect x="38" y="38" width="24" height="24" rx="4" fill="white" stroke="currentColor" strokeWidth="2" />
                        <text x="50" y="52" fontSize="7" fontWeight="bold" fill="currentColor" textAnchor="middle">EZ</text>
                      </svg>
                    </div>
                    <div className="flex items-center gap-1.5 bg-red-500/15 text-red-650 dark:text-red-400 text-[10px] px-3 py-1 rounded-full font-mono font-bold animate-pulse">
                      QR Code expires in: {formatUpiTime(upiTimer)}
                    </div>
                    <div className="text-center space-y-1.5">
                      <p className="font-extrabold text-xs text-zinc-850 dark:text-zinc-200">Scan QR Code to pay {formatPrice(total)}</p>
                      <p className="text-[10px] text-zinc-400 font-light leading-relaxed">Sandbox Payment Auto-Authorized upon Scan Simulation detection.</p>
                    </div>
                  </div>
                )}

                {/* 3. SHOP WALLET Panel */}
                {paymentTab === 'wallet' && (
                  <div className="flex flex-col p-6 bg-zinc-50 dark:bg-premium-border/10 rounded-2xl border border-zinc-200 dark:border-premium-border/30 max-w-sm mx-auto space-y-4 shadow-sm">
                    <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px] text-center">Shop Wallet Balance</span>
                    <div className="flex justify-between items-center bg-white dark:bg-premium-card p-4 border border-zinc-200 dark:border-premium-border/50 rounded-xl">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-zinc-400">Current Balance</p>
                        <p className="text-base font-extrabold text-green-600 dark:text-green-400">₹25,000</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] uppercase font-bold text-zinc-400">Bill Charge</p>
                        <p className="text-sm font-extrabold text-red-500">-{formatPrice(total)}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-100 dark:bg-premium-border/20 rounded-lg text-center text-[10px] text-zinc-500 font-light">
                      Remaining wallet balance after order confirmation will be <span className="font-bold text-zinc-800 dark:text-zinc-250">{formatPrice(25000 - total)}</span>.
                    </div>
                  </div>
                )}

                {/* 4. CASH ON DELIVERY Panel */}
                {paymentTab === 'cod' && (
                  <div className="flex flex-col p-6 bg-zinc-50 dark:bg-premium-border/10 rounded-2xl border border-zinc-200 dark:border-premium-border/30 max-w-sm mx-auto space-y-3 text-center shadow-sm">
                    <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">Cash on Delivery</span>
                    <Truck className="h-8 w-8 text-premium-accent mx-auto" />
                    <p className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">No advance payment required</p>
                    <p className="text-[10px] text-zinc-400 font-light max-w-xs mx-auto leading-relaxed">
                      You can pay via Cash or local UPI QR scanner code upon package arrival at your shipping destination address.
                    </p>
                  </div>
                )}

              </div>

              {/* Bottom Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-zinc-200 dark:border-premium-border text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-50 dark:hover:bg-premium-border transition text-zinc-800 dark:text-zinc-200"
                >
                  Back to Address
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (paymentTab === 'card') {
                      if (!cardHolder || !cardNum || !cardExpiry || !cardCvc) {
                        addToast('Please fill out card details.', 'info');
                        return;
                      }
                      if (cardNum.length < 16) {
                        addToast('Please enter a valid 16-digit card number.', 'error');
                        return;
                      }
                    }
                    if (paymentTab === 'wallet' && total > 25000) {
                      addToast('Insufficient funds in Shop Wallet.', 'error');
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-1 py-3 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition shadow-md"
                >
                  Continue to Review
                </button>
              </div>

            </div>
          )}

          {step === 3 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest pb-3 border-b border-zinc-100 dark:border-premium-border">Review Your Order</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* Shipping Details */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400">Shipping Destination</h4>
                  <div className="p-4 bg-zinc-50 dark:bg-premium-border/10 rounded-xl space-y-1 text-zinc-700 dark:text-zinc-300">
                    <p className="font-semibold text-zinc-850 dark:text-zinc-100">{street}</p>
                    <p>{city}, {state} {postalCode}</p>
                    <p>{country}</p>
                    <p className="text-zinc-400 mt-1 font-mono text-[10px]">Contact: {phone}</p>
                  </div>
                </div>

                {/* Payment Option */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400">Payment Summary</h4>
                  <div className="p-4 bg-zinc-50 dark:bg-premium-border/10 rounded-xl space-y-1.5 text-zinc-700 dark:text-zinc-300">
                    <p className="font-semibold text-zinc-850 dark:text-zinc-100 uppercase">{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</p>
                    {(paymentMethod === 'stripe' || paymentMethod === 'razorpay') && (
                      <p className="text-zinc-400 font-mono text-[10px]">
                        Card ending: **** **** **** {cardNum.slice(-4) || '1234'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Summary in checkout review */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-zinc-400">Order Items ({items.length})</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-xs justify-between items-center bg-zinc-50 dark:bg-premium-border/10 p-2.5 rounded-xl border border-zinc-100 dark:border-premium-border/10">
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">SKU: {item.variantSku} | Qty: {item.quantity}</p>
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 border-t border-zinc-100 dark:border-premium-border/20 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-zinc-200 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-50 dark:hover:bg-premium-border transition text-zinc-800 dark:text-zinc-200"
                >
                  Back to Payment
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 py-3 bg-premium-accent text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-md shadow-premium-accent/20"
                >
                  {loading ? 'Processing Order...' : `Confirm & Place Order`}
                </button>
              </div>

            </div>
          )}

        </div>

          {/* Pricing Invoice Summary column */}
          <div className="space-y-6">
            
            {/* Promo Code Coupon block */}
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest">Apply Promo</h4>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-premium-accent/15 text-premium-accent rounded-xl text-xs">
                  <span className="font-semibold">{appliedCoupon} Applied</span>
                  <button onClick={handleRemoveCoupon} className="p-1 hover:bg-premium-accent/20 rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold rounded-lg uppercase"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Price invoice break down */}
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest pb-3 border-b border-zinc-100 dark:border-premium-border">Invoice Summary</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Items Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-green-500 font-medium">
                    <span>Discount Code</span>
                    <span>-{formatPrice(discountValue)}</span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500">
                  <span>Shipping Fee</span>
                  <span>{shippingPrice === 0 ? 'Free' : formatPrice(shippingPrice)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Estimated Tax</span>
                  <span>{formatPrice(taxPrice)}</span>
                </div>
                <hr className="border-zinc-200 dark:border-premium-border" />
                <div className="flex justify-between font-bold text-sm">
                  <span>Grand Total</span>
                  <span className="text-premium-accent">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

          </div>

      </div>
    </div>
  );
};

export default Checkout;
