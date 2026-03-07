'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { apiPost } from '@/lib/api';
import { getSellerOrders, packageOrder } from '@/lib/orders';
import { formatCurrency, formatDate } from '@/lib/utils';
import Barcode from 'react-barcode';
import {
  Package, Truck, CheckCircle, XCircle, RefreshCw,
  Eye, Printer, Download, ChevronLeft, ChevronRight,
  User, MapPin, CreditCard, Box, ArrowRight, MessageSquare, Search,
} from 'lucide-react';

/* --- constants ------------------------------------------------ */

const TABS = [
  { key: 'PAID_ESCROW',               label: 'Pesanan Masuk', icon: <Box className="w-4 h-4" /> },
  { key: 'PROCESSING',                label: 'Dikemas',       icon: <Package className="w-4 h-4" /> },
  { key: 'SHIPPED',                   label: 'Dikirim',       icon: <Truck className="w-4 h-4" /> },
  { key: 'COMPLETED',                 label: 'Selesai',       icon: <CheckCircle className="w-4 h-4" /> },
  { key: 'REFUND_REQUESTED,REFUNDED', label: 'Dikembalikan',  icon: <RefreshCw className="w-4 h-4" /> },
  { key: 'CANCELLED',                 label: 'Dibatalkan',    icon: <XCircle className="w-4 h-4" /> },
] as const;

const STATUS_BADGE: Record<string, string> = {
  PAID_ESCROW:      'bg-amber-100 text-amber-700',
  PROCESSING:       'bg-purple-100 text-purple-700',
  SHIPPED:          'bg-blue-100 text-blue-700',
  COMPLETED:        'bg-emerald-100 text-emerald-700',
  REFUND_REQUESTED: 'bg-orange-100 text-orange-700',
  REFUNDED:         'bg-gray-100 text-gray-500',
  CANCELLED:        'bg-red-100 text-red-600',
};
const STATUS_LABEL: Record<string, string> = {
  PAID_ESCROW:      'Menunggu Proses',
  PROCESSING:       'Dikemas',
  SHIPPED:          'Dikirim',
  COMPLETED:        'Selesai',
  REFUND_REQUESTED: 'Refund',
  REFUNDED:         'Direfund',
  CANCELLED:        'Dibatalkan',
};

const PAYMENT_LABEL: Record<string, string> = {
  bca_va: 'BCA Virtual Account', bni_va: 'BNI Virtual Account',
  bri_va: 'BRI Virtual Account', mandiri_va: 'Mandiri Virtual Account',
  permata_va: 'Permata VA', cimb_va: 'CIMB VA', bsi_va: 'BSI VA',
  qris: 'QRIS', shopeepay: 'ShopeePay', gopay: 'GoPay', cod: 'Bayar di Tempat',
};

const COURIERS = ['JNE', 'J&T Express', 'SiCepat', 'Anteraja', 'Ninja Express', 'Pos Indonesia', 'Manual / Ambil Sendiri'];

/* --- Resi Print template ------------------------------------- */

function ResiPrintContent({ order }: { order: Order }) {
  const buyerName = order.buyer_name_snapshot || order.buyer?.full_name || '-';
  return (
    <div id="resi-print-content" style={{ fontFamily: 'sans-serif', color: '#111', padding: '24px', width: '320px' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ fontWeight: 900, fontSize: '18px', margin: 0, letterSpacing: '-0.5px' }}>LAPAK STIKOM</p>
        <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0' }}>Official Marketplace STIKOM Yos Sudarso</p>
      </div>
      <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '12px 0', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <Barcode
            value={order.order_code}
            width={1.5}
            height={50}
            fontSize={10}
            displayValue={false}
          />
        </div>
        <p style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', letterSpacing: '2px', margin: '8px 0 0' }}>{order.order_code}</p>
      </div>
      <div style={{ fontSize: '12px', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Penerima</p>
        <p style={{ fontWeight: 600, margin: '0 0 6px' }}>{buyerName}</p>
        {order.buyer_phone_snapshot && (
          <>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Telepon</p>
            <p style={{ margin: '0 0 6px' }}>{order.buyer_phone_snapshot}</p>
          </>
        )}
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Lokasi Pengambilan</p>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{order.shipping_address || '-'}</p>
      </div>
      <div style={{ borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px' }}>Produk</p>
        {(order.items ?? []).map(item => {
          const variantStr = item.variations && Object.keys(item.variations).length > 0
            ? Object.entries(item.variations as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(', ')
            : null;
          return (
            <div key={item.id} style={{ marginBottom: '5px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ flex: 1, marginRight: '8px', fontWeight: 600 }}>{item.product_title_snapshot}</span>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>{formatCurrency(item.subtotal)}</span>
              </div>
              {variantStr && <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#888' }}>{variantStr}</p>}
              <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#666' }}>Qty: {item.quantity}</p>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
          <span>Total Produk</span>
          <span>{formatCurrency(order.product_amount ?? order.total_amount)}</span>
        </div>
      </div>
      {order.payment_method && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ccc', fontSize: '12px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px' }}>Metode Pembayaran</p>
          <p style={{ margin: 0, fontWeight: 600 }}>{PAYMENT_LABEL[order.payment_method] ?? order.payment_method}</p>
        </div>
      )}
      <p style={{ textAlign: 'center', fontSize: '10px', color: '#aaa', marginTop: '12px' }}>{formatDate(order.created_at)}</p>
    </div>
  );
}

/* --- Detail + action modal ----------------------------------- */

function OrderDetailModal({
  order,
  onClose,
  onPackaged,
  onShipped,
}: {
  order: Order;
  onClose: () => void;
  onPackaged: (updated: Order) => void;
  onShipped: (updated: Order) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [showShipForm, setShowShipForm] = useState(false);
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [shipping, setShipping] = useState(false);
  const [err, setErr] = useState('');
  const [view, setView] = useState<'detail' | 'resi'>('detail');
  const resiRef = useRef<HTMLDivElement>(null);

  const buyerName = order.buyer_name_snapshot || order.buyer?.full_name || '-';
  const productTotal = order.product_amount ?? (order.items ?? []).reduce((s, i) => s + i.subtotal, 0);
  const buyerNote = order.buyer_note || order.notes;

  const handlePackage = async () => {
    setProcessing(true);
    setErr('');
    try {
      const updated = await packageOrder(order.id);
      // Merge with current order to preserve items/buyer snapshots the API may not return
      onPackaged({ ...order, ...updated, items: updated.items?.length ? updated.items : order.items });
      setView('resi');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal memproses pesanan');
    } finally {
      setProcessing(false);
    }
  };

  const handleShip = async () => {
    if (!courier || !tracking) return;
    setShipping(true);
    setErr('');
    try {
      await apiPost(`/orders/${order.id}/ship`, { courier, tracking_number: tracking });
      const updated = { ...order, status: 'SHIPPED' as const, courier, tracking_number: tracking };
      onShipped(updated as Order);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal mengirim pesanan');
    } finally {
      setShipping(false);
    }
  };

  const handlePrint = () => {
    const printContents = document.getElementById('resi-print-content')?.innerHTML;
    if (!printContents) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Resi ${order.order_code}</title>
      <style>*{box-sizing:border-box}body{font-family:sans-serif;margin:0}</style>
      </head><body>${printContents}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDownload = async () => {
    const { default: jsPDF } = await import('jspdf');
    const JsBarcode = (await import('jsbarcode')).default;

    // Generate barcode as canvas data URL
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, order.order_code, { format: 'CODE128', width: 2, height: 60, displayValue: false, margin: 0 });
    const barcodeDataUrl = canvas.toDataURL('image/png');
    const barcodeAspect = canvas.height > 0 ? canvas.width / canvas.height : 3;
    const barcodeW = 60;
    const barcodeH = barcodeW / barcodeAspect;

    const doc = new jsPDF({ unit: 'mm', format: [80, 200], orientation: 'portrait' });
    const buyerN = order.buyer_name_snapshot || order.buyer?.full_name || '-';
    let y = 10;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LAPAK STIKOM', 40, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Official Marketplace STIKOM Yos Sudarso', 40, y, { align: 'center' });
    y += 6;

    // Barcode
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);
    y += 4;
    doc.addImage(barcodeDataUrl, 'PNG', (80 - barcodeW) / 2, y, barcodeW, barcodeH);
    y += barcodeH + 5;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(order.order_code, 40, y, { align: 'center' });
    y += 7;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);
    y += 5;

    // Buyer info
    const label = (txt: string) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(150); doc.text(txt, 5, y); y += 4; };
    const value = (txt: string) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0); const lines = doc.splitTextToSize(txt, 68); doc.text(lines, 5, y); y += lines.length * 4 + 2; };
    const valueBold = (txt: string) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0); const lines = doc.splitTextToSize(txt, 68); doc.text(lines, 5, y); y += lines.length * 4 + 2; };

    label('PENERIMA'); valueBold(buyerN);
    if (order.buyer_phone_snapshot) { label('TELEPON'); value(order.buyer_phone_snapshot); }
    label('LOKASI PENGAMBILAN'); value(order.shipping_address || '-');

    // Products
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);
    y += 5;
    label('PRODUK');
    doc.setTextColor(0);

    (order.items ?? []).forEach(item => {
      const variantStr = item.variations && Object.keys(item.variations).length > 0
        ? Object.entries(item.variations as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(', ')
        : null;
      const price = formatCurrency(item.subtotal);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0);
      const tLines = doc.splitTextToSize(item.product_title_snapshot, 50);
      doc.text(tLines, 5, y);
      doc.text(price, 75, y, { align: 'right' });
      y += tLines.length * 3.5 + 1;
      if (variantStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120);
        doc.text(variantStr, 5, y);
        y += 4;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text(`Qty: ${item.quantity}`, 5, y);
      y += 5;
      doc.setTextColor(0);
    });

    doc.setLineDashPattern([], 0);
    doc.line(5, y, 75, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text('Total Produk', 5, y);
    doc.text(formatCurrency(order.product_amount ?? order.total_amount), 75, y, { align: 'right' });
    y += 6;

    // Payment method
    if (order.payment_method) {
      doc.setLineDashPattern([1, 1], 0);
      doc.line(5, y, 75, y);
      y += 5;
      label('METODE PEMBAYARAN');
      value(PAYMENT_LABEL[order.payment_method] ?? order.payment_method);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(formatDate(order.created_at), 40, y, { align: 'center' });

    doc.save(`resi-${order.order_code}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {view === 'resi' ? 'Resi Pengiriman' : 'Detail Pesanan'}
            </p>
            <p className="text-xs text-gray-400 font-mono">{order.order_code}</p>
          </div>
          <div className="flex items-center gap-2">
            {(order.status === 'PROCESSING' || view === 'resi') && (
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs">
                <button onClick={() => setView('detail')}
                  className={`px-3 py-1.5 font-medium transition-colors ${view === 'detail' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  Detail
                </button>
                <button onClick={() => setView('resi')}
                  className={`px-3 py-1.5 font-medium transition-colors ${view === 'resi' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  Resi
                </button>
              </div>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {view === 'resi' ? (
            <div className="flex flex-col items-center py-4">
              <div ref={resiRef}>
                <ResiPrintContent order={order} />
              </div>
              <div className="flex gap-3 px-5 pb-4 w-full">
                <button onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Printer className="w-4 h-4" /> Cetak
                </button>
                <button onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                  <Download className="w-4 h-4" /> Unduh PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5">
              {/* Buyer info */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Informasi Pembeli</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3.5 space-y-1.5">
                  <p className="font-semibold text-sm text-gray-900">{buyerName}</p>
                  {order.buyer_phone_snapshot && <p className="text-xs text-gray-500">{order.buyer_phone_snapshot}</p>}
                  {order.buyer_prodi_snapshot && (
                    <p className="text-xs text-gray-500">
                      {order.buyer_prodi_snapshot}{order.buyer_nim_snapshot ? ` - ${order.buyer_nim_snapshot}` : ''}
                    </p>
                  )}
                </div>
              </section>

              {/* Address */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lokasi Pengambilan</p>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3.5 leading-relaxed whitespace-pre-line">{order.shipping_address || '-'}</p>
              </section>

              {/* Buyer note */}
              {buyerNote && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Catatan dari Pembeli</p>
                  </div>
                  <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl p-3.5 leading-relaxed whitespace-pre-line">{buyerNote}</p>
                </section>
              )}

              {/* Products */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Box className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produk</p>
                </div>
                <div className="space-y-2">
                  {(order.items ?? []).map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <div className="w-11 h-11 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.product_image_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={item.product_image_url} alt={item.product_title_snapshot} className="w-full h-full object-cover" />
                          : <Box className="w-5 h-5 text-gray-300" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.product_title_snapshot}</p>
                        {item.variations && Object.keys(item.variations).length > 0 && (
                          <p className="text-[10px] text-gray-400">
                            {Object.entries(item.variations as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(' - ')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">x{item.quantity} @ {formatCurrency(item.price_snapshot)}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Total Produk</span>
                  <span className="text-base font-bold text-blue-600">{formatCurrency(productTotal)}</span>
                </div>
              </section>

              {/* Payment method */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metode Pembayaran</p>
                </div>
                <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-xl px-3.5 py-2.5">
                  {order.payment_method ? (PAYMENT_LABEL[order.payment_method] ?? order.payment_method) : '-'}
                </p>
              </section>

              {/* Tracking info (if shipped) */}
              {order.tracking_number && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Info Pengiriman</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5">
                    <p className="text-xs text-blue-500 font-semibold">{order.courier}</p>
                    <p className="text-sm font-mono font-bold text-blue-700">{order.tracking_number}</p>
                  </div>
                </section>
              )}

              {err && <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}
            </div>
          )}
        </div>

        {/* Action footer */}
        {view === 'detail' && (
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
            {order.status === 'PAID_ESCROW' && (
              <button onClick={handlePackage} disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                <Package className="w-4 h-4" />
                {processing ? 'Memproses...' : 'Tandai Dikemas'}
              </button>
            )}
            {order.status === 'PROCESSING' && !showShipForm && (
              <button onClick={() => setShowShipForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
                <Truck className="w-4 h-4" /> Konfirmasi Kirim
              </button>
            )}
            {order.status === 'PROCESSING' && showShipForm && (
              <div className="space-y-3">
                <select value={courier} onChange={e => setCourier(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50">
                  <option value="">Pilih kurir...</option>
                  {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" value={tracking} onChange={e => setTracking(e.target.value)}
                  placeholder="Nomor resi / kode pickup"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                <div className="flex gap-2">
                  <button onClick={() => setShowShipForm(false)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Batal
                  </button>
                  <button onClick={handleShip} disabled={!courier || !tracking || shipping}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
                    <ArrowRight className="w-4 h-4" />
                    {shipping ? 'Mengirim...' : 'Konfirmasi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Minimalist order card ------------------------------------ */

function OrderCard({ order, onView }: { order: Order; onView: (o: Order) => void }) {
  const items = order.items ?? [];
  const firstItem = items[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Product thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-100">
          {firstItem?.product_image_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={firstItem.product_image_url} alt={firstItem.product_title_snapshot} className="w-full h-full object-cover" />
            : <Box className="w-5 h-5 text-gray-300" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-mono text-xs font-bold text-gray-700 truncate">{order.order_code}</p>
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
          {/* Products list */}
          <div className="space-y-0.5">
            {items.slice(0, 2).map(item => (
              <p key={item.id} className="text-xs text-gray-600 truncate">
                {item.product_title_snapshot}
                {item.variations && Object.keys(item.variations).length > 0 && (
                  <span className="text-gray-400"> - {Object.entries(item.variations as Record<string, string>).map(([, v]) => v).join(', ')}</span>
                )}
                <span className="text-gray-400"> x{item.quantity}</span>
              </p>
            ))}
            {items.length > 2 && (
              <p className="text-[11px] text-gray-400">+{items.length - 2} produk lainnya</p>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{formatDate(order.created_at)}</p>
        </div>

        {/* Action */}
        <button onClick={() => onView(order)}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Eye className="w-3.5 h-3.5" /> Lihat
        </button>
      </div>
    </div>
  );
}

/* --- Main page ----------------------------------------------- */

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('PAID_ESCROW');
  const [orders, setOrders]       = useState<Order[]>([]);
  const [counts, setCounts]       = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push('/login?redirect=/dashboard/orders');
    else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') router.push('/');
  }, [authLoading, isLoggedIn, user, router]);

  // Debounce search input — wait until user stops typing (500ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!isLoggedIn) return;
    TABS.forEach(async (t) => {
      try {
        const res = await getSellerOrders({ status: t.key, limit: 1 });
        setCounts(c => ({ ...c, [t.key]: res.meta.total }));
      } catch { /* ignore */ }
    });
  }, [isLoggedIn]);

  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError('');
    try {
      const res = await getSellerOrders({
        // When searching, remove the status filter so results span all tabs
        ...(searchQuery ? {} : { status: activeTab }),
        page,
        limit: 15,
        ...(searchQuery ? { search: searchQuery } : {}),
      });
      setOrders(res.data);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Gagal memuat pesanan.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, activeTab, page, searchQuery]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handlePackaged = (updated: Order) => {
    setSelectedOrder(updated);
    setCounts(c => ({
      ...c,
      PAID_ESCROW: Math.max(0, (c['PAID_ESCROW'] ?? 1) - 1),
      PROCESSING: (c['PROCESSING'] ?? 0) + 1,
    }));
    if (activeTab === 'PAID_ESCROW') {
      setOrders(prev => prev.filter(o => o.id !== updated.id));
    }
  };

  const handleShipped = (updated: Order) => {
    setSelectedOrder(null);
    setCounts(c => ({
      ...c,
      PROCESSING: Math.max(0, (c['PROCESSING'] ?? 1) - 1),
      SHIPPED: (c['SHIPPED'] ?? 0) + 1,
    }));
    if (activeTab === 'PROCESSING') {
      setOrders(prev => prev.filter(o => o.id !== updated.id));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (!user || user.role !== 'UKM_OFFICIAL') return null;

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      {error && (
        <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Cari kode pesanan di semua status..."
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs — dimmed while searching to hint that filter is bypassed */}
      <div className={`flex gap-0.5 overflow-x-auto mb-4 bg-gray-100 rounded-xl p-1 transition-opacity ${searchQuery ? 'opacity-40 pointer-events-none' : ''}`}>
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => { setActiveTab(t.key); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.icon}
            {t.label}
            {!!counts[t.key] && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>
      {searchQuery && (
        <p className="text-xs text-blue-600 mb-3 flex items-center gap-1.5">
          <Search className="w-3 h-3" />
          Menampilkan hasil dari semua status untuk <span className="font-semibold">&ldquo;{searchQuery}&rdquo;</span>
        </p>
      )}

      {/* Orders list */}
      {loading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
                <div className="h-7 w-14 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <Box className="w-10 h-10 mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-500">Tidak ada pesanan</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onView={o => setSelectedOrder(o)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-5">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-500 tabular-nums">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPackaged={handlePackaged}
          onShipped={handleShipped}
        />
      )}
    </UkmDashboardLayout>
  );
}