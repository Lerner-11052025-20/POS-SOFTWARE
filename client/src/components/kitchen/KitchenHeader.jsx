import { ChefHat, Wifi, WifiOff, Flame, History } from 'lucide-react';

export default function KitchenHeader({ viewMode, onViewModeChange, activeCount, isConnected }) {
  return (
    <div className="flex items-center gap-6">
      {/* Brand */}
      <div className="flex items-center gap-3 border-r border-stone-200 pr-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-btn">
          <ChefHat className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-display font-bold text-stone-900 leading-none">Kitchen Display</h1>
          <p className="text-[10px] text-stone-400 font-medium mt-0.5">Odoo POS Cafe</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex bg-stone-50 p-1 rounded-xl border border-stone-100">
        <button
          onClick={() => onViewModeChange('active')}
          className={`h-9 px-4 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
            viewMode === 'active'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Live Kitchen
        </button>
        <button
          onClick={() => onViewModeChange('history')}
          className={`h-9 px-4 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${
            viewMode === 'history'
              ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <History className="w-3.5 h-3.5" /> History
        </button>
      </div>

      {/* Live badge & count */}
      <div className="flex items-center gap-3 ml-auto sm:ml-0">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
          isConnected
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
            : 'bg-red-50 text-red-500 border-red-100'
        }`}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'Live' : 'Offline'}
        </div>

        {viewMode === 'active' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider">{activeCount} Active</span>
          </div>
        )}
      </div>
    </div>
  );
}
