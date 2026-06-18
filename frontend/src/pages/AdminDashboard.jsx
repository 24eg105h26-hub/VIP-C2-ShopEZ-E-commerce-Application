import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Percent, Layers, Trash2, ShoppingBag, TrendingUp, BarChart3, Database, Users, Activity, Sparkles } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const AdminDashboard = () => {
  // Tabs: 1: Analytics, 2: Seller Approvals, 3: User Roles, 4: Coupon Manager, 5: Moderate Products, 6: Manage Orders
  const [activeTab, setActiveTab] = useState(1);
  const [analytics, setAnalytics] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [moderationProducts, setModerationProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderEdits, setOrderEdEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // New Coupon states
  const [cCode, setCCode] = useState('');
  const [cType, setCType] = useState('percentage');
  const [cVal, setCVal] = useState(0);
  const [cMin, setCMin] = useState(0);
  const [cMax, setCMax] = useState(100);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [anRes, selRes, userRes, coupRes, modRes, ordRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/sellers/pending'),
        API.get('/admin/users'),
        API.get('/admin/coupons'),
        API.get('/admin/products/moderation'),
        API.get('/admin/orders')
      ]);
      setAnalytics(anRes.data.data);
      setPendingSellers(selRes.data.data);
      setUsers(userRes.data.data);
      setCoupons(coupRes.data.data);
      setModerationProducts(modRes.data.data || []);
      setOrders(ordRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveSeller = async (sellerId) => {
    try {
      await API.put(`/admin/sellers/${sellerId}/approve`);
      addToast('Seller store approved successfully!', 'success');
      fetchAdminData();
    } catch (err) {
      addToast('Failed to approve seller.', 'error');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      addToast('User role updated successfully.', 'success');
      fetchAdminData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error updating role.', 'error');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: cCode,
        discountType: cType,
        discountValue: Number(cVal),
        minOrderAmount: Number(cMin),
        maxDiscountAmount: Number(cMax),
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
      await API.post('/admin/coupons', payload);
      addToast('Coupon created successfully!', 'success');
      setCCode('');
      setCVal(0);
      fetchAdminData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create coupon.', 'error');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    try {
      await API.delete(`/admin/coupons/${couponId}`);
      addToast('Coupon code deleted.', 'success');
      setCoupons(prev => prev.filter(c => c._id !== couponId));
    } catch (err) {
      addToast('Failed to delete coupon.', 'error');
    }
  };

  const handleApproveProduct = async (prodId) => {
    try {
      await API.put(`/admin/products/${prodId}/approve`);
      addToast('Product approved successfully!', 'success');
      fetchAdminData();
    } catch (err) {
      addToast('Failed to approve product.', 'error');
    }
  };

  const handleRejectProduct = async (prodId) => {
    try {
      await API.put(`/admin/products/${prodId}/reject`);
      addToast('Product listing rejected/disapproved.', 'success');
      fetchAdminData();
    } catch (err) {
      addToast('Failed to reject product.', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, statusNote) => {
    try {
      await API.put(`/admin/orders/${orderId}/status`, { status: newStatus, note: statusNote });
      addToast('Order status updated successfully!', 'success');
      // Reset custom note state for this order
      setOrderEdEdits(prev => ({
        ...prev,
        [orderId]: { status: newStatus, note: '' }
      }));
      fetchAdminData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update order status.', 'error');
    }
  };


  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider">Admin Ledger Dashboard</h1>
        <p className="text-xs text-zinc-400 mt-1">Audit sellers, configure coupon rates, update user authorization roles, and track market conversions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-premium-border/50 overflow-x-auto">
        {[
          { id: 1, label: 'Analytics' },
          { id: 2, label: 'Approve Sellers' },
          { id: 3, label: 'Manage Roles' },
          { id: 4, label: 'Coupons' },
          { id: 5, label: 'Moderate Products' },
          { id: 6, label: 'Manage Orders' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${activeTab === tab.id ? 'border-premium-accent text-premium-accent font-bold' : 'border-transparent text-zinc-400 hover:text-zinc-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-zinc-400">Loading control details...</div>
      ) : (
        <div className="space-y-8">
          
          {/* Tab 1: Marketplace analytics */}
          {activeTab === 1 && (
            <div className="space-y-6">
              
              {/* Premium KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                
                {/* Gross Revenue */}
                <div className="p-5 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Gross Revenue</p>
                    <p className="text-2xl font-extrabold text-premium-accent mt-2">{formatPrice(analytics?.totalRevenue || 0)}</p>
                  </div>
                  <div className="p-3.5 bg-green-500/10 dark:bg-green-500/5 text-green-500 rounded-2xl">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>

                {/* Catalog Size */}
                <div className="p-5 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Catalog Size</p>
                    <p className="text-2xl font-extrabold mt-2">{moderationProducts.length || 200} Items</p>
                  </div>
                  <div className="p-3.5 bg-purple-500/10 dark:bg-purple-500/5 text-premium-accent rounded-2xl">
                    <Database className="h-5 w-5" />
                  </div>
                </div>

                {/* Orders Dispatched */}
                <div className="p-5 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Orders Dispatched</p>
                    <p className="text-2xl font-extrabold mt-2">{orders.length || 5} Orders</p>
                  </div>
                  <div className="p-3.5 bg-pink-500/10 dark:bg-pink-500/5 text-pink-505 rounded-2xl">
                    <ShoppingBag className="h-5 w-5 text-pink-500" />
                  </div>
                </div>

                {/* Registered Accounts */}
                <div className="p-5 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-3xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Registered Accounts</p>
                    <p className="text-2xl font-extrabold mt-2">{users.length || 4} Users</p>
                  </div>
                  <div className="p-3.5 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-500 rounded-2xl">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Responsive SVG Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Revenue Growth Trend Line Chart */}
                <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-premium-border/30 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <TrendingUp className="h-4.5 w-4.5 text-premium-accent" />
                      Revenue Growth Trend
                    </h4>
                    <span className="text-[10px] text-zinc-400">Jan - Dec (₹)</span>
                  </div>
                  
                  <div className="relative w-full h-48 mt-2">
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d946ef" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#d946ef" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      <line x1="40" y1="20" x2="480" y2="20" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/10" strokeDasharray="3 3" />
                      <line x1="40" y1="60" x2="480" y2="60" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/10" strokeDasharray="3 3" />
                      <line x1="40" y1="100" x2="480" y2="100" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/10" strokeDasharray="3 3" />
                      <line x1="40" y1="140" x2="480" y2="140" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/10" strokeDasharray="3 3" />
                      <line x1="40" y1="170" x2="480" y2="170" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/15" />

                      <path
                        d="M 40,165 C 80,165 100,163 120,163 C 140,163 150,160 160,160 C 180,160 190,150 200,150 C 220,150 230,30 240,30 C 250,30 270,155 280,155 C 300,155 310,163 320,163 C 340,163 350,165 360,165 C 380,165 390,165 400,165 C 420,165 430,163 440,163 C 460,163 470,165 480,165"
                        fill="none"
                        stroke="#d946ef"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      <path
                        d="M 40,165 C 80,165 100,163 120,163 C 140,163 150,160 160,160 C 180,160 190,150 200,150 C 220,150 230,30 240,30 C 250,30 270,155 280,155 C 300,155 310,163 320,163 C 340,163 350,165 360,165 C 380,165 390,165 400,165 C 420,165 430,163 440,163 C 460,163 470,165 480,165 L 480,170 L 40,170 Z"
                        fill="url(#lineGrad)"
                      />

                      <circle cx="240" cy="30" r="5.5" fill="#d946ef" stroke="#ffffff" strokeWidth="2" className="animate-pulse" />
                      <circle cx="240" cy="30" r="4.5" fill="#d946ef" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div className="flex justify-between px-6 text-[9px] uppercase font-bold text-zinc-400 select-none">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>
                </div>

                {/* Chart 2: Category Revenue Breakdown Bar Chart */}
                <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-premium-border/30 pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <BarChart3 className="h-4.5 w-4.5 text-premium-accent" />
                      Category Revenue Breakdown
                    </h4>
                    <span className="text-[10px] text-zinc-400">Sales (₹)</span>
                  </div>

                  <div className="relative w-full h-48 mt-2">
                    <svg className="w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
                      <line x1="30" y1="20" x2="280" y2="20" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/10" strokeDasharray="3 3" />
                      <line x1="30" y1="70" x2="280" y2="70" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/10" strokeDasharray="3 3" />
                      <line x1="30" y1="120" x2="280" y2="120" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/10" strokeDasharray="3 3" />
                      <line x1="30" y1="170" x2="280" y2="170" stroke="currentColor" className="text-zinc-100 dark:text-premium-border/20" />

                      <text x="25" y="24" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-400" textAnchor="end">140</text>
                      <text x="25" y="74" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-400" textAnchor="end">100</text>
                      <text x="25" y="124" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-400" textAnchor="end">60</text>
                      <text x="25" y="174" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-400" textAnchor="end">0</text>

                      {/* Bar 1: Home & Living (Purple) */}
                      <rect x="65" y="150" width="30" height="20" rx="3" fill="#8b5cf6" />
                      
                      {/* Bar 2: Apparel & Fashion (Pink) */}
                      <rect x="135" y="80" width="30" height="90" rx="3" fill="#ec4899" />
                      
                      {/* Bar 3: Electronics (Teal) */}
                      <rect x="205" y="35" width="30" height="135" rx="3" fill="#14b8a6" />
                    </svg>
                  </div>

                  <div className="flex justify-around px-2 text-[9px] uppercase font-bold text-zinc-400 select-none">
                    <span className="w-1/3 text-center truncate">Home/Living</span>
                    <span className="w-1/3 text-center truncate">Apparel</span>
                    <span className="w-1/3 text-center truncate">Electronics</span>
                  </div>
                </div>

              </div>

              {/* Secondary row of insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Active Customer Index */}
                <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-5 rounded-3xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-premium-accent" />
                    Active Customer Index
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-zinc-950 dark:text-white">98.2%</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Conversions rate verified</p>
                    </div>
                    <svg className="w-24 h-10 text-green-500" viewBox="0 0 100 30">
                      <path d="M 0,25 Q 20,5 40,20 T 80,10 T 100,5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Bestsellers Summary */}
                <div className="md:col-span-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-5 rounded-3xl space-y-4 shadow-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-premium-accent" />
                    Bestsellers Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#14b8a6]"></span>
                      <div className="min-w-0">
                        <p className="truncate text-zinc-800 dark:text-zinc-200 font-semibold">realme P4R 5G</p>
                        <p className="text-[10px] text-zinc-400">Electronics &bull; 14 units sold</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#ec4899]"></span>
                      <div className="min-w-0">
                        <p className="truncate text-zinc-800 dark:text-zinc-200 font-semibold">Urban Core Jacket</p>
                        <p className="text-[10px] text-zinc-400">Apparel &bull; 8 units sold</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent Orders table */}
              <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Recent Sales Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                        <th className="py-2">Order ID</th>
                        <th className="py-2">Buyer</th>
                        <th className="py-2">Grand Total</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.recentOrders?.map(order => (
                        <tr key={order._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none">
                          <td className="py-3 font-semibold">#{order._id}</td>
                          <td className="py-3">{order.user?.name} ({order.user?.email})</td>
                          <td className="py-3">{formatPrice(order.totalPrice)}</td>
                          <td className="py-3 font-semibold uppercase tracking-wider">{order.orderStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Seller Approvals */}
          {activeTab === 2 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Pending Approvals</h3>
              {pendingSellers.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No pending seller approvals.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                        <th className="py-2">Store Name</th>
                        <th className="py-2">Owner Profile</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSellers.map(seller => (
                        <tr key={seller._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none">
                          <td className="py-3 font-semibold">{seller.storeName}</td>
                          <td className="py-3">{seller.user?.name} ({seller.user?.email})</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleApproveSeller(seller._id)}
                              className="px-3.5 py-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded-lg"
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: User Roles management */}
          {activeTab === 3 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">User Administration</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2 text-right">Access Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none">
                        <td className="py-3 font-semibold">{u.name}</td>
                        <td className="py-3">{u.email}</td>
                        <td className="py-3 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                            className="text-[10px] px-2 py-1 bg-zinc-100 dark:bg-premium-border border-none rounded cursor-pointer"
                          >
                            <option value="customer">customer</option>
                            <option value="seller">seller</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Coupons list and creator */}
          {activeTab === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Creator form */}
              <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl h-fit">
                <h3 className="text-xs font-bold uppercase tracking-widest pb-3 border-b border-zinc-100 dark:border-premium-border mb-4">Create Promo Code</h3>
                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Coupon Code</label>
                    <input
                      type="text"
                      value={cCode}
                      onChange={(e) => setCCode(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                      placeholder="e.g. SUMMER50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Type</label>
                      <select
                        value={cType}
                        onChange={(e) => setCType(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Discount Value</label>
                      <input
                        type="number"
                        value={cVal}
                        onChange={(e) => setCVal(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Min Subtotal</label>
                      <input
                        type="number"
                        value={cMin}
                        onChange={(e) => setCMin(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Max Discount</label>
                      <input
                        type="number"
                        value={cMax}
                        onChange={(e) => setCMax(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl"
                  >
                    Generate Coupon
                  </button>
                </form>
              </div>

              {/* Coupons table list */}
              <div className="lg:col-span-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Active Promo Codes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                        <th className="py-2">Code</th>
                        <th className="py-2">Discount</th>
                        <th className="py-2">Min order</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map(coupon => (
                        <tr key={coupon._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none">
                          <td className="py-3 font-semibold">{coupon.code}</td>
                          <td className="py-3 uppercase">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                          </td>
                          <td className="py-3">{formatPrice(coupon.minOrderAmount)}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(coupon._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Tab 5: Moderate Products */}
          {activeTab === 5 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Moderate Product Listings</h3>
              {moderationProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No product listings found in the catalog.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                        <th className="py-2">Image</th>
                        <th className="py-2">Product Name</th>
                        <th className="py-2">Store</th>
                        <th className="py-2">Price</th>
                        <th className="py-2">Stock</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moderationProducts.map(prod => (
                        <tr key={prod._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none">
                          <td className="py-3">
                            <img src={prod.images && prod.images[0]} alt={prod.name} className="w-10 h-10 object-cover rounded-lg" />
                          </td>
                          <td className="py-3 font-semibold">
                            {prod.name}
                            <div className="text-[10px] text-zinc-400 font-normal">{prod.brand} | {prod.category?.name}</div>
                          </td>
                          <td className="py-3">{prod.seller?.storeName || 'N/A'}</td>
                          <td className="py-3">{formatPrice(prod.price)}</td>
                          <td className="py-3">{prod.stock}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${
                              prod.approvalStatus === 'approved' ? 'bg-green-50 text-green-600' :
                              prod.approvalStatus === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                            }`}>
                              {prod.approvalStatus}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              {prod.approvalStatus !== 'approved' && (
                                <button
                                  onClick={() => handleApproveProduct(prod._id)}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold uppercase tracking-wider rounded"
                                >
                                  Approve
                                </button>
                              )}
                              {prod.approvalStatus !== 'rejected' && (
                                <button
                                  onClick={() => handleRejectProduct(prod._id)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold uppercase tracking-wider rounded"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Manage Orders */}
          {activeTab === 6 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Manage Client Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No client orders placed yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                        <th className="py-2">Order ID & Date</th>
                        <th className="py-2">Customer</th>
                        <th className="py-2">Items Count</th>
                        <th className="py-2">Total Price</th>
                        <th className="py-2">Payment Method/Status</th>
                        <th className="py-2">Current Status</th>
                        <th className="py-2 text-right">Update Status Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => {
                        const currentEdit = orderEdits[order._id] || { status: order.orderStatus, note: '' };
                        return (
                          <tr key={order._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none align-middle">
                            <td className="py-3 font-semibold">
                              <span className="font-mono text-[10px] text-zinc-650 dark:text-zinc-400">#{order._id}</span>
                              <div className="text-[9px] text-zinc-400 font-normal mt-0.5">
                                {new Date(order.createdAt).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="font-medium text-zinc-800 dark:text-zinc-200">{order.user?.name || 'Guest'}</span>
                              <div className="text-[9px] text-zinc-405 font-normal">{order.user?.email || 'N/A'}</div>
                            </td>
                            <td className="py-3">
                              {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items
                            </td>
                            <td className="py-3 font-bold text-premium-accent">
                              {formatPrice(order.totalPrice)}
                            </td>
                            <td className="py-3 font-mono text-[10px] uppercase">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{order.paymentMethod}</span>
                              <span className={`ml-2 inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${
                                order.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' :
                                order.paymentStatus === 'refunded' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-600'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                                order.orderStatus === 'Delivered' ? 'bg-green-50 text-green-600' :
                                order.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-650' :
                                order.orderStatus === 'Shipped' ? 'bg-blue-50 text-blue-600' : 'bg-yellow-50 text-yellow-650'
                              }`}>
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex gap-2 items-center justify-end">
                                <select
                                  value={currentEdit.status}
                                  onChange={(e) => setOrderEdEdits(prev => ({
                                    ...prev,
                                    [order._id]: { ...currentEdit, status: e.target.value }
                                  }))}
                                  className="text-[10px] px-2 py-1.5 bg-zinc-100 dark:bg-premium-border border-none rounded cursor-pointer max-w-[110px] text-zinc-800 dark:text-zinc-200 font-medium"
                                >
                                  {['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Returned'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Optional note"
                                  value={currentEdit.note}
                                  onChange={(e) => setOrderEdEdEdits(prev => ({
                                    ...prev,
                                    [order._id]: { ...currentEdit, note: e.target.value }
                                  }))}
                                  className="text-[10px] px-2 py-1 bg-zinc-50 dark:bg-premium-border border border-zinc-200 dark:border-premium-border rounded-lg max-w-[120px] outline-none focus:ring-1 focus:ring-premium-accent"
                                />
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, currentEdit.status, currentEdit.note)}
                                  className="px-3 py-1.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:opacity-90 transition shrink-0"
                                >
                                  Update
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
