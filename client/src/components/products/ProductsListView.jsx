import { useState, useEffect, useCallback } from 'react';
import { Search, X, Archive, Trash2, Package, Loader2, Edit3, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsAPI, categoriesAPI } from '../../services/api';

function formatCurrency(a) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a || 0);
}

function getCategoryChipStyle(color) {
  if (!color) return { backgroundColor: '#f5f5f4', color: '#78716c' };
  // Generate soft pastel bg from hex
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    color: `rgb(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
  };
}

export default function ProductsListView({ isManager, onEdit }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [selected, setSelected] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterCat) params.category = filterCat;
      const res = await productsAPI.getAll(params);
      if (res.data.success) setProducts(res.data.products);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, filterCat]);

  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesAPI.getAll();
        if (res.data.success) setCategories(res.data.categories);
      } catch {}
    })();
  }, []);

  useEffect(() => { setLoading(true); fetchProducts(); }, [fetchProducts]);

  const toggleSelect = (id) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === products.length ? [] : products.map((p) => p._id));

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      await productsAPI.bulkArchive(selected);
      toast.success(`${selected.length} product(s) archived`);
      setSelected([]); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Archive failed'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await productsAPI.bulkDelete(selected);
      toast.success(`${selected.length} product(s) deleted`);
      setSelected([]); fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cafe-500 animate-spin" />
          <p className="text-sm text-stone-400 font-display font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..." className="auth-input pl-10 text-xs" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="auth-input text-xs pl-9 pr-8 min-w-[160px]">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Multi-select Action Bar */}
      {selected.length > 0 && isManager && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-2xl border border-stone-200 shadow-card animate-slide-down">
          <span className="text-sm font-display font-semibold text-stone-700">{selected.length} selected</span>
          <div className="flex-1" />
          <button onClick={handleArchive} disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-display font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50">
            <Archive className="w-3.5 h-3.5" /> Archive
          </button>
          <button onClick={handleDelete} disabled={actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-display font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={() => setSelected([])} className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex items-center justify-center py-20 animate-fade-in-up">
          <div className="text-center max-w-xs">
            <div className="relative inline-flex items-center justify-center mb-5">
              <div className="absolute w-24 h-24 rounded-full bg-cafe-100/50 animate-pulse-soft" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-stone-900 mb-1">
              {search || filterCat ? 'No matching products' : 'No products yet'}
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed">
              {search || filterCat ? 'Try different search or filter settings.' : 'Create your first product to build the menu.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.length === products.length && products.length > 0}
                      onChange={toggleAll} className="w-4 h-4 rounded border-stone-300 text-cafe-500 focus:ring-cafe-500/30" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hidden sm:table-cell">Tax</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hidden md:table-cell">UOM</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Category</th>
                  {isManager && <th className="px-4 py-3 w-10" />}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const catStyle = getCategoryChipStyle(p.category?.color);
                  return (
                    <tr key={p._id}
                      className={`border-b border-stone-50 transition-colors duration-150 ${
                        selected.includes(p._id) ? 'bg-cafe-50/50' : 'hover:bg-stone-50/50'
                      }`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(p._id)}
                          onChange={() => toggleSelect(p._id)}
                          className="w-4 h-4 rounded border-stone-300 text-cafe-500 focus:ring-cafe-500/30" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-display font-bold text-stone-800 truncate">{p.name}</p>
                          {p.variants?.length > 0 && (
                            <p className="text-[10px] text-stone-400 mt-0.5">{p.variants.length} variant{p.variants.length > 1 ? 's' : ''}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-display font-semibold text-stone-800">{formatCurrency(p.salePrice)}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-stone-500">{p.tax}%</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-stone-500">{p.uom}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {p.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                            style={catStyle}>
                            {p.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>
                      {isManager && (
                        <td className="px-4 py-3">
                          <button onClick={() => onEdit(p)}
                            className="p-2 text-stone-400 hover:text-cafe-600 hover:bg-cafe-50 rounded-lg transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
