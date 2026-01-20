'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { getProduct, formatPrice, getPrimaryImage } from '@/lib/products';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Input, Alert } from '@/components/ui';
import { apiPost } from '@/lib/api';

interface CheckoutItem {
  product: Product;
  quantity: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    receiver_name: '',
    phone: '',
    address_line: '',
    city: '',
    province: '',
    postal_code: '',
  });

  // Fetch product from query params
  useEffect(() => {
    const fetchProduct = async () => {
      const productId = searchParams.get('product');
      const qty = parseInt(searchParams.get('qty') || '1', 10);

      if (!productId) {
        setError('Tidak ada produk yang dipilih');
        setLoading(false);
        return;
      }

      try {
        const product = await getProduct(productId);
        setItems([{ product, quantity: qty }]);
      } catch (err) {
        setError('Gagal memuat produk');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [searchParams]);

  // Pre-fill user info
  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        receiver_name: user.full_name,
      }));
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=' + encodeURIComponent('/checkout'));
    }
  }, [authLoading, isLoggedIn, router]);

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!shippingAddress.receiver_name || !shippingAddress.phone || !shippingAddress.address_line) {
      setError('Harap lengkapi alamat pengiriman');
      return;
    }

    if (items.length === 0) {
      setError('Tidak ada produk yang dipilih');
      return;
    }

    setSubmitting(true);

    try {
      const orderData = {
        seller_id: items[0].product.seller_id,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_address: `${shippingAddress.receiver_name}\n${shippingAddress.phone}\n${shippingAddress.address_line}\n${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.postal_code}`,
      };

      const response = await apiPost<{
        success: boolean;
        data?: {
          order: { id: string; order_code: string };
          midtrans: { redirect_url: string; token: string };
        };
        message?: string;
      }>('/orders/checkout', orderData);

      if (response.success && response.data) {
        // Redirect to Midtrans payment page
        window.location.href = response.data.midtrans.redirect_url;
      } else {
        setError(response.message || 'Gagal membuat pesanan');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat pesanan';
      setError(errorMessage);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl p-6 h-64 animate-pulse" />
              </div>
              <div className="bg-white rounded-xl p-6 h-80 animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900">Checkout Gagal</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <Link href="/products">
              <Button className="mt-4">Lihat Produk</Button>
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Shipping Address */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Address Form */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Alamat Pengiriman
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nama Penerima"
                      name="receiver_name"
                      value={shippingAddress.receiver_name}
                      onChange={handleInputChange}
                      required
                    />
                    <Input
                      label="No. Telepon"
                      name="phone"
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alamat Lengkap
                      </label>
                      <textarea
                        name="address_line"
                        value={shippingAddress.address_line}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                        required
                      />
                    </div>
                    <Input
                      label="Kota"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Provinsi"
                      name="province"
                      value={shippingAddress.province}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Kode Pos"
                      name="postal_code"
                      value={shippingAddress.postal_code}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Produk yang Dibeli
                  </h2>
                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <div key={item.product.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex gap-4">
                          <img
                            src={getPrimaryImage(item.product)}
                            alt={item.product.title}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/placeholder-product.svg';
                            }}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {item.product.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.quantity} x {formatPrice(item.product.price)}
                            </p>
                            {item.product.seller && (
                              <p className="text-xs text-gray-500 mt-1">
                                Penjual: {item.product.seller.full_name}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatPrice(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-24">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Ringkasan Pesanan
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ongkos Kirim</span>
                      <span className="text-green-600 font-medium">Gratis</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Biaya Layanan</span>
                      <span className="font-medium">Rp 0</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-base">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-blue-600">
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    isLoading={submitting}
                    disabled={submitting || items.length === 0}
                  >
                    Bayar Sekarang
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Dengan melanjutkan, Anda menyetujui{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      Syarat & Ketentuan
                    </Link>{' '}
                    yang berlaku.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
