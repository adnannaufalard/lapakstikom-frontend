'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Search,
  ScanBarcode,
  QrCode,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Package,
  Clock,
  Truck,
  MapPin,
  ShoppingBag,
  RotateCcw,
  X,
  Camera,
  CameraOff,
  AlertTriangle,
  List,
  ClipboardCheck,
  User,
  Store,
} from 'lucide-react';

//  Types 

type OrderStatus =
  | 'WAITING_PAYMENT' | 'PAID_ESCROW' | 'PROCESSING' | 'SHIPPED'
  | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | 'REFUND_REQUESTED' | 'REFUNDED';

interface AdminOrder {
  id: string;
  order_code: string;
  status: OrderStatus;
  total_amount: number;
  payment_method: string;
  buyer_name: string;
  buyer_email: string;
  buyer_name_snapshot?: string;
  buyer_nim_snapshot?: string;
  seller_name: string;
  store_name: string;
  created_at: string;
  updated_at: string;
}

interface OrderDetail {
  id: string;
  order_code: string;
  status: OrderStatus;
  total_amount: number;
  buyer_name?: string;
  buyer_name_snapshot?: string;
  buyer_nim_snapshot?: string;
  seller_name?: string;
  created_at: string;
  items?: { product_title_snapshot: string; quantity: number; subtotal: number }[];
}

interface OrdersResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

//  Helpers 

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Semua',
  WAITING_PAYMENT: 'Menunggu Bayar',
  PAID_ESCROW: 'Sudah Bayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  ARRIVED: 'Tiba di Lokasi Pengambilan',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  REFUND_REQUESTED: 'Refund Diminta',
  REFUNDED: 'Direfund',
};

const STATUS_COLORS: Record<string, string> = {
  WAITING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  PAID_ESCROW:     'bg-blue-100 text-blue-700',
  PROCESSING:      'bg-purple-100 text-purple-700',
  SHIPPED:         'bg-indigo-100 text-indigo-700',
  ARRIVED:         'bg-teal-100 text-teal-700',
  COMPLETED:       'bg-green-100 text-green-700',
  CANCELLED:       'bg-red-100 text-red-700',
  REFUND_REQUESTED:'bg-orange-100 text-orange-700',
  REFUNDED:        'bg-gray-100 text-gray-600',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  WAITING_PAYMENT: Clock,
  PAID_ESCROW:     ShoppingBag,
  PROCESSING:      Package,
  SHIPPED:         Truck,
  ARRIVED:         MapPin,
  COMPLETED:       CheckCircle2,
  CANCELLED:       XCircle,
  REFUND_REQUESTED:RotateCcw,
  REFUNDED:        RotateCcw,
};

/** Format order code: auto-insert dashes as user types (e.g. LPS-202603-1234) */
function formatOrderCodeInput(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length <= 3)  return clean;
  if (clean.length <= 9)  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 9)}-${clean.slice(9, 13)}`;
}

/** Validate completed order code: XXX-XXXXXX-XXXX */
function isValidOrderCode(code: string): boolean {
  return /^[A-Z0-9]{3}-[A-Z0-9]{6}-[A-Z0-9]{4}$/.test(code.toUpperCase());
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

//  Camera Scanner Modal 

interface CameraScannerProps {
  mode: 'barcode' | 'qr';
  onDetect: (code: string) => void;
  onClose: () => void;
}

function CameraScanner({ mode, onDetect, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [phase, setPhase] = useState<'starting' | 'scanning' | 'detected' | 'error'>('starting');
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);
  const [scanKey, setScanKey] = useState(0);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let active = true;
    setPhase('starting');
    setError(null);
    setDetected(null);

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) { stream.getTracks().forEach(t => t.stop()); return; }

        setPhase('scanning');

        // Use @zxing/browser — works on all desktop browsers (no BarcodeDetector needed)
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const codeReader = new BrowserMultiFormatReader();

        const ctrl = await codeReader.decodeFromStream(stream, video, (result) => {
          if (!active || !result) return;
          active = false;
          setDetected(result.getText());
          setPhase('detected');
        });

        if (!active) { ctrl.stop(); return; }
        controlsRef.current = ctrl;
      } catch (err: any) {
        if (!active) return;
        if (err.name === 'NotAllowedError') setError('Akses kamera ditolak. Izinkan akses kamera di pengaturan browser lalu coba lagi.');
        else if (err.name === 'NotFoundError') setError('Kamera tidak ditemukan pada perangkat ini.');
        else setError(`Gagal membuka kamera: ${err.message}`);
        setPhase('error');
      }
    };

    start();
    return () => { active = false; stopCamera(); };
  }, [mode, scanKey, stopCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const handleRescan = () => {
    stopCamera();
    setScanKey(k => k + 1);
  };

  const handleUse = () => {
    if (!detected) return;
    stopCamera();
    onDetect(detected);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            {mode === 'qr' ? <QrCode className="w-5 h-5 text-emerald-600" /> : <ScanBarcode className="w-5 h-5 text-indigo-600" />}
            <span className="text-sm font-semibold text-gray-900">
              {mode === 'qr' ? 'Scan QR Pembeli' : 'Scan Barcode Resi'}
            </span>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Tutup kamera">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black" style={{ height: 300 }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {phase === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                <p className="text-white text-xs">Membuka kamera…</p>
              </div>
            </div>
          )}

          {phase === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br-lg" />
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-green-400 animate-pulse" />
              </div>
              <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs drop-shadow">
                Arahkan ke {mode === 'qr' ? 'QR code' : 'barcode'}
              </p>
            </div>
          )}

          {phase === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="text-center">
                <CameraOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-white text-sm leading-relaxed whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

          {phase === 'detected' && (
            <div className="absolute inset-0 flex items-center justify-center px-6 bg-black/60">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white text-xs mb-1 opacity-70">Terdeteksi:</p>
                <p className="text-white font-mono font-bold text-base tracking-widest break-all">{detected}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex gap-2 bg-white">
          {phase === 'detected' ? (
            <>
              <button onClick={handleRescan} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
                Scan Ulang
              </button>
              <button onClick={handleUse} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-green-600 hover:bg-green-700 transition-colors">
                Gunakan Kode Ini
              </button>
            </>
          ) : (
            <button onClick={handleClose} className="w-full py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Batal / Tutup Kamera
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

//  Order Preview Card 

function OrderCard({
  order, actionLabel, actionColor, actionDisabled, actionLoading, hint, onAction,
}: {
  order: OrderDetail;
  actionLabel: string;
  actionColor: string;
  actionDisabled: boolean;
  actionLoading: boolean;
  hint?: string;
  onAction: () => void;
}) {
  const StatusIcon = STATUS_ICONS[order.status] ?? Package;
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-gray-800">{order.order_code}</span>
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[order.status])}>
          <StatusIcon className="w-3.5 h-3.5" />
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span className="font-medium">{order.buyer_name_snapshot ?? order.buyer_name ?? ''}</span>
          {order.buyer_nim_snapshot && <span className="text-gray-400">({order.buyer_nim_snapshot})</span>}
        </div>
        {order.seller_name && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Store className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span>{order.seller_name}</span>
          </div>
        )}
        {order.items && order.items.length > 0 && (
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <Package className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 mt-0.5" />
            <span className="leading-snug">{order.items.map(i => `${i.product_title_snapshot} (x${i.quantity})`).join(', ')}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
          <span className="text-sm font-bold text-gray-900">{formatIDR(order.total_amount)}</span>
        </div>
      </div>
      {hint && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {hint}
          </div>
        </div>
      )}
      <div className="px-4 pb-4">
        <button
          onClick={onAction}
          disabled={actionDisabled}
          className={cn(
            'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
            actionColor
          )}
        >
          {actionLoading
            ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Memproses...</span>
            : actionLabel}
        </button>
      </div>
    </div>
  );
}

//  Scan Panel Full 

function ScanPanelFull({ mode, onActionDone }: { mode: 'arrive' | 'pickup'; onActionDone: () => void }) {
  const [rawInput, setRawInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isArrive = mode === 'arrive';
  const ScanIcon = isArrive ? ScanBarcode : QrCode;

  const handleInputChange = (val: string) => {
    const formatted = formatOrderCodeInput(val);
    setRawInput(formatted);
    setOrder(null);
    setLookupError(null);
    setActionResult(null);
  };

  const handleLookup = useCallback(async (code: string) => {
    const upperCode = code.toUpperCase();
    if (!isValidOrderCode(upperCode)) {
      setLookupError('Format kode tidak valid. Contoh: LPS-202603-1234');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setOrder(null);
    setActionResult(null);
    try {
      const res = await apiGet<ApiResponse<any>>(`/admin/orders/code/${encodeURIComponent(upperCode)}`, true);
      if (!res.success || !res.data) {
        setLookupError('Kode pesanan tidak ditemukan.');
      } else {
        setOrder(res.data);
      }
    } catch (err: any) {
      setLookupError(err.message ?? 'Gagal mengambil data pesanan.');
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const handleCameraDetect = (detected: string) => {
    const formatted = formatOrderCodeInput(detected);
    setRawInput(formatted);
    setOrder(null);
    setLookupError(null);
    setActionResult(null);
    if (isValidOrderCode(formatted)) handleLookup(formatted);
  };

  const handleAction = async () => {
    if (!order) return;
    setActionLoading(true);
    setActionResult(null);
    try {
      const endpoint = isArrive ? `/orders/${order.id}/arrive` : `/orders/${order.id}/confirm`;
      const res = await apiPost<ApiResponse<any>>(endpoint, {}, true);
      if (!res.success) throw new Error((res as any).message ?? 'Gagal memperbarui status');
      const msg = isArrive
        ? `Pesanan ${order.order_code} ditandai Tiba di Lokasi Pengambilan`
        : `Pesanan ${order.order_code} dikonfirmasi Diambil pembeli`;
      setActionResult({ type: 'success', message: msg });
      setOrder(null);
      setRawInput('');
      onActionDone();
      inputRef.current?.focus();
    } catch (err: any) {
      setActionResult({ type: 'error', message: err.message ?? 'Terjadi kesalahan' });
    } finally {
      setActionLoading(false);
    }
  };

  const requiredStatus = isArrive ? 'SHIPPED' : 'ARRIVED';
  const actionLabel = isArrive ? 'Tandai Pesanan Telah Tiba' : 'Konfirmasi Pesanan Diambil';
  const actionColor = isArrive ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700';
  const actionDisabled = !order || order.status !== requiredStatus || actionLoading;
  const hint = order && order.status !== requiredStatus
    ? (isArrive
        ? `Pesanan harus berstatus "Dikirim" untuk ditandai tiba. Status saat ini: ${STATUS_LABELS[order.status] ?? order.status}`
        : `Pesanan harus berstatus "Tiba di Lokasi Pengambilan" untuk dikonfirmasi. Status saat ini: ${STATUS_LABELS[order.status] ?? order.status}`)
    : undefined;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={cn('px-4 py-3 border-b border-gray-100 flex items-center gap-3', isArrive ? 'bg-indigo-50' : 'bg-emerald-50')}>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', isArrive ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600')}>
          <ScanIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {isArrive ? 'Terima Paket  Resi Seller' : 'Ambil Pesanan  QR Buyer'}
          </p>
          <p className="text-xs text-gray-500">
            {isArrive
              ? 'Scan / input kode resi dari seller  tandai pesanan telah tiba'
              : 'Scan / input QR dari pembeli  konfirmasi pesanan diambil'}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {actionResult && (
          <div className={cn('flex items-start gap-2 p-3 rounded-lg text-sm border', actionResult.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800')}>
            {actionResult.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span className="flex-1 text-xs">{actionResult.message}</span>
            <button onClick={() => setActionResult(null)}><X className="w-3.5 h-3.5 opacity-50 hover:opacity-100" /></button>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600">
            Kode Pesanan <span className="text-gray-400 font-normal">(format: LPS-YYYYMM-XXXX)</span>
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={rawInput}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && rawInput) handleLookup(rawInput); }}
              placeholder="LPS-202603-1234"
              maxLength={15}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50 tracking-widest"
            />
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              title="Scan dengan kamera"
              className={cn('px-3 flex-shrink-0 rounded-xl border transition-colors', isArrive ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50')}
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleLookup(rawInput)}
              disabled={!rawInput || lookupLoading}
              className={cn('px-4 flex-shrink-0 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-40', isArrive ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700')}
            >
              {lookupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Cek'}
            </button>
          </div>
        </div>

        {lookupError && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {lookupError}
          </div>
        )}

        {order && (
          <OrderCard
            order={order}
            actionLabel={actionLabel}
            actionColor={actionColor}
            actionDisabled={actionDisabled}
            actionLoading={actionLoading}
            hint={hint}
            onAction={handleAction}
          />
        )}
      </div>

      {cameraOpen && (
        <CameraScanner
          mode={isArrive ? 'barcode' : 'qr'}
          onDetect={handleCameraDetect}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}

//  Orders Table 

const STATUS_TABS = ['ALL', 'WAITING_PAYMENT', 'PAID_ESCROW', 'PROCESSING', 'SHIPPED', 'ARRIVED', 'COMPLETED', 'CANCELLED'];

function OrdersTable({ refreshKey }: { refreshKey: number }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(async (p: number, status: string, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '25' });
      if (status !== 'ALL') params.append('status', status);
      if (search) params.append('search', search);
      const res = await apiGet<ApiResponse<OrdersResponse>>(`/admin/orders?${params}`, true);
      if (res.success && res.data) {
        setOrders(res.data.orders);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchOrders(page, statusFilter, searchQuery);
  }, [page, statusFilter, searchQuery, fetchOrders, refreshKey]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setSearchQuery(val); }, 500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Kode pesanan, nama pembeli, toko..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
            />
          </div>
          <button
            onClick={() => fetchOrders(page, statusFilter, searchQuery)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn('px-3 py-1 rounded-full text-xs font-medium transition-colors', statusFilter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400">{loading ? 'Memuat...' : `${total.toLocaleString('id-ID')} pesanan`}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left p-3 pl-4 text-xs font-medium text-gray-500 whitespace-nowrap">Kode Pesanan</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">Pembeli</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">Toko</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">Total</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left p-3 text-xs font-medium text-gray-500 whitespace-nowrap">Tgl Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[80, 120, 100, 70, 90, 90].map((w, j) => (
                    <td key={j} className="p-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400 text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Tidak ada pesanan ditemukan
                </td>
              </tr>
            ) : (
              orders.map(order => {
                const Icon = STATUS_ICONS[order.status] ?? Package;
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                    <td className="p-3 pl-4">
                      <span className="font-mono text-xs font-semibold text-gray-800">{order.order_code}</span>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-medium text-gray-800 leading-tight">{order.buyer_name_snapshot ?? order.buyer_name}</p>
                      {order.buyer_nim_snapshot && <p className="text-[11px] text-gray-400">{order.buyer_nim_snapshot}</p>}
                    </td>
                    <td className="p-3">
                      <p className="text-xs text-gray-700">{order.store_name}</p>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <p className="text-xs font-medium text-gray-800">{formatIDR(order.total_amount)}</p>
                    </td>
                    <td className="p-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap', STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600')}>
                        <Icon className="w-3 h-3" />
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="text-[11px] text-gray-400 whitespace-nowrap">{formatDate(order.created_at)}</p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-xs text-gray-500">Hal. {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}

//  Main 

type Tab = 'orders' | 'scan';

export function AdminOrdersClient() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          <List className="w-4 h-4" />
          Daftar Pesanan
        </button>
        <button
          onClick={() => setActiveTab('scan')}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === 'scan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}
        >
          <ClipboardCheck className="w-4 h-4" />
          Input / Scan
        </button>
      </div>

      {activeTab === 'orders' && <OrdersTable refreshKey={refreshKey} />}

      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScanPanelFull mode="arrive" onActionDone={() => setRefreshKey(k => k + 1)} />
          <ScanPanelFull mode="pickup" onActionDone={() => setRefreshKey(k => k + 1)} />
        </div>
      )}
    </div>
  );
}
