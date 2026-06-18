import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingBag, Bell, Sun, Moon, User, LogOut, Search, Heart, LayoutDashboard } from 'lucide-react';
import { logoutUser } from '../../redux/authSlice';
import { useSocket } from '../../context/SocketContext';
import API from '../../services/api';

const Header = ({ onCartOpen }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const { notifications } = useSocket();

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Autocomplete query lookup
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await API.get(`/products/search/autocomplete?q=${searchQuery}`);
        setSuggestions(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside auto-complete listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/catalog?search=${searchQuery}`);
    }
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.error(err);
    }
    dispatch(logoutUser());
    navigate('/login');
  };

  const cartItemsCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const unreadAlerts = notifications.filter(n => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 border-b border-zinc-200 dark:border-premium-border glass bg-white/70 dark:bg-premium-dark/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-wider font-display bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-premium-accent bg-clip-text text-transparent">
            SHOPEZ
          </span>
        </Link>

        {/* Global Search Bar */}
        <div ref={suggestionsRef} className="relative hidden sm:block max-w-md w-full mx-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search premium products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-100 dark:bg-premium-card border-none rounded-full outline-none focus:ring-1 focus:ring-premium-accent transition"
              />
              <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-zinc-400" />
            </div>
          </form>

          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-xl shadow-xl overflow-hidden z-50">
              {suggestions.map((p) => (
                <div
                  key={p.slug}
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    navigate(`/products/${p.slug}`);
                  }}
                  className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-premium-border flex items-center gap-3 cursor-pointer transition"
                >
                  <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-md object-cover" />
                  <span className="text-sm font-medium text-zinc-950 dark:text-zinc-100 truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          
          {/* Wishlist Link */}
          {isAuthenticated && (
            <Link to="/wishlist" className="p-2 text-zinc-600 hover:text-red-500 dark:text-zinc-300 dark:hover:text-red-400 transition">
              <Heart className="h-5 w-5" />
            </Link>
          )}

          {/* Dark Mode Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Socket In-app Alert Notifications */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                }}
                className="p-2 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition relative"
              >
                <Bell className="h-5 w-5" />
                {unreadAlerts > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-premium-accent ring-2 ring-white dark:ring-premium-dark" />
                )}
              </button>

              {/* Notification drop menu */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 bg-zinc-50 dark:bg-premium-border/50 border-b border-zinc-200 dark:border-premium-border flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider">Alerts</span>
                    {unreadAlerts > 0 && (
                      <span className="text-[10px] bg-premium-accent/20 text-premium-accent px-1.5 py-0.5 rounded-full font-medium">
                        {unreadAlerts} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-zinc-400">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-premium-border/30 border-b border-zinc-100 dark:border-premium-border/20 last:border-0 transition">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart Indicator */}
          <button
            onClick={onCartOpen}
            className="p-2 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* User Profile Options */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-premium-accent object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center border border-premium-accent">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* Profile dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-56 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-premium-border/50">
                    <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">{user.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-1">
                    {user.role === 'customer' && (
                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-50 dark:hover:bg-premium-border/50 transition font-medium"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-50 dark:hover:bg-premium-border/50 transition font-medium"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    {user.role === 'seller' && (
                      <Link
                        to="/seller"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-zinc-50 dark:hover:bg-premium-border/50 transition font-medium"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Seller Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition font-medium text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-zinc-950 dark:bg-white dark:text-zinc-950 rounded-full hover:opacity-95 transition"
            >
              Sign In
            </Link>
          )}

        </div>
      </div>
    </header>
  );
};

export default Header;
