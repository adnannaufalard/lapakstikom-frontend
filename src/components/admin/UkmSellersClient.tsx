'use client';

import { useState, useEffect } from 'react';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPatch, ApiResponse } from '@/lib/api';
import Link from 'next/link';

interface UkmSeller {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  ukm_name: string;
  ukm_description?: string;
  logo_url?: string;
  ukm_status: string;
  ukm_created_at: string;
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  total_products: number;
}

export function UkmSellersClient() {
  const [sellers, setSellers] = useState<UkmSeller[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, total_products: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedSeller, setSelectedSeller] = useState<UkmSeller | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, [statusFilter, searchQuery]);

  const fetchSellers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiGet<ApiResponse<{ ukm_sellers: UkmSeller[]; stats: Stats }>>(
        `/ukm/admin/ukm-sellers?${params.toString()}`
      );
      
      if (response.success && response.data) {
        setSellers(response.data.ukm_sellers);
        setStats(response.data.stats);
      } else {
        throw new Error(response.message || 'Gagal memuat data UKM');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data UKM');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleToggleStatus = async (seller: UkmSeller) => {
    if (!confirm(`${seller.is_active ? 'Nonaktifkan' : 'Aktifkan'} UKM "${seller.ukm_name}"?`)) {
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiPatch<ApiResponse>(`/ukm/admin/ukm-sellers/${seller.id}/toggle-status`, {});
      if (response.success) {
        setSuccess(`UKM "${seller.ukm_name}" berhasil ${seller.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
        fetchSellers();
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
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-xl h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">UKM Sellers</h1>
          <p className="text-gray-600 mt-1">Kelola UKM dan lihat performa penjualan</p>
        </div>
        <Button
          onClick={() => fetchSellers()}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <svg 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
          <p className="text-sm text-blue-600">Total UKM</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-700">{stats.active}</p>
          <p className="text-sm text-green-600">Aktif</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-2xl font-bold text-red-700">{stats.inactive}</p>
          <p className="text-sm text-red-600">Nonaktif</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-700">{stats.total_products}</p>
          <p className="text-sm text-purple-600">Total Produk</p>
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cari UKM, email, username..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button onClick={handleSearch}>Cari</Button>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                }}
              >
                Reset
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aktif ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nonaktif ({stats.inactive})
            </button>
          </div>
        </div>
      </div>

      {/* UKM List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sellers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p>Tidak ada UKM ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UKM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statistik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {seller.logo_url ? (
                          <img
                            src={seller.logo_url}
                            alt={seller.ukm_name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 font-semibold text-lg">
                              {seller.ukm_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{seller.ukm_name}</p>
                          <p className="text-sm text-gray-500">@{seller.username}</p>
                          <p className="text-xs text-gray-400">Bergabung {formatDate(seller.ukm_created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{seller.email}</p>
                      <p className="text-sm text-gray-500">{seller.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-900">
                          <span className="font-medium">{seller.total_products}</span> Produk
                          <span className="text-green-600 ml-1">({seller.active_products} aktif)</span>
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">{seller.total_orders}</span> Pesanan
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(seller.total_revenue)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {seller.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/ukm-sellers/${seller.id}`}>
                          <Button variant="outline" size="sm">
                            Detail
                          </Button>
                        </Link>
                        <Button
                          variant={seller.is_active ? 'outline' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(seller)}
                          disabled={processing}
                        >
                          {seller.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      </div>
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
