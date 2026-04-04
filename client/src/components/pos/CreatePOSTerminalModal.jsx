import { useState, useRef, useEffect } from 'react';
import { X, Monitor, Loader2 } from 'lucide-react';
import { posAPI } from '../../services/api';

export default function CreatePOSTerminalModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Terminal name is required');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await posAPI.createConfig({ name: name.trim() });
      if (res.data.success) {
        onCreated(res.data.config);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create terminal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-glass-lg border border-stone-100 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-sm">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-stone-900">New Terminal</h2>
              <p className="text-xs text-stone-400">Create a new POS terminal configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <label htmlFor="terminal-name" className="auth-label">Terminal Name</label>
            <input
              ref={inputRef}
              id="terminal-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Odoo Cafe, Drive-Thru, Counter 2"
              disabled={loading}
              className={`auth-input ${error ? 'auth-input-error' : ''}`}
              autoComplete="off"
            />
            {error && (
              <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1 animate-slide-down">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {error}
              </p>
            )}
            <p className="text-stone-400 text-[11px] mt-2 leading-relaxed">
              This name will identify your POS terminal across sessions and reports.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-stone-100 text-stone-600 font-display font-semibold text-sm rounded-xl hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Terminal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
