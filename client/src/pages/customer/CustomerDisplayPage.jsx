import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Coffee, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Bell, 
  ShoppingBag,
  Timer,
  Hash
} from 'lucide-react';
import socket from '../../services/socket';
import { ordersAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';

export default function CustomerDisplayPage() {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrders = async () => {
    try {
      // Fetch orders that are being prepared or are ready
      const res = await ordersAPI.getAll({ status: 'preparing,ready' });
      if (res.data.success) {
        setActiveOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Fetch active orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
    socket.connect();

    socket.on('order_status_updated', () => {
      fetchActiveOrders();
    });

    return () => {
      socket.off('order_status_updated');
      socket.disconnect();
    };
  }, []);

  const preparingOrders = activeOrders.filter(o => o.status === 'preparing');
  const readyOrders = activeOrders.filter(o => o.status === 'ready');

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cafe-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 text-white font-body selection:bg-cafe-500/30 overflow-hidden flex flex-col">
      {/* Dynamic Header */}
      <header className="bg-stone-800/50 backdrop-blur-xl border-b border-white/5 px-10 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-cafe-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-cafe-500/20">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black tracking-tight leading-none">Odoo Cafe</h1>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-1.5 ml-0.5">Order Status Board</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Current Time</span>
             <p className="text-xl font-display font-black tabular-nums">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
           </div>
           <div className="w-px h-10 bg-white/10" />
           <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Data Sync</span>
           </div>
        </div>
      </header>

      {/* Status Board */}
      <main className="flex-1 grid grid-cols-2 gap-px bg-white/5 overflow-hidden">
        
        {/* Left Column: PREPARING */}
        <section className="flex flex-col bg-stone-900/40 p-12 overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                  <ChefHat className="w-6 h-6 text-amber-500" />
               </div>
               <h2 className="text-4xl font-display font-black tracking-tight">PREPARING</h2>
            </div>
            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10">
               <span className="text-sm font-black text-white/40">{preparingOrders.length} TICKETS</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-dark">
            {preparingOrders.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Timer className="w-20 h-20 mb-4" />
                  <p className="text-lg font-black tracking-widest">KITCHEN IS READY</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {preparingOrders.map(order => (
                  <div key={order._id} className="bg-stone-800/40 border border-white/5 rounded-3xl p-6 animate-fade-in flex flex-col items-center group hover:bg-stone-800/60 transition-all duration-500">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Hash className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-4xl font-display font-black tracking-tighter mb-1 tracking-widest">
                       {order.orderNumber.split('-')[1]}
                    </span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Table {order.tableNumber || '101'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: READY FOR PICKUP */}
        <section className="flex flex-col bg-emerald-500/[0.02] p-12 overflow-hidden border-l border-white/5">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <Bell className="w-6 h-6 text-emerald-500" />
               </div>
               <h2 className="text-4xl font-display font-black tracking-tight text-emerald-400">READY</h2>
            </div>
            <div className="px-5 py-2 bg-emerald-500/20 rounded-full border border-emerald-500/30">
               <span className="text-sm font-black text-emerald-400">{readyOrders.length} TICKETS</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-dark">
            {readyOrders.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <ShoppingBag className="w-20 h-20 mb-4" />
                  <p className="text-lg font-black tracking-widest">WAITING FOR CHEF</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {readyOrders.map(order => (
                  <div key={order._id} className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 animate-bounce-slow flex flex-col items-center shadow-[0_15px_40px_rgba(16,185,129,0.1)]">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/40">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <span className="text-5xl font-display font-black tracking-tighter mb-1 text-white tracking-widest">
                       {order.orderNumber.split('-')[1]}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest">Pick up at Counter</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Marquee Footer */}
      <footer className="bg-stone-800/80 backdrop-blur-md border-t border-white/5 py-4 shrink-0 overflow-hidden">
         <div className="flex whitespace-nowrap animate-marquee">
            {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="flex items-center gap-10 px-10">
                  <span className="text-xs font-black tracking-[0.3em] text-white/30 uppercase">Scan QR code at table to order</span>
                  <div className="w-1.5 h-1.5 bg-cafe-500 rounded-full" />
                  <span className="text-xs font-black tracking-[0.3em] text-white/30 uppercase">Premium Odoo Cafe Experience</span>
                  <div className="w-1.5 h-1.5 bg-cafe-500 rounded-full" />
                  <span className="text-xs font-black tracking-[0.3em] text-white/30 uppercase">Direct Kitchen Sync Enabled</span>
                  <div className="w-1.5 h-1.5 bg-cafe-500 rounded-full" />
               </div>
            ))}
         </div>
      </footer>
    </div>
  );
}
