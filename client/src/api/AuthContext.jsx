import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../api/userService';

/**
 * AuthContext provides global authentication state and methods.
 * It manages user persistence in localStorage/sessionStorage and
 * provides easy access to the current user and their role.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Initialize user state from storage on app load
    const savedUser = localStorage.getItem('etest_user') || sessionStorage.getItem('etest_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /**
   * Handle user login and persistence
   * @param {Object} userData - User information from API
   * @param {boolean} rememberMe - Whether to use localStorage for persistence
   */
  const login = (userData, rememberMe) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('etest_user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('etest_user', JSON.stringify(userData));
    }
  };

  /**
   * Handle user registration persistence
   */
  const register = (userData) => {
    if (userData) {
      setUser(userData);
      sessionStorage.setItem('etest_user', JSON.stringify(userData));
    }
  };

  /**
   * Clean up user session on logout
   */
  const logout = async () => {
    try {
      await userService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem('etest_user');
      sessionStorage.removeItem('etest_user');
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    role: user?.role
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
