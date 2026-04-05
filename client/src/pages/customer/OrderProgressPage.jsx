import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bell, 
  Coffee, 
  ArrowLeft, 
  ShoppingBag,
  Timer,
  Hash,
  Receipt,
  Info
} from 'lucide-react';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2, description: 'Order received' },
  { id: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Chef crafting' },
  { id: 'ready', label: 'Ready', icon: Bell, description: 'Hot & ready' },
  { id: 'served', label: 'Served', icon: Coffee, description: 'Enjoy!' },
  { id: 'completed', label: 'Completed', icon: ShoppingBag, description: 'Visit again' }
];

export default function OrderProgressPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'confirmed');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    // If we have an orderId but no order data (e.g., Refresh), fetch it
    const fetchOrderData = async () => {
      if (orderId && !order) {
        try {
          const res = await ordersAPI.getById(orderId);
          if (res.data.success) {
            setOrder(res.data.order);
            setCurrentStatus(res.data.order.status);
          }
        } catch (err) {
          toast.error('Could not load order tracking');
          navigate('/customer/menu');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrderData();

    if (order?._id || orderId) {
      const targetId = order?._id || orderId;
      socket.connect();
      socket.emit('join_order_room', targetId);

      socket.on('order_status_updated', (data) => {
        setCurrentStatus(data.status);
        setLastUpdate(new Date());
      });
    }

    return () => {
      socket.off('order_status_updated');
      socket.disconnect();
    };
  }, [order, orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cafe-600"></div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex(s => s.id === currentStatus);

  if (!order) {
    return (
       <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-6 text-center">
          <Info className="w-12 h-12 text-stone-200 mb-4" />
          <h2 className="text-xl font-display font-black text-stone-800">Tracking Session Expired</h2>
          <p className="text-stone-400 text-sm mt-2 max-w-xs">We couldn't find your active order. Please check with our staff if your order is already served.</p>
          <Link to="/customer/menu" className="mt-6 px-6 py-3 bg-stone-900 text-white rounded-xl font-bold">Return to Menu</Link>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7] font-body pb-10 animate-fade-in text-[#1A1814]">
      {/* Mini Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-stone-100 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/customer/menu" className="flex items-center gap-1.5 text-stone-400 hover:text-cafe-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-[10px] font-display font-black uppercase tracking-widest">Back</span>
          </Link>
          <h1 className="text-[10px] font-display font-black uppercase tracking-[0.3em] text-stone-900">Live Tracker</h1>
          <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
             <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
             Live
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Compact Bill Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-card border border-stone-100 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cafe-500 to-amber-400" />
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cream-100 rounded-xl border border-cafe-100 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-cafe-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-black text-espresso-900 tracking-tight leading-none mb-1">Receipt</h2>
                    <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">#{order.orderNumber.split('-')[1]}</p>
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-stone-50 text-stone-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-stone-100">
                  Paid
                </div>
              </div>

              {/* Mini Item List */}
              <div className="space-y-3 mb-6 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {order.lines.map((line, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-display font-black text-cafe-600 min-w-[20px]">{line.quantity}x</span>
                      <p className="text-xs font-bold text-espresso-900 tracking-tight">{line.product}</p>
                    </div>
                    <p className="text-xs font-display font-black text-espresso-900">₹{line.subtotal}</p>
                  </div>
                ))}
              </div>

              {/* Totals Section */}
              <div className="pt-4 border-t border-stone-50 space-y-2">
                 <div className="flex justify-between text-[9px] font-bold text-stone-300 uppercase tracking-wider">
                   <span>Subtotal</span>
                   <span>₹{order.subtotal}</span>
                 </div>
                 <div className="flex justify-between items-center pt-2 bg-cream-50/50 p-2 rounded-xl border border-cafe-100/10">
                   <p className="text-[10px] font-black text-espresso-800 uppercase tracking-widest">Total Bill</p>
                   <p className="text-2xl font-display font-black text-espresso-900 tracking-tighter">₹{order.total}</p>
                 </div>
              </div>
            </div>

            {/* Compact Table Info */}
            <div className="bg-espresso-900 rounded-2xl p-5 text-white flex items-center justify-between group overflow-hidden relative">
               <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Hash className="w-4 h-4 text-cafe-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] mb-0.5">Table</p>
                    <p className="text-sm font-display font-black text-white">#101 ·Asset</p>
                  </div>
               </div>
               <div className="text-right relative z-10">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] mb-0.5">Wait Est.</p>
                  <p className="text-sm font-display font-black text-cafe-400">12-15 <span className="text-[9px] uppercase font-bold text-white font-body">MIN</span></p>
               </div>
            </div>
          </div>

          {/* Right: Small Lifecycle Feed */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 shadow-card border border-stone-100 min-h-[440px] relative overflow-hidden flex flex-col group">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-[9px] font-display font-black text-espresso-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cafe-500 rounded-full animate-pulse" />
                    Kitchen Stream
                  </h3>
                  <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest italic flex items-center gap-2">
                    <Timer className="w-3 h-3" /> Live
                  </span>
               </div>

               <div className="relative space-y-10 pl-10 flex-1">
                  {/* Narrow Progress Line */}
                  <div className="absolute left-[54px] top-4 bottom-4 w-[2px] bg-stone-50 rounded-full overflow-hidden">
                     <div 
                        className="w-full bg-cafe-500 transition-all duration-[2000ms]"
                        style={{ height: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
                      />
                  </div>
                  
                  {STAGES.map((stage, sIdx) => {
                    const isCompleted = sIdx < currentIndex;
                    const isActive = sIdx === currentIndex;
                    const isUpcoming = sIdx > currentIndex;
                    const Icon = stage.icon;

                    return (
                      <div key={stage.id} className={`relative flex gap-8 transition-all duration-700 ${isUpcoming ? 'opacity-30' : 'opacity-100'}`}>
                        {/* Small Node */}
                        <div className={`relative z-10 w-[30px] h-[30px] rounded-xl flex items-center justify-center transition-all duration-700 border ${
                          isActive 
                            ? 'bg-espresso-900 border-cafe-500 text-white shadow-lg scale-110' 
                            : isCompleted
                              ? 'bg-cafe-600 border-cafe-600 text-white shadow-sm'
                              : 'bg-white border-stone-100 text-stone-200'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                             <h4 className={`text-sm font-display font-black tracking-tight transition-all duration-500 ${isActive ? 'text-espresso-900' : 'text-stone-400'}`}>
                               {stage.label}
                             </h4>
                             {isActive && <span className="text-[7px] font-black bg-stone-50 text-stone-300 border border-stone-200 px-2 rounded-full uppercase tracking-widest">Active</span>}
                          </div>
                          <p className={`text-[10px] font-semibold text-stone-300 mt-0.5 leading-snug transition-colors ${isActive ? 'text-stone-400' : ''}`}>
                            {stage.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
               </div>

               {/* Activity Bar Footer (Small Scale) */}
               <div className="mt-10 pt-6 border-t border-stone-50 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-[8px] font-body font-black text-stone-300 uppercase tracking-widest italic bg-stone-50 px-4 py-1.5 rounded-xl">
                     <Clock className="w-2.5 h-2.5" /> {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="w-full h-1 bg-stone-50 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-cafe-500 back to-amber-400 transition-all duration-[2000ms]" 
                       style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }} 
                     />
                  </div>
               </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="mt-10 text-center opacity-30">
         <p className="text-[8px] font-display font-black text-stone-300 uppercase tracking-[0.5em]">Odoo CAFE</p>
      </footer>
    </div>
  );
}
