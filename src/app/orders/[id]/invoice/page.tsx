'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types';
import { getOrder } from '@/lib/orders';
import { formatCurrency } from '@/lib/utils';

const BANK_LABEL: Record<string, string> = {
  bca_va: 'BCA Virtual Account', bni_va: 'BNI Virtual Account', bri_va: 'BRI Virtual Account',
  mandiri_va: 'Mandiri Virtual Account', permata_va: 'Permata Virtual Account',
  cimb_va: 'CIMB Niaga Virtual Account', bsi_va: 'BSI Virtual Account',
  seabank_va: 'SeaBank Virtual Account', qris: 'QRIS', shopeepay: 'ShopeePay',
  dana: 'DANA', cod: 'Bayar di Tempat (COD)',
};

const STATUS_LABEL: Record<string, string> = {
  WAITING_PAYMENT:  'Menunggu Pembayaran',
  PAID_ESCROW:      'Menunggu Dikemas',
  PROCESSING:       'Sedang Dikemas',
  SHIPPED:          'Dalam Pengiriman',
  ARRIVED:          'Telah Tiba',
  COMPLETED:        'Lunas / Selesai',
  CANCELLED:        'Dibatalkan',
  REFUND_REQUESTED: 'Refund Diminta',
  REFUNDED:         'Direfund',
};

export default function InvoicePage() {
  const params  = useParams();
  const orderId = params.id as string;
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const [order, setOrder]       = useState<Order | null>(null);
  const [loading, setLoading]   = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || !orderId) return;
    getOrder(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [isLoggedIn, orderId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-sm">Memuat invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-sm">Invoice tidak ditemukan.</p>
      </div>
    );
  }

  const method    = order.payment_method ?? '';
  const methodLb  = BANK_LABEL[method] ?? (method ? method.toUpperCase() : '—');
  const isCOD     = method === 'cod';
  const statusLb  = STATUS_LABEL[order.status] ?? order.status;
  const buyerName = order.buyer_name_snapshot || order.buyer_name || order.buyer?.full_name || '—';
  const sellerName = order.seller_name_snapshot || order.seller_name || order.seller?.full_name || '—';
  const subtotal  = order.product_amount ?? order.total_amount;
  const voucher   = order.voucher_discount_amount ?? 0;
  const delivery  = order.delivery_fee ?? 0;
  const svc       = order.service_fee ?? 0;
  const pmFee     = order.payment_method_fee ?? 0;
  const isPaid    = ['PAID_ESCROW', 'PROCESSING', 'SHIPPED', 'ARRIVED', 'COMPLETED'].includes(order.status);

  const qrData = JSON.stringify({
    kode: order.order_code,
    total: order.total_amount,
    pembeli: buyerName,
    penjual: sellerName,
    tanggal: order.created_at,
    status: order.status,
  });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&format=png&data=${encodeURIComponent(qrData)}`;

  const downloadPdf = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

      const pageW  = 210;
      const mL     = 15;
      const mR     = 15;
      const cW     = pageW - mL - mR;
      let   y      = 15;

      // ── Fetch logo upfront ─────────────────────────────────────────────
      let logoDataUrl: string | null = null;
      let logoAspect = 2.5;
      try {
        const logoRes  = await fetch('/images/logo.png');
        const logoBlob = await logoRes.blob();
        logoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
        const img = new window.Image();
        img.src = logoDataUrl;
        await new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); });
        if (img.naturalWidth > 0) logoAspect = img.naturalWidth / img.naturalHeight;
      } catch {
        // fall back to text
      }

      // ── Header ──────────────────────────────────────────────────────────
      if (logoDataUrl) {
        const logoH = 14;
        const logoW = logoAspect * logoH;
        doc.addImage(logoDataUrl, 'PNG', mL, y - 3, logoW, logoH);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140);
        doc.text('Platform Marketplace STIKOM Yos Sudarso', mL, y + 13);
        doc.setTextColor(0);
      } else {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text('LAPAK STIKOM', mL, y);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140);
        doc.text('Platform Marketplace STIKOM Yos Sudarso', mL, y + 5);
        doc.setTextColor(0);
      }

      // Right: INVOICE + order_code + date + status pill
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageW - mR, y, { align: 'right' });
      doc.setFontSize(10);
      doc.text(order.order_code, pageW - mR, y + 7, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(140);
      doc.text(createdDate, pageW - mR, y + 13, { align: 'right' });
      doc.setTextColor(0);

      // Status pill — match web: COD → amber, paid non-COD → green, else → gray
      const pillLabel = isCOD ? 'Pembayaran Tunai' : isPaid ? 'LUNAS' : statusLb;
      const [pr, pg, pb] = isCOD ? [255, 243, 205] : isPaid ? [220, 255, 220] : [240, 240, 240];
      const [tr, tg, tb] = isCOD ? [180, 83, 9]   : isPaid ? [22, 100, 22]   : [80, 80, 80];
      doc.setFillColor(pr, pg, pb);
      doc.roundedRect(pageW - mR - 32, y + 16, 32, 7, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(tr, tg, tb);
      doc.text(pillLabel, pageW - mR - 16, y + 21, { align: 'center' });
      doc.setTextColor(0);

      y += 32;

      // ── Separator ─────────────────────────────────────────────────────
      doc.setDrawColor(20);
      doc.setLineWidth(0.5);
      doc.line(mL, y, pageW - mR, y);
      y += 7;

      // ── 2×2 info grid ─────────────────────────────────────────────────
      const colW = cW / 2 - 4;
      const c1 = mL;
      const c2 = mL + cW / 2 + 4;

      const labelStyle = () => {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(150);
      };
      const valueStyle = () => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
      };
      const subStyle = () => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
      };

      // Pemesan (col 1)
      labelStyle(); doc.text('PEMESAN', c1, y);
      let r1y = y + 5;
      valueStyle(); doc.text(buyerName, c1, r1y); r1y += 5;
      subStyle();
      if (order.buyer_phone_snapshot) { doc.text(order.buyer_phone_snapshot, c1, r1y); r1y += 4; }
      if (order.buyer_prodi_snapshot) { doc.text(order.buyer_prodi_snapshot, c1, r1y); r1y += 4; }
      if (order.buyer_nim_snapshot)   { doc.text('NIM: ' + order.buyer_nim_snapshot, c1, r1y); r1y += 4; }
      doc.setTextColor(0);

      // Lokasi Pengambilan (col 2)
      let r2y = y;
      labelStyle(); doc.text('LOKASI PENGAMBILAN', c2, r2y); r2y += 5;
      subStyle();
      const addrLines = doc.splitTextToSize(order.shipping_address || '—', colW);
      doc.text(addrLines, c2, r2y); r2y += addrLines.length * 4 + 4;
      doc.setTextColor(0);

      // Row 2 starts after the taller of the two columns
      y = Math.max(r1y, r2y) + 3;

      // Penjual (col 1)
      labelStyle(); doc.text('PENJUAL', c1, y);
      let s1y = y + 5;
      valueStyle(); doc.text(sellerName, c1, s1y); s1y += 5;

      // Metode Pembayaran (col 2)
      let s2y = y;
      labelStyle(); doc.text('METODE PEMBAYARAN', c2, s2y); s2y += 5;
      subStyle(); doc.text(methodLb, c2, s2y); s2y += 5;
      doc.setTextColor(0);

      y = Math.max(s1y, s2y) + 5;

      // ── Items table ────────────────────────────────────────────────────
      doc.setDrawColor(20);
      doc.setLineWidth(0.5);
      doc.line(mL, y, pageW - mR, y);
      y += 5;

      // Table header
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50);
      doc.text('Produk', mL, y);
      doc.text('Qty', mL + cW * 0.57, y, { align: 'center' });
      doc.text('Harga Satuan', mL + cW * 0.76, y, { align: 'right' });
      doc.text('Subtotal', pageW - mR, y, { align: 'right' });
      y += 4;
      doc.setLineWidth(0.3);
      doc.line(mL, y, pageW - mR, y);
      y += 4;
      doc.setTextColor(0);

      // Table rows
      for (const item of order.items ?? []) {
        const nameLines = doc.splitTextToSize(item.product_title_snapshot, cW * 0.52);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text(nameLines, mL, y);

        const vars = item.variations;
        let varLine = '';
        if (vars && Object.keys(vars).length > 0) {
          varLine = Object.entries(vars).map(([k, v]) => `${k}: ${v}`).join(' · ');
        }
        const extraRows = varLine ? 1 : 0;
        if (varLine) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(130);
          doc.text(varLine, mL, y + nameLines.length * 4);
          doc.setTextColor(0);
        }

        const rowH = (nameLines.length + extraRows) * 4 + 2;
        const midY = y + rowH / 2;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(String(item.quantity), mL + cW * 0.57, midY, { align: 'center' });
        doc.text(formatCurrency(item.price_snapshot), mL + cW * 0.76, midY, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(item.subtotal), pageW - mR, midY, { align: 'right' });

        y += rowH;
        doc.setDrawColor(210);
        doc.setLineWidth(0.2);
        doc.line(mL, y, pageW - mR, y);
        y += 4;
      }

      y += 4;

      // ── Totals ─────────────────────────────────────────────────────────
      const tLX = pageW - mR - 75;
      const addRow = (label: string, value: string, bold = false, rgb?: [number, number, number]) => {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setTextColor(...(rgb ?? [80, 80, 80]));
        doc.text(label, tLX, y);
        doc.text(value, pageW - mR, y, { align: 'right' });
        doc.setTextColor(0);
        y += 5;
      };

      addRow('Subtotal Produk', formatCurrency(subtotal));
      if (voucher  > 0) addRow('Diskon Voucher',   `- ${formatCurrency(voucher)}`,  false, [10, 150, 10]);
      if (delivery > 0) addRow('Ongkos Kirim',      formatCurrency(delivery));
      if (svc      > 0) addRow('Biaya Layanan',      formatCurrency(svc));
      if (pmFee    > 0) addRow('Biaya Pembayaran',   formatCurrency(pmFee));

      doc.setDrawColor(20);
      doc.setLineWidth(0.5);
      doc.line(tLX, y, pageW - mR, y);
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text('Total Pembayaran', tLX, y);
      doc.text(formatCurrency(order.total_amount), pageW - mR, y, { align: 'right' });
      y += 10;

      // ── QR Code ────────────────────────────────────────────────────────
      try {
        const qrRes = await fetch(qrUrl);
        const qrBlob = await qrRes.blob();
        const qrDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(qrBlob);
        });
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(130);
        doc.text('QR PENGAMBILAN PESANAN', mL, y);
        y += 3;
        doc.addImage(qrDataUrl, 'PNG', mL, y, 30, 30);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(order.order_code, mL, y + 33);
        doc.setTextColor(0);
      } catch {
        // QR image fetch failed — skip silently
      }

      // ── Footer ─────────────────────────────────────────────────────────
      const footerY = 285;
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      doc.line(mL, footerY, pageW - mR, footerY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150);
      doc.text(
        `Dokumen ini diterbitkan secara otomatis oleh sistem LapakSTIKOM \u2022 ${createdDate}`,
        pageW / 2, footerY + 4, { align: 'center' }
      );
      doc.text('@2026 LapakSTIKOM. All rights reserved.', pageW / 2, footerY + 8, { align: 'center' });

      doc.save(`Invoice-${order.order_code}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const createdDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <>
      {/* Screen toolbar — hidden on print */}
      <div className="print:hidden bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center justify-between no-print">
        <p className="text-sm font-semibold text-gray-700">
          Invoice — <span className="font-mono">{order.order_code}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={downloadPdf}
            disabled={downloading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {downloading ? 'Mengunduh...' : 'Unduh PDF'}
          </button>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Invoice content */}
      <div className="bg-white min-h-screen p-10 max-w-3xl mx-auto text-gray-900 text-sm font-sans" id="invoice-content">
        {/* Header */}
        <div className="flex justify-between items-start pb-5 mb-6 border-b-2 border-gray-800">
          <div className="flex flex-col items-start gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="LapakSTIKOM" className="h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <p className="text-xs text-gray-400 mt-1">Platform Marketplace STIKOM Yos Sudarso</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-gray-900 tracking-tight">INVOICE</p>
            <p className="font-mono font-bold text-base mt-0.5">{order.order_code}</p>
            <p className="text-xs text-gray-500 mt-0.5">{createdDate}</p>
            <div className="mt-1.5">
              {isCOD ? (
                <span className="inline-block px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">
                  Pembayaran Tunai
                </span>
              ) : isPaid ? (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                  Lunas
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  {statusLb}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4-section 2×2 info grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-6">
          {/* Pemesan */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pemesan</p>
            <p className="font-semibold text-gray-900">{buyerName}</p>
            {order.buyer_phone_snapshot && <p className="text-xs text-gray-500 mt-0.5">{order.buyer_phone_snapshot}</p>}
            {order.buyer_prodi_snapshot && <p className="text-xs text-gray-500">{order.buyer_prodi_snapshot}</p>}
            {order.buyer_nim_snapshot && <p className="text-xs text-gray-500">NIM: {order.buyer_nim_snapshot}</p>}
          </div>

          {/* Lokasi Pengambilan */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Lokasi Pengambilan</p>
            {order.shipping_address ? (
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{order.shipping_address}</p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </div>

          {/* Penjual */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Penjual</p>
            <p className="font-semibold text-gray-900">{sellerName}</p>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Metode Pembayaran</p>
            <p className="text-xs text-gray-700">{methodLb}</p>
          </div>
        </div>

        {/* Items table */}
        <table className="w-full mb-6 border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2.5 font-bold text-gray-700">Produk</th>
              <th className="text-center py-2.5 font-bold text-gray-700 w-16">Qty</th>
              <th className="text-right py-2.5 font-bold text-gray-700 w-28">Harga Satuan</th>
              <th className="text-right py-2.5 font-bold text-gray-700 w-28">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={item.id ?? idx} className="border-b border-gray-100">
                <td className="py-2.5">
                  <p className="font-semibold text-gray-900">{item.product_title_snapshot}</p>
                  {item.variations && Object.keys(item.variations).length > 0 && (
                    <p className="text-gray-400 text-[10px] mt-0.5">
                      {Object.entries(item.variations).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </td>
                <td className="py-2.5 text-center text-gray-700">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-700">{formatCurrency(item.price_snapshot)}</td>
                <td className="py-2.5 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + QR */}
        <div className="flex justify-between items-start gap-8">
          <div className="flex-shrink-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">QR Pengambilan Pesanan</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR" width={120} height={120} className="border border-gray-200 rounded-lg" />
            <p className="text-[9px] text-gray-400 mt-1 font-mono">{order.order_code}</p>
          </div>

          <div className="flex-1 max-w-xs space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal Produk</span>
              <span className="text-gray-800">{formatCurrency(subtotal)}</span>
            </div>
            {voucher > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Diskon Voucher</span>
                <span>- {formatCurrency(voucher)}</span>
              </div>
            )}
            {delivery > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Ongkos Kirim</span>
                <span className="text-gray-800">{formatCurrency(delivery)}</span>
              </div>
            )}
            {svc > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Biaya Layanan</span>
                <span className="text-gray-800">{formatCurrency(svc)}</span>
              </div>
            )}
            {pmFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Biaya Pembayaran</span>
                <span className="text-gray-800">{formatCurrency(pmFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-2 border-t-2 border-gray-800">
              <span className="text-gray-900">Total Pembayaran</span>
              <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-400">
            Dokumen ini diterbitkan secara otomatis oleh sistem LapakSTIKOM &bull; {createdDate}
          </p>
          <p className="text-[10px] text-gray-300 mt-0.5">
            @2026 LapakSTIKOM. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          #invoice-content { max-width: 100%; margin: 0; padding: 24px; }
        }
      `}</style>
    </>
  );
}
