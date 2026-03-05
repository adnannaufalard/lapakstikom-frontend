'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, getMe, getToken, removeToken, isAuthenticated as checkAuth } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const refreshUser = async () => {
    if (!checkAuth()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error: any) {
      // Silently handle authentication errors (token already cleared by API layer)
      // Only log non-auth errors
      if (error?.status !== 401) {
        console.error('Failed to fetch user:', error);
      }
      // Ensure cleanup
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    setMounted(true);
    refreshUser();
  }, []);

  // Always render children to prevent hydration mismatch
  // Just keep loading state true until mounted

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refreshUser,
        logout,
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
