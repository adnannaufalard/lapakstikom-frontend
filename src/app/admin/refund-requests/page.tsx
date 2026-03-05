'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface RefundRequest {
  id: string;
  request_number: string;
  order_id: string;
  user_name: string;
  seller_name: string;
  product_name: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  created_at: string;
  evidence_url?: string;
}

export default function RefundRequestsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([
    {
      id: '1',
      request_number: 'RFD-2026-001',
      order_id: 'ORD-2026-050',
      user_name: 'John Doe',
      seller_name: 'UKM Tech Store',
      product_name: 'Wireless Mouse',
      amount: 125000,
      reason: 'Product defective',
      status: 'PENDING',
      created_at: '2026-01-28',
    },
    {
      id: '2',
      request_number: 'RFD-2026-002',
      order_id: 'ORD-2026-048',
      user_name: 'Jane Smith',
      seller_name: 'UKM Craft Shop',
      product_name: 'Handmade Bag',
      amount: 200000,
      reason: 'Wrong item received',
      status: 'APPROVED',
      created_at: '2026-01-27',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAction = (requestId: string, action: 'approve' | 'reject') => {
    console.log(`${action} request ${requestId}`);
    // API call here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Refund Requests</h1>
        <p className="text-gray-600 mt-1">Review and process customer refund requests</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {requests.filter(r => r.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {requests.filter(r => r.status === 'APPROVED').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Refund Amount</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            Rp {requests.reduce((sum, r) => sum + r.amount, 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Avg Processing Time</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">1.5 days</p>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {request.request_number}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-blue-600">
                  {request.order_id}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{request.user_name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{request.product_name}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  Rp {request.amount.toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {request.reason}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(request.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4">
                  {request.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(request.id, 'approve')}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(request.id, 'reject')}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
