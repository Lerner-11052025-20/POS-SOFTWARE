import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  ChefHat, 
  Bell, 
  Coffee, 
  ArrowLeft, 
  ShoppingBag,
  Timer,
  Hash
} from 'lucide-react';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2, description: 'We have received your order' },
  { id: 'preparing', label: 'In Preparation', icon: ChefHat, description: 'Chef is crafting your choice' },
  { id: 'ready', label: 'Ready to Serve', icon: Bell, description: 'Your order is hot and ready!' },
  { id: 'served', label: 'Served', icon: Coffee, description: 'Enjoy your meal!' },
  { id: 'completed', label: 'Completed', icon: ShoppingBag, description: 'Thank you for visiting' }
];

export default function OrderProgressPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};
  
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'confirmed');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (!order?._id) {
      toast.error('No active order found');
      navigate('/customer/menu');
      return;
    }

    // Connect and join room
    socket.connect();
    socket.emit('join_order_room', order._id);

    socket.on('order_status_updated', (data) => {
      setCurrentStatus(data.status);
      setLastUpdate(new Date());
      
      // Personalized notifications per milestone
      switch(data.status) {
        case 'preparing':
          toast('👨‍🍳 Chef started preparing your order!', { icon: '🔥', duration: 4000 });
          break;
        case 'ready':
          toast.success('🎉 Your order is READY!', { duration: 5000, style: { fontWeight: 'bold' } });
          break;
        case 'served':
          toast('☕ Order served. Enjoy!', { icon: '✨' });
          break;
        case 'completed':
          toast.success('✅ Transaction completed. Come again!');
          break;
        default:
          break;
      }
    });

    return () => {
      socket.off('order_status_updated');
      socket.disconnect();
    };
  }, [order, navigate]);

  const getStageIndex = (status) => STAGES.findIndex(s => s.id === status);
  const currentIndex = getStageIndex(currentStatus);

  if (!order) return null;

  return (
    <div className="min-h-screen bg-cream-50 font-body animate-fade-in pb-12">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-stone-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/customer/menu" className="p-2 -ml-2 text-stone-400 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-display font-black uppercase tracking-[0.2em] text-stone-900">Live Tracker</h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Real-time status</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100">
             <Timer className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8">
        {/* Order Identifier Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-card border border-stone-100 text-center mb-8 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cafe-500 to-amber-300" />
           
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-emerald-100/50">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             Payment Verified
           </div>

           <div className="flex flex-col items-center justify-center gap-1 mb-6">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-2">
                <Hash className="w-6 h-6 text-stone-400" />
              </div>
              <h2 className="text-3xl font-display font-black text-stone-900 tracking-tight">#{order.orderNumber || '0000'}</h2>
              <p className="text-sm font-bold text-stone-400">Order Token</p>
           </div>

           <div className="grid grid-cols-2 gap-4 pt-6 border-t border-stone-50">
             <div className="text-left">
               <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Table</p>
               <p className="text-lg font-display font-black text-stone-800">101 <span className="text-xs font-bold text-stone-400 ml-1 tracking-normal uppercase font-body italic">Dining Asset</span></p>
             </div>
             <div className="text-right">
               <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Estimated</p>
               <p className="text-lg font-display font-black text-stone-800">12-15 <span className="text-xs font-bold text-stone-400 ml-1 tracking-normal uppercase font-body font-bold">Mins</span></p>
             </div>
           </div>
        </div>

        {/* Live Progress Tracker */}
        <div className="bg-white rounded-[2rem] p-8 shadow-card border border-stone-100">
           <h3 className="text-xs font-display font-black text-stone-900 uppercase tracking-widest mb-8 flex items-center gap-2">
             <span className="w-1 h-1 bg-cafe-500 rounded-full" />
             Preparation Progress
           </h3>

           <div className="relative space-y-10 pl-6">
              {/* Connecting Line */}
              <div className="absolute left-[34px] top-4 bottom-4 w-0.5 bg-stone-100" />
              
              {STAGES.map((stage, sIdx) => {
                const isCompleted = sIdx < currentIndex;
                const isActive = sIdx === currentIndex;
                const isUpcoming = sIdx > currentIndex;
                const Icon = stage.icon;

                return (
                  <div key={stage.id} className={`relative flex gap-6 transition-all duration-700 ${isUpcoming ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                    {/* Stage Indicator Node */}
                    <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                      isActive 
                        ? 'bg-cafe-600 border-cafe-200 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)] scale-125' 
                        : isCompleted
                          ? 'bg-emerald-500 border-emerald-100 text-white'
                          : 'bg-white border-stone-100 text-stone-300'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                      
                      {isActive && (
                        <div className="absolute inset-0 rounded-full border-4 border-cafe-500/20 animate-ping" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                         <h4 className={`text-sm font-display font-black tracking-tight ${isActive ? 'text-stone-900' : 'text-stone-700'}`}>
                           {stage.label}
                         </h4>
                         {isActive && <span className="text-[10px] font-black text-cafe-600 uppercase tracking-widest animate-pulse">Live</span>}
                      </div>
                      <p className="text-xs font-medium text-stone-400 mt-0.5 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        {/* Timeline Footer */}
        <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest italic">
           <Clock className="w-3 h-3" />
           Last update at {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </main>
    </div>
  );
}
