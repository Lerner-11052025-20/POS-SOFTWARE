const STAGES = [
  { label: 'Received', status: 'confirmed' },
  { label: 'Cooking', status: 'preparing' },
  { label: 'Ready', status: 'ready' },
  { label: 'Served', status: 'served' },
];

const STATUS_INDEX = { confirmed: 0, preparing: 1, ready: 2, served: 3 };

export default function KitchenTicketProgressBar({ status, preparedCount, totalCount }) {
  const activeIdx = STATUS_INDEX[status] ?? 0;
  const pct = totalCount > 0 ? Math.round((preparedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-2.5">
      {/* Stage dots */}
      <div className="relative flex items-center justify-between">
        {/* Track */}
        <div className="absolute inset-x-4 top-[10px] h-0.5 bg-stone-100 rounded-full" />
        <div
          className="absolute left-4 top-[10px] h-0.5 bg-cafe-500 rounded-full transition-all duration-700"
          style={{ width: `${(activeIdx / (STAGES.length - 1)) * (100 - 8)}%` }}
        />

        {STAGES.map((s, idx) => {
          const done = idx < activeIdx;
          const active = idx === activeIdx;
          return (
            <div key={s.status} className="relative z-10 flex flex-col items-center">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-500 ${
                done
                  ? 'bg-cafe-500 text-white'
                  : active
                    ? 'bg-white border-2 border-cafe-500 text-cafe-600'
                    : 'bg-white border-2 border-stone-200 text-stone-300'
              }`}>
                {done ? '✓' : idx + 1}
              </div>
              <span className={`text-[9px] font-semibold mt-1 ${
                active ? 'text-stone-700' : done ? 'text-stone-400' : 'text-stone-300'
              }`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Item progress bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-cafe-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-stone-400 tabular-nums">
            {preparedCount}/{totalCount}
          </span>
        </div>
      )}
    </div>
  );
}
