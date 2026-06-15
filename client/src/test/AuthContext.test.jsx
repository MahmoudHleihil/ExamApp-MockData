import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../api/AuthContext';
import { userService } from '../api/userService';

// Mock userService
vi.mock('../api/userService', () => ({
  userService: {
    logout: vi.fn().mockResolvedValue({})
  }
}));

// Test component to consume the auth context
const TestComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-name">{user?.fullName || 'No User'}</div>
      <button onClick={() => login({ fullName: 'John Doe', role: 'Student' }, true)}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('provides the initial state correctly (unauthenticated)', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
  });

  it('updates state on login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    expect(localStorage.getItem('etest_user')).toContain('John Doe');
  });

  it('updates state on logout', async () => {
    // Manually set initial state in localStorage
    const mockUser = { fullName: 'John Doe', role: 'Student' };
    localStorage.setItem('etest_user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');

    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    expect(localStorage.getItem('etest_user')).toBeNull();
    expect(userService.logout).toHaveBeenCalled();
  });
});
