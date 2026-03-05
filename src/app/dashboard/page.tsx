'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe } from '@/lib/auth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { HiPlus, HiClipboardDocumentList, HiEye, HiDocumentChartBar, HiCube, HiShoppingCart, HiCurrencyDollar, HiChartBar } from 'react-icons/hi2';

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
      description: 'Tambahkan produk baru',
      icon: <HiPlus className="w-5 h-5" />,
      href: '/dashboard/products/new',
      color: 'bg-blue-500',
    },
    {
      title: 'Kelola Pesanan',
      description: 'Lihat pesanan masuk',
      icon: <HiClipboardDocumentList className="w-5 h-5" />,
      href: '/dashboard/orders',
      color: 'bg-emerald-500',
    },
    {
      title: 'Lihat Toko',
      description: 'Preview halaman toko',
      icon: <HiEye className="w-5 h-5" />,
      href: '/dashboard/store',
      color: 'bg-violet-500',
    },
    {
      title: 'Laporan',
      description: 'Laporan penjualan',
      icon: <HiDocumentChartBar className="w-5 h-5" />,
      href: '/dashboard/finance',
      color: 'bg-amber-500',
    },
  ];

  const recentActivities = [
    { type: 'order', message: 'Pesanan baru dari Budi Santoso', time: '5 menit lalu' },
    { type: 'product', message: 'Produk "Kaos STIKOM" ditambahkan', time: '1 jam lalu' },
    { type: 'payment', message: 'Pembayaran Rp 150.000 diterima', time: '2 jam lalu' },
    { type: 'review', message: 'Review baru: ⭐⭐⭐⭐⭐', time: '3 jam lalu' },
  ];

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white mb-6">
        <h1 className="text-xl font-semibold mb-1">
          Selamat Datang, {user.full_name}! 👋
        </h1>
        <p className="text-sm text-blue-100">
          Kelola toko dan pantau performa penjualan Anda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <HiCube className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+12%</span>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Total Produk</p>
          <p className="text-xl font-semibold text-gray-900">{stats.totalProducts}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <HiShoppingCart className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">-3%</span>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Pesanan Aktif</p>
          <p className="text-xl font-semibold text-gray-900">{stats.activeOrders}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center">
              <HiCurrencyDollar className="w-5 h-5 text-violet-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+8%</span>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Pendapatan</p>
          <p className="text-xl font-semibold text-gray-900">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <HiChartBar className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+15%</span>
          </div>
          <p className="text-xs text-gray-500 mb-0.5">Kunjungan</p>
          <p className="text-xl font-semibold text-gray-900">{stats.totalViews.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Aksi Cepat</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group text-center"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-2.5 text-white group-hover:scale-105 transition-transform`}>
                  {action.icon}
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-0.5">{action.title}</h3>
                <p className="text-xs text-gray-500">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Aktivitas Terbaru</h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {recentActivities.map((activity, index) => (
              <div key={index} className="px-3 py-2.5 hover:bg-gray-50 transition-colors">
                <p className="text-xs text-gray-700 leading-relaxed">{activity.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{activity.time}</p>
              </div>
            ))}
            <div className="px-3 py-2.5 text-center">
              <Link href="/dashboard/activity" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Lihat Semua →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UkmDashboardLayout>
  );
}
