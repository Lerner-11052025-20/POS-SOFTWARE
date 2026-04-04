import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/Dashboard';
import POSConfigurationPage from './pages/pos/POSConfigurationPage';
import OperationsManagementPage from './pages/pos/OperationsManagementPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg animate-pulse-soft">
              <span className="text-2xl">☕</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-stone-600 text-sm font-display font-semibold">Odoo POS Cafe</p>
            <p className="text-stone-400 text-xs mt-1">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* POS Configuration — Manager + Cashier */}
      <Route
        path="/pos/config"
        element={
          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
            <POSConfigurationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos/config/:id/settings"
        element={
          <ProtectedRoute allowedRoles={['manager']}>
            <POSConfigurationPage />
          </ProtectedRoute>
        }
      />

      {/* Operations — Orders, Payments, Customers */}
      <Route
        path="/operations"
        element={
          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
            <OperationsManagementPage />
          </ProtectedRoute>
        }
      />

      {/* POS Floor / Orders placeholder */}
      <Route
        path="/pos/floor"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'manager']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos/*"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'manager']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Kitchen */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={['kitchen', 'manager']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Customer */}
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Unauthorized */}
      <Route
        path="/unauthorized"
        element={
          <ProtectedRoute>
            <UnauthorizedPage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
