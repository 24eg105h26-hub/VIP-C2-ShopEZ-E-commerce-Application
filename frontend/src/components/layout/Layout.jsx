import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../common/CartDrawer';

const Layout = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-premium-dark transition-colors duration-300">
      <Header onCartOpen={() => setIsCartOpen(true)} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Layout;
