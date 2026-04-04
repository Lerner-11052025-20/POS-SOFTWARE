import React, { useState } from 'react';
import { tablesAPI } from '../../services/api';

export default function TableFormModal({ isOpen, onClose, onSuccess, floorId }) {
  const [tableNumber, setTableNumber] = useState('');
  const [seatsCount, setSeatsCount] = useState(4);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Table name/number is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await tablesAPI.create({ tableNumber, seatsCount, floor: floorId });
      setTableNumber('');
      setSeatsCount(4);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize table');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in transition-all">
      <div className="bg-white rounded-[2rem] shadow-5xl w-full max-w-md overflow-hidden animate-zoom-in relative">
        {/* Luxury Header Decor */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-cafe-500 to-amber-400"></div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-display font-bold text-stone-900 tracking-tight leading-7">
                Initialize <br/>
                <span className="text-cafe-600">New Seating Asset</span>
              </h3>
              <p className="text-sm font-medium text-stone-400 mt-2">Dine-In Architecture</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-300 hover:text-stone-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-500 ml-1">Table Name / No.</label>
              <div className="relative group">
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. 101, T5, Window"
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-5 text-stone-800 font-semibold focus:bg-white focus:ring-4 focus:ring-cafe-500/10 focus:border-cafe-500 transition-all outline-none"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-500 ml-1">Recommended Seats</label>
              <div className="relative group">
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-5 text-stone-800 font-semibold focus:bg-white focus:ring-4 focus:ring-cafe-500/10 focus:border-cafe-500 transition-all outline-none"
                  value={seatsCount}
                  onChange={(e) => setSeatsCount(Number(e.target.value))}
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 animate-head-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                <p className="text-rose-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl bg-stone-50 text-stone-600 text-sm font-semibold hover:bg-stone-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 px-6 rounded-2xl bg-cafe-600 text-white text-sm font-semibold shadow-gold hover:bg-cafe-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? 'Initializing...' : 'Initialize Asset'}
                {!loading && (
                   <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                   </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
