import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { posAPI } from '../services/api';
import { LogOut, Coffee, Monitor, LayoutGrid, ChefHat, ShoppingBag, BarChart3, Settings, ClipboardList, ArrowRight, Terminal } from 'lucide-react';

const ROLE_FEATURES = {
  cashier: {
    title: 'POS Terminal',
    description: 'Your station is ready. Start taking orders, manage tables, and process payments.',
    icon: LayoutGrid,
    color: 'from-cafe-500 to-amber-500',
    quickActions: [
      { label: 'POS Config', path: '/pos/config', icon: Monitor, ready: true },
      { label: 'Operations', path: '/operations', icon: ClipboardList, ready: true },
      { label: 'New Order', path: '/pos/orders', icon: ShoppingBag, ready: false },
    ],
  },
  kitchen: {
    title: 'Kitchen Display',
    description: 'Kitchen queue is live. Track incoming orders and update preparation status.',
    icon: ChefHat,
    color: 'from-amber-500 to-orange-500',
    quickActions: [
      { label: 'View Queue', path: '/kitchen', icon: ChefHat, ready: false },
      { label: 'Active Orders', path: '/kitchen', icon: ShoppingBag, ready: false },
    ],
  },
  customer: {
    title: 'Customer Portal',
    description: 'Welcome! Browse menu, place orders, and track your order status in real time.',
    icon: ShoppingBag,
    color: 'from-emerald-500 to-teal-500',
    quickActions: [
      { label: 'View Menu', path: '/customer/menu', icon: ShoppingBag, ready: true },
      { label: 'Select Table', path: '/pos/terminal', icon: Monitor, ready: true },
      { label: 'My Orders', path: '/customer', icon: LayoutGrid, ready: false },
    ],
  },
  manager: {
    title: 'Management Hub',
    description: 'Full control of operations. Monitor performance, configure settings, and manage staff.',
    icon: BarChart3,
    color: 'from-violet-500 to-purple-500',
    quickActions: [
      { label: 'POS Config', path: '/pos/config', icon: Monitor, ready: true },
      { label: 'Operations', path: '/operations', icon: ClipboardList, ready: true },
      { label: 'Settings', path: '/pos/config', icon: Settings, ready: true },
    ],
  },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await posAPI.getConfigs();
        if (res.data.success) {
          setConfigs(res.data.configs);
        }
      } catch (err) {
        console.error('Fetch configs error:', err);
      } finally {
        setLoadingConfigs(false);
      }
    };
    fetchConfigs();
  }, []);

  if (!user) return null;

  const roleData = ROLE_FEATURES[user.role] || ROLE_FEATURES.customer;
  const RoleIcon = roleData.icon;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSelfOrder = () => {
    navigate('/pos/terminal/default');
  };


  return (
    <div className="min-h-screen bg-cream-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center">
              <Coffee className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-stone-900">Odoo POS Cafe</h1>
              <p className="text-[10px] text-stone-400 font-medium">{roleData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-display font-semibold text-stone-800">{user.fullName}</p>
              <p className="text-[11px] text-stone-400 capitalize">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 font-display font-bold text-sm">
              {user.fullName?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">


        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${roleData.color} p-8 sm:p-12 text-white mb-8 animate-fade-in-up`}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <RoleIcon className="w-6 h-6 text-white" />
              </div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold capitalize">
                {user.role} Access
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              Welcome, {user.fullName}!
            </h2>
            <p className="text-white/80 text-sm sm:text-base max-w-lg leading-relaxed">
              {roleData.description}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-12 top-8 w-24 h-24 rounded-full bg-white/5 blur-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          {roleData.quickActions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => {
                  if (action.ready) {
                    if (action.label === 'Select Table') handleSelfOrder();
                    else navigate(action.path);
                  }
                }}
                className={`p-5 bg-white rounded-2xl shadow-card hover:shadow-card-hover border border-stone-100 text-left transition-all duration-300 hover:-translate-y-0.5 group ${!action.ready ? 'opacity-80' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-cafe-50 flex items-center justify-center mb-3 transition-colors">
                  <ActionIcon className="w-5 h-5 text-stone-500 group-hover:text-cafe-500 transition-colors" />
                </div>
                <h3 className="font-display font-semibold text-stone-800 text-sm">{action.label}</h3>
                <p className="text-stone-400 text-xs mt-1">{action.ready ? 'Go to module →' : 'Coming soon →'}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-6 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}>
          <h3 className="font-display font-bold text-stone-800 mb-4">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: user.fullName },
              { label: 'Username', value: `@${user.username}` },
              { label: 'Email', value: user.email },
              { label: 'Role', value: user.role, capitalize: true },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">{label}</span>
                <span className={`text-sm font-medium text-stone-700 mt-0.5 ${capitalize ? 'capitalize' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

