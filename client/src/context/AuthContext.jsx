import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('pos_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        if (res.data.success) {
          setUser(res.data.user);
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authAPI.login(credentials);
    if (res.data.success) {
      localStorage.setItem('pos_token', res.data.token);
      localStorage.setItem('pos_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsAuthenticated(true);
    }
    return res.data;
  }, []);

  const signup = useCallback(async (userData) => {
    const res = await authAPI.signup(userData);
    if (res.data.success) {
      localStorage.setItem('pos_token', res.data.token);
      localStorage.setItem('pos_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsAuthenticated(true);
    }
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Even on API failure, clear local state
    }
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const getRoleRedirectPath = useCallback((role) => {
    const paths = {
      cashier: '/pos/floor',
      kitchen: '/kitchen',
      customer: '/customer',
      manager: '/dashboard',
    };
    return paths[role] || '/dashboard';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
