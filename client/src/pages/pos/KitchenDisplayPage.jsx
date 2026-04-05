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
  MoreVertical
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  { id: 'confirmed', label: 'To Cook', icon: ClipboardList, color: 'text-stone-400' },
  { id: 'preparing', label: 'Preparing', icon: Flame, color: 'text-amber-500' },
  { id: 'ready', label: 'Ready', icon: BellRing, color: 'text-emerald-500' }
];

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getAll({ status: 'confirmed,preparing,ready' });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      toast.error('Failed to sync kitchen tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    socket.connect();

    // Join the dedicated kitchen room for global updates
    socket.emit('join_kitchen_room');

    // Listen for global kitchen updates
    socket.on('kitchen_order_updated', (data) => {
      console.log('Kitchen update received:', data);
      fetchOrders();
    });

    // Refresh times every minute
    const timer = setInterval(() => {
      setOrders(prev => [...prev]); // Trigger re-render for time ago
    }, 60000);

    return () => {
      socket.off('kitchen_order_updated');
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Ticket moved to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error('Workflow update failed');
    }
  };

  const toggleItemPrepared = async (orderId, lineId, currentState) => {
    try {
      await api.patch(`/orders/${orderId}/items/${lineId}/prepared`, { isPrepared: !currentState });
      fetchOrders();
    } catch (err) {
      toast.error('Status sync failed');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.lines.some(l => l.product.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || order.lines.some(l => l.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [orders, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(['All']);
    orders.forEach(o => o.lines.forEach(l => { if (l.category) cats.add(l.category); }));
    return Array.from(cats);
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cafe-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-body flex flex-col">
      {/* Kitchen Header */}
      <header className="bg-white border-b border-stone-100 px-8 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-display font-black text-stone-900 tracking-tight leading-none">Kitchen Board</h1>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1 ml-0.5">Live Operations Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-8 px-6 py-2 bg-stone-50 rounded-2xl border border-stone-100">
            {STATUS_COLUMNS.map(col => (
              <div key={col.id} className="text-center">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{col.label}</p>
                <p className="text-lg font-display font-black text-stone-900">{orders.filter(o => o.status === col.id).length}</p>
              </div>
            ))}
          </div>
          <button onClick={fetchOrders} className="p-3 bg-white border border-stone-100 rounded-xl hover:bg-stone-50 transition-colors shadow-sm active:scale-95">
            <RefreshCw className="w-5 h-5 text-stone-400" />
          </button>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="px-8 py-6 flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-cafe-600 transition-colors" />
          <input
            type="text"
            placeholder="Search by Ticket or Dish..."
            className="w-full h-14 pl-12 pr-4 bg-white border border-stone-100 rounded-2xl outline-none focus:ring-4 focus:ring-cafe-500/5 transition-all text-sm font-bold text-stone-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`h-14 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xl -translate-y-0.5'
                  : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Layout */}
      <div className="flex-1 px-8 pb-12 overflow-x-auto">
        <div className="flex gap-8 h-full min-w-[1000px] md:min-w-0">
          {STATUS_COLUMNS.map(column => (
            <div key={column.id} className="flex-1 flex flex-col min-h-0 min-w-[320px]">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white border border-stone-100 shadow-sm ${column.color}`}>
                    <column.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-sm font-display font-black text-stone-800 uppercase tracking-widest">{column.label}</h2>
                </div>
                <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-[10px] font-black flex items-center justify-center">
                  {filteredOrders.filter(o => o.status === column.id).length}
                </span>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {filteredOrders.filter(o => o.status === column.id).map(order => (
                  <div key={order._id} className="bg-white rounded-3xl border border-stone-100 shadow-card hover:shadow-xl transition-all duration-300 group overflow-hidden animate-fade-in relative">
                    {/* Progress indicator border */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${column.id === 'confirmed' ? 'bg-stone-200' : column.id === 'preparing' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                            <Hash className="w-4 h-4 text-stone-400" />
                          </div>
                          <div>
                            <p className="text-lg font-display font-black text-stone-900 tracking-tight leading-none group-hover:text-cafe-600 transition-colors">#{order.orderNumber.split('-')[1]}</p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Table {order.tableNumber || '101'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 rounded-full border border-stone-100">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span className="text-[10px] font-black text-stone-700 tracking-tight">{getTimeAgo(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        {order.lines.map((item) => (
                          <div
                            key={item._id}
                            onClick={() => toggleItemPrepared(order._id, item._id, item.isPrepared)}
                            className={`flex items-start justify-between py-3 px-4 rounded-xl cursor-pointer transition-all active:scale-95 group/item border ${item.isPrepared
                                ? 'bg-emerald-50 border-emerald-100 opacity-60'
                                : 'bg-stone-50 border-stone-100 hover:border-stone-200'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.isPrepared ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300'
                                }`}>
                                {item.isPrepared && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <div>
                                <p className={`text-sm font-bold tracking-tight ${item.isPrepared ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
                                  {item.product}
                                </p>
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{item.category || 'Food'}</p>
                              </div>
                            </div>
                            <span className="text-sm font-display font-black text-stone-900">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Workflow Actions */}
                      <div className="flex gap-2">
                        {column.id === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'preparing')}
                            className="flex-1 h-12 bg-amber-500 text-white rounded-xl font-display font-bold text-sm shadow-md shadow-amber-200 hover:bg-amber-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                          >
                            <Flame className="w-4 h-4" /> Start Cooking
                          </button>
                        )}
                        {column.id === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'ready')}
                            className="flex-1 h-12 bg-emerald-500 text-white rounded-xl font-display font-bold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Order Ready
                          </button>
                        )}
                        {column.id === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'served')}
                            className="flex-1 h-12 bg-stone-900 text-white rounded-xl font-display font-bold text-sm shadow-md shadow-stone-300 hover:bg-black hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                          >
                            Served <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        <button className="w-12 h-12 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredOrders.filter(o => o.status === column.id).length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-stone-100 rounded-[2.5rem]">
                    <div className="w-12 h-12 bg-stone-50 text-stone-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <column.icon className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">No tickets in queue</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
