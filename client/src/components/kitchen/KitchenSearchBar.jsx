import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function KitchenSearchBar({ searchQuery, onSearchChange, page, totalPages, totalItems, itemsPerPage, onPageChange }) {
  const start = totalItems > 0 ? page * itemsPerPage + 1 : 0;
  const end = Math.min((page + 1) * itemsPerPage, totalItems);

  return (
    <div className="flex items-center gap-4">
      {/* Search Input */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search order, product, table..."
          className="w-full h-10 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-cafe-500 focus:ring-2 focus:ring-cafe-500/10 transition-all text-sm font-medium text-stone-700 placeholder:text-stone-400"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-1 border-l border-stone-200 pl-4">
        <span className="text-xs font-bold text-stone-400 px-2 tabular-nums whitespace-nowrap">
          {start}–{end} of {totalItems}
        </span>
        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 disabled:opacity-30 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 disabled:opacity-30 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
