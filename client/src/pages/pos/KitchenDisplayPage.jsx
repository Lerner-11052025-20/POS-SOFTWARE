import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ClipboardList,
  Flame,
  BellRing,
  RefreshCw,
  Hash,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  MapPin,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 'all', label: 'All', color: 'bg-stone-100 text-stone-600' },
  { id: 'confirmed', label: 'To Cook', color: 'bg-blue-100 text-blue-600' },
  { id: 'preparing', label: 'Preparing', color: 'bg-amber-100 text-amber-600' },
  { id: 'ready', label: 'Completed', color: 'bg-emerald-100 text-emerald-600' }
];

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders?status=confirmed,preparing,ready');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Kitchen fetch error:', err);
      toast.error('Failed to sync kitchen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    socket.connect();
    socket.emit('join_kitchen_room');

    socket.on('kitchen_order_updated', fetchOrders);
    socket.on('order_status_updated', fetchOrders);

    return () => {
      socket.off('kitchen_order_updated');
      socket.off('order_status_updated');
    };
  }, []);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'confirmed' ? 'preparing' : 
                       currentStatus === 'preparing' ? 'ready' : 'served';
    try {
      await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update stage');
    }
  };

  const toggleItemPrepared = async (e, orderId, lineId, currentState) => {
    e.stopPropagation();
    try {
      await api.patch(`/orders/${orderId}/items/${lineId}/prepared`, { isPrepared: !currentState });
      fetchOrders();
    } catch (err) {
      toast.error('Status sync failed');
    }
  };

  // Filters computed from current active tickets
  const availableProducts = useMemo(() => {
    const products = new Set();
    orders.forEach(o => o.lines.forEach(l => products.add(l.product)));
    return Array.from(products).sort();
  }, [orders]);

  const availableCategories = useMemo(() => {
    const cats = new Set();
    orders.forEach(o => o.lines.forEach(l => { if (l.category) cats.add(l.category); }));
    return Array.from(cats).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStage = activeStage === 'all' || order.status === activeStage;
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.table?.tableNumber?.toString().includes(searchQuery);
      const matchesProduct = !selectedProduct || order.lines.some(l => l.product === selectedProduct);
      const matchesCategory = !selectedCategory || order.lines.some(l => l.category === selectedCategory);
      
      return matchesStage && matchesSearch && matchesProduct && matchesCategory;
    });
  }, [orders, activeStage, searchQuery, selectedProduct, selectedCategory]);

  const paginatedOrders = filteredOrders.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  if (loading) return null;

  return (
    <div className="h-screen bg-stone-50 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Navbar */}
      <nav className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <Menu className="w-6 h-6 text-stone-400 cursor-pointer" />
          <div className="flex items-center gap-1 border-r border-stone-200 pr-6 mr-2">
             <span className="text-sm font-bold text-stone-800">Kitchen Display</span>
          </div>
          
          <div className="flex items-center gap-1">
             {STAGES.map(stage => (
               <button 
                 key={stage.id}
                 onClick={() => { setActiveStage(stage.id); setPage(0); }}
                 className={`h-10 px-4 rounded-lg flex items-center gap-3 transition-all ${
                   activeStage === stage.id ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'
                 }`}
               >
                 <span className="text-xs font-bold uppercase tracking-wider">{stage.label}</span>
                 <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                    activeStage === stage.id ? 'bg-white/20' : 'bg-stone-100 text-stone-500'
                 }`}>
                   {stage.id === 'all' ? orders.length : orders.filter(o => o.status === stage.id).length}
                 </span>
               </button>
             ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-64 h-10 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:bg-white focus:border-stone-900 transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 border-l border-stone-200 pl-4">
             <span className="text-xs font-bold text-stone-400 px-2">{page * itemsPerPage + 1}-{Math.min((page + 1) * itemsPerPage, filteredOrders.length)} / {filteredOrders.length}</span>
             <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
             <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Filters */}
        <aside className="w-64 bg-white border-r border-stone-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
             <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest">Active Tickets</span>
             {(selectedProduct || selectedCategory) && (
               <button 
                 onClick={() => { setSelectedProduct(null); setSelectedCategory(null); }}
                 className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
               >
                 Clear Filter <X className="w-2.5 h-2.5" />
               </button>
             )}
          </div>

          <div className="p-2">
            <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest px-4 py-2 mt-2">Products</h4>
            <div className="space-y-0.5">
               {availableProducts.map(p => (
                 <button 
                   key={p}
                   onClick={() => setSelectedProduct(selectedProduct === p ? null : p)}
                   className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors rounded-md ${
                     selectedProduct === p ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'
                   }`}
                 >
                   {p}
                 </button>
               ))}
            </div>

            <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest px-4 py-2 mt-6">Categories</h4>
            <div className="space-y-0.5">
               {availableCategories.map(c => (
                 <button 
                   key={c}
                   onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}
                   className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors rounded-md ${
                     selectedCategory === c ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50'
                   }`}
                 >
                   {c}
                 </button>
               ))}
            </div>
          </div>
        </aside>

        {/* Main Ticket Grid */}
        <main className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 content-start overflow-y-auto bg-stone-100/30">
          {paginatedOrders.map(order => (
            <div 
              key={order._id}
              onClick={() => handleUpdateStatus(order._id, order.status)}
              className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all cursor-pointer group flex flex-col min-h-[340px]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between">
                 <div className="flex flex-col gap-1">
                    <span className="text-[28px] font-black text-stone-900 leading-none tracking-tight">#{order.orderNumber.split('-')[1]}</span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        order.status === 'confirmed' ? 'bg-blue-500' : 
                        order.status === 'preparing' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                        {order.status === 'confirmed' ? 'To Cook' : 
                         order.status === 'preparing' ? 'Preparing' : 'Ready'}
                      </span>
                    </div>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <div className="bg-stone-900 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-tighter">
                       T-{order.table?.tableNumber || '--'}
                    </div>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{order.floor?.name || 'Main'}</span>
                 </div>
              </div>

              {/* Items Area */}
              <div className="flex-1 p-5 space-y-3">
                 {order.lines.map(item => (
                   <div 
                     key={item._id}
                     onClick={(e) => toggleItemPrepared(e, order._id, item._id, item.isPrepared)}
                     className="flex items-start justify-between group/item"
                   >
                     <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-sm font-black text-stone-900">
                          {item.quantity}×
                        </span>
                        <div className="flex-1 min-w-0">
                           <p className={`text-sm font-bold leading-tight ${item.isPrepared ? 'line-through text-stone-300 decoration-2' : 'text-stone-800'}`}>
                             {item.product}
                           </p>
                           {item.notes && (
                             <p className="text-[10px] font-medium text-cafe-600 italic mt-1">{item.notes}</p>
                           )}
                        </div>
                     </div>
                   </div>
                 ))}
              </div>

              {/* Footer */}
              <div className="p-5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-stone-300" />
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-tighter">
                      {Math.floor((new Date() - new Date(order.createdAt)) / 60000)} MIN
                    </span>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                 </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-40">
               <ChefHat className="w-16 h-16 text-stone-200 mb-4" />
               <p className="font-bold text-stone-400 uppercase tracking-widest">No matching tickets</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
