'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  vendor_id: number | null;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (loginData: any) => Promise<void>;
  register: (registerData: any) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to make fetch request with credentials
  const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
    options.credentials = 'include';
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    return fetch(url, options);
  };

  const refresh = async (): Promise<boolean> => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/auth/refresh`, {
        method: 'POST',
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const getProfile = async () => {
    try {
      const res = await fetchWithCredentials(`${API_URL}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else if (res.status === 401) {
        // Try refreshing once
        const refreshed = await refresh();
        if (refreshed) {
          const retryRes = await fetchWithCredentials(`${API_URL}/auth/me`);
          if (retryRes.ok) {
            const data = await retryRes.json();
            setUser(data);
            return;
          }
        }
        setUser(null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  const login = async (loginData: any) => {
    setLoading(true);
    try {
      const res = await fetchWithCredentials(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(loginData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Login failed');
      }

      const data = await res.json();
      setUser(data.user);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData: any) => {
    setLoading(true);
    try {
      const res = await fetchWithCredentials(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Registration failed');
      }
      
      // Registration successful: Redirect to login showing approval pending message
      router.push('/login?registered=true');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetchWithCredentials(`${API_URL}/auth/logout`, {
        method: 'POST',
      });
    } finally {
      setUser(null);
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
