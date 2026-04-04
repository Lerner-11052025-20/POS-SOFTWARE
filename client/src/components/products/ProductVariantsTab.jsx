import { Plus, Trash2 } from 'lucide-react';

const UOM_OPTIONS = ['Unit', 'Kg', 'Liter', 'Pack'];

export default function ProductVariantsTab({ variants, onChange }) {
  const addRow = () => {
    onChange([...variants, { attribute: '', value: '', uom: 'Unit', extraPrice: 0 }]);
  };

  const updateRow = (index, field, val) => {
    const updated = variants.map((v, i) => i === index ? { ...v, [field]: val } : v);
    onChange(updated);
  };

  const removeRow = (index) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-display font-bold text-stone-800">Product Variants</h3>
          <p className="text-[10px] text-stone-400 mt-0.5">Add product variations with optional extra pricing.</p>
        </div>
        <button type="button" onClick={addRow}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-display font-semibold text-cafe-600 bg-cafe-50 border border-cafe-200 rounded-xl hover:bg-cafe-100 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="py-12 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-100 mb-3">
            <span className="text-2xl">🧩</span>
          </div>
          <h4 className="text-sm font-display font-semibold text-stone-700 mb-1">No variants yet</h4>
          <p className="text-[11px] text-stone-400 max-w-xs mx-auto leading-relaxed">
            Variants let you define product variations like pack sizes or serving types with optional price differences.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 pb-1">
            <span className="col-span-3 text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Attribute</span>
            <span className="col-span-3 text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Value</span>
            <span className="col-span-2 text-[9px] font-semibold text-stone-400 uppercase tracking-wider">UOM</span>
            <span className="col-span-3 text-[9px] font-semibold text-stone-400 uppercase tracking-wider">Extra Price (₹)</span>
            <span className="col-span-1" />
          </div>

          {/* Rows */}
          {variants.map((v, i) => (
            <div key={i}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-stone-50/80 border border-stone-100 hover:border-stone-200 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}>
              <div className="sm:col-span-3">
                <label className="sm:hidden text-[9px] text-stone-400 uppercase tracking-wider font-semibold mb-1 block">Attribute</label>
                <input type="text" value={v.attribute} onChange={(e) => updateRow(i, 'attribute', e.target.value)}
                  placeholder="e.g. Pack" className="auth-input text-xs !py-2" />
              </div>
              <div className="sm:col-span-3">
                <label className="sm:hidden text-[9px] text-stone-400 uppercase tracking-wider font-semibold mb-1 block">Value</label>
                <input type="text" value={v.value} onChange={(e) => updateRow(i, 'value', e.target.value)}
                  placeholder="e.g. 6" className="auth-input text-xs !py-2" />
              </div>
              <div className="sm:col-span-2">
                <label className="sm:hidden text-[9px] text-stone-400 uppercase tracking-wider font-semibold mb-1 block">UOM</label>
                <select value={v.uom} onChange={(e) => updateRow(i, 'uom', e.target.value)}
                  className="auth-input text-xs !py-2">
                  {UOM_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="sm:hidden text-[9px] text-stone-400 uppercase tracking-wider font-semibold mb-1 block">Extra Price</label>
                <input type="number" min="0" step="0.01" value={v.extraPrice}
                  onChange={(e) => updateRow(i, 'extraPrice', Number(e.target.value) || 0)}
                  placeholder="0" className="auth-input text-xs !py-2" />
              </div>
              <div className="sm:col-span-1 flex items-center justify-end sm:justify-center">
                <button type="button" onClick={() => removeRow(i)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
