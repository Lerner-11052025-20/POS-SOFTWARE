import { useState, useEffect } from 'react';
import { Banknote, CreditCard, QrCode, ChevronDown, Loader2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../../services/api';

function formatCurrency(a) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(a || 0);
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const METHOD_CONFIG = {
  cash: { label: 'Cash', icon: Banknote, color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  card: { label: 'Card / Digital', icon: CreditCard, color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  upi: { label: 'UPI / QR', icon: QrCode, color: 'violet', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
};

export default function PaymentsGroupedView() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await paymentsAPI.getGrouped();
        if (res.data.success) {
          setGroups(res.data.grouped);
          const init = {};
          res.data.grouped.forEach((g) => { init[g._id] = true; });
          setExpanded(init);
        }
      } catch { toast.error('Failed to load payments'); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggleGroup = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cafe-500 animate-spin" />
          <p className="text-sm text-stone-400 font-display font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (!groups.length) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in-up">
        <div className="text-center max-w-xs">
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute w-24 h-24 rounded-full bg-cafe-100/50 animate-pulse-soft" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-display font-bold text-stone-900 mb-1">No payments found</h3>
          <p className="text-stone-400 text-sm leading-relaxed">Payment records will appear here as transactions are processed through the POS.</p>
        </div>
      </div>
    );
  }

  // Quick Stats
  const totalRevenue = groups.reduce((s, g) => s + g.totalAmount, 0);
  const totalTxns = groups.reduce((s, g) => s + g.count, 0);

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-card p-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Total Revenue</p>
          <p className="text-xl font-display font-bold text-stone-900 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-card p-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Transactions</p>
          <p className="text-xl font-display font-bold text-stone-900 mt-1">{totalTxns}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-card p-4 hidden sm:block">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Methods Active</p>
          <p className="text-xl font-display font-bold text-stone-900 mt-1">{groups.length}</p>
        </div>
      </div>

      {/* Grouped Payment Cards */}
      <div className="space-y-4">
        {groups.map((group) => {
          const cfg = METHOD_CONFIG[group._id] || METHOD_CONFIG.cash;
          const Icon = cfg.icon;
          const isOpen = expanded[group._id];

          return (
            <div key={group._id} className="bg-white rounded-2xl border border-stone-200/80 shadow-card overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group._id)}
                className="w-full flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                    <Icon className={`w-5 h-5 ${cfg.text}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-display font-bold text-stone-900">{cfg.label}</h3>
                    <p className="text-[10px] text-stone-400">{group.count} transaction{group.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {formatCurrency(group.totalAmount)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expandable Rows */}
              {isOpen && (
                <div className="border-t border-stone-100">
                  {group.payments.map((p, i) => (
                    <div key={p._id || i}
                      className="flex items-center justify-between px-5 py-3 border-b border-stone-50 last:border-b-0 hover:bg-stone-50/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-display font-semibold text-stone-700 truncate">
                            {p.orderNumber || 'Direct Payment'}
                          </p>
                          <p className="text-[10px] text-stone-400">{p.customerName || '—'} | {formatDate(p.createdAt)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-display font-bold text-stone-800 ml-3 flex-shrink-0">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
