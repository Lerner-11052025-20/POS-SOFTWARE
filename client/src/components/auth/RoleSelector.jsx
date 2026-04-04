import { Utensils, ChefHat, Coffee, ShieldCheck, Check } from 'lucide-react';

const ROLES = [
  {
    value: 'cashier',
    label: 'POS Staff / Cashier',
    shortLabel: 'Cashier',
    description: 'Manage tables, orders, and billing.',
    icon: Utensils,
    accent: 'cafe',
  },
  {
    value: 'kitchen',
    label: 'Kitchen Staff',
    shortLabel: 'Kitchen',
    description: 'Receive tickets and update preparation.',
    icon: ChefHat,
    accent: 'amber',
  },
  {
    value: 'customer',
    label: 'Customer',
    shortLabel: 'Customer',
    description: 'Track orders and self-order easily.',
    icon: Coffee,
    accent: 'emerald',
  },
  {
    value: 'manager',
    label: 'Manager / Admin',
    shortLabel: 'Manager',
    description: 'Configure, monitor, and optimize.',
    icon: ShieldCheck,
    accent: 'violet',
  },
];

export default function RoleSelector({ value, onChange, error }) {
  return (
    <div>
      <label className="auth-label">Select Your Role</label>
      <div className="grid grid-cols-2 gap-3 mt-1">
        {ROLES.map((role) => {
          const isActive = value === role.value;
          const Icon = role.icon;

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={`role-card group text-left ${isActive ? 'role-card-active' : ''}`}
              aria-pressed={isActive}
              aria-label={`Select role: ${role.label}`}
            >
              {/* Check Badge */}
              <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-cafe-500 scale-100 opacity-100'
                  : 'bg-stone-200 scale-75 opacity-0 group-hover:opacity-50 group-hover:scale-100'
              }`}>
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>

              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-all duration-300 ${
                isActive
                  ? 'bg-cafe-500 shadow-md'
                  : 'bg-stone-100 group-hover:bg-stone-200'
              }`}>
                <Icon className={`w-4.5 h-4.5 transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-stone-500 group-hover:text-stone-700'
                }`} />
              </div>

              {/* Text */}
              <h4 className={`text-sm font-display font-semibold transition-colors duration-300 ${
                isActive ? 'text-cafe-700' : 'text-stone-800'
              }`}>
                {role.shortLabel}
              </h4>
              <p className={`text-[11px] mt-0.5 leading-snug transition-colors duration-300 ${
                isActive ? 'text-cafe-600/80' : 'text-stone-400'
              }`}>
                {role.description}
              </p>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-2 animate-slide-down flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full" />
          {error}
        </p>
      )}
    </div>
  );
}

export { ROLES };
