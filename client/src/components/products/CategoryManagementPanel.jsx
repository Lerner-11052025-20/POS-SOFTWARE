import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, Edit3, Trash2, Palette, X, Check, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { categoriesAPI } from '../../services/api';

const COLOR_PALETTE = [
  '#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F97316', '#14B8A6', '#6366F1', '#D97706',
  '#059669', '#7C3AED', '#E11D48', '#0EA5E9', '#84CC16',
  '#A855F7', '#F43F5E', '#06B6D4',
];

function getChipStyle(color) {
  if (!color || typeof color !== 'string' || !color.startsWith('#')) {
    return { backgroundColor: '#f5f5f4', color: '#78716c', borderColor: '#e7e5e4' };
  }
  try {
    const hex = color.replace('#', '');
    const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    const r = parseInt(fullHex.substring(0, 2), 16) || 0;
    const g = parseInt(fullHex.substring(2, 4), 16) || 0;
    const b = parseInt(fullHex.substring(4, 6), 16) || 0;
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
      color: `rgb(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)})`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
    };
  } catch (e) {
    return { backgroundColor: '#f5f5f4', color: '#78716c', borderColor: '#e7e5e4' };
  }
}

export default function CategoryManagementPanel({ isManager }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#F59E0B');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAll();
      if (res.data.success) setCategories(res.data.categories.sort((a, b) => a.name.localeCompare(b.name)));
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { setError('Category name is required'); return; }
    setCreating(true); setError('');
    try {
      const res = await categoriesAPI.create({ name: newName.trim(), color: newColor });
      if (res.data.success) {
        setCategories((prev) => [...prev, res.data.category].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName(''); setNewColor('#F59E0B'); setShowCreate(false);
        toast.success(res.data.message || 'Category created!', { icon: '🏷️' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally { setCreating(false); }
  };

  const startEdit = (cat) => {
    setEditId(cat._id); setEditName(cat.name); setEditColor(cat.color);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    try {
      const res = await categoriesAPI.update(editId, { name: editName.trim(), color: editColor });
      if (res.data.success) {
        setCategories((prev) => prev.map((c) => c._id === editId ? res.data.category : c).sort((a, b) => a.name.localeCompare(b.name)));
        setEditId(null); toast.success('Category updated');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const handleRemove = async (id) => {
    try {
      await categoriesAPI.remove(id);
      setCategories((prev) => prev.filter((c) => c._id !== id));
      toast.success('Category removed');
    } catch (err) { toast.error(err.response?.data?.message || 'Remove failed'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cafe-500 animate-spin" />
          <p className="text-sm text-stone-400 font-display font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Category List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-display font-bold text-stone-800">Product Categories</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Categories help structure the POS menu for faster ordering.</p>
            </div>
            {isManager && !showCreate && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-xs rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 transition-all duration-300">
                <Plus className="w-3.5 h-3.5" /> New Category
              </button>
            )}
          </div>

          {categories.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-xs">
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="absolute w-24 h-24 rounded-full bg-cafe-100/50 animate-pulse-soft" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg">
                    <Tag className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-display font-bold text-stone-900 mb-1">No categories yet</h3>
                <p className="text-stone-400 text-sm leading-relaxed">Create your first category to organize products by type.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const chipStyle = getChipStyle(cat.color);
                const isEditing = editId === cat._id;

                return (
                  <div key={cat._id}
                    className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-4 hover:shadow-card-hover transition-all duration-200 animate-fade-in-up">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                          className="auth-input text-xs" autoFocus />
                        <div className="flex flex-wrap gap-1.5">
                          {COLOR_PALETTE.map((c) => (
                            <button key={c} type="button" onClick={() => setEditColor(c)}
                              className={`w-6 h-6 rounded-lg border-2 transition-all ${editColor === c ? 'border-stone-800 scale-110' : 'border-transparent hover:scale-105'}`}
                              style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-display font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                            <Check className="w-3 h-3" /> Save
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-display font-semibold text-stone-500 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors">
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-4 h-4 rounded-full flex-shrink-0 border-2" style={{ backgroundColor: cat.color, borderColor: cat.color }} />
                          <div className="min-w-0">
                            <p className="text-sm font-display font-bold text-stone-800 truncate">{cat.name}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1" style={chipStyle}>
                              Preview
                            </span>
                          </div>
                        </div>
                        {isManager && (
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button onClick={() => startEdit(cat)}
                              className="p-1.5 text-stone-400 hover:text-cafe-600 hover:bg-cafe-50 rounded-lg transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleRemove(cat._id)}
                              className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Category Side Panel */}
        {showCreate && (
          <div className="xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card animate-fade-in-up sticky top-20">
              <div className="p-5 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-display font-bold text-stone-900">New Category</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Choose a color to visually identify this category.</p>
                </div>
                <button onClick={() => { setShowCreate(false); setError(''); }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                <div>
                  <label className="auth-label">Category Name *</label>
                  <input type="text" value={newName} onChange={(e) => { setNewName(e.target.value); setError(''); }}
                    placeholder="e.g. Food, Drink, Pastries" className="auth-input text-xs" autoFocus />
                </div>

                {/* Color Palette */}
                <div>
                  <label className="auth-label">Color Identity</label>
                  <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-stone-50 border border-stone-100">
                    {COLOR_PALETTE.map((c) => (
                      <button key={c} type="button" onClick={() => setNewColor(c)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                          newColor === c ? 'border-stone-800 scale-110 shadow-sm' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="auth-label">Category Chip Preview</label>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                      style={getChipStyle(newColor)}>
                      {newName.trim() || 'Category Name'}
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-[11px] flex items-center gap-1 animate-slide-down">
                    <span className="w-1 h-1 bg-red-500 rounded-full" />{error}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowCreate(false); setError(''); }}
                    className="flex-1 py-2.5 text-sm font-display font-semibold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating || !newName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-display font-semibold bg-gradient-to-r from-cafe-500 to-cafe-600 text-white rounded-xl shadow-btn hover:shadow-btn-hover transition-all duration-300 disabled:opacity-50">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
