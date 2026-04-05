import { useState, useEffect, useCallback, memo } from 'react';
import { Clock, ChevronRight, Check, UtensilsCrossed } from 'lucide-react';
import KitchenTicketProgressBar from './KitchenTicketProgressBar';

// ──────────────────────────────────────
// Only 4 kitchen states:
//   confirmed  → next: preparing
//   preparing  → next: ready
//   ready      → next: served
//   served     → terminal (no next)
// ──────────────────────────────────────

const STATUS_CONFIG = {
  confirmed: {
    label: 'Order Received',
    color: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-600 border border-blue-100',
    next: 'preparing',
    nextLabel: 'Start Cooking',
  },
  preparing: {
    label: 'Cooking',
    color: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-600 border border-amber-100',
    next: 'ready',
    nextLabel: 'Mark Ready',
  },
  ready: {
    label: 'Ready for Pickup',
    color: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    next: 'served',
    nextLabel: 'Mark Served',
  },
  served: {
    label: 'Served',
    color: 'bg-stone-400',
    badge: 'bg-stone-50 text-stone-500 border border-stone-200',
    next: null,
    nextLabel: null,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-400',
    badge: 'bg-red-50 text-red-500 border border-red-100',
    next: null,
    nextLabel: null,
  },
};

function ElapsedTime({ createdAt }) {
  const [text, setText] = useState('');
  const calc = useCallback(() => {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
  }, [createdAt]);

  useEffect(() => {
    setText(calc());
    const iv = setInterval(() => setText(calc()), 30000);
    return () => clearInterval(iv);
  }, [calc]);

  return (
    <div className="flex items-center gap-1.5 text-stone-400">
      <Clock className="w-3.5 h-3.5" />
      <span className="text-xs font-semibold tabular-nums">{text}</span>
    </div>
  );
}

function KitchenTicketCard({ order, onItemPrepare, onStageChange, isHistory }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
  const preparedCount = order.lines.filter(l => l.isPrepared).length;
  const totalCount = order.lines.length;
  const allPrepared = preparedCount === totalCount && totalCount > 0;

  const handleItemClick = (e, lineId, isPrepared) => {
    e.stopPropagation();
    if (isHistory) return;
    onItemPrepare(order._id, lineId, !isPrepared);
  };

  const handleStageClick = (e) => {
    e.stopPropagation();
    if (isHistory || !config.next) return;
    onStageChange(order._id, config.next);
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-stone-300 ${
      isHistory ? 'opacity-75' : ''
    }`}>

      {/* Header */}
      <div className="px-4 py-3.5 border-b border-stone-100 flex items-start justify-between">
        <div>
          <p className={`text-xl font-display font-bold leading-none ${isHistory ? 'text-stone-400' : 'text-stone-900'}`}>
            #{order.orderNumber?.split('-')[1] || order.orderNumber}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className={`w-2 h-2 rounded-full ${config.color}`} />
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${config.badge}`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-stone-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
            T-{order.table?.tableNumber || '--'}
          </div>
          <p className="text-[10px] text-stone-300 font-medium mt-1">
            {order.floor?.name || 'Main'}
          </p>
        </div>
      </div>

      {/* Line items */}
      <div className="flex-1 px-4 py-3 space-y-1">
        {order.lines.map(item => (
          <button
            key={item._id}
            onClick={(e) => handleItemClick(e, item._id, item.isPrepared)}
            disabled={isHistory}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
              isHistory ? 'cursor-default' : item.isPrepared ? 'bg-emerald-50/60' : 'hover:bg-stone-50 cursor-pointer'
            }`}
          >
            {/* Checkbox */}
            <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
              item.isPrepared
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-stone-300'
            }`}>
              {item.isPrepared && <Check className="w-3 h-3" />}
            </div>

            <span className={`text-xs font-bold flex-shrink-0 ${isHistory ? 'text-stone-400' : 'text-stone-700'}`}>
              {item.quantity}×
            </span>
            <span className={`text-sm font-medium truncate ${
              item.isPrepared
                ? 'line-through text-stone-300'
                : isHistory ? 'text-stone-400' : 'text-stone-800'
            }`}>
              {item.product}
            </span>

            {item.category && (
              <span className="ml-auto text-[10px] text-stone-300 font-medium flex-shrink-0">
                {item.category}
              </span>
            )}
          </button>
        ))}

        {order.notes && (
          <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-[11px] text-amber-700">
              <span className="font-bold text-amber-500">Note: </span>{order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2.5">
        <KitchenTicketProgressBar
          status={order.status}
          preparedCount={preparedCount}
          totalCount={totalCount}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
        {isHistory ? (
          <span className="text-[11px] text-stone-400 font-medium tabular-nums">
            {new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
            {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <ElapsedTime createdAt={order.createdAt} />
        )}

        {!isHistory && config.next && (
          <button
            onClick={handleStageClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              allPrepared
                ? 'bg-cafe-500 text-white hover:bg-cafe-600 shadow-sm'
                : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900'
            }`}
          >
            {allPrepared ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {config.nextLabel}
          </button>
        )}

        {!isHistory && order.status === 'served' && (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <Check className="w-4 h-4" /> Served
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(KitchenTicketCard);
