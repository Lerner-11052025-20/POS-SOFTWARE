import { useState, useEffect, useCallback, memo } from 'react';
import { Clock, ChevronRight, CheckCircle2, UtensilsCrossed } from 'lucide-react';
import KitchenTicketProgressBar from './KitchenTicketProgressBar';

const STATUS_CONFIG = {
  confirmed: { label: 'To Cook', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-600 border-blue-100', next: 'preparing', nextLabel: 'Start Cooking' },
  preparing: { label: 'Preparing', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600 border-amber-100', next: 'ready', nextLabel: 'Mark Ready' },
  ready:     { label: 'Ready', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', next: 'served', nextLabel: 'Serve' },
  served:    { label: 'Served', dot: 'bg-stone-400', badge: 'bg-stone-50 text-stone-500 border-stone-200', next: null, nextLabel: null },
  completed: { label: 'Completed', dot: 'bg-stone-400', badge: 'bg-stone-50 text-stone-500 border-stone-200', next: null, nextLabel: null },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400', badge: 'bg-red-50 text-red-500 border-red-100', next: null, nextLabel: null },
};

function ElapsedTime({ createdAt }) {
  const [elapsed, setElapsed] = useState('');

  const calc = useCallback(() => {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
  }, [createdAt]);

  useEffect(() => {
    setElapsed(calc());
    const iv = setInterval(() => setElapsed(calc()), 30000);
    return () => clearInterval(iv);
  }, [calc]);

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3 h-3 text-stone-300" />
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight tabular-nums">{elapsed}</span>
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
    <div
      className={`bg-white rounded-2xl shadow-card border border-stone-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-card-hover hover:border-stone-300 group ${
        isHistory ? 'opacity-80' : ''
      }`}
    >
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-display font-black tracking-tight leading-none ${
              isHistory ? 'text-stone-400' : 'text-stone-900'
            }`}>
              #{order.orderNumber?.split('-')[1] || order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded-md ${config.badge}`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-stone-900 text-white text-[10px] font-black px-2.5 py-1 rounded-lg tracking-tight shadow-sm">
            T-{order.table?.tableNumber || '--'}
          </div>
          <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">
            {order.floor?.name || 'Main'}
          </span>
        </div>
      </div>

      {/* Line Items */}
      <div className="flex-1 px-5 py-4 space-y-1.5">
        {order.lines.map(item => (
          <button
            key={item._id}
            onClick={(e) => handleItemClick(e, item._id, item.isPrepared)}
            disabled={isHistory}
            className={`w-full flex items-start justify-between p-2 rounded-lg transition-all text-left group/item ${
              isHistory
                ? 'cursor-default'
                : item.isPrepared
                  ? 'bg-emerald-50/50 hover:bg-emerald-50'
                  : 'hover:bg-stone-50 cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              {/* Prepare indicator */}
              <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                item.isPrepared
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-stone-300 text-transparent group-hover/item:border-stone-400'
              }`}>
                {item.isPrepared && <CheckCircle2 className="w-3 h-3" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black ${isHistory ? 'text-stone-400' : 'text-stone-800'}`}>
                    {item.quantity}×
                  </span>
                  <p className={`text-sm font-semibold leading-tight truncate transition-all ${
                    item.isPrepared
                      ? 'line-through text-stone-300 decoration-2 decoration-emerald-400'
                      : isHistory ? 'text-stone-400' : 'text-stone-800'
                  }`}>
                    {item.product}
                  </p>
                </div>
                {item.notes && (
                  <p className="text-[10px] font-medium text-cafe-600 italic mt-0.5 ml-6">{item.notes}</p>
                )}
              </div>
            </div>

            {item.category && (
              <span className="text-[9px] font-bold text-stone-300 uppercase tracking-wider ml-2 mt-0.5 flex-shrink-0">
                {item.category}
              </span>
            )}
          </button>
        ))}

        {order.notes && (
          <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-[10px] font-semibold text-amber-700">
              <span className="font-black uppercase tracking-wider text-amber-500 mr-1">Note:</span>
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-5 pb-3">
        <KitchenTicketProgressBar
          status={order.status}
          preparedCount={preparedCount}
          totalCount={totalCount}
        />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between">
        {!isHistory ? (
          <ElapsedTime createdAt={order.createdAt} />
        ) : (
          <span className="text-[9px] font-bold text-stone-400 tabular-nums">
            {new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
            {new Date(order.updatedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {!isHistory && config.next && (
          <button
            onClick={handleStageClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              allPrepared
                ? 'bg-cafe-500 text-white shadow-btn hover:bg-cafe-600'
                : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900'
            }`}
          >
            {allPrepared ? <UtensilsCrossed className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {config.nextLabel}
          </button>
        )}

        {!isHistory && !config.next && order.status === 'ready' && (
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Kitchen Complete
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(KitchenTicketCard);
