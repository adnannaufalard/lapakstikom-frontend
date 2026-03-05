'use client';

import { useState } from 'react';
import { Button, Alert } from '@/components/ui';

interface Voucher {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([
    {
      id: '1',
      code: 'NEWYEAR2026',
      discount_type: 'PERCENTAGE',
      discount_value: 15,
      min_purchase: 100000,
      max_discount: 50000,
      usage_limit: 100,
      used_count: 23,
      valid_from: '2026-01-01',
      valid_until: '2026-02-01',
      is_active: true,
    },
    {
      id: '2',
      code: 'FREESHIP',
      discount_type: 'FIXED',
      discount_value: 15000,
      min_purchase: 50000,
      usage_limit: 500,
      used_count: 234,
      valid_from: '2026-01-01',
      valid_until: '2026-12-31',
      is_active: true,
    },
  ]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vouchers Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discount vouchers</p>
        </div>
        <Button onClick={() => setShowForm(true)}>Create New Voucher</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Vouchers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{vouchers.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Vouchers</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {vouchers.filter(v => v.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Uses</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {vouchers.reduce((sum, v) => sum + v.used_count, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Available Slots</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {vouchers.reduce((sum, v) => sum + (v.usage_limit - v.used_count), 0)}
          </p>
        </div>
      </div>

      {/* Vouchers List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Purchase</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {vouchers.map((voucher) => (
              <tr key={voucher.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-gray-900">{voucher.code}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {voucher.discount_type === 'PERCENTAGE' 
                    ? `${voucher.discount_value}%`
                    : `Rp ${voucher.discount_value.toLocaleString('id-ID')}`
                  }
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  Rp {voucher.min_purchase.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {voucher.used_count} / {voucher.usage_limit}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(voucher.valid_until).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    voucher.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {voucher.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
