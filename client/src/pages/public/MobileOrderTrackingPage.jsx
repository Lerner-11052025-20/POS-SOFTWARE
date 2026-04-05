import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import socket from '../../services/socket';
import {
  ArrowLeft, Clock, ChevronDown, ChevronUp, Bell, CheckCircle, Coffee, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const STAGES = [
  { key: 'confirmed', label: 'Order Received', emoji: '📋', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
  { key: 'preparing', label: 'Cooking', emoji: '🔥', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' },
  { key: 'ready', label: 'Ready for Pickup', emoji: '✅', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
  { key: 'served', label: 'Served', emoji: '🍽️', color: 'bg-stone-700', lightColor: 'bg-stone-50', textColor: 'text-stone-600', borderColor: 'border-stone-200' },
];

function getStageIdx(status) {
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function getElapsedTime(createdAt) {
  if (!createdAt) return '';
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function MobileOrderTrackingPage() {
  const { token, orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showItems, setShowItems] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const [notifications, setNotifications] = useState([]);
  const notifId = useRef(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await publicAPI.getOrderStatus(orderId);
        if (res.data.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  // Socket real-time updates
  useEffect(() => {
    if (!orderId) return;
    socket.connect();
    socket.emit('join_order_room', orderId);

    const handleUpdate = (data) => {
      if (data.status) {
        setOrder((prev) => (prev ? { ...prev, status: data.status, updatedAt: data.updatedAt || new Date().toISOString() } : prev));
        const stageInfo = STAGES.find((s) => s.key === data.status);
        const label = stageInfo ? stageInfo.label : data.status;
        addNotification(`${stageInfo?.emoji || '📌'} ${data.message || `Order is now: ${label}`}`);
      }
    };

    socket.on('order_status_updated', handleUpdate);
    return () => {
      socket.off('order_status_updated', handleUpdate);
    };
  }, [orderId]);

  // Elapsed time timer
  useEffect(() => {
    if (!order?.createdAt) return;
    const tick = () => setElapsed(getElapsedTime(order.createdAt));
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [order?.createdAt]);

  const addNotification = (message) => {
    const id = ++notifId.current;
    setNotifications((prev) => [{ id, message }, ...prev.slice(0, 4)]);
    toast(message, {
      duration: 4000,
      style: { fontSize: '13px', borderRadius: '1rem', background: '#1A1814', color: '#FFF' },
      icon: '🔔',
    });
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const stageIdx = order ? getStageIdx(order.status) : 0;
  const currentStage = STAGES[stageIdx];
  const isCompleted = order?.status === 'served';

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 font-body">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 animate-pulse-soft flex items-center justify-center">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <p className="text-stone-500 font-display font-semibold text-sm">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 font-body">
        <div className="text-center">
          <p className="text-xl mb-3">😕</p>
          <h2 className="text-lg font-display font-bold text-stone-900 mb-2">Order not found</h2>
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
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/scan/${token}`)}
              className="p-2 -ml-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-display font-bold text-stone-900">Order Tracking</h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {order.orderNumber}
              </p>
            </div>
          </div>
          {elapsed && (
            <div className="flex items-center gap-1.5 text-stone-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">{elapsed}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full">
        {/* Status Hero */}
        <div className={`rounded-3xl p-6 mb-6 text-center border ${currentStage.lightColor} ${currentStage.borderColor} animate-fade-in`}>
          <div className="text-4xl mb-3">{currentStage.emoji}</div>
          <h3 className={`text-xl font-display font-black ${currentStage.textColor} mb-1`}>
            {currentStage.label}
          </h3>
          <p className="text-sm text-stone-500">
            {order.status === 'confirmed' && 'Your order has been received and is in the queue'}
            {order.status === 'preparing' && 'The kitchen is preparing your food'}
            {order.status === 'ready' && 'Your order is ready! Please collect it'}
            {order.status === 'served' && 'Bon appétit! Enjoy your meal'}
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
          <div className="space-y-0">
            {STAGES.map((stage, idx) => {
              const isPast = idx < stageIdx;
              const isCurrent = idx === stageIdx;
              const isFuture = idx > stageIdx;

              return (
                <div key={stage.key} className="flex gap-4">
                  {/* Vertical Line + Dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isPast
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? `${stage.color} text-white shadow-md`
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div
                        className={`w-0.5 h-8 my-1 transition-colors ${
                          isPast ? 'bg-emerald-300' : 'bg-stone-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Stage Label */}
                  <div className="pt-1 pb-3">
                    <p
                      className={`text-sm font-semibold ${
                        isPast
                          ? 'text-emerald-600'
                          : isCurrent
                          ? 'text-stone-900'
                          : 'text-stone-400'
                      }`}
                    >
                      {stage.label}
                      {isCurrent && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cafe-50 border border-cafe-100 text-cafe-600 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-cafe-500 animate-pulse" />
                          NOW
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details (Expandable) */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden mb-6">
          <button
            onClick={() => setShowItems(!showItems)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <Coffee className="w-4 h-4 text-stone-400" />
              <span className="text-sm font-bold text-stone-800">
                Order Details • {order.lines?.length || 0} item{(order.lines?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            {showItems ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>
          {showItems && (
            <div className="border-t border-stone-50 animate-slide-down">
              <div className="divide-y divide-stone-50">
                {order.lines?.map((line, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-stone-400 shrink-0">{line.quantity}×</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate">{line.product}</p>
                        {line.notes && <p className="text-[11px] text-stone-400 truncate">{line.notes}</p>}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-stone-700 shrink-0">{formatCurrency(line.total || line.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-stone-50/50 border-t border-stone-100 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-semibold text-stone-600">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Tax</span>
                  <span className="font-semibold text-stone-600">{formatCurrency(order.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-base pt-1.5 border-t border-stone-200">
                  <span className="font-display font-bold text-stone-900">Total</span>
                  <span className="font-display font-black text-stone-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Info */}
        <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-stone-100 shadow-sm mb-6">
          <div className="w-9 h-9 rounded-lg bg-cafe-50 border border-cafe-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-cafe-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-400">Table</p>
            <p className="text-sm font-semibold text-stone-800">
              {order.tableName || order.table?.tableNumber || '—'} • {order.floor?.name || ''}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-6">
          <button
            onClick={() => navigate(`/order/${token}`)}
            className="w-full py-3 px-6 bg-white border border-stone-200 text-stone-700 font-display font-semibold text-sm rounded-xl hover:bg-stone-50 transition-all"
          >
            Order More Items
          </button>
          <button
            onClick={() => navigate(`/order/${token}/history`)}
            className="w-full py-3 px-6 text-stone-400 font-display font-semibold text-xs rounded-xl hover:bg-stone-50 transition-colors"
          >
            View All Orders
          </button>
        </div>
      </div>

      {/* Floating Notifications */}
      <div className="fixed top-16 right-4 z-50 space-y-2 max-w-xs">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-glass-lg text-sm font-medium animate-slide-down flex items-center gap-2"
          >
            <Bell className="w-4 h-4 text-cafe-400 shrink-0" />
            <span>{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
