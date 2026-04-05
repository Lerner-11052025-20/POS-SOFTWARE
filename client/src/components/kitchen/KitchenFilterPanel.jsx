import { Filter, X, Package, Layers } from 'lucide-react';

export default function KitchenFilterPanel({
  products,
  categories,
  selectedProduct,
  selectedCategory,
  onProductFilter,
  onCategoryFilter,
  onClear,
}) {
  const hasFilters = selectedProduct || selectedCategory;

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest">
            Filters
          </span>
        </div>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-[10px] font-bold text-cafe-600 hover:text-cafe-700 flex items-center gap-1 transition-colors"
          >
            Clear <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Products Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 px-3 py-2">
            <Package className="w-3 h-3 text-stone-300" />
            <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
              Products
            </h4>
          </div>
          <div className="space-y-0.5 max-h-[35vh] overflow-y-auto">
            {products.length > 0 ? (
              products.map(p => (
                <button
                  key={p}
                  onClick={() => onProductFilter(selectedProduct === p ? null : p)}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold transition-all rounded-lg ${
                    selectedProduct === p
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {p}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-stone-300 italic">No products</p>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <div className="flex items-center gap-2 px-3 py-2">
            <Layers className="w-3 h-3 text-stone-300" />
            <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
              Categories
            </h4>
          </div>
          <div className="space-y-0.5 max-h-[35vh] overflow-y-auto">
            {categories.length > 0 ? (
              categories.map(c => (
                <button
                  key={c}
                  onClick={() => onCategoryFilter(selectedCategory === c ? null : c)}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold transition-all rounded-lg ${
                    selectedCategory === c
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {c}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-stone-300 italic">No categories</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
