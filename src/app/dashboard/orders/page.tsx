 'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';
import { formatCurrency, getOrderStatusLabel, formatDate } from '@/lib/utils';

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Auth check
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/orders');
    } else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, user, router]);

  // Fetch seller orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiGet<ApiResponse<Order[]>>('/orders/seller');
        if (response.data) {
          setOrders(response.data);
        }
      } catch (err) {
        console.error('Gagal memuat pesanan:', err);
        setError('Gagal memuat pesanan');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleShip = async (orderId: string) => {
    const trackingNumber = prompt('Masukkan nomor resi pengiriman:');
    if (!trackingNumber) return;

    setProcessing(orderId);
    setError('');
    setSuccess('');

    try {
      await apiPost<ApiResponse>(`/orders/${orderId}/ship`, {
        courier: 'Manual',
        tracking_number: trackingNumber,
      });
      
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'SHIPPED' as const } : o
        )
      );
      setSuccess('Pesanan berhasil dikirim!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesanan');
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'UKM_OFFICIAL') {
    return null;
  }

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const ordersByStatus = {
    waiting: orders.filter((o) => o.status === 'PAID_ESCROW').length,
    shipped: orders.filter((o) => o.status === 'SHIPPED').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
  };

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{ordersByStatus.waiting}</p>
            <p className="text-sm text-yellow-600">Perlu Dikirim</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{ordersByStatus.shipped}</p>
            <p className="text-sm text-blue-600">Dalam Pengiriman</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-2xl font-bold text-green-700">{ordersByStatus.completed}</p>
            <p className="text-sm text-green-600">Selesai</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="PAID_ESCROW">Perlu Dikirim</option>
            <option value="SHIPPED">Dalam Pengiriman</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Belum Ada Pesanan
            </h2>
            <p className="mt-2 text-gray-600">
              Pesanan dari pembeli akan muncul di sini
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.order_code}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      order.status === 'PAID_ESCROW'
                        ? 'bg-yellow-100 text-yellow-700'
                        : order.status === 'SHIPPED'
                        ? 'bg-blue-100 text-blue-700'
                        : order.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  {/* Buyer Info */}
                  {order.buyer && (
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <p className="text-sm text-gray-500">Pembeli</p>
                      <p className="font-medium">{order.buyer.full_name}</p>
                      <p className="text-sm text-gray-600">{order.buyer.email}</p>
                    </div>
                  )}

                  {/* Shipping Address */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Alamat Pengiriman</p>
                    <p className="text-gray-700 whitespace-pre-line">{order.shipping_address}</p>
                  </div>

                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Produk</p>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.product_title_snapshot} x{item.quantity}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {order.status === 'PAID_ESCROW' && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <Button
                      onClick={() => handleShip(order.id)}
                      isLoading={processing === order.id}
                      disabled={processing !== null}
                    >
                      Kirim Pesanan
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </UkmDashboardLayout>
  );
}
