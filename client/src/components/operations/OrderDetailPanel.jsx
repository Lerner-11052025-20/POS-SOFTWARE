import { useState } from 'react';
import { X, Package, FileText, Info } from 'lucide-react';

function formatCurrency(a) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(a || 0);
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_STYLES = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-stone-100 text-stone-500 border-stone-200',
};

export default function OrderDetailPanel({ order, onClose }) {
  const [tab, setTab] = useState('product');

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card animate-fade-in-up sticky top-20">
      {/* Header */}
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-display font-bold text-stone-900">{order.orderNumber}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLES[order.status]}`}>
            {order.status}
          </span>
          <span className="text-[11px] text-stone-400">{formatDate(order.createdAt)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">Customer</p>
            <p className="text-xs font-display font-semibold text-stone-700">{order.customerName || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">Session</p>
            <p className="text-xs font-display font-semibold text-stone-700">{order.sessionName || '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-100">
        <button onClick={() => setTab('product')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-display font-semibold transition-colors ${
            tab === 'product' ? 'text-cafe-600 border-b-2 border-cafe-500' : 'text-stone-400 hover:text-stone-600'
          }`}>
          <Package className="w-3.5 h-3.5" /> Product
        </button>
        <button onClick={() => setTab('extra')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-display font-semibold transition-colors ${
            tab === 'extra' ? 'text-cafe-600 border-b-2 border-cafe-500' : 'text-stone-400 hover:text-stone-600'
          }`}>
          <Info className="w-3.5 h-3.5" /> Extra Info
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {tab === 'product' ? (
          <>
            {order.lines && order.lines.length > 0 ? (
              <div className="space-y-2 mb-4">
                {order.lines.map((line, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-stone-50/80 border border-stone-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-semibold text-stone-800 truncate">{line.product}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {line.quantity} x {formatCurrency(line.unitPrice)} | Tax {line.tax}% | {line.uom}
                      </p>
                    </div>
                    <p className="text-xs font-display font-bold text-stone-800 ml-3">{formatCurrency(line.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-400">No line items in this order.</p>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-stone-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-stone-400">Subtotal</span>
                <span className="font-display font-semibold text-stone-700">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-400">Tax</span>
                <span className="font-display font-semibold text-stone-700">{formatCurrency(order.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-stone-100">
                <span className="font-display font-bold text-stone-900">Total</span>
                <span className="font-display font-bold text-cafe-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Order Number', value: order.orderNumber },
              { label: 'Created By', value: order.createdBy?.fullName || '—' },
              { label: 'Payment Method', value: order.paymentMethod || 'Not specified' },
              { label: 'Archived', value: order.isArchived ? 'Yes' : 'No' },
              { label: 'Created', value: formatDate(order.createdAt) },
              { label: 'Updated', value: formatDate(order.updatedAt) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-stone-50">
                <span className="text-[10px] text-stone-400 uppercase tracking-wider font-medium">{item.label}</span>
                <span className="text-xs font-display font-semibold text-stone-700">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
