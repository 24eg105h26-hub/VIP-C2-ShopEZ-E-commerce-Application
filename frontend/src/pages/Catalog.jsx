import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import { ProductGridSkeleton } from '../components/common/SkeletonScreen';
import API from '../services/api';

const Catalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Read params with defaults
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const ratings = searchParams.get('ratings') || '';
  const sort = searchParams.get('sort') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Sync state variables for local filters
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  useEffect(() => {
    const fetchCatalogData = async () => {
      setLoading(true);
      try {
        const queryStr = searchParams.toString();
        const [prodRes, catRes] = await Promise.all([
          API.get(`/products?${queryStr}`),
          API.get('/categories')
        ]);
        setProducts(prodRes.data.data);
        setTotalPages(prodRes.data.pages);
        setTotalCount(prodRes.data.total);
        setCategories(catRes.data.data);
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogData();
  }, [searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset page on filter change
    setSearchParams(newParams);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localMinPrice) newParams.set('minPrice', localMinPrice);
    else newParams.delete('minPrice');
    if (localMaxPrice) newParams.set('maxPrice', localMaxPrice);
    else newParams.delete('maxPrice');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setLocalMinPrice('');
    setLocalMaxPrice('');
    setSearchParams({});
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12">
      
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-64 shrink-0 space-y-6 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 p-6 rounded-2xl h-fit">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-premium-border">
          <h3 className="text-xs font-bold uppercase tracking-widest">Filters</h3>
          <button onClick={clearAllFilters} className="text-[10px] uppercase font-bold text-premium-accent hover:underline">
            Clear All
          </button>
        </div>

        {/* Categories list */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Categories</h4>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => updateParam('category', '')}
              className={`text-xs text-left py-1 font-medium transition ${!category ? 'text-premium-accent font-bold' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => updateParam('category', cat.slug)}
                className={`text-xs text-left py-1 font-medium transition ${category === cat.slug ? 'text-premium-accent font-bold' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing inputs */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Price Range</h4>
          <form onSubmit={handlePriceApply} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent"
              />
              <input
                type="number"
                placeholder="Max"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] uppercase font-bold tracking-widest rounded-lg"
            >
              Apply Price
            </button>
          </form>
        </div>

        {/* Rating filter options */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ratings</h4>
          <div className="flex flex-col gap-2">
            {[4, 3, 2].map((stars) => (
              <button
                key={stars}
                onClick={() => updateParam('ratings', stars.toString())}
                className={`text-xs text-left py-1 font-medium flex items-center gap-1 transition ${ratings === stars.toString() ? 'text-premium-accent font-bold' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                <span>{stars} Stars & Up</span>
              </button>
            ))}
          </div>
        </div>

      </aside>

      {/* Product Listings grid */}
      <div className="flex-1 space-y-6">
        
        {/* Results Info & Sorting */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl">
          <span className="text-xs font-medium text-zinc-500">
            Showing <strong className="text-zinc-900 dark:text-white">{products.length}</strong> of <strong className="text-zinc-900 dark:text-white">{totalCount}</strong> premium products
          </span>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Sort:</span>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="text-xs px-3 py-1.5 bg-zinc-50 dark:bg-premium-border border-none rounded-lg focus:ring-1 focus:ring-premium-accent cursor-pointer"
            >
              <option value="">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Catalog grid */}
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-2xl">
            <p className="text-sm font-semibold">No items match your selection</p>
            <p className="text-xs text-zinc-400 mt-1">Try resetting your filter parameters or search queries.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}

        {/* Pagination buttons */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              disabled={page === 1}
              onClick={() => updateParam('page', (page - 1).toString())}
              className="px-4 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-lg text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => updateParam('page', (page + 1).toString())}
              className="px-4 py-2 bg-white dark:bg-premium-card border border-zinc-200 dark:border-premium-border/40 rounded-lg text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        )}

      </div>

    </div>
  );
};

export default Catalog;
