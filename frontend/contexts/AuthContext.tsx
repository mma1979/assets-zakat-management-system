import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, AuthResponse } from '../types';
import { loginUser, registerUser, logout as performLogout, getStoredToken, getStoredUser, setTrustToken, setStoredAuth, refreshToken as performRefresh } from '../services/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<AuthResponse>;
  loginWithPin: (email: string, pin: string, trustToken: string) => Promise<void>;
  verify2Fa: (code: string, email: string, challengeToken: string, rememberDevice?: boolean, pin?: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSuccess = (data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);
    setStoredAuth(data);
    if (data.trustToken && data.user.email) {
      setTrustToken(data.user.email, data.trustToken);
    }
    setError(null);
  };

  const login = async (email: string, pass: string): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginUser(email, pass);
      if (!data.twoFactorRequired) {
        handleAuthSuccess(data);
      }
      return data;
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPin = async (email: string, pin: string, trustToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { loginWithPin: performLoginPin } = await import('../services/auth');
      const data = await performLoginPin({ email, pin, trustToken });
      handleAuthSuccess(data);
    } catch (e: any) {
      setError(e.message || 'PIN login failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2Fa = async (code: string, email: string, challengeToken: string, rememberDevice?: boolean, pin?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { verify2Fa: performVerify } = await import('../services/auth');
      const data = await performVerify({ code, email, challengeToken, rememberDevice, pin });
      handleAuthSuccess(data);
    } catch (e: any) {
      setError(e.message || '2FA verification failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await registerUser(name, email, pass);
      handleAuthSuccess(data);
    } catch (e: any) {
      setError(e.message || 'Registration failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    performLogout();
    setUser(null);
    setToken(null);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
      loginWithPin,
      verify2Fa,
      register,
      logout,
      updateUser,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};