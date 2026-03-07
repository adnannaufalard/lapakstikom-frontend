'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types';
import { getOrder, cancelOrder } from '@/lib/orders';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  MdCheckCircle, MdLocalShipping, MdSchedule, MdCancel,
  MdPayment, MdPrint, MdContentCopy, MdCheck, MdArrowBack,
  MdPhone, MdSchool, MdBadge, MdStorefront, MdLocationOn,
  MdShoppingBag, MdQrCode2, MdDownload, MdVerified,
} from 'react-icons/md';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  WAITING_PAYMENT: { label: 'Menunggu Pembayaran', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: <MdSchedule className="w-5 h-5" /> },
  PAID_ESCROW:     { label: 'Menunggu Dikemas', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <MdPayment className="w-5 h-5" /> },
  PROCESSING:      { label: 'Sedang Dikemas', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <MdPayment className="w-5 h-5" /> },
  SHIPPED:         { label: 'Dalam Pengiriman', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: <MdLocalShipping className="w-5 h-5" /> },
  ARRIVED:         { label: 'Telah Tiba', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: <MdVerified className="w-5 h-5" /> },
  COMPLETED:       { label: 'Selesai', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <MdCheckCircle className="w-5 h-5" /> },
  CANCELLED:       { label: 'Dibatalkan', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <MdCancel className="w-5 h-5" /> },
  REFUND_REQUESTED:{ label: 'Refund Diminta', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <MdSchedule className="w-5 h-5" /> },
  REFUNDED:        { label: 'Direfund', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: <MdCheckCircle className="w-5 h-5" /> },
};

const BANK_LABEL: Record<string, string> = {
  bca_va:'BCA Virtual Account', bni_va:'BNI Virtual Account', bri_va:'BRI Virtual Account',
  mandiri_va:'Mandiri Virtual Account', permata_va:'Permata Virtual Account',
  cimb_va:'CIMB Niaga Virtual Account', bsi_va:'BSI Virtual Account',
  seabank_va:'SeaBank Virtual Account', qris:'QRIS', shopeepay:'ShopeePay',
  dana:'DANA', cod:'Bayar di Tempat (COD)',
};

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
      {copied ? <MdCheck className="w-4 h-4 text-green-500" /> : <MdContentCopy className="w-4 h-4" />}
    </button>
  );
}

/* ─── Status timeline ─── */

const ORDER_STEPS = [
  { key: 'WAITING_PAYMENT', label: 'Menunggu Bayar' },
  { key: 'PAID_ESCROW',     label: 'Dikemas' },
  { key: 'SHIPPED',        label: 'Dikirim' },
  { key: 'ARRIVED',        label: 'Telah Tiba' },
  { key: 'COMPLETED',      label: 'Selesai' },
] as const;

const STATUS_STEP_MAP: Record<string, number> = {
  WAITING_PAYMENT: 0,
  PAID_ESCROW:     1,
  PROCESSING:      1,
  SHIPPED:         2,
  ARRIVED:         3,
  COMPLETED:       4,
};

const ROLE_BADGE: Record<string, { label: string; cls: string; verified?: boolean }> = {
  MAHASISWA:    { label: 'Mahasiswa',    cls: 'bg-blue-100 text-blue-700' },
  DOSEN:        { label: 'Dosen',        cls: 'bg-green-100 text-green-700' },
  KARYAWAN:     { label: 'Karyawan',     cls: 'bg-orange-100 text-orange-700' },
  UKM_OFFICIAL: { label: 'UKM Official', cls: 'text-blue-600', verified: true },
};

function SellerAvatar({ avatarUrl, name }: { avatarUrl?: string; name: string }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name}
        className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0" />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
      <MdStorefront className="w-5 h-5 text-blue-500" />
    </div>
  );
}

function StatusTimeline({ status }: { status: string }) {
  if (['CANCELLED', 'REFUND_REQUESTED', 'REFUNDED'].includes(status)) return null;
  const currentIdx = STATUS_STEP_MAP[status] ?? 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
      <div className="flex items-center">
        {ORDER_STEPS.map((step, idx) => {
          const isPast    = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isPast    ? 'bg-blue-600 border-blue-600' :
                  isCurrent ? 'bg-white border-blue-600 ring-4 ring-blue-50' :
                              'bg-white border-gray-200'
                }`}>
                  {isPast
                    ? <MdCheck className="w-4 h-4 text-white" />
                    : <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
                <p className={`text-xs font-medium whitespace-nowrap ${
                  isCurrent ? 'text-blue-600' :
                  isPast    ? 'text-gray-500' :
                              'text-gray-300'
                }`}>{step.label}</p>
              </div>
              {idx < ORDER_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-6 mx-2 rounded-full ${
                  idx < currentIdx ? 'bg-blue-600' : 'bg-gray-100'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function OrderDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const orderId  = params.id as string;
  const { isLoading: authLoading, isLoggedIn, user } = useAuth();

  const [order, setOrder]       = useState<Order | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const CANCEL_REASONS = [
    'Salah pilih produk atau jumlah',
    'Ingin menggunakan voucher lain',
    'Tidak jadi membeli',
    'Menemukan harga lebih murah',
    'Alasan lainnya',
  ];
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push('/login?redirect=/profile?tab=orders');
    if (!authLoading && isLoggedIn && user && (user.role === 'ADMIN' || user.role === 'UKM_OFFICIAL')) {
      router.push('/dashboard');
    }
  }, [authLoading, isLoggedIn, user, router]);

  useEffect(() => {
    if (!orderId || !isLoggedIn) return;
    setLoading(true);
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError('Gagal memuat detail pesanan.'))
      .finally(() => setLoading(false));
  }, [orderId, isLoggedIn]);

  const handleCancel = async () => {
    if (!order || !cancelReason) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id, cancelReason);
      const updated = await getOrder(order.id);
      setOrder(updated);
      setShowCancel(false);
      setCancelReason('');
    } catch {
      setError('Gagal membatalkan pesanan.');
    } finally {
      setCancelling(false);
    }
  };

  /* â”€â”€ states â”€â”€ */

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-5xl mx-auto px-4 space-y-4 animate-pulse">
            <div className="h-6 bg-gray-100 rounded w-1/4" />
            <div className="h-48 bg-gray-100 rounded-2xl" />
            <div className="h-32 bg-gray-100 rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-4xl mb-4">😕</div>
            <p className="text-gray-600 mb-4">{error || 'Pesanan tidak ditemukan.'}</p>
            <Link href="/profile?tab=orders" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
              Kembali ke Pesanan Saya
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const status   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.CANCELLED;
  const method   = order.payment_method ?? '';
  const methodLb  = BANK_LABEL[method] ?? (method ? method.toUpperCase() : '—');
  const subtotal = order.product_amount ?? order.total_amount;
  const voucher  = order.voucher_discount_amount ?? 0;
  const delivery = order.delivery_fee ?? 0;
  const svc      = order.service_fee ?? 0;
  const pmFee    = order.payment_method_fee ?? 0;

  const buyerName  = order.buyer_name_snapshot || order.buyer_name || order.buyer?.full_name || '—';
  const sellerName = order.seller_name_snapshot || order.seller_name || order.seller?.full_name || '—';

  const qrData = JSON.stringify({
    kode: order.order_code,
    total: order.total_amount,
    pembeli: buyerName,
    penjual: sellerName,
    tanggal: order.created_at,
    status: order.status,
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(qrData)}`;

  const downloadQr = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${order.order_code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white print:bg-white">
      <div className="print:hidden"><Navbar /></div>

      <main className="flex-1 bg-gray-50 print:hidden">

        {/* Top header bar */}
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <Link href="/profile?tab=orders"
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
                  <MdArrowBack className="w-5 h-5" />
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-base font-bold text-gray-900 font-mono">{order.order_code}</h1>
                    <CopyBtn value={order.order_code} />
                  </div>
                  <p className="text-xs text-gray-400">{formatDateTime(order.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.bg} ${status.color}`}>
                  {status.icon}
                  {status.label}
                </span>
                {order.status !== 'WAITING_PAYMENT' && order.status !== 'CANCELLED' && (
                  <button onClick={() => window.open(`/orders/${order.id}/invoice`, '_blank')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                    <MdPrint className="w-3.5 h-3.5" />
                    Lihat Invoice
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">

          {/* Status timeline */}
          <StatusTimeline status={order.status} />

          {/* Cancelled banner */}
          {order.status === 'CANCELLED' && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5">
              <MdCancel className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-800 font-semibold">Pesanan ini telah dibatalkan.</p>
            </div>
          )}

          {/* Action banners */}
          {order.status === 'WAITING_PAYMENT' && (
            <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5 flex-wrap">
              <div className="flex items-center gap-2.5">
                <MdSchedule className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-800">Segera selesaikan pembayaran sebelum pesanan dibatalkan.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCancel(true)}
                  className="flex-shrink-0 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors">
                  Batalkan
                </button>
                <Link href={`/orders/${order.id}/payment`}
                  className="flex-shrink-0 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">
                  Bayar Sekarang
                </Link>
              </div>
            </div>
          )}

          {order.status === 'PAID_ESCROW' && (
            <div className="flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 flex-wrap">
              <div className="flex items-center gap-2.5">
                <MdSchedule className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-800">Pesanan sedang dikemas oleh penjual.</p>
              </div>
              <button onClick={() => setShowCancel(true)}
                className="flex-shrink-0 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors">
                Batalkan Pesanan
              </button>
            </div>
          )}

          {order.status === 'SHIPPED' && (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3.5">
              <MdLocalShipping className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <p className="text-sm text-purple-800">Pesanan sedang dalam perjalanan ke loket pengambilan.</p>
            </div>
          )}

          {order.status === 'ARRIVED' && (
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-5 py-3.5">
              <MdVerified className="w-5 h-5 text-teal-500 flex-shrink-0" />
              <p className="text-sm text-teal-800">Pesanan sudah tiba di loket pengambilan. Tunjukan QR Code kepada petugas untuk mengambil pesananmu.</p>
            </div>
          )}

          {order.status === 'COMPLETED' && (() => {
            const completedAt = new Date(order.updated_at);
            const canRefund = (Date.now() - completedAt.getTime()) < 2 * 24 * 60 * 60 * 1000;
            return canRefund ? (
              <div className="flex items-center justify-between gap-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <MdCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-green-800">Pesanan selesai. Kamu masih bisa mengajukan pengembalian barang.</p>
                </div>
                <Link href={`/orders/${order.id}/refund`}
                  className="flex-shrink-0 px-5 py-2 border border-green-600 text-green-700 hover:bg-green-100 rounded-xl text-sm font-semibold transition-colors">
                  Ajukan Pengembalian
                </Link>
              </div>
            ) : null;
          })()}

          {/* Main grid: 2/3 info card | 1/3 QR */}
          <div className="grid lg:grid-cols-3 gap-5 items-start">

            {/* LEFT (2/3): single merged info card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* ── Produk yang Dipesan ── */}
                <div className="px-5 pt-5 pb-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-800">Produk yang Dipesan</p>
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                      {order.items?.length ?? 0} item
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {order.items?.map((item, idx) => {
                    const vars = item.variations;
                    return (
                      <div key={item.id ?? idx} className="flex items-center gap-3 px-5 py-3.5">
                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100">
                          {item.product_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product_image_url} alt={item.product_title_snapshot} className="w-full h-full object-cover" />
                          ) : (
                            <MdShoppingBag className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{item.product_title_snapshot}</p>
                          {vars && Object.keys(vars).length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {Object.entries(vars).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.quantity} × {formatCurrency(item.price_snapshot)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 flex-shrink-0 pl-2">{formatCurrency(item.subtotal)}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-gray-50/70 border-t border-gray-100 px-5 py-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal Produk</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {voucher > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon Voucher</span>
                      <span>− {formatCurrency(voucher)}</span>
                    </div>
                  )}
                  {delivery > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Ongkos Kirim</span>
                      <span>{formatCurrency(delivery)}</span>
                    </div>
                  )}
                  {svc > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Biaya Layanan</span>
                      <span>{formatCurrency(svc)}</span>
                    </div>
                  )}
                  {pmFee > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Biaya {methodLb}</span>
                      <span>{formatCurrency(pmFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total Pembayaran</span>
                    <span className="text-blue-600 text-base">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>

                {/* ── divider ── */}
                <div className="border-t border-gray-100" />

                {/* ── Pemesan ── */}
                <div className="px-5 py-4">
                  <p className="text-sm font-bold text-gray-800 mb-3">Pemesan</p>
                  <p className="text-sm font-semibold text-gray-900 mb-2">{buyerName}</p>
                  <div className="space-y-1.5">
                    {order.buyer_phone_snapshot && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MdPhone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {order.buyer_phone_snapshot}
                      </div>
                    )}
                    {order.buyer_prodi_snapshot && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MdSchool className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {order.buyer_prodi_snapshot}
                      </div>
                    )}
                    {order.buyer_nim_snapshot && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MdBadge className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        NIM {order.buyer_nim_snapshot}
                      </div>
                    )}
                  </div>
                  {order.buyer_note && (
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                      <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">Catatan</p>
                      <p className="text-xs text-amber-800">{order.buyer_note}</p>
                    </div>
                  )}
                </div>

                {/* ── divider ── */}
                <div className="border-t border-gray-100" />

                {/* ── Penjual ── */}
                <div className="px-5 py-4">
                  <p className="text-sm font-bold text-gray-800 mb-3">Penjual</p>
                  <div className="flex items-center gap-2.5">
                    <SellerAvatar avatarUrl={order.seller_avatar_snapshot || order.seller_avatar} name={sellerName} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{sellerName}</p>
                      {(order.seller_role) && (() => {
                        const badge = ROLE_BADGE[order.seller_role];
                        if (!badge) return <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">{order.seller_role}</span>;
                        return badge.verified ? (
                          <span className={`inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-bold tracking-wide ${badge.cls}`}>
                            <MdVerified className="w-3.5 h-3.5" />
                            {badge.label}
                          </span>
                        ) : (
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${badge.cls}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* ── divider ── */}
                <div className="border-t border-gray-100" />

                {/* ── Pembayaran & Pengiriman ── */}
                <div className="px-5 py-4">
                  <p className="text-sm font-bold text-gray-800 mb-4">Pembayaran &amp; Pengiriman</p>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Metode Bayar</p>
                      <div className="flex items-center gap-2">
                        <MdPayment className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-600">{methodLb || '—'}</p>
                      </div>
                      {order.payment?.payment_type && (
                        <p className="text-xs text-gray-400 mt-1 ml-6">{order.payment.payment_type.toUpperCase()}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Alamat Pengiriman</p>
                      {order.shipping_address ? (
                        <div className="flex items-start gap-1.5">
                          <MdLocationOn className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600 leading-relaxed">{order.shipping_address}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">—</p>
                      )}
                      {order.courier && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
                          <MdLocalShipping className="w-3.5 h-3.5 text-gray-400" />
                          Kurir: <span className="font-semibold text-gray-700">{order.courier}</span>
                        </div>
                      )}
                      {order.tracking_number && (
                        <div className="flex items-center gap-1 flex-wrap text-xs text-gray-500 mt-1">
                          <span className="text-gray-400">Resi:</span>
                          <span className="font-mono font-semibold text-gray-700">{order.tracking_number}</span>
                          <CopyBtn value={order.tracking_number} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT (1/3): QR + action buttons */}
            <div className="lg:col-span-1 space-y-4">

              {/* QR Verifikasi — only shown after payment and not cancelled */}
              {order.status !== 'WAITING_PAYMENT' && order.status !== 'CANCELLED' && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <MdQrCode2 className="w-4 h-4 text-gray-500" />
                    <p className="text-sm font-bold text-gray-800">QR Pengambilan Pesanan</p>
                  </div>
                </div>
                <div className="px-5 py-5 flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR Code Pesanan"
                    width={200}
                    height={200}
                    className="rounded-xl border border-gray-100"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <p className="text-[10px] font-mono text-gray-400 text-center break-all px-1">{order.order_code}</p>
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    Tunjukan kode QR ini saat pengambilan pesanan
                  </p>
                  <button
                    onClick={downloadQr}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <MdDownload className="w-4 h-4" />
                    Unduh QR Code
                  </button>
                </div>
              </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <Link href="/profile?tab=orders"
                  className="flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 bg-white rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  <MdArrowBack className="w-3.5 h-3.5" />
                  Pesanan Saya
                </Link>
                <Link href="/products"
                  className="flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-semibold text-white transition-colors">
                  Lanjut Belanja
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── Print Invoice (hidden on screen, visible on print) ── */}
      <div className="hidden print:block p-8 bg-white text-gray-900 text-sm">
        {/* Invoice Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-gray-500 text-xs mt-1">LapakSTIKOM</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-base font-mono">{order.order_code}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-800 text-white">
              {status.label}
            </span>
          </div>
        </div>

        {/* Buyer & Seller */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pemesan</p>
            <p className="font-semibold">{buyerName}</p>
            {order.buyer_phone_snapshot && <p className="text-xs text-gray-600">{order.buyer_phone_snapshot}</p>}
            {order.buyer_prodi_snapshot && <p className="text-xs text-gray-600">{order.buyer_prodi_snapshot}</p>}
            {order.buyer_nim_snapshot && <p className="text-xs text-gray-600">NIM: {order.buyer_nim_snapshot}</p>}
            {order.shipping_address && (
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{order.shipping_address}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Penjual</p>
            <p className="font-semibold">{sellerName}</p>
            <p className="text-xs text-gray-600 mt-1">Metode Bayar: {methodLb || method}</p>
            {order.courier && <p className="text-xs text-gray-600">Kurir: {order.courier}</p>}
            {order.tracking_number && <p className="text-xs text-gray-600 font-mono">Resi: {order.tracking_number}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 font-bold">Produk</th>
              <th className="text-center py-2 font-bold">Qty</th>
              <th className="text-right py-2 font-bold">Harga</th>
              <th className="text-right py-2 font-bold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={item.id ?? idx} className="border-b border-gray-200">
                <td className="py-2">
                  <p className="font-semibold">{item.product_title_snapshot}</p>
                  {(item as { variations?: Record<string, string> }).variations && Object.keys((item as { variations?: Record<string, string> }).variations!).length > 0 && (
                    <p className="text-gray-500 text-xs">
                      {Object.entries((item as { variations?: Record<string, string> }).variations!).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </p>
                  )}
                </td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.price_snapshot)}</td>
                <td className="py-2 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + QR */}
        <div className="flex justify-between items-start gap-6">
          <div className="flex-shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">QR Verifikasi</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR" width={100} height={100} className="border border-gray-300 rounded" />
            <p className="text-xs text-gray-400 mt-1">{order.order_code}</p>
          </div>
          <div className="flex-1 max-w-xs space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal Produk</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {voucher > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Diskon Voucher</span>
                <span>- {formatCurrency(voucher)}</span>
              </div>
            )}
            {delivery > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ongkos Kirim</span>
                <span>{formatCurrency(delivery)}</span>
              </div>
            )}
            {svc > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Layanan</span>
                <span>{formatCurrency(svc)}</span>
              </div>
            )}
            {pmFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Biaya Pembayaran</span>
                <span>{formatCurrency(pmFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-2 border-t-2 border-gray-800">
              <span>Total Pembayaran</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <p className="text-xs text-gray-400 text-right pt-1">
              Dokumen ini dicetak otomatis dari sistem LapakSTIKOM
            </p>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>

      {/* ── Cancel Modal ── */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <MdCancel className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Batalkan Pesanan?</p>
                <p className="text-xs text-gray-400">Pilih alasan pembatalan</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2">
              {CANCEL_REASONS.map((r) => (
                <button key={r} onClick={() => setCancelReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-3 ${
                    cancelReason === r
                      ? 'bg-red-50 border border-red-200 text-red-800 font-medium'
                      : 'bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100'
                  }`}>
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    cancelReason === r ? 'border-red-500 bg-red-500' : 'border-gray-300'
                  }`}>
                    {cancelReason === r && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { setShowCancel(false); setCancelReason(''); }} disabled={cancelling}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                Kembali
              </button>
              <button onClick={handleCancel} disabled={!cancelReason || cancelling}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors">
                {cancelling ? 'Membatalkan…' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


