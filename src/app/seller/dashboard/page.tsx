'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiGet, ApiResponse } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  Settings,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

interface SellerProfile {
  id: string;
  store_name: string;
  store_description: string;
  store_logo_url?: string;
  status: string;
}

interface SellerStats {
  total_products: number;
  active_products: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
}

interface DashboardData {
  profile: SellerProfile | null;
  stats: SellerStats;
}

const QUICK_ACTIONS = [
  {
    title: 'Tambah Produk',
    description: 'Tambah produk baru ke toko',
    href: '/seller/products/new',
    icon: Plus,
    color: 'bg-blue-500',
  },
  {
    title: 'Kelola Produk',
    description: 'Edit atau hapus produk',
    href: '/seller/products',
    icon: Package,
    color: 'bg-emerald-500',
  },
  {
    title: 'Pesanan Masuk',
    description: 'Lihat pesanan yang perlu diproses',
    href: '/seller/orders',
    icon: ShoppingCart,
    color: 'bg-amber-500',
  },
  {
    title: 'Pengaturan Toko',
    description: 'Ubah profil toko',
    href: '/seller/settings',
    icon: Settings,
    color: 'bg-purple-500',
  },
];

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/seller/dashboard');
      return;
    }

    if (isLoggedIn && user) {
      // UKM should go to their dashboard
      if (user.role === 'UKM_OFFICIAL') {
        router.push('/dashboard');
        return;
      }
      // Admin cannot be seller
      if (user.role === 'ADMIN') {
        router.push('/admin');
        return;
      }

      fetchDashboard();
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchDashboard = async () => {
    try {
      const response = await apiGet<ApiResponse<DashboardData>>('/seller/dashboard');
      if (response.success && response.data) {
        setData(response.data);
      } else {
        // Not registered as seller, redirect to profile
        router.push('/profile');
      }
    } catch (err: any) {
      if (err.status === 403) {
        router.push('/profile');
      } else {
        setError('Gagal memuat data dashboard');
        console.error('Error fetching dashboard:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Seller</h1>
            <p className="text-gray-600">
              Selamat datang, <span className="font-medium">{data?.profile?.store_name || user?.full_name}</span>
            </p>
          </div>
          <Link href="/seller/products/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Produk
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.stats.total_products || 0}</p>
                <p className="text-sm text-gray-500">Total Produk</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-emerald-600 font-medium">
                {data?.stats.active_products || 0} aktif
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{data?.stats.total_orders || 0}</p>
                <p className="text-sm text-gray-500">Total Pesanan</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {data?.stats.pending_orders || 0} perlu diproses
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(data?.stats.total_revenue || 0)}</p>
                <p className="text-sm text-gray-500">Total Pendapatan</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Dari pesanan selesai
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 truncate">{data?.profile?.store_name || '-'}</p>
                <p className="text-sm text-gray-500">Nama Toko</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                data?.profile?.status === 'ACTIVE' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {data?.profile?.status === 'ACTIVE' ? 'Aktif' : data?.profile?.status || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  {action.title}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Store Info */}
        {data?.profile && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Informasi Toko</h2>
              <Link href="/seller/settings">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  Edit
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nama Toko</p>
                <p className="font-medium text-gray-900">{data.profile.store_name}</p>
              </div>
              {data.profile.store_description && (
                <div>
                  <p className="text-sm text-gray-500">Deskripsi</p>
                  <p className="text-gray-700">{data.profile.store_description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
