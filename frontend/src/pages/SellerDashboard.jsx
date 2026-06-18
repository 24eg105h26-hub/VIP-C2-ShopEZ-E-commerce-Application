import React, { useState, useEffect } from 'react';
import { ShieldAlert, Award, Plus, Trash2, Edit, X } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/format';

const SellerDashboard = () => {
  // Tabs: 1: Analytics, 2: Products, 3: Orders, 4: Settings
  const [activeTab, setActiveTab] = useState(1);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Settings states
  const [storeDesc, setStoreDesc] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  // New Product states
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState(0);
  const [pCategory, setPCategory] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pSku, setPSku] = useState('');
  const [pStock, setPStock] = useState(0);

  // Editing Product states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editCategory, setEditCategory] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editVariants, setEditVariants] = useState([]);

  useEffect(() => {
    if (editingProduct) {
      setEditName(editingProduct.name || '');
      setEditDesc(editingProduct.description || '');
      setEditPrice(editingProduct.price || 0);
      setEditCategory(editingProduct.category?._id || editingProduct.category || '');
      setEditBrand(editingProduct.brand || '');
      setEditVariants(editingProduct.variants || []);
    } else {
      setEditName('');
      setEditDesc('');
      setEditPrice(0);
      setEditCategory('');
      setEditBrand('');
      setEditVariants([]);
    }
  }, [editingProduct]);

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      const [anRes, catRes, prodRes, storeRes, ordRes] = await Promise.all([
        API.get('/seller/analytics'),
        API.get('/categories'),
        API.get('/seller/products'),
        API.get('/seller/store'),
        API.get('/seller/orders')
      ]);
      setAnalytics(anRes.data.data);
      setCategories(catRes.data.data);
      setProducts(prodRes.data.data);
      setOrders(ordRes.data.data || []);

      const store = storeRes.data.data;
      if (store) {
        setStoreDesc(store.storeDescription || '');
        setLogoUrl(store.logo || '');
        setBannerUrl(store.banner || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, []);

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    try {
      await API.put('/seller/store', {
        storeDescription: storeDesc,
        logo: logoUrl,
        banner: bannerUrl
      });
      addToast('Store settings updated successfully.', 'success');
      fetchSellerData();
    } catch (err) {
      addToast('Error updating store details.', 'error');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!pCategory) {
      addToast('Please select a category.', 'info');
      return;
    }
    try {
      const payload = {
        name: pName,
        description: pDesc,
        category: pCategory,
        brand: pBrand,
        price: Number(pPrice),
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600'],
        variants: [
          {
            sku: pSku,
            size: 'Standard',
            color: 'Default',
            price: Number(pPrice),
            stock: Number(pStock)
          }
        ]
      };
      await API.post('/seller/products', payload);
      addToast('Product created successfully!', 'success');
      setPName('');
      setPDesc('');
      setPPrice(0);
      setPSku('');
      setPStock(0);
      fetchSellerData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create product.', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await API.delete(`/seller/products/${productId}`);
      addToast('Product listing deleted.', 'success');
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      addToast('Failed to delete product.', 'error');
    }
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editCategory) {
      addToast('Please select a category.', 'info');
      return;
    }
    for (const v of editVariants) {
      if (!v.sku) {
        addToast('All variants must have a valid SKU.', 'warning');
        return;
      }
    }
    try {
      const payload = {
        name: editName,
        description: editDesc,
        brand: editBrand,
        category: editCategory,
        price: Number(editPrice),
        variants: editVariants.map(v => ({
          sku: v.sku,
          size: v.size || 'Standard',
          color: v.color || 'Default',
          price: Number(v.price),
          stock: Number(v.stock)
        }))
      };
      await API.put(`/seller/products/${editingProduct._id}`, payload);
      addToast('Product listing and inventory updated successfully!', 'success');
      setEditingProduct(null);
      fetchSellerData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update product details.', 'error');
    }
  };

  const handleAddEditVariant = () => {
    setEditVariants([
      ...editVariants,
      {
        sku: `${editBrand.slice(0, 3).toUpperCase() || 'SKU'}-${Date.now().toString().slice(-4)}`,
        size: 'Standard',
        color: 'Default',
        price: Number(editPrice),
        stock: 0
      }
    ]);
  };

  const handleRemoveEditVariant = (idx) => {
    if (editVariants.length <= 1) {
      addToast('A product listing must have at least one variant.', 'info');
      return;
    }
    setEditVariants(editVariants.filter((_, i) => i !== idx));
  };

  const handleUpdateEditVariant = (idx, field, value) => {
    setEditVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/seller/orders/${orderId}`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by seller.`
      });
      addToast('Order status updated!', 'success');
      fetchSellerData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Error updating order.', 'error');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wider">Seller Dashboard</h1>
        <p className="text-xs text-zinc-400 mt-1">Manage store inventory, catalog listings, analytics, and order fulfillment</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-premium-border/50">
        {[
          { id: 1, label: 'Store Overview' },
          { id: 2, label: 'Add Product' },
          { id: 3, label: 'Fulfill Orders' },
          { id: 4, label: 'Store Settings' }
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
        <div className="text-center py-12 text-xs text-zinc-400">Loading details...</div>
      ) : (
        <div className="space-y-8">
          
          {/* Tab 1: Overview & Analytics */}
          {activeTab === 1 && (
            <div className="space-y-6">
              
              {/* Analytics metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Sales</p>
                  <p className="text-2xl font-bold text-premium-accent mt-2">{formatPrice(analytics?.totalRevenue || 0)}</p>
                </div>
                <div className="p-6 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Fulfillments Logged</p>
                  <p className="text-2xl font-bold mt-2">{analytics?.orderCount || 0}</p>
                </div>
                <div className="p-6 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Low Stock Warnings</p>
                  <p className={`text-2xl font-bold mt-2 ${analytics?.lowStockCount > 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                    {analytics?.lowStockCount || 0}
                  </p>
                </div>
              </div>

              {/* Low stock notifications */}
              {analytics?.lowStockAlerts && analytics.lowStockAlerts.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-200 dark:border-red-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-xs">
                    <ShieldAlert className="h-5 w-5" />
                    <span>Low Stock Warning Notifications</span>
                  </div>
                  <ul className="text-xs text-red-500 space-y-1">
                    {analytics.lowStockAlerts.map(prod => (
                      <li key={prod._id}>
                        • Product <strong>{prod.name}</strong> is low on stock! Total remaining: {prod.stock}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Product list */}
              <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Active Listings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                        <th className="py-2">Item Name</th>
                        <th className="py-2">Total Stock</th>
                        <th className="py-2">Price</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(prod => (
                        <tr key={prod._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none">
                          <td className="py-3 font-semibold">{prod.name}</td>
                          <td className={`py-3 ${prod.stock < 5 ? 'text-red-500 font-bold' : ''}`}>{prod.stock}</td>
                          <td className="py-3">{formatPrice(prod.price)}</td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingProduct(prod)}
                                className="text-premium-accent hover:bg-premium-accent/15 p-1 rounded transition"
                                title="Edit Product"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod._id)}
                                className="text-red-500 hover:bg-red-500/15 p-1 rounded transition"
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Create Product Form */}
          {activeTab === 2 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl max-w-xl">
              <h3 className="text-xs font-bold uppercase tracking-widest pb-3 border-b border-zinc-100 dark:border-premium-border mb-4">Add Product listing</h3>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Product Name</label>
                    <input
                      type="text"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      value={pDesc}
                      onChange={(e) => setPDesc(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Brand</label>
                    <input
                      type="text"
                      value={pBrand}
                      onChange={(e) => setPBrand(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Category</label>
                    <select
                      value={pCategory}
                      onChange={(e) => setPCategory(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Price</label>
                    <input
                      type="number"
                      value={pPrice}
                      onChange={(e) => setPPrice(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Variant SKU</label>
                    <input
                      type="text"
                      value={pSku}
                      onChange={(e) => setPSku(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                      placeholder="e.g. XP-BLK-128"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Initial Stock</label>
                    <input
                      type="number"
                      value={pStock}
                      onChange={(e) => setPStock(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl"
                >
                  Create Product
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Order Fulfillments */}
          {activeTab === 3 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Pending Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-premium-border text-zinc-400 font-medium">
                      <th className="py-2">Order ID</th>
                      <th className="py-2">Customer Phone</th>
                      <th className="py-2">Grand Total</th>
                      <th className="py-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id} className="border-b border-zinc-50 dark:border-premium-border/30 last:border-none">
                        <td className="py-3 font-semibold">#{order._id}</td>
                        <td className="py-3">{order.shippingAddress?.phone}</td>
                        <td className="py-3">{formatPrice(order.totalPrice)}</td>
                        <td className="py-3 uppercase tracking-wider font-semibold">{order.orderStatus}</td>
                        <td className="py-3 text-right">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            className="text-[10px] px-2 py-1 bg-zinc-100 dark:bg-premium-border rounded border-none cursor-pointer"
                          >
                            <option value="Placed">Placed</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out For Delivery">Out For Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Store settings */}
          {activeTab === 4 && (
            <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl max-w-md">
              <h3 className="text-xs font-bold uppercase tracking-widest pb-3 border-b border-zinc-100 dark:border-premium-border mb-4">Store Details</h3>
              <form onSubmit={handleUpdateStore} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Store Description</label>
                  <textarea
                    rows={4}
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent outline-none"
                    placeholder="Describe your store offerings..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Logo Image Link</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Banner Image Link</label>
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold uppercase tracking-widest rounded-xl"
                >
                  Save Store Settings
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-premium-border/40 mb-6 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">Edit Product & Inventory</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-premium-border/50 rounded-full transition text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleUpdateProductSubmit} className="space-y-6 overflow-y-auto pr-1 flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Brand</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent text-zinc-855 dark:text-zinc-100 cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1.5">Base Price (₹)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent text-zinc-850 dark:text-zinc-100 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-premium-border/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400">Inventory Variants</h4>
                  <button
                    type="button"
                    onClick={handleAddEditVariant}
                    className="flex items-center gap-1 text-[10px] font-bold text-premium-accent hover:underline uppercase"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Variant
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {editVariants.map((variant, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-zinc-50 dark:bg-premium-border/10 border border-zinc-200 dark:border-premium-border/30 rounded-2xl grid grid-cols-2 sm:grid-cols-5 gap-3 items-end relative"
                    >
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">SKU</label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleUpdateEditVariant(idx, 'sku', e.target.value)}
                          className="w-full text-[10px] px-2 py-1.5 bg-white dark:bg-premium-border border border-zinc-200 dark:border-premium-border/40 rounded focus:ring-1 focus:ring-premium-accent text-zinc-800 dark:text-zinc-100 outline-none"
                          placeholder="SKU"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Size</label>
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => handleUpdateEditVariant(idx, 'size', e.target.value)}
                          className="w-full text-[10px] px-2 py-1.5 bg-white dark:bg-premium-border border border-zinc-200 dark:border-premium-border/40 rounded focus:ring-1 focus:ring-premium-accent text-zinc-800 dark:text-zinc-100 outline-none"
                          placeholder="e.g. Standard"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Color</label>
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleUpdateEditVariant(idx, 'color', e.target.value)}
                          className="w-full text-[10px] px-2 py-1.5 bg-white dark:bg-premium-border border border-zinc-200 dark:border-premium-border/40 rounded focus:ring-1 focus:ring-premium-accent text-zinc-800 dark:text-zinc-100 outline-none"
                          placeholder="e.g. Default"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleUpdateEditVariant(idx, 'price', Number(e.target.value))}
                          className="w-full text-[10px] px-2 py-1.5 bg-white dark:bg-premium-border border border-zinc-200 dark:border-premium-border/40 rounded focus:ring-1 focus:ring-premium-accent text-zinc-800 dark:text-zinc-100 outline-none"
                          required
                        />
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-[9px] uppercase font-bold text-zinc-400 mb-1">Stock</label>
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => handleUpdateEditVariant(idx, 'stock', Number(e.target.value))}
                            className="w-full text-[10px] px-2 py-1.5 bg-white dark:bg-premium-border border border-zinc-200 dark:border-premium-border/40 rounded focus:ring-1 focus:ring-premium-accent text-zinc-800 dark:text-zinc-100 outline-none"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditVariant(idx)}
                          className="text-red-500 hover:text-red-750 p-1 bg-red-500/10 rounded mt-4"
                          title="Remove Variant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-4 pt-4 border-t border-zinc-100 dark:border-premium-border/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 border border-zinc-200 dark:border-premium-border text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-50 dark:hover:bg-premium-border transition text-zinc-800 dark:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-premium-accent text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition shadow-md shadow-premium-accent/20"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
