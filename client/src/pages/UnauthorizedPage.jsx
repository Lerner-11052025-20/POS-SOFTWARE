import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, getRoleRedirectPath } = useAuth();

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm animate-fade-in-up">
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-28 h-28 rounded-full bg-red-100/50 animate-pulse-soft" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center shadow-lg">
            <ShieldX className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-display font-bold text-stone-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          Your role ({user?.role || 'unknown'}) does not have permission to view this area. Please contact your manager for access.
        </p>
        <button
          onClick={() => navigate(user ? getRoleRedirectPath(user.role) : '/login', { replace: true })}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to My Workspace
        </button>
      </div>
    </div>
  );
}
