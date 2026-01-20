'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { MdFileDownload, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

export default function FinancePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/finance');
    } else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, user, router]);

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

  const financialData = {
    totalRevenue: 45750000,
    totalOrders: 328,
    averageOrder: 139482,
    totalProfit: 12850000,
  };

  const transactions = [
    { date: '2026-01-19', order: '#ORD-001', customer: 'Budi Santoso', amount: 125000, status: 'SUCCESS' },
    { date: '2026-01-19', order: '#ORD-002', customer: 'Siti Nurhaliza', amount: 85000, status: 'SUCCESS' },
    { date: '2026-01-18', order: '#ORD-003', customer: 'Ahmad Fauzi', amount: 245000, status: 'PENDING' },
    { date: '2026-01-18', order: '#ORD-004', customer: 'Dewi Lestari', amount: 65000, status: 'SUCCESS' },
    { date: '2026-01-17', order: '#ORD-005', customer: 'Rudi Hartono', amount: 175000, status: 'SUCCESS' },
  ];

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      <div className="space-y-6">
        {/* Export Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <MdFileDownload />
            Export Laporan
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {[
            { value: 'week', label: '7 Hari' },
            { value: 'month', label: '30 Hari' },
            { value: 'year', label: 'Tahun Ini' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === item.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Pendapatan</p>
              <MdTrendingUp className="text-green-500 text-xl" />
            </div>
            <p className="text-2xl font-bold text-gray-900">Rp {financialData.totalRevenue.toLocaleString('id-ID')}</p>
            <p className="text-xs text-green-600 mt-1">+12.5% dari bulan lalu</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <MdTrendingUp className="text-green-500 text-xl" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{financialData.totalOrders}</p>
            <p className="text-xs text-green-600 mt-1">+8.3% dari bulan lalu</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Rata-rata Pesanan</p>
              <MdTrendingDown className="text-red-500 text-xl" />
            </div>
            <p className="text-2xl font-bold text-gray-900">Rp {financialData.averageOrder.toLocaleString('id-ID')}</p>
            <p className="text-xs text-red-600 mt-1">-3.2% dari bulan lalu</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Keuntungan</p>
              <MdTrendingUp className="text-green-500 text-xl" />
            </div>
            <p className="text-2xl font-bold text-gray-900">Rp {financialData.totalProfit.toLocaleString('id-ID')}</p>
            <p className="text-xs text-green-600 mt-1">+15.7% dari bulan lalu</p>
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Grafik Pendapatan</h2>
          <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Grafik pendapatan akan ditampilkan di sini</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Transaksi Terbaru</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Tanggal</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">No. Pesanan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Pelanggan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Jumlah</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{transaction.order}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{transaction.customer}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {transaction.status === 'SUCCESS' ? 'Berhasil' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </UkmDashboardLayout>
  );
}
