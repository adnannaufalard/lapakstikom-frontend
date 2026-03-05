'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { apiGet } from '@/lib/api';
import { MdContentCopy, MdCheck, MdCheckCircle, MdCancel, MdRefresh } from 'react-icons/md';

/* ─────────────────── Types ─────────────────── */
type SupportedBank = 'bca' | 'bni' | 'bri' | 'mandiri';

interface PaymentStatus {
  order_id: string;
  order_code: string;
  order_status: string;
  total_amount: number;
  payment: {
    bank: SupportedBank | null;
    va_number: string | null;
    bill_key: string | null;
    biller_code: string | null;
    expiry_time: string | null;
    gross_amount: number | null;
    transaction_status: string | null;
  };
}

/* ─────────────────── Helpers ─────────────────── */
const fmt = (n: number) =>
  'Rp\u00a0' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const BANK_CFG: Record<string, { label: string; color: string; textColor: string }> = {
  bca:    { label: 'BCA',    color: 'bg-blue-600',   textColor: 'text-white' },
  bni:    { label: 'BNI',    color: 'bg-orange-500', textColor: 'text-white' },
  bri:    { label: 'BRI',    color: 'bg-sky-600',    textColor: 'text-white' },
  mandiri:{ label: 'Mandiri',color: 'bg-yellow-500', textColor: 'text-gray-900' },
};

const PAY_STEPS: Record<string, string[]> = {
  bca: [
    'Login ke BCA Mobile / KlikBCA',
    'Pilih Transfer > Virtual Account',
    'Masukkan Nomor Virtual Account di atas',
    'Konfirmasi detail dan selesaikan pembayaran',
  ],
  bni: [
    'Login ke BNI Mobile Banking / Internet Banking',
    'Pilih Transfer > Virtual Account',
    'Masukkan Nomor Virtual Account di atas',
    'Konfirmasi dan selesaikan pembayaran',
  ],
  bri: [
    'Login ke BRImo / Internet Banking BRI',
    'Pilih Pembayaran > BRIVA',
    'Masukkan Nomor Virtual Account di atas',
    'Konfirmasi dan selesaikan pembayaran',
  ],
  mandiri: [
    'Login ke Livin by Mandiri / Mandiri Internet Banking',
    'Pilih Bayar > Multipayment',
    'Masukkan Kode Perusahaan (Biller Code) dan Kode Tagihan (Bill Key) di atas',
    'Konfirmasi dan selesaikan pembayaran',
  ],
};

/* ─────────────────── Copy button ─────────────────── */
function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
    >
      {copied ? (
        <><MdCheck className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">Disalin</span></>
      ) : (
        <><MdContentCopy className="w-3.5 h-3.5" />{label ?? 'Salin'}</>
      )}
    </button>
  );
}

/* ─────────────────── Main page ─────────────────── */
export default function OrderPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<PaymentStatus | null>(null);
  const [loadError, setLoadError] = useState('');
  const [polling, setPolling] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiGet<{ success: boolean; data?: PaymentStatus; message?: string }>(
        `/orders/${id}/payment-status`
      );
      if (res.success && res.data) {
        setData(res.data);
        // Stop polling once terminal status reached
        if (['PAID_ESCROW', 'SHIPPED', 'COMPLETED', 'CANCELLED'].includes(res.data.order_status)) {
          setPolling(false);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat status pembayaran';
      setLoadError(msg);
    }
  }, [id]);

  /* Initial fetch + polling */
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
      return;
    }
    fetchStatus();
  }, [authLoading, isLoggedIn, fetchStatus, router]);

  useEffect(() => {
    if (!polling) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current!); };
  }, [polling, fetchStatus]);

  /* ── Loading ── */
  if (authLoading || (!data && !loadError)) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
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

  /* ── Error ── */
  if (loadError && !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-4xl mb-4">😕</div>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <Link href="/orders" className="text-sm text-blue-600 hover:underline">Lihat semua pesanan</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { order_status, order_code, total_amount, payment } = data!;
  const isPaid = ['PAID_ESCROW', 'SHIPPED', 'COMPLETED'].includes(order_status);
  const isCancelled = order_status === 'CANCELLED';
  const bankKey = payment.bank ?? 'bca';
  const bankCfg = BANK_CFG[bankKey] ?? BANK_CFG.bca;
  const isMandiri = bankKey === 'mandiri';

  /* ── PAID state ── */
  if (isPaid) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <MdCheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Kode pesanan <span className="font-semibold text-gray-700">{order_code}</span>
              <br />sudah lunas dan sedang diproses penjual.
            </p>
            <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 mb-6 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total dibayar</span>
                <span className="font-semibold text-green-700">{fmt(total_amount)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={`/orders/${data!.order_id}`} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                Lihat Detail Pesanan
              </Link>
              <Link href="/products" className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                Lanjut Belanja
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── CANCELLED state ── */
  if (isCancelled) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-md mx-auto px-4 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <MdCancel className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Pesanan Dibatalkan</h1>
            <p className="text-sm text-gray-500 mb-6">
              Kode pesanan <span className="font-semibold">{order_code}</span> telah dibatalkan
              {payment.expiry_time ? ' karena melewati batas waktu pembayaran' : ''}.
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

  /* ── WAITING PAYMENT state ── */
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">

          {/* Header */}
          <div className="text-center py-2">
            <h1 className="text-xl font-semibold text-gray-900">Selesaikan Pembayaran</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kode pesanan: <span className="font-semibold text-gray-700">{order_code}</span>
            </p>
          </div>

          {/* Polling indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Memantau status pembayaran secara otomatis...
            <button onClick={fetchStatus} className="ml-1 hover:text-blue-600">
              <MdRefresh className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Total */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total yang harus dibayar</p>
            <p className="text-2xl font-semibold text-blue-600">{fmt(total_amount)}</p>
            {payment.expiry_time && (
              <p className="text-xs text-amber-600 mt-2">
                ⏱ Bayar sebelum:{' '}
                <span className="font-semibold">
                  {new Date(payment.expiry_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </p>
            )}
          </div>

          {/* VA / Bill info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-5">
              <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${bankCfg.color} ${bankCfg.textColor}`}>
                {bankCfg.label}
              </span>
              <span className="text-sm text-gray-500">Transfer Virtual Account</span>
            </div>

            {isMandiri ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Kode Perusahaan (Biller Code)</p>
                  <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xl font-semibold tracking-widest text-gray-900">
                      {payment.biller_code ?? '—'}
                    </p>
                    {payment.biller_code && <CopyBtn value={payment.biller_code} label="Salin Kode" />}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Kode Tagihan (Bill Key)</p>
                  <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xl font-semibold tracking-widest text-gray-900">
                      {payment.bill_key ?? '—'}
                    </p>
                    {payment.bill_key && <CopyBtn value={payment.bill_key} label="Salin Kode" />}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Nomor Virtual Account</p>
                <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-2xl font-semibold tracking-widest text-gray-900">
                    {payment.va_number ?? '—'}
                  </p>
                  {payment.va_number && <CopyBtn value={payment.va_number} label="Salin VA" />}
                </div>
              </div>
            )}
          </div>

          {/* How to pay */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Cara Pembayaran</p>
            <ol className="space-y-2.5">
              {(PAY_STEPS[bankKey] ?? PAY_STEPS.bca).map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 flex-shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pb-4">
            <Link
              href="/products"
              className="flex-1 text-center py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Lanjut Belanja
            </Link>
            <Link
              href={`/orders/${id}`}
              className="flex-1 text-center py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Lihat Detail Pesanan
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
