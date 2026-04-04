import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coffee, LogOut, LayoutGrid, ShoppingBag, BarChart3, ChevronDown, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
  { label: 'POS Config', path: '/pos/config', icon: Settings },
  { label: 'Operations', path: '/operations', icon: ShoppingBag },
  { label: 'Reporting', path: '/pos/reporting', icon: BarChart3, badge: 'Soon' },
];

export default function TopOperationsNav({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-stone-200/60 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Brand */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-sm">
              <Coffee className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-display font-bold text-stone-900 leading-none">Odoo POS Cafe</h1>
              <p className="text-[10px] text-stone-400 font-medium leading-none mt-0.5">Operations Center</p>
            </div>
          </button>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => !item.badge && navigate(item.path)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-display font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-cafe-700 bg-cafe-50'
                      : item.badge
                      ? 'text-stone-400 cursor-default'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-stone-100 text-stone-400 rounded-md uppercase">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-cafe-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-stone-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cafe-400 to-cafe-600 flex items-center justify-center text-white font-display font-bold text-xs">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-display font-semibold text-stone-700 leading-none">{user?.fullName}</p>
                <p className="text-[10px] text-stone-400 capitalize leading-none mt-0.5">{user?.role}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-glass border border-stone-100 py-2 z-50 animate-scale-in origin-top-right">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-xs font-display font-semibold text-stone-800">{user?.fullName}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>My Account</span>
                  </button>
                  <div className="mx-3 my-1 border-t border-stone-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
