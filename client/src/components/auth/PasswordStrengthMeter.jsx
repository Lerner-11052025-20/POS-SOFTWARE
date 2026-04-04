import { getPasswordStrength } from '../../utils/validation';

export default function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  const colorMap = {
    red: { bar: 'bg-red-500', text: 'text-red-600' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-600' },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-600' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
  };

  const colors = colorMap[strength.color] || colorMap.red;

  return (
    <div className="mt-2 animate-slide-down">
      {/* Bar */}
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors.bar}`}
          style={{ width: `${strength.percent}%` }}
        />
      </div>
      {/* Label */}
      <div className="flex items-center justify-between mt-1.5">
        <p className={`text-[11px] font-medium ${colors.text}`}>
          {strength.label}
        </p>
        <p className="text-[10px] text-stone-400">
          {strength.score < 4 ? 'Add uppercase, numbers, symbols' : 'Great password!'}
        </p>
      </div>
    </div>
  );
}
