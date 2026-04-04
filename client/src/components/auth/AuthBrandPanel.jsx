import { useState, useEffect } from 'react';
import { Coffee, ChefHat, ShieldCheck, Utensils, LayoutGrid, Receipt, CreditCard, BarChart3 } from 'lucide-react';

const ROLE_DATA = [
  {
    key: 'cashier',
    headline: 'Open session. Serve faster. Bill confidently.',
    description: 'Access table orders, register actions, and billing with precision.',
    icon: Utensils,
    features: ['Floor & Table Management', 'One-tap Billing', 'Multi-payment Support'],
  },
  {
    key: 'kitchen',
    headline: 'Track tickets in real time. Reduce confusion.',
    description: 'View incoming tickets and update preparation stages instantly.',
    icon: ChefHat,
    features: ['Live Order Queue', 'Status Tracking', 'Priority Management'],
  },
  {
    key: 'customer',
    headline: 'Transparent orders. Faster service.',
    description: 'Track and place orders with ease. Know exactly what\'s happening.',
    icon: Coffee,
    features: ['Order Tracking', 'Self-ordering', 'Live Status Updates'],
  },
  {
    key: 'manager',
    headline: 'Control operations. Monitor performance.',
    description: 'Configure everything, monitor sessions, and optimize your cafe.',
    icon: ShieldCheck,
    features: ['Full Configuration', 'Sales Analytics', 'Staff Management'],
  },
];

const STAT_PREVIEWS = [
  { label: 'Active Tables', value: '12', icon: LayoutGrid, color: 'from-blue-500 to-cyan-400' },
  { label: 'Kitchen Queue', value: '3', icon: Receipt, color: 'from-amber-500 to-orange-400' },
  { label: 'Payments Today', value: '₹24.5K', icon: CreditCard, color: 'from-emerald-500 to-teal-400' },
  { label: 'Avg. Order', value: '₹580', icon: BarChart3, color: 'from-violet-500 to-purple-400' },
];

export default function AuthBrandPanel({ selectedRole }) {
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in');

  // Auto-rotate roles (unless user has selected one in signup)
  useEffect(() => {
    if (selectedRole) {
      const idx = ROLE_DATA.findIndex((r) => r.key === selectedRole);
      if (idx !== -1) setActiveRoleIndex(idx);
      return;
    }

    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setActiveRoleIndex((prev) => (prev + 1) % ROLE_DATA.length);
        setFadeState('in');
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedRole]);

  const currentRole = ROLE_DATA[activeRoleIndex];
  const CurrentIcon = currentRole.icon;

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-espresso-900 via-espresso-800 to-espresso-950 flex flex-col justify-between p-8 lg:p-12">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #F97316 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Floating blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cafe-500/10 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-amber-500/8 blur-3xl animate-drift" />
        <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-cafe-600/6 blur-2xl animate-float-medium" />

        {/* Decorative cafe elements */}
        <svg className="absolute top-8 right-8 w-24 h-24 text-white/[0.04] animate-rotate-slow" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="50" cy="50" r="15" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-24 right-16 w-16 h-16 text-white/[0.04]" viewBox="0 0 64 64">
          <rect x="8" y="8" width="48" height="48" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="20" y="20" width="24" height="24" rx="4" fill="currentColor" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Brand */}
        <div className="animate-fade-in-up mb-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white tracking-tight">Odoo POS Cafe</h1>
            </div>
          </div>
          <p className="text-stone-400 text-sm font-body mt-4 max-w-xs leading-relaxed">
            From table to payment, one intelligent workflow.
          </p>
        </div>

        {/* Role Spotlight */}
        <div className="my-8 lg:my-auto">
          <div className={`transition-all duration-300 ease-out ${fadeState === 'in' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cafe-500/20 flex items-center justify-center">
                  <CurrentIcon className="w-5 h-5 text-cafe-400" />
                </div>
                <span className="text-xs font-display font-semibold text-cafe-400 uppercase tracking-widest">
                  {currentRole.key} View
                </span>
              </div>
              <h2 className="text-lg lg:text-xl font-display font-bold text-white mb-2 leading-snug">
                {currentRole.headline}
              </h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                {currentRole.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {currentRole.features.map((f) => (
                  <span key={f} className="px-3 py-1 text-xs text-cafe-300 bg-cafe-500/10 rounded-full border border-cafe-500/20 font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Role Dots Indicator */}
            {!selectedRole && (
              <div className="flex items-center gap-2 justify-center">
                {ROLE_DATA.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setFadeState('out');
                      setTimeout(() => { setActiveRoleIndex(i); setFadeState('in'); }, 300);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeRoleIndex ? 'w-6 bg-cafe-500' : 'w-1.5 bg-stone-600 hover:bg-stone-500'
                    }`}
                    aria-label={`View ${ROLE_DATA[i].key} role`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stat Preview Cards */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          {STAT_PREVIEWS.map((stat, i) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card rounded-xl p-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 100 + 200}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                    <StatIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-display font-bold text-sm">{stat.value}</p>
                    <p className="text-stone-500 text-[10px] font-medium truncate">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
