'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types';
import { getOrder, confirmOrder } from '@/lib/orders';
import { formatCurrency, formatDateTime, getOrderStatusLabel } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { isLoading: authLoading, isLoggedIn } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/orders');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !isLoggedIn) return;

      setLoading(true);
      setError('');

      try {
        const data = await getOrder(orderId);
        setOrder(data);
      } catch (err) {
        setError('Gagal memuat detail pesanan.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isLoggedIn]);

  const handleConfirmOrder = async () => {
    if (!order) return;

    setConfirming(true);
    try {
      const updated = await confirmOrder(order.id);
      setOrder(updated);
    } catch (err) {
      setError('Gagal mengkonfirmasi pesanan.');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="bg-white rounded-xl p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || 'Pesanan tidak ditemukan'}
            </h3>
            <Link href="/orders">
              <Button variant="outline">Kembali ke Daftar Pesanan</Button>
            </Link>
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
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/orders" className="text-blue-600 hover:text-blue-700">
                Pesanan Saya
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-600">{order.order_code}</li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {order.order_code}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>

              {/* Status Actions */}
              {order.status === 'SHIPPED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800 mb-3">
                    Pesanan Anda sudah dikirim. Konfirmasi jika barang sudah diterima.
                  </p>
                  <Button
                    onClick={handleConfirmOrder}
                    isLoading={confirming}
                    disabled={confirming}
                  >
                    Konfirmasi Pesanan Diterima
                  </Button>
                </div>
              )}

              {order.status === 'WAITING_PAYMENT' && order.payment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    Segera selesaikan pembayaran Anda.
                  </p>
                  <Button>Bayar Sekarang</Button>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Produk yang Dipesan
              </h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {item.product_title_snapshot}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {formatCurrency(item.price_snapshot)}
                      </p>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Alamat Pengiriman
              </h2>
              <p className="text-gray-600 whitespace-pre-line">
                {order.shipping_address}
              </p>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ringkasan Pembayaran
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Biaya Layanan</span>
                  <span className="text-gray-900">{formatCurrency(0)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>

              {/* Seller Info */}
              {order.seller && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Informasi Penjual
                  </h3>
                  <p className="text-sm text-gray-600">{order.seller.full_name}</p>
                  <p className="text-sm text-gray-500">{order.seller.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
