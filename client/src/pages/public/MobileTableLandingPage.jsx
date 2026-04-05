import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI } from '../../services/api';
import { Coffee, ArrowRight, MapPin, Users, Wifi, WifiOff } from 'lucide-react';

export default function MobileTableLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveTable = async () => {
      try {
        setLoading(true);
        const res = await publicAPI.resolveTable(token);
        if (res.data.success) {
          setTable(res.data.table);
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Invalid QR code';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (token) resolveTable();
    else setError('No table token provided');
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg animate-pulse-soft">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <p className="text-stone-500 font-display font-semibold text-sm">Finding your table...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="text-center max-w-xs animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <WifiOff className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-stone-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-stone-500 mb-6">{error}</p>
          <p className="text-xs text-stone-400">Please ask a staff member for help or try scanning the QR code again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col font-body">
      {/* Decorative Top */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-espresso-800 to-stone-900 pt-16 pb-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-cafe-500 blur-3xl" />
          <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-amber-400 blur-2xl" />
        </div>

        <div className="relative z-10 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cafe-500/30">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight leading-tight mb-2">
            Odoo POS Cafe
          </h1>
          <p className="text-sm text-stone-400 font-medium">Premium Dining Experience</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="px-6 -mt-12 relative z-10 flex-1 flex flex-col">
        <div className="bg-white rounded-3xl shadow-card border border-stone-100 p-6 sm:p-8 max-w-sm mx-auto w-full animate-slide-up">
          {/* Table Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cafe-50 rounded-full border border-cafe-100">
              <MapPin className="w-4 h-4 text-cafe-600" />
              <span className="text-sm font-display font-bold text-cafe-700">
                {table.floor?.name || 'Main Floor'}
              </span>
            </div>
          </div>

          {/* Table Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-stone-50 border-2 border-stone-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-display font-black text-stone-800">
                {table.tableNumber}
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-stone-900 mb-1">
              Table {table.tableNumber}
            </h2>
            <div className="flex items-center justify-center gap-1 text-stone-400">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{table.seatsCount} seats</span>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-cream-50 rounded-2xl p-4 mb-6 border border-stone-50">
            <p className="text-sm text-stone-600 text-center leading-relaxed">
              Welcome! Browse our menu and place your order directly from your phone. No waiting required.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate(`/order/${token}`)}
            className="w-full py-4 px-6 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-bold text-sm rounded-2xl shadow-btn hover:shadow-btn-hover hover:from-cafe-600 hover:to-cafe-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
          >
            Start Your Order
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Order History Link */}
          <button
            onClick={() => navigate(`/order/${token}/history`)}
            className="w-full mt-3 py-3 px-6 text-stone-500 font-display font-semibold text-xs rounded-xl hover:bg-stone-50 transition-colors"
          >
            View Order History
          </button>
        </div>

        {/* Footer */}
        <div className="mt-auto py-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-stone-300">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Powered by Odoo POS Cafe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
