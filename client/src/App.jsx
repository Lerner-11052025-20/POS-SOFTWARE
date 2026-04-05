import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import Dashboard from './pages/Dashboard';
import POSConfigurationPage from './pages/pos/POSConfigurationPage';
import OperationsManagementPage from './pages/pos/OperationsManagementPage';
import ProductCategoryManagementPage from './pages/pos/ProductCategoryManagementPage';
import FloorManagementPage from './pages/pos/FloorManagementPage';
import POSTerminalFloorViewPage from './pages/pos/POSTerminalFloorViewPage';
import CustomerMenuPage from './pages/customer/CustomerMenuPage';
import OrderProgressPage from './pages/customer/OrderProgressPage';
import CustomerDisplayPage from './pages/customer/CustomerDisplayPage';
import KitchenDisplayPage from './pages/pos/KitchenDisplayPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';

// Public QR Ordering Pages (no auth required)
import MobileTableLandingPage from './pages/public/MobileTableLandingPage';
import MobileMenuPage from './pages/public/MobileMenuPage';
import MobileCheckoutPage from './pages/public/MobileCheckoutPage';
import MobilePaymentSuccessPage from './pages/public/MobilePaymentSuccessPage';
import MobileOrderTrackingPage from './pages/public/MobileOrderTrackingPage';
import MobileOrderHistoryPage from './pages/public/MobileOrderHistoryPage';

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
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

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

      <Route
        path="/kitchen"
        element={
          <ProtectedRoute allowedRoles={['manager', 'cashier', 'kitchen']}>
            <KitchenDisplayPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operations"
        element={
          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
            <OperationsManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/catalog"
        element={
          <ProtectedRoute allowedRoles={['manager', 'cashier']}>
            <ProductCategoryManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos/floor"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'manager']}>
            <FloorManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos/terminal/:configId"
        element={
          <ProtectedRoute allowedRoles={['cashier', 'manager', 'customer']}>
            <POSTerminalFloorViewPage />
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



      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer', 'cashier', 'manager']}>
            <POSTerminalFloorViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/menu/:tableId?"
        element={
          <ProtectedRoute allowedRoles={['customer', 'cashier', 'manager']}>
            <CustomerMenuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/*"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/order-progress/:orderId?"
        element={
          <ProtectedRoute allowedRoles={['customer', 'cashier', 'manager']}>
            <OrderProgressPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer-display"
        element={
          <ProtectedRoute allowedRoles={['customer', 'cashier', 'manager', 'kitchen']}>
            <CustomerDisplayPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/unauthorized"
        element={
          <ProtectedRoute>
            <UnauthorizedPage />
          </ProtectedRoute>
        }
      />

      {/* ═══ Public QR Table Ordering Routes (no auth) ═══ */}
      <Route path="/scan/:token" element={<MobileTableLandingPage />} />
      <Route path="/order/:token" element={<MobileMenuPage />} />
      <Route path="/order/:token/checkout" element={<MobileCheckoutPage />} />
      <Route path="/order/:token/success/:orderId" element={<MobilePaymentSuccessPage />} />
      <Route path="/order/:token/track/:orderId" element={<MobileOrderTrackingPage />} />
      <Route path="/order/:token/history" element={<MobileOrderHistoryPage />} />

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
