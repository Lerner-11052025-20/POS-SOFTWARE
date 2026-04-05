import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { categoriesAPI, productsAPI, ordersAPI, tablesAPI, floorsAPI } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import { formatCurrency } from '../../utils/format';
import {
  Search, Info, Grid, List as ListIcon, ChevronRight,
  Plus, Minus, MessageSquare, Trash2, Send, ShoppingBag, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import PaymentCheckoutModal from '../../components/payment/PaymentCheckoutModal';

const getProductFallbackImage = (name, categoryName = '') => {
  if (!name) return null;
  const n = name.toLowerCase();
  const c = categoryName.toLowerCase();

  // Specific Beverages
  if (n.includes('water')) return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=400';
  if (n.includes('sprite') || n.includes('lime') || n.includes('dew')) return 'https://images.unsplash.com/photo-1625772452859-1e03c58c1ebb?auto=format&fit=crop&q=80&w=400';
  if (n.includes('cola') || n.includes('thumbs up') || n.includes('pepsi') || n.includes('soda')) return 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&q=80&w=400';
  if (n.includes('maza') || n.includes('maaza') || n.includes('mango') || n.includes('juice') || n.includes('slush')) return 'https://images.unsplash.com/photo-1628200508115-3f23c3be57b3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHNvZnQlMjBkcmlua3xlbnwwfHwwfHx8MA%3D%3D';
  if (n.includes('tea') || n.includes('chai')) return 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=400';
  if (n.includes('coffee') || n.includes('espresso') || n.includes('latte') || n.includes('mocha')) return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=400';
  if (n.includes('drink') || n.includes('beverage')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400';

  // Indian Cuisine
  if (n.includes('paneer') || n.includes('masala') || n.includes('curry')) return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400';
  if (n.includes('thali') || n.includes('punjabi') || n.includes('meal')) return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=400';
  if (n.includes('platter')) return 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=400';
  
  // Quick Bites & Global
  if (n.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400';
  if (n.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400';
  if (n.includes('sandwich') || n.includes('sandwitch')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=400';
  
  // Healthy & Desserts
  if (n.includes('fruit') || n.includes('salad')) return 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&q=80&w=400';
  if (n.includes('cake') || n.includes('dessert') || n.includes('sweet')) return 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400';
  
  // Intelligent Fallbacks based on category
  if (c.includes('beverage') || c.includes('drink')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400';
  if (c.includes('food') || c.includes('meal')) return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400';
  
  // Generic cafe fallback
  return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=400';
};

export default function CustomerMenuPage() {
  const { tableId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [table, setTable] = useState(location.state?.table || null);
  const [floor, setFloor] = useState(location.state?.floor || null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [orderLines, setOrderLines] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    // If no tableId and no state, redirect to floor view
    if (!tableId && !table) {
      navigate('/pos/terminal/default', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. If we have tableId but no table details, fetch them (Refresh case)
        if (tableId && !table) {
          const tableRes = await tablesAPI.getAll({ _id: tableId });
          const foundTable = tableRes.data.tables.find(t => t._id === tableId);
          
          if (!foundTable) {
            toast.error('Table not found');
            navigate('/pos/terminal/default');
            return;
          }

          // Security: Check if current user owns this reservation
          if (foundTable.status !== 'reserved') {
             toast.error('Session expired or table released');
             navigate('/pos/terminal/default');
             return;
          }

          setTable(foundTable);
          
          // Optionally fetch floor details
          const floorRes = await floorsAPI.getAll({ _id: foundTable.floor });
          setFloor(floorRes.data.floors[0]);
        }

        // 2. Fetch Menu
        const [catRes, prodRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getAll({ active: 'true' })
        ]);
        setCategories(catRes.data.categories || []);
        setProducts(prodRes.data.products || []);
      } catch (err) {
        console.error('Fetch menu error:', err);
        toast.error('Failed to load menu session');
        navigate('/pos/terminal/default');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tableId, table, navigate]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.category?._id === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleAddProduct = (product) => {
    setOrderLines(prev => {
      const existingLineIndex = prev.findIndex(line => line.product._id === product._id && !line.notes);
      if (existingLineIndex >= 0) {
        const newLines = [...prev];
        const line = newLines[existingLineIndex];
        newLines[existingLineIndex] = {
          ...line,
          quantity: line.quantity + 1,
          subtotal: (line.quantity + 1) * line.unitPrice
        };
        return newLines;
      }
      return [...prev, {
        product: product,
        quantity: 1,
        unitPrice: product.salePrice,
        subtotal: product.salePrice,
        notes: ''
      }];
    });
    // Visual feedback
    toast.success(`${product.name} added`);
  };

  const handleUpdateQuantity = (index, delta) => {
    setOrderLines(prev => {
      const newLines = [...prev];
      const line = newLines[index];
      const newQuantity = line.quantity + delta;
      
      if (newQuantity <= 0) {
        newLines.splice(index, 1);
      } else {
        newLines[index] = {
          ...line,
          quantity: newQuantity,
          subtotal: newQuantity * line.unitPrice
        };
      }
      return newLines;
    });
  };

  const handleUpdateNotes = (index, notes) => {
    setOrderLines(prev => {
      const newLines = [...prev];
      newLines[index].notes = notes;
      return newLines;
    });
  };

  const handleSendOrder = async () => {
    if (orderLines.length === 0) return;
    setShowPaymentModal(true);
  };
  
  const getOrderPayload = () => {
    return {
      table: table._id,
      floor: floor?._id,
      lines: orderLines.map(l => ({
        product: l.product.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        subtotal: l.subtotal,
        notes: l.notes,
      })),
    };
  };

  const handlePaymentSuccess = () => {
    setOrderLines([]);
    setShowMobileCart(false);
    setShowPaymentModal(false);
  };

  const orderTotal = orderLines.reduce((sum, line) => sum + line.subtotal, 0);
  const totalItems = orderLines.reduce((sum, line) => sum + line.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 border border-cafe-600 animate-pulse-soft"></div>
          <p className="text-stone-500 font-display font-semibold tracking-wide text-sm">Preparing Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 overflow-hidden font-body">
      {/* Context Header */}
      <div className="bg-white border-b border-stone-100 px-6 py-3 shrink-0 shadow-sm z-30">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/pos/terminal/default')}
              className="p-2 -ml-2 rounded-lg text-stone-400 hover:text-cafe-600 hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                {floor?.name || 'Main Floor'}
              </span>
              <h2 className="text-lg font-display font-black text-stone-900 tracking-tight leading-none mt-1">
                Table {table?.tableNumber}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
            <span className="text-xs font-semibold text-emerald-700">Active Order</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">
        {/* Left Side: Product Browsing */}
        <main className="flex-1 flex flex-col min-w-0 bg-cream-50 z-10 relative shadow-[1px_0_0_0_rgba(0,0,0,0.03)]">
          {/* Header & Controls */}
          <div className="bg-white border-b border-stone-100 px-6 py-6 shrink-0 z-20">
            <div className="flex flex-col gap-5">
              <div className="relative group max-w-md">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3.5 px-11 text-stone-800 placeholder-stone-400 focus:bg-white focus:ring-4 focus:ring-cafe-500/10 focus:border-cafe-500 transition-all outline-none font-medium text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-cafe-500 transition-colors" />
              </div>

              {/* Categories Selection */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`whitespace-nowrap px-5 py-2 rounded-lg text-xs font-bold transition-all border ${
                    activeCategory === 'all'
                      ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                      : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                  }`}
                >
                  All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => setActiveCategory(cat._id)}
                    className={`whitespace-nowrap px-5 py-2 rounded-lg text-xs font-bold transition-all border ${
                      activeCategory === cat._id
                        ? 'bg-cafe-600 border-cafe-600 text-white shadow-md'
                        : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-none pb-32 lg:pb-6">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 text-center border border-dashed border-stone-200 shadow-sm mt-8">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-stone-300" />
                </div>
                <h3 className="text-lg font-display font-black text-stone-800">No Items Found</h3>
                <p className="text-stone-400 text-xs mt-2 font-medium">Try checking a different category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6">
                {filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => handleAddProduct(product)}
                    className="group bg-white rounded-2xl flex flex-col overflow-hidden border border-stone-100 shadow-sm hover:shadow-card hover:-translate-y-1 transition-all duration-300 text-left active:scale-[0.98]"
                  >
                    <div className="aspect-[4/3] bg-stone-50 relative overflow-hidden flex flex-col items-center justify-center p-6 border-b border-stone-50">
                      {(product.image || getProductFallbackImage(product.name, product.category?.name)) ? (
                        <img src={product.image || getProductFallbackImage(product.name, product.category?.name)} alt={product.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="relative w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-300 z-10">
                          <ShoppingBag className="w-5 h-5 opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/90 backdrop-blur rounded-md text-[10px] font-bold text-cafe-600 shadow-sm border border-stone-100">
                        {product.category?.name || 'Item'}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="font-display font-bold text-stone-800 text-sm leading-tight mb-1 group-hover:text-cafe-600 transition-colors">
                        {product.name}
                      </h4>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-sm font-black text-stone-900">
                          {formatCurrency(product.salePrice)}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-cafe-50 shadow-sm flex items-center justify-center group-hover:bg-cafe-500 text-cafe-600 group-hover:text-white transition-colors">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Right Side: Order Summary Panel (Desktop) */}
        <aside className="hidden lg:flex flex-col w-[380px] bg-white border-l border-stone-100 shadow-[inset_1px_0_0_0_rgba(0,0,0,0.02)] z-20">
          <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <h3 className="font-display font-black text-stone-900">Current Order</h3>
            <span className="px-2.5 py-1 bg-stone-200 text-stone-700 text-xs font-bold rounded-lg">{totalItems} Items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none bg-white">
            {orderLines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 space-y-3 opacity-60">
                <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">No items added yet</p>
              </div>
            ) : (
              orderLines.map((line, i) => (
                <div key={i} className="bg-stone-50 rounded-2xl p-4 border border-stone-100 group animate-fade-in-up transition-all hover:bg-stone-100/50">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-stone-800 text-sm truncate">{line.product.name}</h4>
                      <p className="text-xs font-semibold text-cafe-600 mt-0.5">{formatCurrency(line.unitPrice)}</p>
                    </div>
                    <p className="font-black text-stone-900">{formatCurrency(line.subtotal)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white rounded-lg shadow-sm border border-stone-200 p-0.5">
                      <button onClick={() => handleUpdateQuantity(i, -1)} className="p-1.5 text-stone-500 hover:text-cafe-600 hover:bg-cafe-50 rounded-md transition-colors active:scale-95">
                        {line.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-stone-800">{line.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(i, 1)} className="p-1.5 text-stone-500 hover:text-cafe-600 hover:bg-cafe-50 rounded-md transition-colors active:scale-95">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <input 
                        type="text"
                        placeholder="Add note..."
                        value={line.notes}
                        onChange={(e) => handleUpdateNotes(i, e.target.value)}
                        className="w-32 bg-transparent text-[11px] font-medium text-stone-600 placeholder-stone-400 border-b border-transparent focus:border-stone-300 px-1 py-1 outline-none transition-all"
                      />
                      <MessageSquare className="w-3 h-3 text-stone-300 absolute right-1 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-stone-50 border-t border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-stone-500">Subtotal</span>
              <span className="text-lg font-black text-stone-900">{formatCurrency(orderTotal)}</span>
            </div>
            {/* Payment is strictly restricted, showing Send Order only */}
            <button
              onClick={handleSendOrder}
              disabled={isSubmitting || orderLines.length === 0}
              className="w-full py-4 px-6 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-bold rounded-xl shadow-btn hover:shadow-btn-hover transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Sending...' : 'Send Order to Kitchen'}
            </button>
          </div>
        </aside>

        {/* Mobile Sticky Order Bar */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-glass-lg p-4 pb-safe flex items-center justify-between px-6">
          <button 
            onClick={() => setShowMobileCart(true)}
            className="flex items-center gap-3 relative"
          >
            <div className="w-12 h-12 bg-cafe-50 rounded-xl flex items-center justify-center text-cafe-600 border border-cafe-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-md">
                 {totalItems}
              </span>
            )}
            <div className="text-left">
               <p className="text-xs font-bold tracking-widest text-stone-400 uppercase">Total</p>
               <p className="text-[17px] font-display font-black text-stone-900 leading-none">{formatCurrency(orderTotal)}</p>
            </div>
          </button>

          <button
            onClick={() => {
              if(orderLines.length > 0) setShowMobileCart(true);
            }}
            disabled={orderLines.length === 0}
            className="py-3.5 px-6 bg-cafe-600 text-white rounded-xl font-bold font-display shadow-btn disabled:opacity-50"
          >
            View Order
          </button>
        </div>

        {/* Mobile Cart Drawer/Modal (Simplified view) */}
        {showMobileCart && (
          <div className="lg:hidden fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex flex-col justify-end animate-fade-in transition-opacity" onClick={() => setShowMobileCart(false)}>
            <div className="bg-white max-h-[85vh] rounded-t-3xl shadow-2xl flex flex-col w-full animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 rounded-t-3xl">
                <h3 className="font-display font-black text-stone-900">Current Order</h3>
                <button onClick={() => setShowMobileCart(false)} className="text-stone-400 font-bold px-3 py-1 bg-white rounded-md text-xs shadow-sm">
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {orderLines.map((line, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-stone-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-stone-800 text-sm">{line.product.name}</span>
                        <span className="font-black text-stone-900 text-sm">{formatCurrency(line.subtotal)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-stone-200 rounded-lg p-0.5">
                          <button onClick={() => handleUpdateQuantity(i, -1)} className="p-2"><Minus className="w-3 h-3 text-stone-500" /></button>
                          <span className="w-6 text-center text-xs font-bold text-stone-800">{line.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(i, 1)} className="p-2"><Plus className="w-3 h-3 text-stone-500" /></button>
                        </div>
                        <input 
                          type="text" placeholder="Note..." value={line.notes}
                          onChange={(e) => handleUpdateNotes(i, e.target.value)}
                          className="flex-1 border border-stone-200 rounded-lg px-3 py-1 text-xs text-stone-600 focus:border-cafe-500 outline-none"
                        />
                        <button onClick={() => handleUpdateQuantity(i, -line.quantity)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
               <div className="p-6 bg-white border-t border-stone-100 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
                  <button
                    onClick={() => { handleSendOrder(); setShowMobileCart(false); }}
                    className="w-full py-4 rounded-xl bg-cafe-600 text-white font-display font-bold shadow-btn flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Order to Kitchen • {formatCurrency(orderTotal)}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
      
      <PaymentCheckoutModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderTotal={orderTotal}
        orderPayload={orderLines.length > 0 ? getOrderPayload() : null}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
