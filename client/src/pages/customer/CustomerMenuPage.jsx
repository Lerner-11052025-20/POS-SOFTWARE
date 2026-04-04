import React, { useState, useEffect } from 'react';
import { categoriesAPI, productsAPI } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import { formatCurrency } from '../../utils/format';
import { Search, Info, Grid, List as ListIcon, ChevronRight } from 'lucide-react';

export default function CustomerMenuPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll({ active: 'true' }) // The route now enforces isActive:true for customers
        ]);
        setCategories(catRes.data.categories || []);
        setProducts(prodRes.data.products || []);
      } catch (err) {
        console.error('Fetch menu error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category?._id === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cafe-500/10 border-4 border-cafe-500 border-t-transparent animate-spin"></div>
          <p className="text-stone-400 font-display font-bold uppercase tracking-widest text-xs">Odoo POS Cafe — Cataloging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-20">
      <Navbar title="Coffee Catalog" subtitle="Live Experience" />

      {/* Header & Controls */}
      <div className="bg-white border-b border-stone-100 px-6 py-10 sticky top-[64px] z-40 shadow-sm animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1 max-w-xl">
              <h1 className="text-3xl font-display font-black text-stone-900 tracking-tight mb-2">Taste the <span className="text-cafe-600">Exceptional</span></h1>
              <p className="text-xs text-stone-400 font-bold tracking-widest uppercase mb-6 leading-relaxed">Artisan Selection • Handcrafted Daily</p>

              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-12 text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-4 focus:ring-cafe-500/10 focus:border-cafe-500 transition-all outline-none font-semibold text-sm shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-cafe-500 transition-colors" />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Categories Selection */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${activeCategory === 'all'
                      ? 'bg-stone-900 border-stone-900 text-white shadow-xl translate-y-[-2px]'
                      : 'bg-white border-stone-100 text-stone-400 hover:border-stone-300'
                    }`}
                >
                  All Delights
                </button>
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => setActiveCategory(cat._id)}
                    className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat._id
                        ? 'bg-cafe-600 border-cafe-600 text-white shadow-gold-sm translate-y-[-2px]'
                        : 'bg-white border-stone-100 text-stone-400 hover:border-stone-300'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-none pt-4 lg:pt-0">
                <div className="flex bg-stone-100 p-1 rounded-xl shadow-inner border border-stone-200">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-cafe-600' : 'text-stone-400'}`}><Grid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-cafe-600' : 'text-stone-400'}`}><ListIcon className="w-4 h-4" /></button>
                </div>
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  Showing {filteredProducts.length} Results
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-24 text-center border border-dashed border-stone-200 animate-fade-in shadow-sm">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-stone-200" />
            </div>
            <h3 className="text-xl font-display font-black text-stone-900 leading-tight">No Items Found</h3>
            <p className="text-stone-400 text-xs mt-3 max-w-sm mx-auto leading-relaxed font-semibold uppercase tracking-widest">
              Your palette is unique. Try adjusting your search or category filters to find our signature blends.
            </p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <div key={product._id} className="group bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-card hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-700 hover:-translate-y-2 animate-fade-in-up">
                  <div className="aspect-square bg-stone-50 relative overflow-hidden flex items-center justify-center p-8 group-hover:bg-cream-50 transition-colors">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="text-5xl opacity-[0.05] grayscale group-hover:opacity-[0.15] transition-opacity">🍽️</div>
                    )}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black text-cafe-600 uppercase tracking-widest shadow-sm border border-stone-50">
                      {product.category?.name || 'Standard'}
                    </div>
                  </div>
                  <div className="p-7">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h4 className="font-display font-black text-stone-900 group-hover:text-cafe-600 transition-colors leading-tight min-h-[2.5rem]">
                        {product.name}
                      </h4>
                    </div>
                    <p className="text-stone-400 text-[10px] font-medium leading-relaxed line-clamp-2 h-8 mb-4">
                      {product.description || 'Experience the essence of our handcrafted culinary excellence.'}
                    </p>
                    <div className="flex items-center justify-between pt-5 border-t border-stone-50">
                      <span className="text-lg font-black text-stone-900 tracking-tight">
                        {formatCurrency(product.salePrice)}
                      </span>
                      <div className="flex items-center gap-1.5 group/info">
                        <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-300 group-hover/info:bg-cafe-50 group-hover/info:border-cafe-100 group-hover/info:text-cafe-500 transition-all">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {filteredProducts.map((product) => (
                <div key={product._id} className="group bg-white rounded-2xl p-4 flex items-center gap-6 border border-stone-100 shadow-sm hover:shadow-md transition-all">
                  <div className="w-16 h-16 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-100 overflow-hidden shadow-inner">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl opacity-20 italic">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-display font-black text-stone-900 group-hover:text-cafe-600 transition-colors">{product.name}</h4>
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-[8px] font-black text-stone-400 uppercase tracking-widest">{product.category?.name}</span>
                    </div>
                    <p className="text-stone-400 text-[10px] line-clamp-1">{product.description || 'Our signature high-quality creation.'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-stone-900 tracking-tight">{formatCurrency(product.salePrice)}</p>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Ready for Order</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-200 ml-4 group-hover:text-cafe-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
