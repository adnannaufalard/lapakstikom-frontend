'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { apiGet } from '@/lib/api';
import { cancelOrder } from '@/lib/orders';
import {
  MdContentCopy, MdCheck, MdCheckCircle, MdCancel,
  MdRefresh, MdOpenInNew, MdQrCode2, MdWarning,
} from 'react-icons/md';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface PaymentStatus {
  order_id: string;
  order_code: string;
  order_status: string;
  total_amount: number;
  product_amount?: number;
  voucher_discount_amount?: number;
  delivery_fee?: number;
  service_fee?: number;
  payment_method_fee?: number;
  payment: {
    payment_method: string | null;
    bank: string | null;
    va_number: string | null;
    bill_key: string | null;
    biller_code: string | null;
    expiry_time: string | null;
    gross_amount: number | null;
    transaction_status: string | null;
    qr_string: string | null;
    redirect_url: string | null;
  };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const fmt = (n: number) =>
  'Rp\u00a0' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const BANK_LABEL: Record<string, string> = {
  bca_va:'BCA', bni_va:'BNI', bri_va:'BRI', mandiri_va:'Mandiri',
  permata_va:'Permata', cimb_va:'CIMB Niaga', bsi_va:'BSI',
  qris:'QRIS', shopeepay:'ShopeePay', gopay:'GoPay', cod:'COD',
};

const PAY_STEPS: Record<string, string[]> = {
  bca_va: ['Login ke BCA Mobile / KlikBCA','Pilih Transfer > Virtual Account','Masukkan Nomor VA di atas','Konfirmasi dan selesaikan pembayaran'],
  bni_va: ['Login ke BNI Mobile Banking','Pilih Transfer > Virtual Account','Masukkan Nomor VA di atas','Konfirmasi dan selesaikan pembayaran'],
  bri_va: ['Login ke BRImo','Pilih Pembayaran > BRIVA','Masukkan Nomor VA di atas','Konfirmasi dan selesaikan pembayaran'],
  mandiri_va: ['Login ke Livin by Mandiri','Pilih Bayar > Multipayment','Masukkan Kode Perusahaan & Kode Tagihan di atas','Konfirmasi dan selesaikan pembayaran'],
  permata_va: ['Login ke PermataMobile X','Pilih Transfer > Virtual Account','Masukkan Nomor VA di atas','Konfirmasi dan selesaikan pembayaran'],
  cimb_va: ['Login ke OCTO Mobile (CIMB)','Pilih Bayar > Virtual Account','Masukkan Nomor VA di atas','Konfirmasi dan selesaikan pembayaran'],
  bsi_va: ['Login ke BSI Mobile','Pilih Transfer > Virtual Account','Masukkan Nomor VA di atas','Konfirmasi dan selesaikan pembayaran'],
  seabank_va: ['Login ke SeaBank App atau BNI Mobile Banking','Pilih Transfer > Virtual Account','Masukkan Nomor VA di atas','Konfirmasi dan selesaikan pembayaran'],
  qris: ['Buka aplikasi e-wallet kamu (GoPay, OVO, ShopeePay, dll)','Pilih fitur Scan QR / Bayar','Scan QR Code di atas','Konfirmasi pembayaran di aplikasimu'],
  shopeepay: ['Tekan tombol "Bayar dengan ShopeePay" di bawah','Kamu akan diarahkan ke Shopee','Konfirmasi pembayaran di Shopee','Kembali ke halaman ini setelah bayar'],
  gopay: ['Tekan tombol "Bayar dengan GoPay" di bawah','Kamu akan diarahkan ke aplikasi Gojek/GoPay','Konfirmasi pembayaran di GoPay','Kembali ke halaman ini setelah bayar'],
  cod: ['Tunggu penjual mengkonfirmasi pesananmu','Penjual akan mengirimkan barang','Bayar kepada kurir saat barang tiba','Cofirmasi penerimaan barang'],
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Copy button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
      {copied
        ? <><MdCheck className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">Disalin</span></>
        : <><MdContentCopy className="w-3.5 h-3.5" />{label ?? 'Salin'}</>}
    </button>
  );
}

/* ─────────────── Cancel modal ─────────────────── */

const CANCEL_REASONS = [
  'Salah pilih metode pembayaran',
  'Salah pilih produk atau jumlah',
  'Ingin menggunakan voucher lain',
  'Tidak jadi membeli',
  'Menemukan harga lebih murah di tempat lain',
  'Alasan lainnya',
];

function CancelModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <MdWarning className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Batalkan Pesanan?</p>
            <p className="text-xs text-gray-400">Pilih alasan pembatalan di bawah</p>
          </div>
        </div>

        {/* Reasons */}
        <div className="px-5 py-4 space-y-2">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setSelected(r)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-3 ${
                selected === r
                  ? 'bg-red-50 border border-red-200 text-red-800 font-medium'
                  : 'bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selected === r ? 'border-red-500 bg-red-500' : 'border-gray-300'
              }`}>
                {selected === r && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              {r}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            Kembali
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || loading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors">
            {loading ? 'Membatalkan…' : 'Ya, Batalkan'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function OrderPaymentPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [data, setData]             = useState<PaymentStatus | null>(null);
  const [loadError, setLoadError]   = useState('');
  const [polling, setPolling]       = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data?: PaymentStatus; message?: string }>(
        `/orders/${id}/payment-status`
      );
      if (res.success && res.data) {
        setData(res.data);
        if (['PAID_ESCROW','SHIPPED','COMPLETED','CANCELLED'].includes(res.data.order_status))
          setPolling(false);
      }
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat status pembayaran');
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) { router.push('/login'); return; }
    fetchStatus();
  }, [authLoading, isLoggedIn, fetchStatus, router]);

  useEffect(() => {
    if (!polling) { if (pollRef.current) clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current!); };
  }, [polling, fetchStatus]);

  const handleCancel = async (reason: string) => {
    setCancelling(true);
    try {
      await cancelOrder(id, reason);
      setPolling(false);
      // Refresh data so page transitions to CANCELLED state
      await fetchStatus();
    } catch {
      // Show error inline — keep modal open
    } finally {
      setCancelling(false);
      setShowCancel(false);
    }
  };

  /* Loading */
  if (authLoading || (!data && !loadError)) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Memuat informasi pembayaran...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* Error */
  if (loadError && !data) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-4xl mb-4">ðŸ˜•</div>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <Link href="/profile?tab=orders" className="text-sm text-blue-600 hover:underline">Lihat semua pesanan</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { order_status, order_code, total_amount, payment } = data!;
  const isPaid     = ['PAID_ESCROW','SHIPPED','COMPLETED'].includes(order_status);
  const isCancelled = order_status === 'CANCELLED';
  const method      = payment.payment_method ?? 'bca_va';
  const isMandiri   = method === 'mandiri_va';
  const isQR        = method === 'qris';
  const isDeeplink  = method === 'shopeepay' || method === 'gopay';
  const isVA        = method.endsWith('_va');
  const isCOD       = method === 'cod';
  const methodLabel = BANK_LABEL[method] ?? method.toUpperCase();
  const steps       = PAY_STEPS[method] ?? PAY_STEPS.bca_va;

  /* â”€â”€ PAID â”€â”€ */
  if (isPaid) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-md mx-auto px-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isCOD ? 'bg-blue-100' : 'bg-green-100'}`}>
                <MdCheckCircle className={`w-12 h-12 ${isCOD ? 'text-blue-500' : 'text-green-500'}`} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isCOD ? 'Pesanan Berhasil Dibuat!' : 'Pembayaran Berhasil!'}
              </h1>
              <p className="text-sm text-gray-500 mb-1">Kode pesanan</p>
              <p className="text-base font-bold text-gray-800 mb-5 font-mono">{order_code}</p>

              <div className={`border rounded-2xl px-5 py-4 mb-6 text-left space-y-2 ${isCOD ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{isCOD ? 'Total tagihan' : 'Total dibayar'}</span>
                  <span className={`font-bold ${isCOD ? 'text-blue-700' : 'text-green-700'}`}>{fmt(total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Metode</span>
                  <span className="font-semibold text-gray-700">{methodLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  {isCOD
                    ? <span className="font-semibold text-amber-600">Menunggu Konfirmasi Penjual</span>
                    : <span className="font-semibold text-green-600">Lunas</span>
                  }
                </div>
              </div>

              {isCOD && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 text-left">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Pesananmu sudah diterima. Penjual akan mengkonfirmasi dan mengirimkan barang.
                    Siapkan uang tunai sebesar <span className="font-bold">{fmt(total_amount)}</span> saat kurir tiba.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Link href={`/orders/${data!.order_id}`}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors text-center">
                  Lihat Detail Pesanan
                </Link>
                <a
                  href={`/orders/${data!.order_id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors text-center"
                >
                  Lihat Invoice
                </a>
                {isCOD ? (
                  <button
                    onClick={() => setShowCancel(true)}
                    className="w-full py-3 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                    Batalkan Pesanan
                  </button>
                ) : (
                  <Link href="/products"
                    className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors text-center">
                    Lanjut Belanja
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />

        {showCancel && (
          <CancelModal
            onConfirm={handleCancel}
            onClose={() => setShowCancel(false)}
            loading={cancelling}
          />
        )}
      </div>
    );
  }

  /* â”€â”€ CANCELLED â”€â”€ */
  if (isCancelled) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <MdCancel className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Pesanan Dibatalkan</h1>
            <p className="text-sm text-gray-500 mb-6">
              Pesanan <span className="font-semibold">{order_code}</span> telah dibatalkan.
            </p>
            <Link href="/products" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold">
              Belanja Lagi
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* â”€â”€ WAITING PAYMENT â”€â”€ */
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-4">

          {/* Header */}
          <div className="text-center pt-2 pb-1">
            <h1 className="text-xl font-bold text-gray-900">Selesaikan Pembayaran</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono font-semibold">{order_code}</p>
          </div>

          {/* Polling indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Memantau status otomatis...
            <button onClick={fetchStatus} className="ml-1 hover:text-blue-600 p-1 rounded-lg hover:bg-gray-100">
              <MdRefresh className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Total */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <p className="text-xs text-center text-gray-400 uppercase tracking-wide mb-1">Total yang harus dibayar</p>
            <p className="text-3xl text-center font-bold text-blue-600">{fmt(total_amount)}</p>
            {payment.expiry_time && (
              <p className="text-xs text-center text-amber-600 mt-2 flex gap-1">
                Bayar sebelum:{' '}
                <span className="font-semibold">
                  {new Date(payment.expiry_time).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' })}
                </span>
              </p>
            )}
            {(data?.delivery_fee !== undefined || data?.service_fee !== undefined) && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                {(data?.product_amount ?? 0) > 0 && (
                  <div className="flex justify-between"><span>Subtotal Produk</span><span>{fmt(data?.product_amount ?? 0)}</span></div>
                )}
                {(data?.voucher_discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-green-600"><span>Diskon Voucher</span><span>- {fmt(data?.voucher_discount_amount ?? 0)}</span></div>
                )}
                {(data?.delivery_fee ?? 0) > 0 && (
                  <div className="flex justify-between"><span>Ongkos Kirim</span><span>{fmt(data?.delivery_fee ?? 0)}</span></div>
                )}
                {(data?.service_fee ?? 0) > 0 && (
                  <div className="flex justify-between"><span>Biaya Layanan</span><span>{fmt(data?.service_fee ?? 0)}</span></div>
                )}
                {(data?.payment_method_fee ?? 0) > 0 && (
                  <div className="flex justify-between"><span>Biaya {methodLabel}</span><span>{fmt(data?.payment_method_fee ?? 0)}</span></div>
                )}
              </div>
            )}
          </div>

          {/* COD info */}
          {isCOD && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-amber-800 mb-1">Bayar di Tempat (COD)</p>
              <p className="text-sm text-amber-700">Siapkan uang tunai sebesar <span className="font-bold">{fmt(total_amount)}</span> saat kurir tiba.</p>
            </div>
          )}

          {/* VA info */}
          {isVA && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <span className="px-3 py-1 rounded-lg text-sm font-bold bg-gray-100 text-gray-700">{methodLabel}</span>
                <span className="text-sm text-gray-500">Transfer Virtual Account</span>
              </div>

              {isMandiri ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Kode Perusahaan (Biller Code)</p>
                    <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xl font-bold tracking-widest text-gray-900">{payment.biller_code ?? 'â€”'}</p>
                      {payment.biller_code && <CopyBtn value={payment.biller_code} label="Salin" />}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Kode Tagihan (Bill Key)</p>
                    <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-xl font-bold tracking-widest text-gray-900">{payment.bill_key ?? 'â€”'}</p>
                      {payment.bill_key && <CopyBtn value={payment.bill_key} label="Salin" />}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-2xl font-bold tracking-widest text-gray-900">{payment.va_number ?? 'â€”'}</p>
                    {payment.va_number && <CopyBtn value={payment.va_number} label="Salin VA" />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QR Code (QRIS / DANA) */}
          {isQR && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-4">Scan QR Code dengan aplikasi e-wallet kamu</p>
              {payment.qr_string ? (() => {
                // Build a reliable QR image URL:
                // - If qr_string is raw QR data (e.g. QRIS "00020101..."), encode it
                //   through api.qrserver.com (free, CORS-friendly, no auth required)
                // - If qr_string is already an HTTP URL (legacy / GoPay fallback),
                //   also proxy through qrserver to avoid potential auth/CORS issues
                const qrImageUrl = payment.qr_string!.startsWith('http')
                  ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(payment.qr_string!)}`
                  : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(payment.qr_string!)}`;
                return (
                  <div className="flex justify-center">
                    <img
                      src={qrImageUrl}
                      alt="QR Code Pembayaran"
                      className="w-56 h-56 rounded-xl border border-gray-200 bg-white"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        const next = el.nextElementSibling as HTMLElement | null;
                        if (next) next.style.display = 'flex';
                      }}
                    />
                    {/* Fallback shown if image fails to load */}
                    <div style={{ display: 'none' }}
                      className="w-56 h-56 bg-gray-50 border border-gray-200 rounded-xl items-center justify-center flex-col gap-2">
                      <MdQrCode2 className="w-16 h-16 text-gray-400" />
                      <p className="text-xs text-gray-400 px-4">QR tidak dapat ditampilkan</p>
                    </div>
                  </div>
                );
              })() : (
                <div className="w-56 h-56 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl mx-auto flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-400">QR sedang dipersiapkan...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ShopeePay / GoPay deeplink */}
          {isDeeplink && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Klik tombol di bawah untuk membuka {method === 'gopay' ? 'GoPay' : 'ShopeePay'}
              </p>
              {payment.redirect_url ? (
                <a href={payment.redirect_url} target="_blank" rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3.5 text-white rounded-xl text-sm font-semibold transition-colors ${
                    method === 'gopay'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}>
                  <MdOpenInNew className="w-4 h-4" />
                  Bayar dengan {method === 'gopay' ? 'GoPay' : 'ShopeePay'}
                </a>
              ) : (
                <p className="text-xs text-gray-400 text-center">Link pembayaran sedang dipersiapkan...</p>
              )}
              <p className="text-xs text-gray-500 text-center mt-3">
                Kamu akan diarahkan ke {method === 'gopay' ? 'Gojek/GoPay' : 'Shopee'} untuk menyelesaikan pembayaran.
              </p>
            </div>
          )}

          {/* How to pay */}
          {!isCOD && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Cara Pembayaran</p>
              <ol className="space-y-2.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 flex-shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pb-6">
            <button
              onClick={() => setShowCancel(true)}
              className="flex-1 text-center py-3 border border-red-200 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
              Batalkan Pesanan
            </button>
            <Link href={`/orders/${id}`}
              className="flex-1 text-center py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors">
              Lihat Detail Pesanan
            </Link>
          </div>
        </div>
      </main>
      <Footer />

      {/* Cancel modal */}
      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={cancelling}
        />
      )}
    </div>
  );
}
