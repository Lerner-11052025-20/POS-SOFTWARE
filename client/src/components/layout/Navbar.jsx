import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Coffee } from 'lucide-react';

export default function Navbar({ title = 'Odoo POS Cafe', subtitle = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 group transition-all">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-display font-bold text-stone-900">{title}</h1>
              <p className="text-xs text-stone-500 font-medium">
                {subtitle || `${user.role} workspace`}
              </p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 border-l border-stone-100 pl-6 ml-2">
             <Link to="/dashboard" className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:text-cafe-600 hover:bg-cafe-50 transition-all">Dashboard</Link>
             <Link to="/pos/config" className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:text-cafe-600 hover:bg-cafe-50 transition-all">Config</Link>
             <Link to="/operations" className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:text-cafe-600 hover:bg-cafe-50 transition-all">Operations</Link>
             <Link to="/catalog" className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:text-cafe-600 hover:bg-cafe-50 transition-all">Catalog</Link>
             <Link to="/pos/floor" className="px-4 py-2 rounded-xl text-sm font-semibold text-cafe-600 bg-cafe-50 transition-all">Floor Plan</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-display font-bold text-stone-800 tracking-tight">{user.fullName}</p>
            <p className="text-xs text-stone-500 font-medium capitalize">{user.role}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 font-display font-bold text-sm shadow-inner shadow-stone-300/20 uppercase">
            {user.fullName?.charAt(0)}
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
            title="Secure Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
