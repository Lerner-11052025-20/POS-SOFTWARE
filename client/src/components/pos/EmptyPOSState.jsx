import { Monitor, Plus } from 'lucide-react';

export default function EmptyPOSState({ onCreateClick, isManager }) {
  return (
    <div className="flex items-center justify-center py-20 animate-fade-in-up">
      <div className="text-center max-w-sm">
        {/* Illustration */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-32 h-32 rounded-full bg-cafe-100/50 animate-pulse-soft" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg">
            <Monitor className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Text */}
        <h3 className="text-xl font-display font-bold text-stone-900 mb-2">
          No terminals yet
        </h3>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          {isManager
            ? 'Create your first POS terminal to start managing orders, payments, and sessions.'
            : 'No POS terminals have been configured yet. Ask your manager to set up the first terminal.'}
        </p>

        {/* Action */}
        {isManager && (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Create First Terminal
          </button>
        )}
      </div>
    </div>
  );
}
