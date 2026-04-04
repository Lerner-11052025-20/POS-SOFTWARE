import { useState, useCallback } from 'react';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel';
import AuthCard from '../../components/auth/AuthCard';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [selectedRole, setSelectedRole] = useState('');

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (newMode === 'login') setSelectedRole('');
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-cream-50">
      {/* Left Brand Panel — Desktop: side panel, Mobile: top banner */}
      <div className="w-full lg:w-[42%] xl:w-[45%] lg:min-h-screen relative hidden lg:block">
        <div className="sticky top-0 h-screen">
          <AuthBrandPanel selectedRole={selectedRole} />
        </div>
      </div>

      {/* Mobile Brand Header */}
      <div className="lg:hidden w-full">
        <div className="h-56 sm:h-64">
          <AuthBrandPanel selectedRole={selectedRole} />
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-5 sm:px-8 py-8 lg:py-12">
        <div className="w-full max-w-md">
          {/* Auth Card Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-glass p-6 sm:p-8 border border-stone-100/80 animate-fade-in-up">
            <AuthCard
              mode={mode}
              onModeChange={handleModeChange}
              onRoleChange={setSelectedRole}
            />
          </div>

          {/* Bottom Branding */}
          <div className="text-center mt-6">
            <p className="text-stone-400 text-xs">
              © 2026 Odoo POS Cafe • Hackathon Final Round
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
