import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-zinc-100 dark:bg-[#0B0F19] border-t border-zinc-200 dark:border-premium-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <span className="text-xl font-bold font-display tracking-widest bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-premium-accent bg-clip-text text-transparent">
              shopEZ
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Experience zero-compromise premium shopping. Curated items from verified global stores delivered directly to your doorstep.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">Marketplace</h4>
            <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <li><Link to="/catalog" className="hover:text-premium-accent transition">All Products</Link></li>
              <li><Link to="/catalog?category=electronics" className="hover:text-premium-accent transition">Electronics</Link></li>
              <li><Link to="/catalog?category=apparel-fashion" className="hover:text-premium-accent transition">Fashion Wear</Link></li>
              <li><Link to="/catalog?category=home-living" className="hover:text-premium-accent transition">Home Decor</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">Support</h4>
            <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <li><Link to="/contact" className="hover:text-premium-accent transition">Contact Support</Link></li>
              <li><Link to="/faq" className="hover:text-premium-accent transition">FAQs</Link></li>
              <li><Link to="/shipping" className="hover:text-premium-accent transition">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-premium-accent transition">Return Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-4">Corporate</h4>
            <ul className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <li><Link to="/login?role=seller" className="hover:text-premium-accent transition">Sell on shopEZ</Link></li>
              <li><Link to="/about" className="hover:text-premium-accent transition">About Us</Link></li>
              <li><Link to="/terms" className="hover:text-premium-accent transition">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-premium-accent transition">Privacy Policy</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-zinc-200 dark:border-premium-border/50 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] tracking-wider text-zinc-400">
            © {new Date().getFullYear()} shopEZ Inc. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-zinc-400">
            <span>Stripe Verified</span>
            <span>Razorpay Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
