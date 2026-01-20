'use client';

/**
 * Custom hook untuk auth state management
 */

import { useState, useEffect, useCallback } from 'react';
import { User, getMe, getToken, isAuthenticated, logout as authLogout } from '@/lib/auth';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Token mungkin expired, hapus token
      authLogout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    refresh: fetchUser,
    logout,
  };
}

export default useAuth;
