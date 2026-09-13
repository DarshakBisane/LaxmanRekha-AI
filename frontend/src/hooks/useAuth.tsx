import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, setCsrfToken, setAuthToken } from '../lib/api';
import { User, UserRole } from '../types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.csrf_token) {
          setCsrfToken(res.data.csrf_token);
        }
      }
    } catch {
      setUser(null);
      setCsrfToken(null);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data?.access_token) {
        setAuthToken(res.data.access_token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.csrf_token) {
          setCsrfToken(res.data.csrf_token);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: UserRole = 'bank_officer') => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/demo-login', { role });
      if (res.data?.access_token) {
        setAuthToken(res.data.access_token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        if (res.data.csrf_token) {
          setCsrfToken(res.data.csrf_token);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      setUser(null);
      setCsrfToken(null);
      setAuthToken(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role || null,
        login,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
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

