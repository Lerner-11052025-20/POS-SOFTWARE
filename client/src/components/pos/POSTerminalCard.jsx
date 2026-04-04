import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Play, Square, MoreHorizontal, Settings, ChefHat, MonitorSmartphone, Clock, IndianRupee, Zap } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function POSTerminalCard({ config, isSelected, onSelect, onOpenSession, onCloseSession, isManager, delay = 0 }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const hasActiveSession = config.currentSessionId && config.currentSessionId.status === 'open';
  const sessionStatus = hasActiveSession ? 'active' : config.lastSessionOpenedAt ? 'ready' : 'new';

  const statusConfig = {
    active: { label: 'Session Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    ready: { label: 'Ready', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    new: { label: 'New Terminal', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  };

  const status = statusConfig[sessionStatus];

  // Payment method count
  const enabledPayments = [
    config.paymentMethods?.cash && 'Cash',
    config.paymentMethods?.digital && 'Digital',
    config.paymentMethods?.qrPayment && 'UPI',
  ].filter(Boolean);

  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer animate-fade-in-up group ${
        isSelected
          ? 'border-cafe-500 shadow-card-hover ring-2 ring-cafe-500/10'
          : 'border-stone-200/80 shadow-card hover:shadow-card-hover hover:border-stone-300 hover:-translate-y-0.5'
      }`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
      onClick={onSelect}
    >
      {/* Top Section */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isSelected
                ? 'bg-gradient-to-br from-cafe-500 to-cafe-600 shadow-md'
                : 'bg-stone-100 group-hover:bg-cafe-50'
            }`}>
              <Monitor className={`w-5 h-5 transition-colors ${isSelected ? 'text-white' : 'text-stone-500 group-hover:text-cafe-500'}`} />
            </div>
            <div>
              <h3 className="font-display font-bold text-stone-900 text-sm">{config.name}</h3>
              <div className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${hasActiveSession ? 'animate-pulse' : ''}`} />
                {status.label}
              </div>
            </div>
          </div>

          {/* Overflow Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-glass border border-stone-100 py-1.5 z-50 animate-scale-in origin-top-right">
                  {isManager && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/pos/config/${config._id}/settings`); setShowMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/kitchen'); setShowMenu(false); }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Kitchen Display</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/customer'); setShowMenu(false); }}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <MonitorSmartphone className="w-3.5 h-3.5" />
                    <span>Customer Display</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session Meta */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Last Session</p>
              <p className="text-xs font-display font-semibold text-stone-700">{formatDate(config.lastSessionOpenedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IndianRupee className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Last Closing</p>
              <p className="text-xs font-display font-semibold text-stone-700">{formatCurrency(config.lastClosingSaleAmount)}</p>
            </div>
          </div>
        </div>

        {/* Payment chips */}
        {enabledPayments.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            <Zap className="w-3 h-3 text-stone-400" />
            {enabledPayments.map((pm) => (
              <span key={pm} className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-500 rounded-md">
                {pm}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-5 pb-4 pt-1">
        {hasActiveSession ? (
          <button
            onClick={(e) => { e.stopPropagation(); onCloseSession(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-display font-semibold hover:bg-red-100 transition-all duration-200"
          >
            <Square className="w-3.5 h-3.5" />
            Close Session
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onOpenSession(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white rounded-xl text-sm font-display font-semibold shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <Play className="w-3.5 h-3.5" />
            Open Session
          </button>
        )}
      </div>
    </div>
  );
}
