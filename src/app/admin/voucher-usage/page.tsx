'use client';

import { useState } from 'react';

interface VoucherUsage {
  id: string;
  voucher_code: string;
  user_name: string;
  order_id: string;
  discount_amount: number;
  order_total: number;
  used_at: string;
}

export default function VoucherUsagePage() {
  const [usages, setUsages] = useState<VoucherUsage[]>([
    {
      id: '1',
      voucher_code: 'NEWYEAR2026',
      user_name: 'John Doe',
      order_id: 'ORD-2026-001',
      discount_amount: 15000,
      order_total: 100000,
      used_at: '2026-01-28T10:30:00',
    },
    {
      id: '2',
      voucher_code: 'FREESHIP',
      user_name: 'Jane Smith',
      order_id: 'ORD-2026-002',
      discount_amount: 15000,
      order_total: 75000,
      used_at: '2026-01-28T14:20:00',
    },
  ]);

  return (
    <div className="space-y-6">


      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Redemptions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{usages.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Discount Given</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            Rp {usages.reduce((sum, u) => sum + u.discount_amount, 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Avg Discount</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            Rp {Math.round(usages.reduce((sum, u) => sum + u.discount_amount, 0) / usages.length).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voucher Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usages.map((usage) => (
              <tr key={usage.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(usage.used_at).toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-blue-600">{usage.voucher_code}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{usage.user_name}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{usage.order_id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Rp {usage.order_total.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-green-600">
                  -Rp {usage.discount_amount.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
