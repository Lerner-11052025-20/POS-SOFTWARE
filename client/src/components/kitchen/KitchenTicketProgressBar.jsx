const STAGE_META = {
  confirmed: { index: 0, color: 'bg-blue-500' },
  preparing: { index: 1, color: 'bg-amber-500' },
  ready:     { index: 2, color: 'bg-emerald-500' },
  served:    { index: 3, color: 'bg-emerald-500' },
  completed: { index: 4, color: 'bg-emerald-600' },
};

const STAGES = ['Received', 'Cooking', 'Preparing', 'Ready', 'Completed'];

export default function KitchenTicketProgressBar({ status, preparedCount, totalCount }) {
  const meta = STAGE_META[status] || STAGE_META.confirmed;
  const activeIdx = meta.index;
  const itemPercent = totalCount > 0 ? Math.round((preparedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Stage dots + connecting line */}
      <div className="relative flex items-center justify-between px-1">
        {/* Track line */}
        <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-[2px] bg-stone-100 rounded-full" />
        {/* Filled track */}
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-cafe-500 to-amber-400 rounded-full transition-all duration-700"
          style={{ width: `${(activeIdx / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((label, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;

          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                  isCompleted
                    ? 'bg-cafe-500 border-cafe-500'
                    : isActive
                      ? 'bg-white border-cafe-500 ring-2 ring-cafe-200'
                      : 'bg-white border-stone-200'
                }`}
              />
              <span className={`text-[8px] font-bold uppercase tracking-wider ${
                isActive ? 'text-stone-600' : isCompleted ? 'text-stone-400' : 'text-stone-300'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Item progress mini-bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cafe-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${itemPercent}%` }}
            />
          </div>
          <span className="text-[9px] font-bold text-stone-400 tabular-nums whitespace-nowrap">
            {preparedCount}/{totalCount}
          </span>
        </div>
      )}
    </div>
  );
}
