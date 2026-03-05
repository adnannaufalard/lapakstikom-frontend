'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { getProduct, formatPrice, getPrimaryImage } from '@/lib/products';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { apiPost, apiGet } from '@/lib/api';
import { MdLocalShipping, MdStoreMallDirectory, MdSell } from 'react-icons/md';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type DeliveryMethod = 'pickup' | 'delivery';
type SupportedBank = 'bca' | 'bni' | 'bri' | 'mandiri';

interface CheckoutItem {
  product: Product;
  quantity: number;
  variations?: Record<string, string>;
}

interface WilayahItem { code: string; name: string; }

interface VoucherData {
  id: string;
  code: string;
  name: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  max_discount?: number;
}

interface CheckoutResponse {
  order: { id: string; order_code: string; total_amount: number; original_amount: number; voucher_discount: number };
  payment: { bank: string; va_number?: string; bill_key?: string; biller_code?: string; expiry_time?: string };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const fmt = (n: number) =>
  'Rp\u00a0' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const PICKUP_ADDRESS = 'Ruangan Senat Mahasiswa, Gedung Kampus STIKOM Yos Sudarso, Jl. Kendalsari No.20, Purwokerto, Banyumas â€“ Ambil sendiri di tempat';

const BANK_CFG: Record<SupportedBank, { label: string; color: string; textColor: string }> = {
  bca:    { label: 'BCA',    color: 'bg-blue-600',   textColor: 'text-white' },
  bni:    { label: 'BNI',    color: 'bg-orange-500', textColor: 'text-white' },
  bri:    { label: 'BRI',    color: 'bg-sky-600',    textColor: 'text-white' },
  mandiri:{ label: 'Mandiri',color: 'bg-yellow-500', textColor: 'text-gray-900' },
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Copy button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  /* â”€â”€ Items â”€â”€ */
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  /* â”€â”€ Delivery â”€â”€ */
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');

  /* â”€â”€ Address form (only relevant when delivery) â”€â”€ */
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [kecamatanCode, setKecamatanCode] = useState('');
  const [kecamatanName, setKecamatanName] = useState('');
  const [villageCode, setVillageCode] = useState('');
  const [villageName, setVillageName] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [kecamatanList, setKecamatanList] = useState<WilayahItem[]>([]);
  const [villageList, setVillageList] = useState<WilayahItem[]>([]);
  const [kecamatanLoading, setKecamatanLoading] = useState(false);
  const [villageLoading, setVillageLoading] = useState(false);

  /* â”€â”€ Bank â”€â”€ */
  const [selectedBank, setSelectedBank] = useState<SupportedBank>('bca');

  /* â”€â”€ Voucher â”€â”€ */
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherApplied, setVoucherApplied] = useState<VoucherData | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  /* â”€â”€ Load product from params â”€â”€ */
  useEffect(() => {
    const fetchProduct = async () => {
      const productId = searchParams.get('product');
      const qty = parseInt(searchParams.get('qty') || '1', 10);
      const variationsParam = searchParams.get('variations');

      if (!productId) { setError('Tidak ada produk yang dipilih'); setLoading(false); return; }

      try {
        const product = await getProduct(productId);
        const variations = variationsParam ? JSON.parse(decodeURIComponent(variationsParam)) : undefined;
        setItems([{ product, quantity: qty, variations }]);
      } catch (err) {
        setError('Gagal memuat produk');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [searchParams]);

  /* â”€â”€ Pre-fill user name â”€â”€ */
  useEffect(() => {
    if (user?.full_name) setReceiverName(user.full_name);
  }, [user]);

  /* â”€â”€ Auth guards â”€â”€ */
  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push('/login?redirect=' + encodeURIComponent('/checkout'));
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!authLoading && user && ['ADMIN', 'UKM_OFFICIAL'].includes(user.role)) {
      alert(user.role === 'ADMIN' ? 'Admin tidak dapat melakukan pembelian' : 'Akun UKM tidak dapat melakukan pembelian');
      router.push('/');
    }
  }, [authLoading, user, router]);

  /* â”€â”€ Load kecamatan (Banyumas) â”€â”€ */
  useEffect(() => {
    setKecamatanLoading(true);
    fetch('/api/wilayah?path=districts/33.02')
      .then(r => r.json())
      .then(data => setKecamatanList(data.data ?? []))
      .catch(console.error)
      .finally(() => setKecamatanLoading(false));
  }, []);

  /* â”€â”€ Load villages when kecamatan changes â”€â”€ */
  useEffect(() => {
    if (!kecamatanCode) { setVillageList([]); return; }
    setVillageLoading(true);
    setVillageCode(''); setVillageName('');
    fetch(`/api/wilayah?path=villages/${encodeURIComponent(kecamatanCode)}`)
      .then(r => r.json())
      .then(data => setVillageList(data.data ?? []))
      .catch(console.error)
      .finally(() => setVillageLoading(false));
  }, [kecamatanCode]);

  /* â”€â”€ Derived â”€â”€ */
  const totalAmount = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const finalAmount = Math.max(0, totalAmount - voucherDiscount);

  /* â”€â”€ Voucher validation â”€â”€ */
  const handleValidateVoucher = useCallback(async () => {
    if (!voucherInput.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await apiGet<{ success: boolean; data?: { voucher: VoucherData; discount_amount: number; final_amount: number }; message?: string }>(
        `/orders/voucher/validate?code=${encodeURIComponent(voucherInput.trim())}&amount=${totalAmount}`
      );
      if (res.success && res.data) {
        setVoucherApplied(res.data.voucher);
        setVoucherDiscount(res.data.discount_amount);
      } else {
        setVoucherError(res.message || 'Kode voucher tidak valid');
      }
    } catch (err: unknown) {
      setVoucherError(err instanceof Error ? err.message : 'Kode voucher tidak valid');
    } finally {
      setVoucherLoading(false);
    }
  }, [voucherInput, totalAmount]);

  const clearVoucher = () => {
    setVoucherInput('');
    setVoucherApplied(null);
    setVoucherDiscount(0);
    setVoucherError('');
  };

  /* â”€â”€ Submit â”€â”€ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (deliveryMethod === 'delivery') {
      if (!receiverName || !phone || !addressLine) {
        setError('Harap lengkapi nama, nomor telepon, dan alamat');
        return;
      }
      if (!kecamatanCode) { setError('Pilih kecamatan terlebih dahulu'); return; }
    }

    if (items.length === 0) { setError('Tidak ada produk yang dipilih'); return; }

    setSubmitting(true);
    try {
      let shippingAddress: string;
      if (deliveryMethod === 'pickup') {
        shippingAddress = PICKUP_ADDRESS;
      } else {
        const parts = [
          receiverName,
          phone,
          addressLine,
          villageName ? `${villageName}, ${kecamatanName}` : kecamatanName,
          'Kabupaten Banyumas, Jawa Tengah',
          postalCode,
        ].filter(Boolean);
        shippingAddress = parts.join(', ');
      }

      const payload = {
        seller_id: items[0].product.seller_id,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        shipping_address: shippingAddress,
        delivery_method: deliveryMethod,
        bank: selectedBank,
        ...(voucherApplied ? { voucher_code: voucherApplied.code } : {}),
      };

      const response = await apiPost<{ success: boolean; data?: CheckoutResponse; message?: string }>(
        '/orders/checkout', payload
      );

      if (response.success && response.data) {
        // Redirect to dedicated payment page (survives refresh, has real-time polling)
        router.push(`/orders/${response.data.order.id}/payment`);
      } else {
        setError(response.message || 'Gagal membuat pesanan');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat pesanan');
    } finally {
      setSubmitting(false);
    }
  };


  /* â”€â”€ Loading skeleton â”€â”€ */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 py-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              <div className="space-y-5">
                <div className="bg-white rounded-2xl h-32 animate-pulse" />
                <div className="bg-white rounded-2xl h-64 animate-pulse" />
              </div>
              <div className="bg-white rounded-2xl h-80 animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* â”€â”€ Error (no items) â”€â”€ */
  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-16">
            <div className="text-5xl mb-4">ðŸ˜•</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Checkout Gagal</h2>
            <p className="mt-2 text-gray-500 text-sm">{error}</p>
            <Link href="/products" className="inline-block mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Lihat Produk
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white placeholder:text-gray-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';
  const selectCls = inputCls + ' bg-white cursor-pointer';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3.5 text-sm mb-6">
              <span className="shrink-0 text-base mt-0.5">âš </span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

              {/* â”€â”€ LEFT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div className="space-y-5">

                {/* Step 1: Produk */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">1</span>
                      Produk yang Dibeli
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map((item) => (
                      <div key={item.product.id} className="px-5 py-4">
                        <div className="flex gap-4 items-start">
                          <img
                            src={getPrimaryImage(item.product)}
                            alt={item.product.title}
                            className="w-[72px] h-[72px] object-cover rounded-xl border border-gray-100 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.svg'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{item.product.title}</h3>
                            {item.variations && Object.keys(item.variations).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {Object.entries(item.variations).map(([k, v]) => (
                                  <span key={k} className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2 py-0.5">{k}: {v}</span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{item.quantity} barang</p>
                            <p className="text-sm font-semibold text-blue-600 mt-1">{formatPrice(item.product.price * item.quantity)}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-gray-400">{formatPrice(item.product.price)} / barang</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Pengiriman */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">2</span>
                      Metode Pengiriman
                    </h2>
                  </div>
                  <div className="px-5 py-5">
                    {/* Toggle */}
                    <div className="flex gap-3 mb-5">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl py-3.5 border-2 text-sm font-semibold transition-all ${
                          deliveryMethod === 'pickup'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <MdStoreMallDirectory className="w-5 h-5" />
                        Pick Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('delivery')}
                        className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl py-3.5 border-2 text-sm font-semibold transition-all ${
                          deliveryMethod === 'delivery'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <MdLocalShipping className="w-5 h-5" />
                        Delivery
                      </button>
                    </div>

                    {/* Pickup info */}
                    {deliveryMethod === 'pickup' && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-blue-700 mb-1.5 uppercase tracking-wide">Lokasi Pengambilan</p>
                        <p className="text-sm text-blue-800 leading-relaxed font-semibold">Ruangan Senat Mahasiswa</p>
                        <p className="text-sm text-blue-700 leading-relaxed">Gedung Kampus STIKOM Yos Sudarso</p>
                        <p className="text-sm text-blue-700 leading-relaxed">Jl. Kendalsari No.20, Purwokerto, Banyumas</p>
                        <p className="text-xs text-blue-500 mt-2">Ambil sendiri sesuai jadwal yang disepakati dengan penjual</p>
                      </div>
                    )}

                    {/* Delivery form */}
                    {deliveryMethod === 'delivery' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>Nama Penerima <span className="text-red-400 normal-case tracking-normal">*</span></label>
                            <input
                              value={receiverName}
                              onChange={e => setReceiverName(e.target.value)}
                              placeholder="Nama lengkap penerima"
                              required={deliveryMethod === 'delivery'}
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>No. Telepon <span className="text-red-400 normal-case tracking-normal">*</span></label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                              placeholder="08xxxxxxxxxx"
                              required={deliveryMethod === 'delivery'}
                              className={inputCls}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Alamat Lengkap <span className="text-red-400 normal-case tracking-normal">*</span></label>
                          <textarea
                            value={addressLine}
                            onChange={e => setAddressLine(e.target.value)}
                            rows={2}
                            placeholder="Nama jalan, nomor, RT/RW"
                            required={deliveryMethod === 'delivery'}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none placeholder:text-gray-400"
                          />
                        </div>
                        {/* Fixed: Jawa Tengah, Kabupaten Banyumas */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>Provinsi</label>
                            <input value="Jawa Tengah" disabled className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} />
                          </div>
                          <div>
                            <label className={labelCls}>Kabupaten/Kota</label>
                            <input value="Kabupaten Banyumas" disabled className={inputCls + ' bg-gray-50 text-gray-500 cursor-not-allowed'} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelCls}>Kecamatan <span className="text-red-400 normal-case tracking-normal">*</span></label>
                            <select
                              value={kecamatanCode}
                              onChange={e => {
                                const opt = kecamatanList.find(k => k.code === e.target.value);
                                setKecamatanCode(e.target.value);
                                setKecamatanName(opt?.name ?? '');
                              }}
                              required={deliveryMethod === 'delivery'}
                              className={selectCls}
                            >
                              <option value="">{kecamatanLoading ? 'Memuat...' : 'Pilih kecamatan'}</option>
                              {kecamatanList.map(k => (
                                <option key={k.code} value={k.code}>{k.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Kelurahan/Desa</label>
                            <select
                              value={villageCode}
                              onChange={e => {
                                const opt = villageList.find(v => v.code === e.target.value);
                                setVillageCode(e.target.value);
                                setVillageName(opt?.name ?? '');
                              }}
                              disabled={!kecamatanCode || villageLoading}
                              className={selectCls + (!kecamatanCode ? ' bg-gray-50 text-gray-400 cursor-not-allowed opacity-60' : '')}
                            >
                              <option value="">{villageLoading ? 'Memuat...' : 'Pilih kelurahan/desa'}</option>
                              {villageList.map(v => (
                                <option key={v.code} value={v.code}>{v.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="w-40">
                          <label className={labelCls}>Kode Pos</label>
                          <input
                            value={postalCode}
                            onChange={e => setPostalCode(e.target.value)}
                            placeholder="12345"
                            maxLength={5}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Metode Pembayaran */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">3</span>
                      Metode Pembayaran
                    </h2>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-xs text-gray-500 mb-3">Pilih bank untuk Transfer Virtual Account</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(Object.keys(BANK_CFG) as SupportedBank[]).map(bank => {
                        const cfg = BANK_CFG[bank];
                        const selected = selectedBank === bank;
                        return (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={`py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                              selected
                                ? `${cfg.color} ${cfg.textColor} border-transparent shadow-sm`
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Nomor Virtual Account akan dikirim setelah order dibuat
                    </p>
                  </div>
                </div>

                {/* Step 4: Voucher */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">4</span>
                      <MdSell className="w-4 h-4 text-blue-600" />
                      Voucher & Diskon
                    </h2>
                  </div>
                  <div className="px-5 py-5">
                    {voucherApplied ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-green-700">{voucherApplied.code}</p>
                          <p className="text-xs text-green-600">{voucherApplied.name} â€“ hemat {fmt(voucherDiscount)}</p>
                        </div>
                        <button type="button" onClick={clearVoucher} className="text-xs text-gray-500 hover:text-red-600 transition-colors ml-4">
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex gap-2">
                          <input
                            value={voucherInput}
                            onChange={e => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(''); }}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleValidateVoucher())}
                            placeholder="Masukkan kode voucher"
                            className={inputCls + ' flex-1'}
                          />
                          <button
                            type="button"
                            disabled={!voucherInput.trim() || voucherLoading}
                            onClick={handleValidateVoucher}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
                          >
                            {voucherLoading ? '...' : 'Terapkan'}
                          </button>
                        </div>
                        {voucherError && (
                          <p className="text-xs text-red-600 mt-2">{voucherError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* â”€â”€ RIGHT: Ringkasan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
              <div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800">Ringkasan Pesanan</h2>
                  </div>
                  <div className="px-5 py-5 space-y-3.5">
                    {items.map(item => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <img
                          src={getPrimaryImage(item.product)}
                          alt={item.product.title}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                          onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder-product.svg'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 line-clamp-1">{item.product.title}</p>
                          <p className="text-[11px] text-gray-400">{item.quantity} x {formatPrice(item.product.price)}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    ))}

                    <div className="h-px bg-gray-100" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-semibold text-gray-800">{fmt(totalAmount)}</span>
                      </div>
                      {voucherDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-600">Diskon Voucher</span>
                          <span className="font-semibold text-green-600">- {fmt(voucherDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ongkos Kirim</span>
                        <span className="font-semibold text-emerald-600">Gratis</span>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total Pembayaran</span>
                      <span className="text-lg font-semibold text-blue-600">{fmt(finalAmount)}</span>
                    </div>

                    {/* Bank badge */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Bayar via:</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${BANK_CFG[selectedBank].color} ${BANK_CFG[selectedBank].textColor}`}>
                        {BANK_CFG[selectedBank].label} Virtual Account
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || items.length === 0}
                      className="w-full mt-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        'Bayar Sekarang'
                      )}
                    </button>

                    <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                      Dengan melanjutkan, kamu menyetujui{' '}
                      <Link href="/terms" className="text-blue-500 hover:underline">Syarat & Ketentuan</Link>
                      {' '}yang berlaku.
                    </p>
                  </div>
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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Memuat halaman checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

