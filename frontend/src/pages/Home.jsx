import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RefreshCw, Star } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/common/SkeletonScreen';
import API from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          API.get('/products/recommendations'),
          API.get('/categories')
        ]);
        setProducts(prodRes.data.data);
        setCategories(catRes.data.data);
      } catch (err) {
        console.error('Failed to load home page listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-12">
      
      {/* Premium Hero Section */}
      <section className="relative w-full overflow-hidden rounded-3xl bg-zinc-950 text-white min-h-[460px] flex items-center p-8 md:p-16">
        {/* Background Image decoration */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

        <div className="relative z-10 max-w-lg space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs uppercase font-bold tracking-widest text-premium-accent">
              Zero-Compromise Luxury
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-2 leading-tight">
              Reinventing the <br />Marketplace.
            </h1>
            <p className="text-xs md:text-sm text-zinc-300 font-light mt-4 leading-relaxed">
              Discover verified products, tailored variants, and instant checkouts from the most elite shops globally.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex gap-4 pt-4"
          >
            <Link
              to="/catalog"
              className="px-6 py-3 bg-white text-zinc-950 text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-zinc-100 transition shadow-lg"
            >
              Explore Collection
            </Link>
            <Link
              to="/catalog?category=apparel-fashion"
              className="px-6 py-3 border border-white text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-white/10 transition"
            >
              Browse Apparel
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Category Shortcuts */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg md:text-xl font-bold">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.slice(0, 3).map((cat) => (
            <Link
              key={cat._id}
              to={`/catalog?category=${cat.slug}`}
              className="group relative h-40 rounded-2xl overflow-hidden flex items-end p-6 bg-zinc-900 shadow-sm transition"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />
              <img
                src={cat.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600'}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500"
              />
              <div className="relative z-20">
                <h3 className="text-sm font-bold text-white tracking-wide">{cat.name}</h3>
                <p className="text-[10px] text-zinc-300 mt-1 line-clamp-1">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Value Propositions */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-y border-zinc-200 dark:border-premium-border/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-premium-accent/10 text-premium-accent rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider">Secure Escrow Protection</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Payments are securely stored until items are verified and fully received.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-premium-accent/10 text-premium-accent rounded-xl">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider">Fast Courier Delivery</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Priority shipping routes with complete real-time satellite tracking timelines.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-premium-accent/10 text-premium-accent rounded-xl">
            <RefreshCw className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider">Hassle-Free Returns</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Easy refunds and collection options within a standard 30-day window.</p>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Featured Selections</h2>
            <p className="text-xs text-zinc-400 mt-1">Hand-picked luxury favorites tailored for your profile.</p>
          </div>
          <Link to="/catalog" className="text-xs font-bold text-premium-accent hover:underline uppercase tracking-wider">
            View All
          </Link>
        </div>

        {loading ? (
          <ProductGridSkeleton count={3} />
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-sm text-zinc-400">
            No products found. Run seed script.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
