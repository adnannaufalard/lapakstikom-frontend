'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface Ticket {
  id: string;
  ticket_number: string;
  user_name: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  last_reply: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      ticket_number: 'TKT-2026-001',
      user_name: 'John Doe',
      subject: 'Payment not received',
      category: 'Payment',
      priority: 'HIGH',
      status: 'OPEN',
      created_at: '2026-01-28',
      last_reply: '2 hours ago',
    },
    {
      id: '2',
      ticket_number: 'TKT-2026-002',
      user_name: 'Jane Smith',
      subject: 'Cannot upload product images',
      category: 'Technical',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      created_at: '2026-01-27',
      last_reply: '1 day ago',
    },
  ]);
  const [filter, setFilter] = useState<string>('ALL');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">


      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Open Tickets</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {tickets.filter(t => t.status === 'OPEN').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {tickets.filter(t => t.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Resolved Today</p>
          <p className="text-2xl font-bold text-green-600 mt-1">5</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Avg Response Time</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">2.5h</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Reply</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {ticket.ticket_number}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{ticket.user_name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{ticket.subject}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{ticket.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{ticket.last_reply}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View
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
