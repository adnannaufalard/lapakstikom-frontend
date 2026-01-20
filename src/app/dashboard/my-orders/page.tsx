'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/my-orders');
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
  const orders = [
    { id: 1, product: 'Kaos STIKOM Limited Edition', seller: 'Merch STIKOM', price: 125000, status: 'PENDING', date: '2026-01-19' },
    { id: 2, product: 'Totebag Canvas Premium', seller: 'Crafty Store', price: 85000, status: 'SHIPPED', date: '2026-01-18' },
    { id: 3, product: 'Notebook Set', seller: 'Stationery Hub', price: 45000, status: 'DELIVERED', date: '2026-01-15' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'SHIPPED': return 'bg-blue-100 text-blue-700';
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Menunggu Pembayaran';
      case 'SHIPPED': return 'Dalam Pengiriman';
      case 'DELIVERED': return 'Selesai';
      case 'CANCELLED': return 'Dibatalkan';
      default: return status;
    }
  };

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      <div className="space-y-6">
        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{order.product}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Penjual: {order.seller}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(order.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">Rp {order.price.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Detail Pesanan
                </button>
                {order.status === 'DELIVERED' && (
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Beli Lagi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </UkmDashboardLayout>
  );
}
