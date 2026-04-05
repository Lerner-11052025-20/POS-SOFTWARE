import { ChefHat, Wifi, WifiOff, Flame, History, Search } from 'lucide-react';

export default function KitchenHeader({ viewMode, onViewModeChange, activeCount, isConnected, searchQuery, onSearchChange }) {
  return (
    <header className="bg-white border-b border-stone-200/60 px-4 sm:px-6 py-3">
      <div className="flex items-center gap-4 flex-wrap">

        {/* Brand */}
        <div className="flex items-center gap-3 mr-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-sm">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-display font-bold text-stone-900 leading-none">Kitchen Display</h1>
            <p className="text-[11px] text-stone-400 mt-0.5">Odoo POS Cafe</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => onViewModeChange('live')}
            className={`h-9 px-4 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${
              viewMode === 'live'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Live Kitchen</span>
          </button>
          <button
            onClick={() => onViewModeChange('history')}
            className={`h-9 px-4 rounded-lg flex items-center gap-2 text-sm font-semibold transition-all ${
              viewMode === 'history'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>

        {/* Connection badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
          isConnected
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-red-50 text-red-500'
        }`}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isConnected ? 'Live' : 'Offline'}
        </div>

        {/* Active count */}
        {viewMode === 'live' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold">
            {activeCount} active
          </div>
        )}

        {/* Search — pushed right */}
        <div className="relative ml-auto w-full sm:w-auto sm:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search order, product, table…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-700 placeholder:text-stone-400 outline-none focus:bg-white focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/10 transition-all"
          />
        </div>
      </div>
    </header>
  );
}
