'use client';

import { useState, useEffect } from 'react';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPatch, ApiResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  order_code: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface KetuaInfo {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: string;
}

interface UkmDetail {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  ukm_name: string;
  ukm_description?: string;
  logo_url?: string;
  ukm_status: string;
  ukm_created_at: string;
  ketua?: KetuaInfo;
}

interface Statistics {
  products: {
    total: number;
    active: number;
    inactive: number;
  };
  orders: {
    total_orders: number;
    paid_orders: number;
    total_revenue: number;
    paid_revenue: number;
  };
}

interface UkmDetailData {
  ukm: UkmDetail;
  statistics: Statistics;
  recent_products: Product[];
  recent_orders: Order[];
}

export function UkmDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<UkmDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiGet<ApiResponse<UkmDetailData>>(`/ukm/admin/ukm-sellers/${id}`);
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.message || 'Gagal memuat detail UKM');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail UKM');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data) return;
    
    if (!confirm(`${data.ukm.is_active ? 'Nonaktifkan' : 'Aktifkan'} UKM "${data.ukm.ukm_name}"?`)) {
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiPatch<ApiResponse>(`/ukm/admin/ukm-sellers/${id}/toggle-status`, {});
      if (response.success) {
        setSuccess(`UKM "${data.ukm.ukm_name}" berhasil ${data.ukm.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        fetchDetail();
      } else {
        setError(response.message || 'Gagal mengubah status UKM');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status UKM');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-xl h-96" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="error">{error}</Alert>
        <div className="mt-4 text-center">
          <Button onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { ukm, statistics, recent_products, recent_orders } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div>
            <p className="text-base font-semibold text-gray-900">{ukm.ukm_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">Detail UKM dan Statistik Performa</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={ukm.is_active ? 'outline' : 'primary'}
            onClick={handleToggleStatus}
            disabled={processing}
          >
            {ukm.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          {success}
        </Alert>
      )}

      {/* UKM Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {ukm.logo_url ? (
            <img
              src={ukm.logo_url}
              alt={ukm.ukm_name}
              className="w-24 h-24 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-semibold text-3xl">
                {ukm.ukm_name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{ukm.ukm_name}</h2>
              {ukm.is_active ? (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                  Aktif
                </span>
              ) : (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                  Nonaktif
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{ukm.ukm_description || 'Tidak ada deskripsi'}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{ukm.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Username</p>
                <p className="font-medium">@{ukm.username}</p>
              </div>
              <div>
                <p className="text-gray-500">Telepon</p>
                <p className="font-medium">{ukm.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Bergabung</p>
                <p className="font-medium">{formatDate(ukm.ukm_created_at)}</p>
              </div>
              {ukm.ketua && (
                <div className="col-span-2">
                  <p className="text-gray-500">Ketua UKM</p>
                  <p className="font-medium">{ukm.ketua.full_name} (@{ukm.ketua.username})</p>
                  <p className="text-sm text-gray-600">{ukm.ketua.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Produk</p>
          <p className="text-3xl font-bold text-blue-600">{statistics.products.total}</p>
          <p className="text-xs text-gray-500 mt-1">
            {statistics.products.active} aktif, {statistics.products.inactive} nonaktif
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Pesanan</p>
          <p className="text-3xl font-bold text-purple-600">{statistics.orders.total_orders}</p>
          <p className="text-xs text-gray-500 mt-1">
            {statistics.orders.paid_orders} lunas
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(statistics.orders.total_revenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Semua pesanan</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Revenue Terbayar</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(statistics.orders.paid_revenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pesanan lunas</p>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Produk Terbaru</h3>
        {recent_products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada produk</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nama Produk</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Harga</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stok</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ditambahkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recent_products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.stock}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          product.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(product.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pesanan Terbaru</h3>
        {recent_orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada pesanan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">No. Pesanan</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(order.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'PAID_ESCROW'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'WAITING_PAYMENT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
