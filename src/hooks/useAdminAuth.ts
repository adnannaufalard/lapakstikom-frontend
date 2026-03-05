'use client';

/**
 * Custom hook untuk admin auth state management
 * Isolated session untuk admin panel
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from '@/lib/auth';
import { getAdminToken, isAdminAuthenticated, adminLogout as authAdminLogout } from '@/lib/auth';
import { apiGet, ApiResponse } from '@/lib/api';

interface UseAdminAuthReturn {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!isAdminAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const token = getAdminToken();
      if (!token) {
        throw new Error('No admin token');
      }

      // Fetch user data dengan admin token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin user');
      }

      const result: ApiResponse<User> = await response.json();
      
      if (result.data && result.data.role === 'ADMIN') {
        setUser(result.data);
      } else {
        throw new Error('Not an admin user');
      }
    } catch (error) {
      console.error('Failed to fetch admin user:', error);
      // Token mungkin expired, hapus token
      authAdminLogout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    authAdminLogout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    isLoggedIn: !!user && user.role === 'ADMIN',
    refresh,
    logout,
  };
}
