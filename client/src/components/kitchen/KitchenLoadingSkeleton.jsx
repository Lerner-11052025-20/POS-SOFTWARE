export default function KitchenLoadingSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="px-4 py-3.5 border-b border-stone-50 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 w-14 bg-stone-100 rounded" />
              <div className="h-3 w-24 bg-stone-50 rounded" />
            </div>
            <div className="h-6 w-12 bg-stone-100 rounded-lg" />
          </div>
          <div className="p-4 space-y-2.5">
            {[1, 2].map(n => (
              <div key={n} className="flex items-center gap-2.5">
                <div className="w-4 h-4 bg-stone-100 rounded" />
                <div className="h-3 flex-1 bg-stone-50 rounded" />
              </div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map(n => <div key={n} className="w-5 h-5 rounded-full bg-stone-100" />)}
            </div>
          </div>
          <div className="px-4 py-3 bg-stone-50 border-t border-stone-50 flex justify-between">
            <div className="h-3 w-10 bg-stone-100 rounded" />
            <div className="h-7 w-24 bg-stone-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
