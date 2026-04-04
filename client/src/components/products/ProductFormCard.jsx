import { useState, useEffect } from 'react';
import { Package, Layers, Loader2, Save, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsAPI, categoriesAPI } from '../../services/api';
import ProductVariantsTab from './ProductVariantsTab';

const TAX_OPTIONS = [0, 5, 12, 18, 28];
const UOM_OPTIONS = ['Unit', 'Kg', 'Liter', 'Pack'];

export default function ProductFormCard({ product, onSave, onCancel }) {
  const isEdit = !!product;
  const [tab, setTab] = useState('general');
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category?._id || '',
    salePrice: product?.salePrice ?? '',
    tax: product?.tax ?? 0,
    uom: product?.uom || 'Unit',
    description: product?.description || '',
  });
  const [variants, setVariants] = useState(product?.variants || []);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesAPI.getAll();
        if (res.data.success) setCategories(res.data.categories);
      } catch {}
    })();
  }, []);

  const updateField = (key, val) => { setForm((p) => ({ ...p, [key]: val })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Product name is required'); return; }
    if (form.salePrice === '' || Number(form.salePrice) < 0) { setError('Valid sale price is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        salePrice: Number(form.salePrice),
        tax: Number(form.tax),
        category: form.category || null,
        variants,
      };
      if (isEdit) {
        await productsAPI.update(product._id, payload);
        toast.success('Product updated!', { icon: '✏️' });
      } else {
        await productsAPI.create(payload);
        toast.success('Product created!', { icon: '🍽️' });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card overflow-hidden">
        {/* Header */}
        <div className="p-5 lg:p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-stone-900">
                {isEdit ? 'Edit Product' : 'Create New Product'}
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                {isEdit ? 'Update product details, pricing, and variants.' : 'Define a menu-ready product with pricing and variants.'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 px-5 lg:px-6">
          {[
            { key: 'general', label: 'General Info', icon: Info },
            { key: 'variants', label: 'Variants', icon: Layers },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-display font-semibold transition-colors border-b-2 -mb-px ${
                  tab === t.key
                    ? 'text-cafe-600 border-cafe-500'
                    : 'text-stone-400 border-transparent hover:text-stone-600'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.key === 'variants' && variants.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-cafe-100 text-cafe-700 rounded-md font-bold">{variants.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSubmit}>
          {tab === 'general' && (
            <div className="p-5 lg:p-6 space-y-5">
              {/* Product Name */}
              <div>
                <label className="auth-label">Product Name *</label>
                <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Margherita Pizza, Cold Coffee" className="auth-input text-sm" />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">Category</label>
                  <select value={form.category} onChange={(e) => updateField('category', e.target.value)}
                    className="auth-input text-sm">
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-400 mt-1">Categories help structure the POS menu for faster ordering.</p>
                </div>
                <div>
                  <label className="auth-label">Sale Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.salePrice}
                    onChange={(e) => updateField('salePrice', e.target.value)}
                    placeholder="0.00" className="auth-input text-sm" />
                </div>
              </div>

              {/* Tax + UOM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">Tax Rate</label>
                  <div className="flex gap-2 flex-wrap">
                    {TAX_OPTIONS.map((t) => (
                      <button key={t} type="button"
                        onClick={() => updateField('tax', t)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-display font-semibold border transition-all duration-200 ${
                          form.tax === t
                            ? 'bg-cafe-500 text-white border-cafe-500 shadow-sm'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-cafe-300 hover:text-cafe-600'
                        }`}>
                        {t}%
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="auth-label">Unit of Measure</label>
                  <div className="flex gap-2 flex-wrap">
                    {UOM_OPTIONS.map((u) => (
                      <button key={u} type="button"
                        onClick={() => updateField('uom', u)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-display font-semibold border transition-all duration-200 ${
                          form.uom === u
                            ? 'bg-cafe-500 text-white border-cafe-500 shadow-sm'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-cafe-300 hover:text-cafe-600'
                        }`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="auth-label">Description</label>
                <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief product description for internal reference..."
                  rows={3}
                  className="auth-input text-sm resize-none" />
                <p className="text-[10px] text-stone-400 mt-1">{form.description.length}/500 characters</p>
              </div>
            </div>
          )}

          {tab === 'variants' && (
            <ProductVariantsTab variants={variants} onChange={setVariants} />
          )}

          {/* Footer Actions */}
          <div className="p-5 lg:p-6 border-t border-stone-100 bg-stone-50/50">
            {error && (
              <p className="text-red-500 text-xs flex items-center gap-1 mb-3 animate-slide-down">
                <span className="w-1 h-1 bg-red-500 rounded-full" />{error}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={onCancel}
                className="px-5 py-2.5 text-sm font-display font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
                Discard
              </button>
              <button type="submit" disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-display font-semibold bg-gradient-to-r from-cafe-500 to-cafe-600 text-white rounded-xl shadow-btn hover:shadow-btn-hover transition-all duration-300 disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {isEdit ? 'Update Product' : 'Create Product'}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
