const STAGES = [
  { id: 'all', label: 'All Active' },
  { id: 'confirmed', label: 'To Cook' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'served', label: 'Served' },
  { id: 'completed', label: 'Completed' },
];

export default function KitchenStageTabs({ activeStage, onStageChange, stageCounts }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
      {STAGES.map(stage => {
        const count = stage.id === 'all'
          ? (stageCounts.confirmed || 0) + (stageCounts.preparing || 0) + (stageCounts.ready || 0) + (stageCounts.served || 0) + (stageCounts.completed || 0)
          : (stageCounts[stage.id] || 0);
        const isActive = activeStage === stage.id;

        return (
          <button
            key={stage.id}
            onClick={() => onStageChange(stage.id)}
            className={`h-10 px-4 rounded-xl flex items-center gap-2.5 transition-all whitespace-nowrap ${
              isActive
                ? 'bg-stone-900 text-white shadow-md'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider">{stage.label}</span>
            <span className={`min-w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] font-black ${
              isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
