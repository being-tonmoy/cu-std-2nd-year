import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authenticateUser } from '../services/firestoreService';

export const AuthContext = createContext();

// Session timeout in milliseconds (12 hours)
const SESSION_TIMEOUT = 12 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionTimer, setSessionTimer] = useState(null);

  // Check for logged-in user on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Setup session timeout on user login/mount
  useEffect(() => {
    if (user) {
      // Clear existing timer
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }

      // Set new session timeout
      const timer = setTimeout(() => {
        // console.log('Session expired after 12 hours');
        logoutDueToTimeout();
      }, SESSION_TIMEOUT);

      setSessionTimer(timer);

      // Return cleanup function
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const logoutDueToTimeout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('sessionStartTime');
  };

  const checkAuthStatus = () => {
    try {
      const storedUser = localStorage.getItem('adminUser');
      const sessionStartTime = localStorage.getItem('sessionStartTime');

      if (storedUser && sessionStartTime) {
        const now = Date.now();
        const sessionAge = now - parseInt(sessionStartTime);

        // Check if session has expired (12 hours)
        if (sessionAge > SESSION_TIMEOUT) {
          // Session expired
          localStorage.removeItem('adminUser');
          localStorage.removeItem('sessionStartTime');
          setUser(null);
        } else {
          // Session still valid
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const authenticatedUser = await authenticateUser(email, password);
      
      if (authenticatedUser) {
        setUser(authenticatedUser);
        // Store user and session start time
        localStorage.setItem('adminUser', JSON.stringify(authenticatedUser));
        localStorage.setItem('sessionStartTime', Date.now().toString());
        return { success: true };
      } else {
        setError('Invalid email or password');
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('sessionStartTime');
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
  }, [sessionTimer]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
