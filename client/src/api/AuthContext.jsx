import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../api/userService';

/**
 * AuthContext provides global authentication state and methods.
 * It manages user persistence in localStorage/sessionStorage and
 * provides easy access to the current user and their role.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    // Initialize state from storage on app load
    const savedUser = localStorage.getItem('etest_user') || sessionStorage.getItem('etest_user');
    
    return {
      user: savedUser ? JSON.parse(savedUser) : null
    };
  });

  /**
   * Handle user login and persistence
   * @param {Object} data - Data from API (contains {user} or just user)
   * @param {boolean} rememberMe - Whether to use localStorage for persistence
   */
  const login = (data, rememberMe) => {
    // Handle both mock (just user) and server (user) responses
    // Token is now set via HttpOnly cookie by the server
    const user = data.user || data;

    setAuthState({ user });
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('etest_user', JSON.stringify(user));
  };

  /**
   * Handle user registration persistence
   */
  const register = (data) => {
    if (data) {
      const user = data.user || data;
      
      setAuthState({ user });
      sessionStorage.setItem('etest_user', JSON.stringify(user));
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
      setAuthState({ user: null });
      localStorage.removeItem('etest_user');
      sessionStorage.removeItem('etest_user');
    }
  };

  const value = {
    user: authState.user,
    login,
    register,
    logout,
    isAuthenticated: !!authState.user,
    role: authState.user?.role
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
