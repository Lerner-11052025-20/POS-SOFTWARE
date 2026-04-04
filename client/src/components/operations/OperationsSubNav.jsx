export default function OperationsSubNav({ tabs, active, onChange }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-card p-1.5 inline-flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative px-5 py-2 rounded-xl text-sm font-display font-semibold transition-all duration-300 ${
              active === tab.key
                ? 'bg-gradient-to-r from-cafe-500 to-cafe-600 text-white shadow-btn'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
