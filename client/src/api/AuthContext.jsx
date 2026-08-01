import React, {
  createContext,
  useContext,
  useState,
} from "react";

import { userService } from "../api/userService";

const AuthContext =
  createContext(null);

export const AuthProvider = ({
  children,
}) => {
  const [authState, setAuthState] =
    useState(() => {
      try {
        const savedUser =
          localStorage.getItem(
            "etest_user"
          ) ||
          sessionStorage.getItem(
            "etest_user"
          );

        return {
          user: savedUser
            ? JSON.parse(savedUser)
            : null,
        };
      } catch (error) {
        console.error(
          "Failed to parse saved user:",
          error
        );

        return {
          user: null,
        };
      }
    });

  const login = (
    data,
    rememberMe
  ) => {
    const user =
      data.user || data;

    setAuthState({
      user,
    });

    localStorage.removeItem(
      "etest_user"
    );

    sessionStorage.removeItem(
      "etest_user"
    );

    const storage =
      rememberMe
        ? localStorage
        : sessionStorage;

    storage.setItem(
      "etest_user",
      JSON.stringify(user)
    );
  };

  const register = async (
    registrationData
  ) => {
    return userService.register(
      registrationData
    );
  };

  const logout = async () => {
    try {
      await userService.logout();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    } finally {
      setAuthState({
        user: null,
      });

      localStorage.removeItem(
        "etest_user"
      );

      sessionStorage.removeItem(
        "etest_user"
      );
    }
  };

  const value = {
    user: authState.user,
    login,
    register,
    logout,
    isAuthenticated:
      Boolean(authState.user),
    role:
      authState.user?.role,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};