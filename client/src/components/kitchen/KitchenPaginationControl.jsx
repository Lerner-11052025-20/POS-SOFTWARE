import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function KitchenPaginationControl({ page, totalPages, totalItems, itemsPerPage, onPageChange }) {
  if (totalItems <= itemsPerPage) return null;

  const start = totalItems > 0 ? page * itemsPerPage + 1 : 0;
  const end = Math.min((page + 1) * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 disabled:opacity-30 transition-all"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-xs font-bold text-stone-500 tabular-nums px-3">
        {start}–{end} of {totalItems}
      </span>

      <button
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:bg-stone-50 disabled:opacity-30 transition-all"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
