import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, MapPin, User, Plus, Trash2, ShieldCheck, Mail, Calendar, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { updateUserProfile } from '../redux/authSlice';
import API from '../services/api';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const CustomerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const { addToast } = useToast();

  // Tabs: 1: Profile & Addresses, 2: Order History
  const [activeTab, setActiveTab] = useState(1);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // New Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  const [expandedOrders, setExpandedOrders] = useState({});
  const [copiedOrderId, setCopiedOrderId] = useState('');

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    addToast('Order ID copied to clipboard!', 'success');
    setTimeout(() => setCopiedOrderId(''), 2000);
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'Placed': return 1;
      case 'Confirmed': return 1;
      case 'Packed': return 2;
      case 'Shipped': return 3;
      case 'Out For Delivery': return 4;
      case 'Delivered': return 5;
      default: return 1;
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await API.get('/orders/my-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'orders') {
      setActiveTab(2);
    }
  }, [location.search]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const newAddress = { street, city, state, postalCode, country, phone, isDefault: !user.addresses || user.addresses.length === 0 };
      const res = await API.post('/auth/address', newAddress);
      dispatch(updateUserProfile({ addresses: res.data.data }));
      
      setStreet('');
      setCity('');
      setState('');
      setPostalCode('');
      setCountry('');
      setPhone('');
      setShowAddressForm(false);
      addToast('Address added successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save address.', 'error');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await API.delete(`/auth/address/${addressId}`);
      dispatch(updateUserProfile({ addresses: res.data.data }));
      addToast('Address removed.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete address.', 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await API.put(`/orders/${orderId}/cancel`);
      addToast('Order cancelled successfully!', 'success');
      fetchOrders();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      addToast('Popup blocked! Please allow popups to print invoices.', 'error');
      return;
    }
    const itemsHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 12px 0; font-size: 12px;">
          <div style="font-weight: 600; color: #18181b;">${item.name}</div>
          <div style="font-size: 10px; color: #71717a; margin-top: 2px;">SKU: ${item.variantSku}</div>
        </td>
        <td style="padding: 12px 0; font-size: 12px; text-align: center; color: #3f3f46;">${item.quantity}</td>
        <td style="padding: 12px 0; font-size: 12px; text-align: right; color: #18181b; font-weight: 600;">₹${item.price.toLocaleString('en-IN')}</td>
        <td style="padding: 12px 0; font-size: 12px; text-align: right; color: #18181b; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - #${order._id}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #18181b;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
          }
          .invoice-container {
            max-w: 700px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f4f4f5;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.05em;
            color: #18181b;
          }
          .logo span {
            color: #d946ef;
          }
          .title {
            text-align: right;
          }
          .title h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .title p {
            margin: 5px 0 0 0;
            font-size: 11px;
            color: #71717a;
          }
          .details {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          .details h3 {
            margin: 0 0 8px 0;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #71717a;
          }
          .details p {
            margin: 0;
            line-height: 1.5;
            color: #27272a;
          }
          .table-container {
            margin-top: 40px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #71717a;
            border-bottom: 2px solid #f4f4f5;
            padding-bottom: 10px;
          }
          .totals {
            margin-top: 30px;
            margin-left: auto;
            width: 250px;
            font-size: 12px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            color: #71717a;
          }
          .totals-row.grand {
            border-top: 2px solid #f4f4f5;
            font-weight: 700;
            color: #18181b;
            font-size: 14px;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #f4f4f5;
            padding-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #a1a1aa;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="logo">shop<span>EZ</span></div>
            <div class="title">
              <h1>Invoice</h1>
              <p>Order ID: #${order._id}</p>
              <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="details">
            <div>
              <h3>Billed To:</h3>
              <p><strong>${order.user?.name || 'Customer'}</strong></p>
              <p>${order.user?.email || ''}</p>
            </div>
            <div style="text-align: right;">
              <h3>Shipping Address:</h3>
              <p>${order.shippingAddress.street}</p>
              <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
              <p>${order.shippingAddress.country}</p>
              <p>Phone: ${order.shippingAddress.phone}</p>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Item Description</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 100px;">Price</th>
                  <th style="text-align: right; width: 100px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>
          
          <div class="totals">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>₹${(order.totalPrice - order.taxPrice - order.shippingPrice + order.discountAmount).toLocaleString('en-IN')}</span>
            </div>
            ${order.discountAmount > 0 ? `
            <div class="totals-row" style="color: #22c55e;">
              <span>Discount</span>
              <span>-₹${order.discountAmount.toLocaleString('en-IN')}</span>
            </div>
            ` : ''}
            <div class="totals-row">
              <span>Shipping</span>
              <span>${order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice.toLocaleString('en-IN')}`}</span>
            </div>
            <div class="totals-row">
              <span>Estimated Tax</span>
              <span>₹${order.taxPrice.toLocaleString('en-IN')}</span>
            </div>
            <div class="totals-row grand">
              <span>Grand Total</span>
              <span style="color: #d946ef;">₹${order.totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing shopEZ. For support, email support@shopez.com</p>
            <p>&copy; ${new Date().getFullYear()} shopEZ Inc. All rights reserved.</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
  };

  const getStepNumber = (status) => {
    switch (status) {
      case 'Placed': return 1;
      case 'Confirmed': return 2;
      case 'Packed': return 2;
      case 'Shipped': return 3;
      case 'Out For Delivery': return 3;
      case 'Delivered': return 4;
      default: return 1;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider">Customer Portal</h1>
        <p className="text-xs text-zinc-400 mt-1">Manage your profile information, default shipping addresses, and track order histories</p>
      </div>

      {/* Tab select buttons */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-premium-border/50">
        <button
          onClick={() => setActiveTab(1)}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${activeTab === 1 ? 'border-premium-accent text-premium-accent font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
        >
          Profile & Addresses
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${activeTab === 2 ? 'border-premium-accent text-premium-accent font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
        >
          Order History ({orders.length})
        </button>
      </div>

      {activeTab === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Profile overview card */}
          <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl space-y-6 h-fit">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold flex items-center justify-center text-lg border border-premium-accent">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{user?.name}</h3>
                <span className="inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase bg-premium-accent/15 text-premium-accent rounded">
                  {user?.role}
                </span>
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-premium-border" />

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-500">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <ShieldCheck className="h-4 w-4 text-zinc-400" />
                <span>Verified Buyer</span>
              </div>
            </div>
          </div>

          {/* Addresses list column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest">Saved Addresses</h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-1 text-[10px] uppercase font-bold text-premium-accent hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New
                </button>
              </div>

              {/* Address insert form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="p-4 bg-zinc-50 dark:bg-premium-border/30 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-lg"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-lg"
                      required
                    />
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Contact Phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] uppercase font-bold rounded-lg"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-zinc-200 text-[10px] uppercase font-bold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses listings */}
              {!user.addresses || user.addresses.length === 0 ? (
                <p className="text-xs text-zinc-400">No saved addresses found. Click "Add New" to save one.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.addresses.map((addr, idx) => (
                    <div key={idx} className="p-4 border border-zinc-100 dark:border-premium-border/40 rounded-xl space-y-2 relative group">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <MapPin className="h-4 w-4" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Address {idx + 1}</span>
                        {addr.isDefault && (
                          <span className="text-[8px] bg-green-50 text-green-600 px-1 rounded font-bold uppercase">Default</span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {addr.street}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                      </p>
                      <p className="text-[10px] text-zinc-400">Phone: {addr.phone}</p>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Tab 2: Order History */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-4 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Order History ({orders.length})</h3>
          </div>
          
          {loadingOrders ? (
            <p className="text-xs text-zinc-400 text-center py-12">Fetching orders...</p>
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-12 text-center text-zinc-400 rounded-3xl">
              <ShoppingBag className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <p className="text-xs font-semibold">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((ord) => {
                const isExpanded = expandedOrders[ord._id];
                const estDeliveryDate = new Date(new Date(ord.createdAt).getTime() + 3*24*60*60*1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                const formattedDate = new Date(ord.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                const subtotal = ord.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                
                return (
                  <div key={ord._id} className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-3xl p-6 shadow-sm space-y-4 transition">
                    
                    {/* Collapsible Order Header Card */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] uppercase font-bold text-zinc-400">
                        
                        {/* Identifier block */}
                        <div>
                          <p className="mb-1">Order Identifier</p>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs bg-purple-50 dark:bg-purple-950/20 text-premium-accent px-2 py-0.5 rounded font-semibold text-[11px] select-all">
                              {ord._id}
                            </span>
                            <button 
                              onClick={() => handleCopyId(ord._id)} 
                              className="p-1 hover:bg-zinc-150 dark:hover:bg-premium-border rounded transition text-zinc-400 hover:text-zinc-650"
                              title="Copy Order ID"
                            >
                              {copiedOrderId === ord._id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Date placed */}
                        <div>
                          <p className="mb-1">Date Placed</p>
                          <span className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold normal-case">
                            {formattedDate}
                          </span>
                        </div>

                        {/* Estimated delivery */}
                        {ord.orderStatus !== 'Cancelled' && ord.orderStatus !== 'Returned' && (
                          <div>
                            <p className="mb-1">Estimated Delivery</p>
                            <span className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold normal-case">
                              {estDeliveryDate}
                            </span>
                          </div>
                        )}

                        {/* Total invoice */}
                        <div>
                          <p className="mb-1">Total Invoice</p>
                          <span className="text-zinc-900 dark:text-white text-sm font-bold">
                            {formatPrice(ord.totalPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Status and chevron down/up */}
                      <div className="flex items-center gap-3">
                        {/* Payment badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                          ord.paymentStatus === 'paid' 
                            ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 border-green-200/40' 
                            : ord.paymentStatus === 'refunded'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/40'
                            : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-200/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ord.paymentStatus === 'paid' ? 'bg-green-500' : ord.paymentStatus === 'refunded' ? 'bg-blue-500' : 'bg-yellow-550'
                          }`}></span>
                          {ord.paymentStatus === 'paid' ? 'Paid' : ord.paymentStatus}
                        </span>

                        {/* Order status badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                          ord.orderStatus === 'Delivered' 
                            ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 border-green-200/40' 
                            : ord.orderStatus === 'Cancelled'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-200/40'
                            : 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            ord.orderStatus === 'Delivered' ? 'bg-green-500' : ord.orderStatus === 'Cancelled' ? 'bg-red-500' : 'bg-orange-500'
                          }`}></span>
                          {ord.orderStatus === 'Placed' ? 'Processing' : ord.orderStatus}
                        </span>

                        {/* Chevron collapse trigger */}
                        <button
                          onClick={() => setExpandedOrders(prev => ({ ...prev, [ord._id]: !isExpanded }))}
                          className="p-1.5 bg-zinc-50 dark:bg-premium-border/30 hover:bg-zinc-100 dark:hover:bg-premium-border rounded-lg text-zinc-500 transition ml-2"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Detailed Order Timeline Card Body */}
                    {isExpanded && (
                      <div className="pt-6 border-t border-zinc-150 dark:border-premium-border/40 space-y-6">
                        
                        {/* Stepper block */}
                        <div className="bg-zinc-50 dark:bg-premium-border/10 p-5 rounded-2xl border border-zinc-100 dark:border-premium-border/10">
                          <div className="flex items-center gap-2.5 text-xs text-zinc-500">
                            <span className="w-2 h-2 rounded-full bg-premium-accent"></span>
                            <span className="font-semibold uppercase tracking-wider text-zinc-400 text-[10px]">Shipment Milestone</span>
                          </div>
                          
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-2">
                            {ord.orderStatus === 'Cancelled' ? 'This order has been cancelled.' : ord.orderStatus === 'Returned' ? 'This order has been returned.' : 'We are processing your order items.'}
                          </p>

                          {/* 5 Stage Stepper bar */}
                          {ord.orderStatus !== 'Cancelled' && ord.orderStatus !== 'Returned' && (
                            <div className="px-2 mt-6 mb-2">
                              <div className="flex items-center justify-between relative">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-premium-border/50 -translate-y-1/2 z-0"></div>
                                <div 
                                  className="absolute top-1/2 left-0 h-0.5 bg-premium-accent -translate-y-1/2 z-0 transition-all duration-300"
                                  style={{ width: `${((getStepIndex(ord.orderStatus) - 1) / 4) * 100}%` }}
                                ></div>
                                {['PROCESSING', 'PACKED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED'].map((step, sIdx) => {
                                  const stepNum = sIdx + 1;
                                  const currentStep = getStepIndex(ord.orderStatus);
                                  const isCompleted = currentStep >= stepNum;
                                  const isActive = currentStep === stepNum;
                                  return (
                                    <div key={step} className="flex flex-col items-center z-10 relative">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                                        isCompleted 
                                          ? 'bg-premium-accent text-white scale-110 shadow-md shadow-premium-accent/20' 
                                          : 'bg-zinc-200 dark:bg-premium-border text-zinc-500'
                                      }`}>
                                        {stepNum}
                                      </div>
                                      <span className={`text-[8px] font-bold tracking-wider mt-2 ${
                                        isActive ? 'text-premium-accent font-extrabold' : isCompleted ? 'text-zinc-700 dark:text-zinc-350' : 'text-zinc-400'
                                      }`}>
                                        {step}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Split details summary block */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Left: Purchased Items Column */}
                          <div className="md:col-span-2 space-y-4">
                            <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Order Items ({ord.items?.length})</h4>
                            
                            <div className="space-y-3">
                              {ord.items?.map((item, idx) => {
                                const image = item.product?.images?.[0] || 'https://via.placeholder.com/150';
                                return (
                                  <div key={idx} className="flex gap-3 text-xs justify-between items-center bg-zinc-50 dark:bg-premium-border/10 p-2.5 rounded-xl border border-zinc-100 dark:border-premium-border/10">
                                    <div className="flex gap-2.5 items-center min-w-0">
                                      <img 
                                        src={image} 
                                        alt={item.name} 
                                        className="w-10 h-10 object-cover rounded-lg border border-zinc-200/40 dark:border-premium-border/30 shrink-0" 
                                      />
                                      <div className="min-w-0">
                                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.name}</p>
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">Price: {formatPrice(item.price)} &bull; Qty: {item.quantity}</p>
                                      </div>
                                    </div>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Action Buttons Group */}
                            <div className="flex flex-wrap gap-2.5 pt-2">
                              <button
                                onClick={() => addToast('Simulating: Order items added to cart', 'success')}
                                className="px-4 py-2 bg-premium-accent text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition shadow-sm"
                              >
                                Buy Items Again
                              </button>
                              <button
                                onClick={() => handlePrintInvoice(ord)}
                                className="px-4 py-2 bg-zinc-100 dark:bg-premium-border text-zinc-800 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition"
                              >
                                Print Invoice
                              </button>
                              <button
                                onClick={() => addToast('Reviewing products option standard redirect.', 'info')}
                                className="px-4 py-2 bg-zinc-100 dark:bg-premium-border text-zinc-800 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition"
                              >
                                Write a Review
                              </button>
                              {(ord.orderStatus === 'Placed' || ord.orderStatus === 'Confirmed') && (
                                <button
                                  onClick={() => handleCancelOrder(ord._id)}
                                  className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-red-100 dark:hover:bg-red-950/40 transition ml-auto"
                                >
                                  Cancel Order
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Right: Shipping, Payment & Billing breakup columns */}
                          <div className="space-y-4">
                            
                            {/* Shipping Destination */}
                            <div className="space-y-1.5">
                              <h5 className="text-[9px] uppercase font-bold text-zinc-400">Shipping Destination</h5>
                              <div className="p-3 bg-zinc-50 dark:bg-premium-border/15 rounded-xl text-xs space-y-1 text-zinc-650 dark:text-zinc-300">
                                <p className="font-semibold text-zinc-850 dark:text-zinc-100">Delivery Address</p>
                                <p className="leading-tight">{ord.shippingAddress?.street}</p>
                                <p>{ord.shippingAddress?.city}, {ord.shippingAddress?.state} {ord.shippingAddress?.postalCode}</p>
                                <p>{ord.shippingAddress?.country}</p>
                              </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="space-y-1.5">
                              <h5 className="text-[9px] uppercase font-bold text-zinc-405">Payment Summary</h5>
                              <div className="p-3 bg-zinc-50 dark:bg-premium-border/15 rounded-xl text-xs text-zinc-650 dark:text-zinc-300 space-y-1">
                                <div className="flex justify-between">
                                  <span>Gateway method:</span>
                                  <span className="font-semibold capitalize text-zinc-800 dark:text-zinc-100">{ord.paymentMethod === 'cod' ? 'COD' : ord.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Transact Status:</span>
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-100 capitalize">{ord.paymentStatus}</span>
                                </div>
                              </div>
                            </div>

                            {/* Billing Breakup */}
                            <div className="space-y-1.5">
                              <h5 className="text-[9px] uppercase font-bold text-zinc-405">Billing Breakup</h5>
                              <div className="p-3 bg-zinc-50 dark:bg-premium-border/15 rounded-xl text-xs space-y-2 text-zinc-650 dark:text-zinc-350">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>{formatPrice(subtotal)}</span>
                                </div>
                                {ord.discountAmount > 0 && (
                                  <div className="flex justify-between text-green-500 font-medium">
                                    <span>Discount Applied:</span>
                                    <span>-{formatPrice(ord.discountAmount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span>Delivery Shipping:</span>
                                  <span>{ord.shippingPrice === 0 ? 'FREE' : formatPrice(ord.shippingPrice)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-premium-border/30 pt-1.5 mt-1">
                                  <span>Amount Charged:</span>
                                  <span className="text-premium-accent">{formatPrice(ord.totalPrice)}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
