import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import {
  Search, ArrowLeft, ShoppingBag, Plus, Minus, X, Trash2,
  ChevronRight, ChevronDown, ChevronUp, Coffee, Clock, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const CART_KEY = (token) => `qr_cart_${token}`;

const getProductImage = (name, categoryName = '') => {
  if (!name) return null;
  const n = name.toLowerCase();
  const c = categoryName.toLowerCase();
  if (n.includes('water')) return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=400';
  if (n.includes('sprite') || n.includes('lime') || n.includes('dew')) return 'https://images.unsplash.com/photo-1625772452859-1e03c58c1ebb?auto=format&fit=crop&q=80&w=400';
  if (n.includes('cola') || n.includes('pepsi') || n.includes('soda')) return 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=400';
  if (n.includes('maza') || n.includes('mango') || n.includes('juice')) return 'https://images.unsplash.com/photo-1628200508115-3f23c3be57b3?auto=format&fit=crop&q=80&w=400';
  if (n.includes('tea') || n.includes('chai')) return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=400';
  if (n.includes('coffee') || n.includes('espresso') || n.includes('latte')) return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400';
  if (n.includes('paneer') || n.includes('masala') || n.includes('curry')) return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400';
  if (n.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400';
  if (n.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400';
  if (n.includes('sandwich')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=400';
  if (n.includes('cake') || n.includes('dessert')) return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400';
  if (n.includes('salad') || n.includes('fruit')) return 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&q=80&w=400';
  if (c.includes('beverage') || c.includes('drink')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400';
  if (c.includes('food') || c.includes('meal')) return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400';
  return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400';
};

// ─── Product Detail Bottom Sheet ─────────────────────────────────────
function ProductDetailSheet({ product, onClose, onAddToCart, existingQty }) {
  const [quantity, setQuantity] = useState(existingQty || 1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const unitPrice = product.salePrice + (selectedVariant?.extraPrice || 0);
  const lineTotal = unitPrice * quantity;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center font-body">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-glass-lg animate-slide-up max-h-[85vh] flex flex-col">
        {/* Product Image */}
        <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-3xl sm:rounded-t-3xl shrink-0">
          <img
            src={getProductImage(product.name, product.category?.name)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-stone-600 hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {product.category && (
            <div className="absolute bottom-4 left-4">
              <span
                className="px-3 py-1 rounded-full text-[10px] font-bold text-white border border-white/20"
                style={{ backgroundColor: product.category.color || '#F59E0B' }}
              >
                {product.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <h3 className="text-xl font-display font-bold text-stone-900 mb-1">{product.name}</h3>
          <p className="text-lg font-display font-black text-cafe-600 mb-3">{formatCurrency(product.salePrice)}</p>
          {product.description && (
            <p className="text-sm text-stone-500 mb-4 leading-relaxed">{product.description}</p>
          )}

          {/* Variants */}
          {product.variants?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Customize</p>
              <div className="space-y-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVariant(selectedVariant?._id === v._id ? null : v)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      selectedVariant?._id === v._id
                        ? 'border-cafe-500 bg-cafe-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-semibold text-stone-800">{v.attribute}: {v.value}</span>
                    </div>
                    {v.extraPrice > 0 && (
                      <span className="text-xs font-bold text-cafe-600">+{formatCurrency(v.extraPrice)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-4">
            <p className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Special Instructions</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests..."
              maxLength={200}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/10 resize-none"
              rows={2}
            />
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">Quantity</p>
            <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-1 border border-stone-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-display font-bold text-stone-900">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(20, quantity + 1))}
                className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="p-5 pt-3 border-t border-stone-100 shrink-0">
          <button
            onClick={() => {
              onAddToCart(product, quantity, selectedVariant, notes);
              onClose();
            }}
            className="w-full py-4 bg-stone-900 text-white font-display font-bold text-sm rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <ShoppingBag className="w-4 h-4" />
            Add to Cart — {formatCurrency(lineTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer ─────────────────────────────────────────────────────
function CartDrawer({ isOpen, onClose, cart, onUpdateQty, onRemove, onCheckout, token }) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxTotal = cart.reduce((sum, item) => {
    const lineSubtotal = item.unitPrice * item.quantity;
    return sum + (lineSubtotal * (item.tax || 0)) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center font-body">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-glass-lg max-h-[85vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-stone-900">Your Order</h3>
              <p className="text-xs text-stone-400">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-stone-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-400">Your cart is empty</p>
              <p className="text-xs text-stone-300 mt-1">Browse the menu to add items</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
                    {item.variantLabel && (
                      <p className="text-[11px] text-cafe-600 font-medium mt-0.5">{item.variantLabel}</p>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-stone-400 mt-0.5 truncate">Note: {item.notes}</p>
                    )}
                    <p className="text-xs font-semibold text-stone-500 mt-1">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-display font-bold text-stone-900 shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-200/60">
                  <button
                    onClick={() => onRemove(idx)}
                    className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-0.5 border border-stone-200">
                    <button
                      onClick={() => onUpdateQty(idx, item.quantity - 1)}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-stone-900">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(idx, item.quantity + 1)}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals + Checkout */}
        {cart.length > 0 && (
          <div className="p-5 pt-0 shrink-0">
            <div className="bg-stone-50 rounded-2xl p-4 mb-4 space-y-2 border border-stone-100">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-semibold text-stone-700">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Tax</span>
                <span className="font-semibold text-stone-700">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-stone-200">
                <span className="font-display font-bold text-stone-900">Total</span>
                <span className="font-display font-black text-stone-900">{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-4 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-bold text-sm rounded-2xl shadow-btn hover:shadow-btn-hover hover:from-cafe-600 hover:to-cafe-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Proceed to Checkout
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Mobile Menu Page ───────────────────────────────────────────
export default function MobileMenuPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCart, setShowCart] = useState(false);

  // Cart state with localStorage persistence
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY(token));
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY(token), JSON.stringify(cart));
  }, [cart, token]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [tableRes, menuRes] = await Promise.all([
          publicAPI.resolveTable(token),
          publicAPI.getMenu(),
        ]);
        if (tableRes.data.success) setTable(tableRes.data.table);
        if (menuRes.data.success) {
          setCategories(menuRes.data.categories || []);
          setProducts(menuRes.data.products || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCategory === 'all' || p.category?._id === activeCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleAddToCart = useCallback((product, quantity, variant, notes) => {
    setCart((prev) => {
      const unitPrice = product.salePrice + (variant?.extraPrice || 0);
      const key = `${product._id}_${variant?._id || 'base'}`;
      const existingIdx = prev.findIndex((item) => item.key === key && item.notes === notes);

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + quantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          key,
          productId: product._id,
          name: product.name,
          unitPrice,
          tax: product.tax || 0,
          quantity,
          variantId: variant?._id || null,
          variantLabel: variant ? `${variant.attribute}: ${variant.value}` : null,
          notes: notes || '',
          categoryName: product.category?.name || '',
        },
      ];
    });
    toast.success('Added to cart', { duration: 1500, style: { fontSize: '13px' } });
  }, []);

  const handleUpdateQty = useCallback((idx, newQty) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setCart((prev) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: Math.min(20, newQty) };
        return updated;
      });
    }
  }, []);

  const handleRemoveItem = useCallback((idx) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCart(false);
    navigate(`/order/${token}/checkout`, { state: { cart, table } });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const getCartQty = (productId) => cart.filter((c) => c.productId === productId).reduce((sum, c) => sum + c.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 animate-pulse-soft flex items-center justify-center">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <p className="text-stone-500 font-display font-semibold text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <p className="text-xl mb-2">😕</p>
          <h2 className="text-lg font-display font-bold text-stone-900 mb-2">{error}</h2>
          <button onClick={() => navigate(`/scan/${token}`)} className="text-sm text-cafe-600 font-semibold hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-body flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/scan/${token}`)}
              className="p-2 -ml-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {table?.floor?.name || 'Main Floor'}
              </p>
              <h2 className="text-base font-display font-bold text-stone-900 leading-tight">
                Table {table?.tableNumber}
              </h2>
            </div>
          </div>
          <button
            onClick={() => navigate(`/order/${token}/history`)}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 sm:px-6 pt-4 pb-2 max-w-2xl mx-auto w-full">
        <div className="relative">
          <input
            type="text"
            placeholder="Search menu..."
            className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/10 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-4 sm:px-6 py-3 max-w-2xl mx-auto w-full">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
              activeCategory === 'all'
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                activeCategory === cat._id
                  ? 'bg-cafe-600 border-cafe-600 text-white'
                  : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 px-4 sm:px-6 pb-32 max-w-2xl mx-auto w-full">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">🔍</p>
            <p className="text-sm font-semibold text-stone-400">No items found</p>
            <p className="text-xs text-stone-300 mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const inCartQty = getCartQty(product._id);
              return (
                <button
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-card transition-all text-left group active:scale-[0.98]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={getProductImage(product.name, product.category?.name)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {product.category && (
                      <span
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
                        style={{ backgroundColor: product.category.color || '#F59E0B' }}
                      >
                        {product.category.name}
                      </span>
                    )}
                    {inCartQty > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cafe-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                        {inCartQty}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-stone-800 leading-tight truncate">{product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-display font-bold text-cafe-600">{formatCurrency(product.salePrice)}</p>
                      <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center group-hover:bg-cafe-600 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full py-4 px-5 bg-stone-900 text-white rounded-2xl shadow-glass-lg flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-5 h-5" />
                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cafe-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                    {totalItems}
                  </div>
                </div>
                <span className="text-sm font-semibold">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-display font-bold">{formatCurrency(cartTotal)}</span>
                <ChevronUp className="w-4 h-4 opacity-60" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Sheet */}
      {selectedProduct && (
        <ProductDetailSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          existingQty={getCartQty(selectedProduct._id)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveItem}
        onCheckout={handleCheckout}
        token={token}
      />
    </div>
  );
}
