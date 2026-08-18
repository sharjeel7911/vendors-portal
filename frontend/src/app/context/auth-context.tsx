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

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  businessName: string;
  name: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (loginData: LoginInput) => Promise<void>;
  register: (registerData: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** class-validator errors arrive as string[]; plain errors as string. */
function toErrorMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return '';
}

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

  useEffect(() => {
    let cancelled = false;

    async function getProfile() {
      try {
        const res = await fetchWithCredentials(`${API_URL}/auth/me`);
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUser(data);
        } else if (res.status === 401) {
          // Try refreshing once
          const refreshed = await refresh();
          if (cancelled) return;
          if (refreshed) {
            const retryRes = await fetchWithCredentials(`${API_URL}/auth/me`);
            if (cancelled) return;
            if (retryRes.ok) {
              const data = await retryRes.json();
              if (!cancelled) setUser(data);
              if (!cancelled) setLoading(false);
              return;
            }
          }
          if (!cancelled) setUser(null);
        } else {
          if (!cancelled) setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    getProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (loginData: LoginInput) => {
    setLoading(true);
    try {
      const res = await fetchWithCredentials(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(loginData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(toErrorMessage(errData.message) || 'Login failed');
      }

      const data = await res.json();
      setUser(data.user);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const register = async (registerData: RegisterInput) => {
    setLoading(true);
    try {
      const res = await fetchWithCredentials(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(registerData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(toErrorMessage(errData.message) || 'Registration failed');
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
