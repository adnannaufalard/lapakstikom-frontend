'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { StoreBannerManagement } from '@/components/dashboard/StoreBannerManagement';
import { MdVisibility } from 'react-icons/md';
import { apiGet, ApiResponse } from '@/lib/api';

export default function StorePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/store');
    } else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, user, router]);

  const loadStoreData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await apiGet<ApiResponse<any>>('/ukm/store/info');
      if (response.success && response.data) {
        setStoreData(response.data);
      }
    } catch (error) {
      console.error('Failed to load store data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'UKM_OFFICIAL') {
      loadStoreData();
    }
  }, [user]);

  const handleViewStore = () => {
    if (user?.username) {
      window.open(`/${user.username}`, '_blank');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user.role !== 'UKM_OFFICIAL') {
    return null;
  }

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      <div className="space-y-6">
        {/* View Store Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleViewStore}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdVisibility />
            Lihat Toko
          </button>
        </div>

        {/* Store Banner Management */}
        {!loading && (
          <StoreBannerManagement
            currentLogo={storeData?.avatar_url}
            currentBio={storeData?.bio}
            currentBackgroundUrl={storeData?.background_url}
            currentBanners={storeData?.banners || []}
            currentLayout={storeData?.layout}
            onUpdate={loadStoreData}
          />
        )}
      </div>
    </UkmDashboardLayout>
  );
}
