'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { getProduct, formatPrice, getPrimaryImage } from '@/lib/products';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { apiPost, apiGet } from '@/lib/api';
import {
  MdSell, MdCheck, MdClose,
  MdCreditCard, MdAccountBalanceWallet, MdDeliveryDining,
  MdPerson, MdPhone, MdSchool, MdLocationOn, MdBadge, MdMessage,
  MdShoppingBag, MdInfoOutline, MdVerified,
  MdWallet,
} from 'react-icons/md';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

/* ─────────────────────────── Types ─────────────────────────────── */

type DeliveryMethod = 'pickup' | 'delivery';

type PaymentMethod =
  | 'bca_va' | 'bni_va' | 'bri_va' | 'mandiri_va'
  | 'permata_va' | 'cimb_va' | 'bsi_va'
  | 'qris' | 'shopeepay' | 'gopay' | 'cod';

interface CheckoutItem   { product: Product; quantity: number; variations?: Record<string, string>; }

function getEffectivePrice(product: Product, variations?: Record<string, string>): number {
  if (!variations || Object.keys(variations).length === 0 || !product.variations) return product.price;
  return product.variations.reduce<number>((p, v) => {
    const sel = variations[v.name];
    const optPrice = sel ? (v.option_prices?.[sel] ?? 0) : 0;
    return optPrice > 0 ? optPrice : p;
  }, product.price);
}
interface WilayahItem    { code: string; name: string; }
interface VoucherData    {
  id: string; code: string; name: string;
  discount_type: 'PERCENTAGE' | 'FIXED'; discount_value: number;
  max_discount?: number; min_purchase: number;
}
interface CheckoutResponse {
  order: { id: string; order_code: string; total_amount: number; original_amount: number; voucher_discount: number };
  payment: { payment_method: string; va_number?: string; bill_key?: string; biller_code?: string;
             expiry_time?: string; qr_string?: string; redirect_url?: string };
}

/* ─────────────────────────── Fee constants ─────────────────────── */

const SERVICE_FEE     = 2_000;
const VA_FEE          = 4_440;
const GOPAY_RATE      = 0.015;
const QRIS_RATE       = 0.007;
const SHOPEE_RATE     = 0.02;

function getPaymentFee(method: PaymentMethod | null, base: number): number {
  if (!method) return 0;
  if (method.endsWith('_va'))   return VA_FEE;
  if (method === 'gopay')       return Math.round(base * GOPAY_RATE);
  if (method === 'qris')        return Math.round(base * QRIS_RATE);
  if (method === 'shopeepay')   return Math.round(base * SHOPEE_RATE);
  return 0; // COD
}

/* ─────────────────────────── Payment method config ─────────────── */

interface MethodCfg {
  label: string;
  fullLabel: string;
  imgPath: string;
  fee: string;
  category: 'bank_va' | 'ewallet' | 'cod';
}

const METHODS: Record<PaymentMethod, MethodCfg> = {
  bca_va:     { label:'BCA',          fullLabel:'Bank Central Asia',      imgPath:'/images/payment-method/bank-transfer/bca.png',        fee:`+Rp 4.440`,  category:'bank_va' },
  bni_va:     { label:'BNI',          fullLabel:'Bank Negara Indonesia',  imgPath:'/images/payment-method/bank-transfer/bni.png',        fee:`+Rp 4.440`,  category:'bank_va' },
  bri_va:     { label:'BRI',          fullLabel:'Bank Rakyat Indonesia',  imgPath:'/images/payment-method/bank-transfer/bri.png',        fee:`+Rp 4.440`,  category:'bank_va' },
  mandiri_va: { label:'Mandiri',      fullLabel:'Bank Mandiri',           imgPath:'/images/payment-method/bank-transfer/mandiri.png',    fee:`+Rp 4.440`,  category:'bank_va' },
  permata_va: { label:'Permata',      fullLabel:'Bank Permata',           imgPath:'/images/payment-method/bank-transfer/permata.png',    fee:`+Rp 4.440`,  category:'bank_va' },
  cimb_va:    { label:'CIMB Niaga',   fullLabel:'Bank CIMB Niaga',        imgPath:'/images/payment-method/bank-transfer/cimb-niaga.png', fee:`+Rp 4.440`,  category:'bank_va' },
  bsi_va:     { label:'BSI',          fullLabel:'Bank Syariah Indonesia', imgPath:'/images/payment-method/bank-transfer/bsi.png',        fee:`+Rp 4.440`,  category:'bank_va' },
  qris:       { label:'QRIS',         fullLabel:'QRIS',                   imgPath:'/images/payment-method/e-wallet/qris.png',            fee:`+0,7%`,      category:'ewallet' },
  shopeepay:  { label:'ShopeePay',    fullLabel:'ShopeePay',              imgPath:'/images/payment-method/e-wallet/shopeepay.png',       fee:`+2%`,        category:'ewallet' },
  gopay:      { label:'GoPay',        fullLabel:'GoPay',                  imgPath:'/images/payment-method/e-wallet/gopay.png',           fee:`+1,5%`,      category:'ewallet' },
  cod:        { label:'COD',          fullLabel:'Bayar di Tempat (COD)',  imgPath:'/images/payment-method/cash-on-delivery/cod.png',     fee:'Gratis',     category:'cod' },
};

const BANK_VA_METHODS: PaymentMethod[]    = ['bca_va','bni_va','bri_va','mandiri_va','permata_va','cimb_va','bsi_va'];
const EWALLET_METHODS: PaymentMethod[]    = ['qris','shopeepay','gopay'];

/* ─────────────────────────── Helpers ───────────────────────────── */

const fmt = (n: number) => 'Rp\u00a0' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const PICKUP_ADDRESS = 'Ruangan Senat Mahasiswa, Kampus STIKOM Yos Sudarso, Jl. SMP 5, Windusara, Karangklesem, Kec. Purwokerto Sel., Kabupaten Banyumas';

/* ─────────────────────────── Voucher Picker Modal ──────────────── */

function VoucherModal({
  onClose, onSelect, orderTotal, selected,
}: {
  onClose: () => void;
  onSelect: (v: VoucherData | null, discount: number) => void;
  orderTotal: number;
  selected: VoucherData | null;
}) {
  const [vouchers, setVouchers]   = useState<VoucherData[]>([]);
  const [loading, setLoading]     = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [manualErr, setManualErr] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    apiGet<{ success: boolean; data?: VoucherData[] }>(
      `/orders/voucher/available?amount=${orderTotal}`
    ).then(res => {
      if (res.success && res.data) setVouchers(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [orderTotal]);

  const calcDiscount = (v: VoucherData) => {
    if (v.discount_type === 'PERCENTAGE') {
      const d = Math.round((orderTotal * v.discount_value) / 100);
      return v.max_discount ? Math.min(d, v.max_discount) : d;
    }
    return Math.min(v.discount_value, orderTotal);
  };

  const handleManual = async () => {
    if (!manualCode.trim()) return;
    setManualLoading(true); setManualErr('');
    try {
      const res = await apiGet<{ success: boolean; data?: { voucher: VoucherData; discount_amount: number }; message?: string }>(
        `/orders/voucher/validate?code=${encodeURIComponent(manualCode.trim())}&amount=${orderTotal}`
      );
      if (res.success && res.data) {
        onSelect(res.data.voucher, res.data.discount_amount);
        onClose();
      } else { setManualErr(res.message || 'Kode voucher tidak valid'); }
    } catch (e: any) { setManualErr(e.message || 'Kode voucher tidak valid'); }
    finally { setManualLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Pilih Voucher</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><MdClose className="w-5 h-5 text-gray-500" /></button>
        </div>

        {/* Manual code input */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={e => { setManualCode(e.target.value.toUpperCase()); setManualErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleManual()}
              placeholder="Masukkan kode voucher manual"
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleManual}
              disabled={!manualCode.trim() || manualLoading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold"
            >
              {manualLoading ? '...' : 'Pakai'}
            </button>
          </div>
          {manualErr && <p className="text-xs text-red-600 mt-1.5">{manualErr}</p>}
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-2">
          {loading && <p className="text-sm text-gray-400 text-center py-6">Memuat voucher...</p>}
          {!loading && vouchers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Tidak ada voucher tersedia</p>
          )}
          {vouchers.map(v => {
            const disc = calcDiscount(v);
            const isSelected = selected?.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => { onSelect(v, disc); onClose(); }}
                className={`w-full text-left border-2 rounded-xl px-4 py-3.5 transition-all ${
                  isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Kode: <span className="font-mono font-semibold text-blue-700">{v.code}</span>
                      {v.min_purchase > 0 && ` · Min. ${fmt(v.min_purchase)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-green-600">-{fmt(disc)}</p>
                    <p className="text-xs text-gray-400">
                      {v.discount_type === 'PERCENTAGE'
                        ? `${v.discount_value}%${v.max_discount ? ` maks ${fmt(v.max_discount)}` : ''}`
                        : `Potongan ${fmt(v.discount_value)}`}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-700 font-semibold">
                    <MdCheck className="w-3.5 h-3.5" /> Terpilih
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Role badge config ─────────────────── */

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  MAHASISWA:    { label: 'Mahasiswa',    className: 'bg-blue-100 text-blue-700' },
  DOSEN:        { label: 'Dosen',        className: 'bg-green-100 text-green-700' },
  KARYAWAN:     { label: 'Karyawan',     className: 'bg-orange-100 text-orange-700' },
  UKM_OFFICIAL: { label: 'UKM Official', className: 'text-blue-600' },
};

/* ─────────────────────────── Section card ─────────────────────── */

function SectionCard({ step, title, children, headerRight }: {
  step: number; title: React.ReactNode; children: React.ReactNode; headerRight?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shrink-0">{step}</span>
          {title}
        </h2>
        {headerRight}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

/* ─────────────────────────── Main checkout ─────────────────────── */

function CheckoutContent() {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  /* Items */
  const [items, setItems]     = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]     = useState('');

  /* Payment */
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>('cod');
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);
  const [openAccordion, setOpenAccordion]   = useState<string>('cod');
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);
  const [payContainerH, setPayContainerH]   = useState<number | undefined>(undefined);

  /* Voucher */
  const [voucherApplied, setVoucherApplied] = useState<VoucherData | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  /* Buyer info (editable) */
  const [editedName, setEditedName]   = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedProdi, setEditedProdi] = useState('');
  const [editedNim, setEditedNim]     = useState('');

  /* Note to seller */
  const [buyerNote, setBuyerNote] = useState('');

  /* ── Load products ── */
  useEffect(() => {
    const fetchItems = async () => {
      const source = searchParams.get('source');

      if (source === 'cart') {
        // Multiple items from cart, passed via sessionStorage
        const raw = sessionStorage.getItem('checkout_items');
        if (!raw) { setError('Tidak ada produk yang dipilih'); setLoading(false); return; }
        let cartItems: { productId: string; quantity: number; variations?: Record<string, string> }[] = [];
        try { cartItems = JSON.parse(raw); } catch { setError('Data keranjang tidak valid'); setLoading(false); return; }
        if (cartItems.length === 0) { setError('Tidak ada produk yang dipilih'); setLoading(false); return; }
        try {
          const fetched = await Promise.all(
            cartItems.map(async ci => {
              const product = await getProduct(ci.productId);
              return { product, quantity: Math.max(1, ci.quantity), variations: ci.variations };
            })
          );
          setItems(fetched);
        } catch { setError('Gagal memuat produk'); }
        finally  { setLoading(false); }
      } else {
        // Single product flow (from product detail page)
        const productId = searchParams.get('product');
        const qty       = parseInt(searchParams.get('qty') || '1', 10);
        const varParam  = searchParams.get('variations');
        if (!productId) { setError('Tidak ada produk yang dipilih'); setLoading(false); return; }
        try {
          const product    = await getProduct(productId);
          const variations = varParam ? JSON.parse(decodeURIComponent(varParam)) : undefined;
          setItems([{ product, quantity: qty, variations }]);
        } catch { setError('Gagal memuat produk'); }
        finally  { setLoading(false); }
      }
    };
    fetchItems();
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push('/login?redirect=' + encodeURIComponent('/checkout'));
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!authLoading && user && ['ADMIN', 'UKM_OFFICIAL'].includes(user.role)) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  /* ── Measure payment panel height for dynamic container ── */
  useEffect(() => {
    const measure = () => {
      const el = paymentPanelOpen ? panelBRef.current : panelARef.current;
      if (el) setPayContainerH(el.offsetHeight);
    };
    measure();
    const t = setTimeout(measure, 350);
    return () => clearTimeout(t);
  }, [paymentPanelOpen, openAccordion]);

  /* ── Pre-fill buyer info from user profile ── */
  useEffect(() => {
    if (user) {
      setEditedName((user as any).full_name || '');
      setEditedPhone((user as any).phone || (user as any).phone_number || '');
      setEditedProdi((user as any).program_studi || '');
      setEditedNim((user as any).nim || '');
    }
  }, [user]);

  /* ── Fee calculation ── */
  const subtotal          = items.reduce((s, i) => s + getEffectivePrice(i.product, i.variations) * i.quantity, 0);
  const afterVoucher      = Math.max(0, subtotal - voucherDiscount);
  const baseForFee        = afterVoucher + SERVICE_FEE;   // produk + biaya layanan sebagai dasar perhitungan %
  const paymentFee        = getPaymentFee(paymentMethod, baseForFee);
  const grandTotal        = baseForFee + paymentFee;

  const handleVoucherSelect = useCallback((v: VoucherData | null, discount: number) => {
    setVoucherApplied(v);
    setVoucherDiscount(v ? discount : 0);
  }, []);

  /* ── Quantity adjustment ── */
  const updateItemQty = (itemKey: string, newQty: number) => {
    setItems(prev => prev.map(i =>
      makeItemKey(i.product.id, i.variations) === itemKey
        ? { ...i, quantity: Math.max(1, Math.min(newQty, i.product.stock ?? 99)) }
        : i
    ));
  };

  const makeItemKey = (productId: string, variations?: Record<string, string>) => {
    if (!variations || Object.keys(variations).length === 0) return productId;
    const sorted = Object.fromEntries(Object.entries(variations).sort(([a], [b]) => a.localeCompare(b)));
    return `${productId}::${JSON.stringify(sorted)}`;
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!paymentMethod) { setError('Pilih metode pembayaran terlebih dahulu'); return; }
    if (items.length === 0) { setError('Tidak ada produk yang dipilih'); return; }

    setSubmitting(true);
    try {
      const payload = {
        seller_id:        items[0].product.seller_id,
        items:            items.map(i => ({
          product_id: i.product.id,
          quantity:   i.quantity,
          ...(i.variations && Object.keys(i.variations).length > 0 ? { variations: i.variations } : {}),
        })),
        shipping_address: PICKUP_ADDRESS,
        delivery_method:  'pickup',
        payment_method:   paymentMethod,
        buyer_name:       editedName  || undefined,
        buyer_phone:      editedPhone || undefined,
        buyer_prodi:      editedProdi || undefined,
        buyer_nim:        editedNim   || undefined,
        buyer_note:       buyerNote   || undefined,
        ...(voucherApplied ? { voucher_code: voucherApplied.code } : {}),
      };

      const response = await apiPost<{ success: boolean; data?: CheckoutResponse; message?: string }>(
        '/orders/checkout', payload
      );

      if (response.success && response.data) {
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

  /* ── Skeletons ── */
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

  if (error && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Checkout Gagal</h2>
            <p className="text-sm text-gray-500">{error}</p>
            <Link href="/products" className="inline-block mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Lihat Produk
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-gray-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide';

  const seller = items[0]?.product;
  const sellerRole = (seller as any)?.seller_role ?? '';
  const roleBadge = ROLE_BADGE[sellerRole];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      {showVoucherModal && (
        <VoucherModal
          onClose={() => setShowVoucherModal(false)}
          onSelect={handleVoucherSelect}
          orderTotal={subtotal}
          selected={voucherApplied}
        />
      )}

      <main className="flex-1 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3.5 text-sm mb-6">
              <span className="shrink-0 mt-0.5">⚠</span>{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

              {/* ── LEFT ────────────────────────────────────── */}
              <div className="space-y-5">

                {/* ── Section 1: Data Diri ── */}
                <SectionCard step={1} title="Data Diri">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nama Lengkap</label>
                      <input
                        value={editedName}
                        onChange={e => setEditedName(e.target.value)}
                        placeholder="Nama lengkap"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Nomor HP</label>
                      <input
                        value={editedPhone}
                        onChange={e => setEditedPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Program Studi</label>
                      <input
                        value={editedProdi}
                        onChange={e => setEditedProdi(e.target.value)}
                        placeholder="Program studi"
                        className={inputCls}
                      />
                    </div>
                    {user?.role === 'MAHASISWA' && (
                      <div>
                        <label className={labelCls}>NIM</label>
                        <input
                          value={editedNim}
                          onChange={e => setEditedNim(e.target.value)}
                          placeholder="Nomor Induk Mahasiswa"
                          className={inputCls}
                        />
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* ── Section 2: Produk yang Dibeli ── */}
                <SectionCard step={2} title="Produk yang Dibeli">
                  {/* Seller header */}
                  {seller && (
                    <div className="-mx-5 -mt-5 mb-0 px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                      <Link
                        href={`/${(seller as any).seller_username ?? (seller as any).seller_id}`}
                        className="flex items-center gap-3 flex-1 min-w-0 group"
                      >
                        <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden shrink-0 ring-2 ring-white">
                          {(seller as any).seller_avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(seller as any).seller_avatar} alt={(seller as any).seller_name ?? 'Seller'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-sm">
                              {((seller as any).seller_name ?? 'S')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                            {(seller as any).seller_name ?? 'Penjual'}
                          </p>
                          {roleBadge && (
                            sellerRole === 'UKM_OFFICIAL' ? (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 shrink-0">
                                <MdVerified className="w-3.5 h-3.5" />
                                {roleBadge.label}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${roleBadge.className}`}>
                                {roleBadge.label}
                              </span>
                            )
                          )}
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Items list */}
                  <div className="divide-y divide-gray-50 -mx-5">
                    {items.map(item => (
                      <div key={makeItemKey(item.product.id, item.variations)} className="px-5 py-4 flex gap-4 items-start">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getPrimaryImage(item.product)} alt={item.product.title}
                          className="w-[72px] h-[72px] object-cover rounded-xl border border-gray-100 shrink-0"
                          onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder-product.svg'; }} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{item.product.title}</h3>
                          {item.variations && Object.keys(item.variations).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Object.entries(item.variations).map(([k, v]) => (
                                <span key={k} className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2 py-0.5">{k}: {v}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                              <button type="button"
                                onClick={() => updateItemQty(makeItemKey(item.product.id, item.variations), item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base font-bold">−</button>
                              <span className="px-3 text-sm font-semibold text-gray-900 min-w-[2.25rem] text-center">{item.quantity}</span>
                              <button type="button"
                                onClick={() => updateItemQty(makeItemKey(item.product.id, item.variations), item.quantity + 1)}
                                disabled={item.quantity >= (item.product.stock ?? 99)}
                                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base font-bold">+</button>
                            </div>
                            <span className="text-xs text-gray-500">× {formatPrice(getEffectivePrice(item.product, item.variations))}</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-600 shrink-0">{formatPrice(getEffectivePrice(item.product, item.variations) * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Note to seller */}
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <label className={labelCls}>Pesan untuk Penjual</label>
                    <textarea
                      value={buyerNote}
                      onChange={e => setBuyerNote(e.target.value)}
                      placeholder="Tinggalkan pesan untuk penjual"
                      rows={3}
                      className={inputCls + ' resize-none'}
                    />
                  </div>
                </SectionCard>

                {/* ── Section 3: Pengambilan Pesanan ── */}
                <SectionCard
                  step={3}
                  title="Pengambilan Pesanan"
                  headerRight={
                    <Link href="/panduan-pengambilan" className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors whitespace-nowrap">
                      Lihat Panduan &rsaquo;
                    </Link>
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 flex items-center justify-center shrink-0">
                      <MdLocationOn className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Ruangan Senat Mahasiswa</p>
                      <p className="text-sm text-gray-500 mt-0.5">Kampus STIKOM Yos Sudarso</p>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Jl. SMP 5, Windusara, Karangklesem, Kec. Purwokerto Sel., Kabupaten Banyumas
                      </p>
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs text-gray-500">
                        <MdInfoOutline className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Barang siap diambil setelah barang berada di lokasi pengambilan</span>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* ── Section 4: Voucher ── */}
                <SectionCard step={4} title={<span className="flex items-center gap-1.5">Voucher & Diskon</span>}>
                  {voucherApplied ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-green-700">{voucherApplied.code}</p>
                        <p className="text-xs text-green-600">{voucherApplied.name} – hemat {fmt(voucherDiscount)}</p>
                      </div>
                      <button type="button" onClick={() => { setVoucherApplied(null); setVoucherDiscount(0); }}
                        className="text-xs text-gray-500 hover:text-red-600 transition-colors ml-4">Hapus</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowVoucherModal(true)}
                      className="w-full flex items-center justify-between border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl px-4 py-3.5 text-sm text-gray-500 hover:text-blue-700 transition-all">
                      <span className="flex items-center gap-2"><MdSell className="w-4 h-4" />Pilih atau masukkan voucher</span>
                      <span className="text-xs text-blue-500 font-semibold">Lihat Voucher &rsaquo;</span>
                    </button>
                  )}
                </SectionCard>

                {/* ── Section 5: Metode Pembayaran ── */}
                <SectionCard
                  step={5}
                  title={<span className="flex items-center gap-1.5">Metode Pembayaran</span>}
                  headerRight={
                    !paymentPanelOpen ? (
                      <button type="button" onClick={() => setPaymentPanelOpen(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors whitespace-nowrap">
                        Lihat Semua &rsaquo;
                      </button>
                    ) : undefined
                  }
                >
                  {/* Slide container */}
                  <div
                    className="overflow-hidden -mx-5 -my-5"
                    style={{ height: payContainerH !== undefined ? `${payContainerH}px` : undefined, transition: 'height 300ms ease-in-out' }}
                  >
                    <div
                      className="flex transition-transform duration-300 ease-in-out"
                      style={{ transform: paymentPanelOpen ? 'translateX(-50%)' : 'translateX(0)', width: '200%' }}
                    >
                      {/* Panel A – compact default view */}
                      <div ref={panelARef} className="w-1/2 px-5 py-5">
                        <div
                          className="flex items-center gap-3 border-2 border-blue-500 bg-blue-50 rounded-xl px-4 py-3.5 cursor-pointer"
                          onClick={() => setPaymentPanelOpen(true)}
                        >
                          <div className="w-10 h-7 shrink-0 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={METHODS[paymentMethod].imgPath} alt={METHODS[paymentMethod].label} className="max-w-full max-h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-blue-700">{METHODS[paymentMethod].fullLabel}</p>
                            <p className="text-xs text-blue-500">
                              {METHODS[paymentMethod].fee === 'Gratis' ? 'Tanpa biaya tambahan' : `Biaya: ${METHODS[paymentMethod].fee}`}
                            </p>
                          </div>
                          <MdCheck className="w-5 h-5 text-blue-600 shrink-0" />
                        </div>
                        <p className="text-xs text-gray-400 mt-3 text-center">
                          Klik <span className="font-semibold text-blue-500">Lihat Semua</span> di atas untuk mengganti metode pembayaran
                        </p>
                      </div>

                      {/* Panel B – full accordion */}
                      <div ref={panelBRef} className="w-1/2 px-5 py-5">
                        <Accordion type="single" collapsible value={openAccordion} onValueChange={v => setOpenAccordion(v)} className="space-y-2">
                          {/* Bank VA */}
                          <AccordionItem value="bank_va" className="border border-gray-200 rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-4 py-3.5 hover:bg-gray-50 text-xs font-semibold text-gray-800 [&>svg]:text-gray-400 hover:no-underline">
                              <span className="flex items-center gap-2">
                                <MdWallet className="w-4 h-4 text-gray-500" />
                                Bank Transfer Virtual Account
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="divide-y divide-gray-50">
                                {BANK_VA_METHODS.map(m => {
                                  const cfg = METHODS[m];
                                  const isSel = paymentMethod === m;
                                  return (
                                    <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                      <div className="w-10 h-6 shrink-0 flex items-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={cfg.imgPath} alt={cfg.label} className="w-full h-full object-contain" />
                                      </div>
                                      <span className={`flex-1 text-left text-xs ${isSel ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>{cfg.fullLabel}</span>
                                      <span className="text-xs text-gray-400">{cfg.fee}</span>
                                      {isSel && <MdCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* E-Wallet */}
                          <AccordionItem value="ewallet" className="border border-gray-200 rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-4 py-3.5 hover:bg-gray-50 text-xs font-semibold text-gray-800 [&>svg]:text-gray-400 hover:no-underline">
                              <span className="flex items-center gap-2">
                                <MdAccountBalanceWallet className="w-4 h-4 text-gray-500" />
                                E-Wallet
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <div className="divide-y divide-gray-50">
                                {EWALLET_METHODS.map(m => {
                                  const cfg = METHODS[m];
                                  const isSel = paymentMethod === m;
                                  return (
                                    <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                      <div className="w-10 h-6 shrink-0 flex items-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={cfg.imgPath} alt={cfg.label} className="w-full h-full object-contain" />
                                      </div>
                                      <span className={`flex-1 text-left text-xs ${isSel ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>{cfg.fullLabel}</span>
                                      <span className="text-xs text-amber-600">{cfg.fee}</span>
                                      {isSel && <MdCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>

                          {/* COD */}
                          <AccordionItem value="cod" className="border border-gray-200 rounded-xl overflow-hidden">
                            <AccordionTrigger className="px-4 py-3.5 hover:bg-gray-50 text-xs font-semibold text-gray-800 [&>svg]:text-gray-400 hover:no-underline">
                              <span className="flex items-center gap-2">
                                <MdDeliveryDining className="w-4 h-4 text-gray-500" />
                                Bayar di Tempat
                                <span className="text-xs text-emerald-600 font-semibold">Gratis</span>
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pb-0">
                              <button type="button" onClick={() => setPaymentMethod('cod')}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${paymentMethod === 'cod' ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <div className="w-10 h-6 shrink-0 flex items-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={METHODS.cod.imgPath} alt="COD" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 text-left">
                                  <span className={`text-xs ${paymentMethod === 'cod' ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>Bayar di Tempat (COD)</span>
                                  <p className="text-xs text-gray-400">Bayar saat mengambil pesanan</p>
                                </div>
                                <span className="text-xs text-emerald-600">Gratis</span>
                                {paymentMethod === 'cod' && <MdCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                              </button>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        <button
                          type="button"
                          onClick={() => setPaymentPanelOpen(false)}
                          className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                        >
                          Konfirmasi Pilihan
                        </button>
                      </div>
                    </div>
                  </div>
                </SectionCard>

              </div>

              {/* ── RIGHT: Ringkasan ───────────────────────── */}
              <div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-semibold text-gray-800">Ringkasan Pesanan</h2>
                  </div>
                  <div className="px-5 py-5 space-y-3.5">
                    {items.map(item => (
                      <div key={makeItemKey(item.product.id, item.variations)} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getPrimaryImage(item.product)} alt={item.product.title}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                          onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder-product.svg'; }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 line-clamp-1">{item.product.title}</p>
                          <p className="text-[11px] text-gray-400">{item.quantity} × {formatPrice(item.product.price)}</p>
                        </div>
                        <span className="text-xs text-gray-800 shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                    ))}

                    <div className="h-px bg-gray-100" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Subtotal produk</span>
                        <span className="text-xs text-gray-800">{fmt(subtotal)}</span>
                      </div>
                      {voucherDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-500">Diskon Voucher</span>
                          <span className="text-xs text-green-600">- {fmt(voucherDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Biaya Layanan</span>
                        <span className="text-xs text-gray-800">{fmt(SERVICE_FEE)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Biaya {METHODS[paymentMethod].label}</span>
                        <span className={`text-xs ${paymentFee === 0 ? 'text-emerald-600' : 'text-gray-800'}`}>
                          {paymentFee === 0 ? 'Gratis' : fmt(paymentFee)}
                        </span>
                      </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Total Pembayaran</span>
                      <span className="text-sm font-bold text-blue-600">{fmt(grandTotal)}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || items.length === 0}
                      className="w-full mt-1 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses...</>
                      ) : `Bayar Sekarang`}
                    </button>

                    <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                      Dengan melanjutkan, kamu menyetujui{' '}
                      <Link href="/terms" className="text-blue-500 hover:underline">Syarat & Ketentuan</Link> yang berlaku.
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
            <p className="text-gray-500 text-sm">Memuat checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
