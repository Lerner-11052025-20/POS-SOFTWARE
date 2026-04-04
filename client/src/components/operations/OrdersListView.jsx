import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Archive, Trash2, X, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersAPI } from '../../services/api';
import OrderDetailPanel from './OrderDetailPanel';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatCurrency(a) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a || 0);
}

const STATUS_STYLES = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-stone-100 text-stone-500 border-stone-200',
};

export default function OrdersListView({ isManager }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersAPI.getAll({});
      if (res.data.success) setOrders(res.data.orders);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelected(selected.length === orders.length ? [] : orders.map((o) => o._id));
  };

  const handleArchive = async () => {
    if (!selected.length) return;
    setActionLoading(true);
    try {
      await ordersAPI.archive(selected);
      toast.success(`${selected.length} order(s) archived`);
      setSelected([]);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Archive failed'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected.length) return;
    const drafts = orders.filter((o) => selected.includes(o._id) && o.status === 'draft');
    const nonDrafts = selected.length - drafts.length;
    if (nonDrafts > 0) {
      toast.error(`${nonDrafts} selected order(s) are not drafts. Only draft orders can be deleted.`);
      return;
    }
    setActionLoading(true);
    try {
      await ordersAPI.deleteDrafts(selected);
      toast.success(`${drafts.length} draft order(s) deleted`);
      setSelected([]);
      setActiveOrder(null);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cafe-500 animate-spin" />
          <p className="text-sm text-stone-400 font-display font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in-up">
        <div className="text-center max-w-xs">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute w-24 h-24 rounded-full bg-cafe-100/50 animate-pulse-soft" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-display font-bold text-stone-900 mb-1">No orders yet</h3>
          <p className="text-stone-400 text-sm leading-relaxed">Order records will appear here once sessions are active and orders are placed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
      {/* Multi-select Action Bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-2xl border border-stone-200 shadow-card animate-slide-down">
          <span className="text-sm font-display font-semibold text-stone-700">
            {selected.length} selected
          </span>
          <div className="flex-1" />
          {isManager && (
            <>
              <button onClick={handleArchive} disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-display font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50">
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
              <button onClick={handleDelete} disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-display font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> Delete Drafts
              </button>
            </>
          )}
          <button onClick={() => setSelected([])}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Orders Table */}
        <div className="flex-1 bg-white rounded-2xl border border-stone-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.length === orders.length && orders.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-stone-300 text-cafe-500 focus:ring-cafe-500/30" />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hidden sm:table-cell">Session</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Customer</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}
                    onClick={() => setActiveOrder(order)}
                    className={`border-b border-stone-50 cursor-pointer transition-colors duration-150 ${
                      activeOrder?._id === order._id
                        ? 'bg-cafe-50/50'
                        : 'hover:bg-stone-50/50'
                    }`}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.includes(order._id)}
                        onChange={() => toggleSelect(order._id)}
                        className="w-4 h-4 rounded border-stone-300 text-cafe-500 focus:ring-cafe-500/30" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-display font-bold text-stone-800">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-stone-500">{order.sessionName || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-stone-500">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-display font-semibold text-stone-800">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-stone-500">{order.customerName || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLES[order.status] || STATUS_STYLES.draft}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {activeOrder && (
          <div className="xl:w-96 flex-shrink-0">
            <OrderDetailPanel order={activeOrder} onClose={() => setActiveOrder(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
