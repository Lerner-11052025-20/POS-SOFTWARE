import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link, useParams } from 'react-router-dom';
import { ordersAPI } from '../../services/api';
import {
  Check,
  Clock,
  ChefHat,
  Bell,
  Coffee,
  ArrowLeft,
  Info,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import socket from '../../services/socket';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 'confirmed', label: 'Order Received', icon: Check, emoji: '✅', msg: 'We got your order! Sending it to the kitchen now.' },
  { id: 'preparing', label: 'Cooking', icon: ChefHat, emoji: '👨‍🍳', msg: 'Our chef is preparing your food with love.' },
  { id: 'ready', label: 'Ready for Pickup', icon: Bell, emoji: '🔔', msg: 'Your order is ready! We\'re bringing it to you.' },
  { id: 'served', label: 'Served', icon: Coffee, emoji: '☕', msg: 'Enjoy your meal! Bon Appétit!' }
];

function ElapsedTimer({ since }) {
  const [text, setText] = useState('');
  const calc = useCallback(() => {
    const s = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ${m % 60}m ago`;
  }, [since]);
  useEffect(() => {
    setText(calc());
    const iv = setInterval(() => setText(calc()), 15000);
    return () => clearInterval(iv);
  }, [calc]);
  return <span>{text}</span>;
}

export default function OrderProgressPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'confirmed');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(!order);
  const [showItems, setShowItems] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (orderId && !order) {
        try {
          const res = await ordersAPI.getById(orderId);
          if (res.data.success) {
            setOrder(res.data.order);
            setCurrentStatus(res.data.order.status);
          }
        } catch {
          toast.error('Could not load order');
          navigate('/pos/terminal/default');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrderData();

    if (orderId) {
      socket.connect();
      socket.emit('join_order_room', orderId);
      const handleUpdate = (data) => {
        if (data.status) {
          setCurrentStatus(data.status);
          setLastUpdate(new Date());
          if (data.status === 'ready' || data.status === 'served') {
            setCelebrated(true);
            setTimeout(() => setCelebrated(false), 2000);
          }
        }
      };
      socket.on('order_status_updated', handleUpdate);
      return () => { socket.off('order_status_updated', handleUpdate); };
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Loading your order...</p>
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex(s => s.id === currentStatus);
  const activeStage = STAGES[currentIndex] || STAGES[0];
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / STAGES.length) * 100 : 25;

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <Info className="w-10 h-10 text-neutral-300 mb-4" />
        <h2 className="text-lg font-semibold text-neutral-800">Order not found</h2>
        <p className="text-neutral-400 text-sm mt-2 max-w-xs">We couldn't find this order. It may have been completed already.</p>
        <Link to="/pos/terminal/default" className="mt-6 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
          Back to Menu
        </Link>
      </div>
    );
  }

  const isServed = currentStatus === 'served';

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Celebration overlay */}
      {celebrated && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce">
            {currentStatus === 'served' ? '🎉' : '🔔'}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-lg mx-auto px-5 py-3.5 flex items-center justify-between">
          <Link to="/pos/terminal/default" className="p-1.5 -ml-1.5 rounded-lg hover:bg-neutral-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Link>
          <div className="text-center">
            <p className="text-[13px] font-semibold text-neutral-900">Order #{order.orderNumber?.split('-')[1]}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-6">

        {/* Hero Status Card */}
        <div className={`rounded-2xl p-6 text-center transition-all duration-700 ${
          isServed
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100'
            : 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100'
        }`}>
          <div className="text-5xl mb-3 transition-all duration-500">{activeStage.emoji}</div>
          <h1 className="text-xl font-bold text-neutral-900 mb-1">{activeStage.label}</h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-xs mx-auto">{activeStage.msg}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated <ElapsedTimer since={lastUpdate} /></span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            {STAGES.map((stage, idx) => {
              const done = idx <= currentIndex;
              return (
                <div key={stage.id} className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-500 ${
                    idx === currentIndex
                      ? 'bg-neutral-900 text-white scale-110 shadow-lg shadow-neutral-900/20'
                      : done
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-400'
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-neutral-900 rounded-full transition-all duration-[1500ms] ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {STAGES.map(s => (
              <span key={s.id} className="text-[10px] text-neutral-400 flex-1 text-center">{s.label.split(' ')[0]}</span>
            ))}
          </div>
        </div>

        {/* Table & Estimated Time */}
        <div className="flex gap-3">
          <div className="flex-1 bg-neutral-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg border border-neutral-200 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-medium">Your Table</p>
              <p className="text-sm font-bold text-neutral-900">Table {order.table?.tableNumber || '--'}</p>
            </div>
          </div>
          <div className="flex-1 bg-neutral-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg border border-neutral-200 flex items-center justify-center">
              <Clock className="w-4 h-4 text-neutral-600" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-medium">Est. Wait</p>
              <p className="text-sm font-bold text-neutral-900">
                {isServed ? 'Done!' : currentStatus === 'ready' ? '< 1 min' : '10–15 min'}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary (Expandable) */}
        <div className="bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100">
          <button
            onClick={() => setShowItems(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-800">
                {order.lines.length} item{order.lines.length > 1 ? 's' : ''} · ₹{order.total}
              </span>
            </div>
            {showItems ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
          </button>

          {showItems && (
            <div className="px-5 pb-4 space-y-3 border-t border-neutral-100 pt-3 animate-fade-in">
              {order.lines.map((line, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-white rounded-md border border-neutral-200 flex items-center justify-center text-[11px] font-bold text-neutral-600">
                      {line.quantity}
                    </span>
                    <span className="text-sm text-neutral-700">{line.product}</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">₹{line.subtotal}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-dashed border-neutral-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-600">Total</span>
                <span className="text-lg font-bold text-neutral-900">₹{order.total}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Timeline */}
        <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-100">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-4">Live Activity</h3>
          <div className="space-y-0">
            {STAGES.map((stage, sIdx) => {
              const done = sIdx < currentIndex;
              const active = sIdx === currentIndex;
              const upcoming = sIdx > currentIndex;
              const Icon = stage.icon;

              return (
                <div key={stage.id} className="flex gap-3.5">
                  {/* Line + dot column */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                      active
                        ? 'bg-neutral-900 text-white ring-4 ring-neutral-900/10'
                        : done
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white border-2 border-neutral-200 text-neutral-300'
                    }`}>
                      {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    {sIdx < STAGES.length - 1 && (
                      <div className={`w-0.5 h-8 transition-all duration-500 ${
                        done ? 'bg-neutral-900' : 'bg-neutral-200'
                      }`} />
                    )}
                  </div>

                  {/* Text content */}
                  <div className={`pb-6 pt-1 transition-all duration-300 ${upcoming ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${active ? 'text-neutral-900' : done ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {stage.label}
                      </p>
                      {active && (
                        <span className="px-2 py-0.5 bg-neutral-900 text-white text-[10px] font-semibold rounded-full animate-pulse">
                          NOW
                        </span>
                      )}
                    </div>
                    {(active || done) && (
                      <p className="text-xs text-neutral-400 mt-0.5">{stage.msg}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Served CTA */}
        {isServed && (
          <div className="text-center py-4 animate-fade-in">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm text-neutral-500 mb-4">Your food has been served. Enjoy!</p>
            <Link
              to="/pos/terminal/default"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Order More
            </Link>
          </div>
        )}

      </main>

      {/* Minimal footer */}
      <footer className="py-6 text-center">
        <p className="text-[11px] text-neutral-300">Odoo POS Cafe</p>
      </footer>
    </div>
  );
}
