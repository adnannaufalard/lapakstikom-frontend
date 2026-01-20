'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe } from '@/lib/auth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    totalViews: 0,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getMe();
        setUser(userData);
        
        // Check if user is UKM_OFFICIAL
        if (userData.role !== 'UKM_OFFICIAL') {
          router.push('/');
          return;
        }
        
        // TODO: Fetch actual stats from API
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'UKM_OFFICIAL') {
    return null;
  }

  const quickActions = [
    {
      title: 'Tambah Produk',
      description: 'Tambahkan produk baru ke toko Anda',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '/dashboard/products/new',
      color: 'bg-blue-500',
    },
    {
      title: 'Kelola Pesanan',
      description: 'Lihat dan proses pesanan masuk',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/dashboard/orders',
      color: 'bg-green-500',
    },
    {
      title: 'Lihat Toko',
      description: 'Preview halaman toko Anda',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      href: '/dashboard/store',
      color: 'bg-purple-500',
    },
    {
      title: 'Laporan Keuangan',
      description: 'Lihat laporan penjualan & keuangan',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/finance',
      color: 'bg-orange-500',
    },
  ];

  const recentActivities = [
    { type: 'order', message: 'Pesanan baru dari Budi Santoso', time: '5 menit yang lalu', icon: '🛒' },
    { type: 'product', message: 'Produk "Kaos STIKOM" berhasil ditambahkan', time: '1 jam yang lalu', icon: '📦' },
    { type: 'payment', message: 'Pembayaran Rp 150.000 diterima', time: '2 jam yang lalu', icon: '💰' },
    { type: 'review', message: 'Review baru: ⭐⭐⭐⭐⭐ (5.0)', time: '3 jam yang lalu', icon: '⭐' },
  ];

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Selamat Datang, {user.full_name}! 👋
        </h1>
        <p className="text-blue-100">
          Kelola toko dan pantau performa penjualan Anda dengan mudah
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Produk</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded">-3%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Pesanan Aktif</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+8%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Pendapatan</h3>
          <p className="text-3xl font-bold text-gray-900">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+15%</span>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Kunjungan</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivitas Terbaru</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {recentActivities.map((activity, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-4 text-center">
              <Link href="/dashboard/activity" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Lihat Semua Aktivitas →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UkmDashboardLayout>
  );
}
