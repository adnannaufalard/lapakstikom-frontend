'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types';
import { getMyOrders, OrderQueryParams } from '@/lib/orders';
import { formatCurrency, formatDate, getOrderStatusLabel } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

const ORDER_STATUSES = [
  { value: '', label: 'Semua Status' },
  { value: 'WAITING_PAYMENT', label: 'Menunggu Pembayaran' },
  { value: 'PAID_ESCROW', label: 'Dibayar' },
  { value: 'SHIPPED', label: 'Dikirim' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    WAITING_PAYMENT: 'bg-yellow-100 text-yellow-800',
    PAID_ESCROW: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUND_REQUESTED: 'bg-orange-100 text-orange-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/orders');
    }
  }, [authLoading, isLoggedIn, router]);

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    setError('');

    try {
      const params: OrderQueryParams = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;

      const response = await getMyOrders(params);
      setOrders(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError('Gagal memuat pesanan. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pesanan Saya</h1>
          <p className="mt-2 text-gray-600">Kelola dan pantau pesanan Anda</p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada pesanan
            </h3>
            <p className="text-gray-500 mb-6">
              Anda belum memiliki pesanan. Mulai belanja sekarang!
            </p>
            <Link href="/products">
              <Button>Jelajahi Produk</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </p>
                      <p className="font-medium text-gray-900">
                        {order.order_code}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="border-t border-gray-100 pt-4">
                    {order.items && order.items.length > 0 ? (
                      <div className="space-y-3">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {item.product_title_snapshot}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.quantity}x {formatCurrency(item.price_snapshot)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 2} produk lainnya
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">-</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Total Pembayaran</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        Lihat Detail
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Sebelumnya
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Halaman {page} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
