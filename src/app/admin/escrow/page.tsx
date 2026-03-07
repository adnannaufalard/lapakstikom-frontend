'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Wallet,
  Building2,
  ShieldCheck,
  TrendingUp,
  ArrowDownLeft,
  Store,
  ChevronRight,
} from 'lucide-react';

interface EscrowOverview {
  admin_balance: number;
  seller_available: number;
  seller_total_earned: number;
  seller_total_withdrawn: number;
  escrow_held: number;
  escrow_count: number;
  completed_this_month_amount: number;
  completed_this_month_count: number;
  seller_breakdown: {
    user_id: string;
    store_name: string;
    seller_name: string;
    available_balance: number;
    total_earned: number;
    total_withdrawn: number;
    updated_at: string;
  }[];
}

function formatIDR(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function EscrowOverviewPage() {
  const [data, setData] = useState<EscrowOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ success: boolean; data: EscrowOverview }>(
        '/admin/escrow/overview',
        true
      );
      if (res.success && res.data) setData(res.data);
      else setError('Gagal mengambil data escrow');
    } catch (err: any) {
      setError(err.message ?? 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const totalSystemFunds = (data?.admin_balance ?? 0) + (data?.seller_available ?? 0) + (data?.escrow_held ?? 0);

  const statCards = [
    {
      label: 'Saldo Admin (Biaya Layanan)',
      value: data?.admin_balance ?? 0,
      icon: ShieldCheck,
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      hint: 'Akumulasi biaya layanan dari setiap pesanan yang selesai',
    },
    {
      label: 'Dana Seller (Siap Dicairkan)',
      value: data?.seller_available ?? 0,
      icon: Wallet,
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      hint: 'Dana seller yang sudah bisa dicairkan (tersimpan di rekening sistem)',
    },
    {
      label: 'Dana Escrow (Pesanan Aktif)',
      value: data?.escrow_held ?? 0,
      icon: Building2,
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      hint: `${data?.escrow_count ?? 0} pesanan sedang berjalan (Dibayar  Dikirim  Tiba)`,
    },
    {
      label: 'Diselesaikan Bulan Ini',
      value: data?.completed_this_month_amount ?? 0,
      icon: TrendingUp,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      hint: `${data?.completed_this_month_count ?? 0} pesanan selesai bulan ini`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mt-0.5">
            Semua dana tersimpan di rekening sistem. Seller melihat saldo sebagai UI dan dapat mengajukan penarikan.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
          <Link
            href="/admin/escrow/actions"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Proses Aksi
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Total banner */}
      {!loading && data && (
        <div className="bg-gray-800 rounded-xl p-5 text-white flex flex-wrap gap-6 items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Dana Tersimpan di Sistem</p>
            <p className="text-3xl font-bold">{formatIDR(totalSystemFunds)}</p>
            <p className="text-gray-400 text-xs mt-1">
              Admin {formatIDR(data.admin_balance)}  Seller {formatIDR(data.seller_available)}  Escrow {formatIDR(data.escrow_held)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs mb-1">Total Dicairkan ke Seller</p>
            <p className="text-xl font-semibold text-emerald-300">{formatIDR(data.seller_total_withdrawn)}</p>
            <p className="text-gray-400 text-xs mt-1">dari {formatIDR(data.seller_total_earned)} total pendapatan seller</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={cn('rounded-xl border border-gray-100 p-5', card.bg)}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.iconBg)}>
                  <Icon className={cn('w-5 h-5', card.iconColor)} />
                </div>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-7 bg-gray-200/60 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200/40 rounded animate-pulse w-full" />
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{formatIDR(card.value)}</p>
                  <p className="text-xs text-gray-600 mt-1 leading-snug">{card.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{card.hint}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Fund flow diagram */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Alur Dana</h3>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {[
            { label: 'Pembeli Bayar', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { label: '', color: '' },
            { label: 'Tersimpan di Escrow Sistem', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { label: ' Pesanan Selesai ', color: '' },
            { label: 'Biaya Layanan  Saldo Admin', color: 'bg-violet-100 text-violet-700 border-violet-200' },
            { label: '+', color: '' },
            { label: 'Dana Produk  Saldo Seller', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            { label: '', color: '' },
            { label: 'Seller Withdraw', color: 'bg-gray-100 text-gray-700 border-gray-200' },
          ].map((item, i) =>
            item.color ? (
              <span key={i} className={cn('px-2.5 py-1 rounded-full border font-medium', item.color)}>
                {item.label}
              </span>
            ) : (
              <span key={i} className="text-gray-400 font-medium">{item.label}</span>
            )
          )}
        </div>
      </div>

      {/* Seller balance breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-800">Distribusi Dana Seller</h3>
          </div>
          <span className="text-xs text-gray-400">{data?.seller_breakdown.length ?? 0} seller</span>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/4" />
              </div>
            ))}
          </div>
        ) : !data || data.seller_breakdown.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Belum ada seller dengan saldo</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="text-left p-3 pl-5 text-xs font-medium text-gray-500">Seller / Toko</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">Saldo Tersedia</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">Total Diterima</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500">Total Dicairkan</th>
                  <th className="text-right p-3 pr-5 text-xs font-medium text-gray-500">Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {data.seller_breakdown.map((seller) => {
                  const pct = seller.total_earned > 0
                    ? Math.round((seller.total_withdrawn / seller.total_earned) * 100)
                    : 0;
                  return (
                    <tr key={seller.user_id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                      <td className="p-3 pl-5">
                        <p className="text-xs font-semibold text-gray-800">{seller.store_name}</p>
                        <p className="text-[11px] text-gray-400">{seller.seller_name}</p>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-xs font-semibold text-emerald-700">{formatIDR(seller.available_balance)}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-xs text-gray-700">{formatIDR(seller.total_earned)}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div>
                          <span className="text-xs text-gray-600">{formatIDR(seller.total_withdrawn)}</span>
                          {pct > 0 && (
                            <div className="mt-1 h-1 w-16 ml-auto bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 pr-5 text-right">
                        <span className="text-[11px] text-gray-400">{formatDate(seller.updated_at)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/80 border-t border-gray-200">
                  <td className="p-3 pl-5 text-xs font-semibold text-gray-700">Total</td>
                  <td className="p-3 text-right text-xs font-bold text-emerald-700">{formatIDR(data.seller_available)}</td>
                  <td className="p-3 text-right text-xs font-semibold text-gray-700">{formatIDR(data.seller_total_earned)}</td>
                  <td className="p-3 text-right text-xs font-semibold text-gray-700">{formatIDR(data.seller_total_withdrawn)}</td>
                  <td className="p-3 pr-5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
