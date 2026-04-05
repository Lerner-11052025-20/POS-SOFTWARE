import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { CheckCircle, ArrowRight, Clock, Coffee, MapPin, Receipt } from 'lucide-react';

export default function MobilePaymentSuccessPage() {
  const { token, orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [table, setTable] = useState(location.state?.table || null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (!order && orderId) {
      publicAPI.getOrderStatus(orderId).then((res) => {
        if (res.data.success) setOrder(res.data.order);
      }).catch(() => {});
    }
    if (!table && token) {
      publicAPI.resolveTable(token).then((res) => {
        if (res.data.success) setTable(res.data.table);
      }).catch(() => {});
    }
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [orderId, token, order, table]);

  return (
    <div className="min-h-screen bg-cream-50 font-body flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Celebration Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float-fast"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${Math.random() * 50}%`,
                backgroundColor: ['#F97316', '#FBBF24', '#10B981', '#3B82F6', '#EC4899'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="max-w-sm w-full animate-slide-up relative z-20">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-100/50">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-display font-black text-stone-900 tracking-tight mb-2">
            Order Confirmed!
          </h1>
          <p className="text-sm text-stone-500">
            Your order has been sent to the kitchen
          </p>
        </div>

        {/* Order Card */}
        <div className="bg-white rounded-3xl shadow-card border border-stone-100 overflow-hidden mb-6">
          {/* Order Number */}
          <div className="p-5 border-b border-stone-50 text-center bg-stone-50/30">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Order Number</p>
            <p className="text-2xl font-display font-black text-stone-900 tracking-tight">
              {order?.orderNumber || '...'}
            </p>
          </div>

          {/* Details */}
          <div className="p-5 space-y-4">
            {/* Table */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cafe-50 border border-cafe-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-cafe-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Table</p>
                <p className="text-sm font-semibold text-stone-800">
                  {table?.tableNumber || order?.tableName || '—'} • {table?.floor?.name || order?.floor?.name || ''}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Amount Paid</p>
                <p className="text-sm font-display font-bold text-stone-800">
                  {order ? formatCurrency(order.total) : '...'}
                </p>
              </div>
            </div>

            {/* Items Count */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Coffee className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Items</p>
                <p className="text-sm font-semibold text-stone-800">
                  {order?.lines?.length || 0} item{(order?.lines?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-semibold text-emerald-600">Confirmed — Sent to Kitchen</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/order/${token}/track/${orderId}`, { replace: true })}
            className="w-full py-4 px-6 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-bold text-sm rounded-2xl shadow-btn hover:shadow-btn-hover hover:from-cafe-600 hover:to-cafe-700 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            Track Your Order
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => navigate(`/order/${token}`)}
            className="w-full py-3 px-6 text-stone-500 font-display font-semibold text-sm rounded-xl hover:bg-stone-100 transition-colors"
          >
            Order More Items
          </button>
        </div>
      </div>
    </div>
  );
}
