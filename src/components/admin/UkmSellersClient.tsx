'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPatch, ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Store,
  Package,
  Users,
  DollarSign,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';

interface UkmSeller {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  is_active: boolean;
  ukm_name: string;
  ukm_description?: string;
  logo_url?: string;
  ukm_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedSeller, setSelectedSeller] = useState<UkmSeller | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const response = await apiGet<ApiResponse & { data: { ukm_sellers: UkmSeller[]; stats: Stats } }>('/ukm/admin/ukm-sellers', true);
      if (response.success && response.data) {
        setSellers(Array.isArray(response.data.ukm_sellers) ? response.data.ukm_sellers : []);
        setStats(response.data.stats || { total: 0, active: 0, inactive: 0, total_products: 0 });
      }
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setError('Gagal memuat data penjual');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (seller: UkmSeller) => {
    const newStatus = seller.is_active ? 'INACTIVE' : 'ACTIVE';
    const confirmMsg = seller.is_active
      ? `Nonaktifkan penjual "${seller.ukm_name}"?`
      : `Aktifkan penjual "${seller.ukm_name}"?`;

    if (!confirm(confirmMsg)) return;

    setProcessing(seller.id);
    setError('');
    setSuccess('');

    try {
      const response = await apiPatch<ApiResponse>(`/ukm/admin/ukm-sellers/${seller.id}/toggle-status`, {
        status: newStatus,
      }, true);

      if (response.success) {
        setSuccess(`Status penjual berhasil diubah menjadi ${newStatus === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}`);
        fetchSellers();
      } else {
        setError(response.message || 'Gagal mengubah status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status');
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.ukm_name.toLowerCase().includes(search.toLowerCase()) ||
      seller.full_name.toLowerCase().includes(search.toLowerCase()) ||
      seller.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'ACTIVE' && seller.is_active) ||
      (filter === 'INACTIVE' && !seller.is_active);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-lg h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => fetchSellers()}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
              <p className="text-[10px] text-gray-500">Total Penjual</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-600">{stats.active}</p>
              <p className="text-[10px] text-gray-500">Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-600">{stats.inactive}</p>
              <p className="text-[10px] text-gray-500">Nonaktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-blue-600">{stats.total_products}</p>
              <p className="text-[10px] text-gray-500">Total Produk</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-3 h-3 text-red-400" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="w-3 h-3 text-emerald-400" />
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama UKM, pemilik, atau email..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                filter === status
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {status === 'ALL' ? 'Semua' : status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase">Penjual</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase">Pemilik</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-medium text-gray-500 uppercase">Produk</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-medium text-gray-500 uppercase">Order</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2.5 text-center text-[10px] font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">
                    {search ? 'Tidak ada penjual yang cocok' : 'Belum ada penjual terdaftar'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {seller.logo_url ? (
                        <Image
                          src={seller.logo_url}
                          alt={seller.ukm_name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Store className="w-4 h-4 text-indigo-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-900">{seller.ukm_name}</p>
                        <p className="text-[10px] text-gray-500">{seller.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {seller.avatar_url ? (
                        <Image
                          src={seller.avatar_url}
                          alt={seller.full_name}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-900">{seller.full_name}</p>
                        <p className="text-[10px] text-gray-500">{seller.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-xs text-gray-900">{seller.active_products}</span>
                    <span className="text-[10px] text-gray-400">/{seller.total_products}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-xs text-gray-900">{seller.total_orders}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-xs font-medium text-gray-900">
                      {formatCurrency(seller.total_revenue)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] font-medium rounded",
                        seller.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {seller.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedSeller(seller)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(seller)}
                        disabled={processing === seller.id}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          seller.is_active
                            ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                        )}
                        title={seller.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {processing === seller.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : seller.is_active ? (
                          <ToggleRight className="w-3.5 h-3.5" />
                        ) : (
                          <ToggleLeft className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedSeller(null)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedSeller.logo_url ? (
                    <Image
                      src={selectedSeller.logo_url}
                      alt={selectedSeller.ukm_name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-indigo-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{selectedSeller.ukm_name}</h2>
                    <p className="text-[10px] text-gray-500">{selectedSeller.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSeller(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                {selectedSeller.ukm_description && (
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Deskripsi</p>
                    <p className="text-xs text-gray-900">{selectedSeller.ukm_description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Pemilik</p>
                    <div className="flex items-center gap-2">
                      {selectedSeller.avatar_url ? (
                        <Image
                          src={selectedSeller.avatar_url}
                          alt={selectedSeller.full_name}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-900">{selectedSeller.full_name}</p>
                        <p className="text-[10px] text-gray-500">@{selectedSeller.username}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Kontak</p>
                    <p className="text-xs text-gray-900">{selectedSeller.phone}</p>
                    <p className="text-[10px] text-gray-500">{selectedSeller.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-gray-50 rounded-md p-2 text-center">
                    <p className="text-sm font-semibold text-gray-900">{selectedSeller.total_products}</p>
                    <p className="text-[10px] text-gray-500">Produk</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2 text-center">
                    <p className="text-sm font-semibold text-emerald-600">{selectedSeller.active_products}</p>
                    <p className="text-[10px] text-gray-500">Aktif</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2 text-center">
                    <p className="text-sm font-semibold text-indigo-600">{selectedSeller.total_orders}</p>
                    <p className="text-[10px] text-gray-500">Order</p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2 text-center">
                    <p className="text-sm font-semibold text-amber-600">{formatCurrency(selectedSeller.total_revenue).replace('Rp', '')}</p>
                    <p className="text-[10px] text-gray-500">Revenue</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Status</p>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded",
                        selectedSeller.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {selectedSeller.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(selectedSeller)}
                    disabled={processing === selectedSeller.id}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      selectedSeller.is_active
                        ? "text-amber-700 border border-amber-300 hover:bg-amber-50"
                        : "text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                    )}
                  >
                    {processing === selectedSeller.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : selectedSeller.is_active ? (
                      <>
                        <ToggleRight className="w-3 h-3" />
                        Nonaktifkan
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-3 h-3" />
                        Aktifkan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
