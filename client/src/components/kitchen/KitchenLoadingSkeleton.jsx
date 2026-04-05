export default function KitchenLoadingSkeleton({ count = 8 }) {
  return (
    <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* Header skeleton */}
          <div className="px-5 py-4 border-b border-stone-50 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-6 w-16 bg-stone-100 rounded-lg" />
              <div className="h-3 w-20 bg-stone-50 rounded" />
            </div>
            <div className="h-6 w-12 bg-stone-100 rounded-lg" />
          </div>

          {/* Items skeleton */}
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-stone-100 rounded" />
                <div className="h-3 flex-1 bg-stone-50 rounded" />
              </div>
            ))}
          </div>

          {/* Progress skeleton */}
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="w-3 h-3 rounded-full bg-stone-100" />
              ))}
            </div>
            <div className="h-1 bg-stone-50 rounded-full" />
          </div>

          {/* Footer skeleton */}
          <div className="px-5 py-3 bg-stone-50/50 border-t border-stone-50 flex justify-between">
            <div className="h-3 w-12 bg-stone-100 rounded" />
            <div className="h-6 w-20 bg-stone-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
