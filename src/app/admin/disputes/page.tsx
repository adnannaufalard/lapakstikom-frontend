'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface Dispute {
  id: string;
  dispute_number: string;
  order_id: string;
  buyer_name: string;
  seller_name: string;
  reason: string;
  amount: number;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  evidence_count: number;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: '1',
      dispute_number: 'DSP-2026-001',
      order_id: 'ORD-2026-045',
      buyer_name: 'John Doe',
      seller_name: 'UKM Tech Store',
      reason: 'Product not as described',
      amount: 250000,
      status: 'PENDING',
      created_at: '2026-01-28',
      evidence_count: 3,
    },
    {
      id: '2',
      dispute_number: 'DSP-2026-002',
      order_id: 'ORD-2026-038',
      buyer_name: 'Jane Smith',
      seller_name: 'UKM Fashion Hub',
      reason: 'Item never arrived',
      amount: 150000,
      status: 'INVESTIGATING',
      created_at: '2026-01-27',
      evidence_count: 2,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transaction Disputes</h1>
        <p className="text-gray-600 mt-1">Handle buyer-seller disputes and conflicts</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {disputes.filter(d => d.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Under Investigation</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {disputes.filter(d => d.status === 'INVESTIGATING').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Resolved This Month</p>
          <p className="text-2xl font-bold text-green-600 mt-1">12</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            Rp {disputes.reduce((sum, d) => sum + d.amount, 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dispute #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evidence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {dispute.dispute_number}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-blue-600">
                  {dispute.order_id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{dispute.buyer_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{dispute.seller_name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{dispute.reason}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  Rp {dispute.amount.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {dispute.evidence_count} files
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(dispute.status)}`}>
                    {dispute.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Review
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
