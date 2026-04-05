import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import {
  ArrowLeft, Clock, ChevronRight, Coffee, Inbox
} from 'lucide-react';

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
  preparing: { label: 'Cooking', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' },
  ready: { label: 'Ready', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  served: { label: 'Served', bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', dot: 'bg-stone-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
  paid: { label: 'Paid', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function MobileOrderHistoryPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [tableRes, ordersRes] = await Promise.all([
          publicAPI.resolveTable(token),
          publicAPI.getTableOrders(token),
        ]);
        if (tableRes.data.success) setTable(tableRes.data.table);
        if (ordersRes.data.success) setOrders(ordersRes.data.orders || []);
      } catch (err) {
        console.error('Load history error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 font-body">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 animate-pulse-soft flex items-center justify-center">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <p className="text-stone-500 font-display font-semibold text-sm">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 font-body flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate(`/scan/${token}`)}
            className="p-2 -ml-2 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-display font-bold text-stone-900">Order History</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Table {table?.tableNumber} • Last 24 hours
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full">
        {orders.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-display font-bold text-stone-900 mb-2">No orders yet</h3>
            <p className="text-sm text-stone-400 mb-6">Place your first order from the menu</p>
            <button
              onClick={() => navigate(`/order/${token}`)}
              className="px-6 py-3 bg-cafe-600 text-white text-sm font-display font-semibold rounded-xl hover:bg-cafe-700 transition-all"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
              return (
                <button
                  key={order._id}
                  onClick={() => navigate(`/order/${token}/track/${order._id}`)}
                  className="w-full bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-left hover:shadow-card transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-base font-display font-bold text-stone-900">{order.orderNumber}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{formatTime(order.createdAt)}</p>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${order.status === 'preparing' ? 'animate-pulse' : ''}`} />
                      {statusConfig.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {order.lines?.slice(0, 3).map((line, idx) => (
                      <span key={idx} className="text-xs text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md">
                        {line.quantity}× {line.product}
                      </span>
                    ))}
                    {order.lines?.length > 3 && (
                      <span className="text-xs text-stone-400">+{order.lines.length - 3} more</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                    <p className="text-sm font-display font-bold text-stone-900">{formatCurrency(order.total)}</p>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-cafe-500 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 pb-6">
          <button
            onClick={() => navigate(`/order/${token}`)}
            className="w-full py-3 px-6 bg-white border border-stone-200 text-stone-700 font-display font-semibold text-sm rounded-xl hover:bg-stone-50 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
