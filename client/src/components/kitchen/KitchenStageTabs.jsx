const TABS = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Order Received' },
  { id: 'preparing', label: 'Cooking' },
  { id: 'ready', label: 'Ready for Pickup' },
];

export default function KitchenStageTabs({ activeStage, onStageChange, stageCounts }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none -mb-px">
      {TABS.map(tab => {
        const count = tab.id === 'all'
          ? (stageCounts.confirmed || 0) + (stageCounts.preparing || 0) + (stageCounts.ready || 0)
          : (stageCounts[tab.id] || 0);
        const isActive = activeStage === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onStageChange(tab.id)}
            className={`relative h-11 px-4 flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? 'text-stone-900'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {tab.label}
            <span className={`min-w-[20px] h-5 px-1.5 rounded-md flex items-center justify-center text-[11px] font-bold ${
              isActive ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
            }`}>
              {count}
            </span>
            {/* Active underline */}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-stone-900 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
