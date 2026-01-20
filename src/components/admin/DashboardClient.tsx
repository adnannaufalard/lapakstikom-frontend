'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';

interface UkmApplication {
  id: string;
  user_id: string;
  ukm_name: string;
  description?: string;
  logo_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface AdminStats {
  total_users: number;
  total_products: number;
  total_orders: number;
  pending_ukm: number;
}

export function DashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [ukmApplications, setUkmApplications] = useState<UkmApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ukmRes] = await Promise.all([
          apiGet<ApiResponse<AdminStats>>('/admin/stats'),
          apiGet<ApiResponse<UkmApplication[]>>('/admin/ukm/applications'),
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (ukmRes.data) setUkmApplications(ukmRes.data);
      } catch (err) {
        console.error('Gagal memuat data admin:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproval = async (applicationId: string, action: 'approve' | 'reject') => {
    setProcessing(applicationId);
    setError('');
    setSuccess('');

    try {
      const endpoint = `/admin/ukm/applications/${applicationId}/${action}`;
      const response = await apiPost<ApiResponse<any>>(endpoint, {});
      
      if (response.success) {
        setSuccess(`Aplikasi berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
        
        // Refresh data
        const ukmRes = await apiGet<ApiResponse<UkmApplication[]>>('/admin/ukm/applications');
        if (ukmRes.data) setUkmApplications(ukmRes.data);
      } else {
        setError(response.message || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses aplikasi');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Kelola platform Lapak STIKOM</p>
      </div>

      {/* Alerts */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Products"
          value={stats?.total_products || 0}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Orders"
          value={stats?.total_orders || 0}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Pending UKM"
          value={stats?.pending_ukm || 0}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users" className="block group">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Manage Users</h3>
                <p className="text-blue-100 text-sm">View and edit user accounts</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/products" className="block group">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Manage Products</h3>
                <p className="text-green-100 text-sm">Moderate product listings</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/admin/ukm-applications" className="block group">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">UKM Applications</h3>
                <p className="text-orange-100 text-sm">{stats?.pending_ukm || 0} pending applications</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent UKM Applications */}
      {ukmApplications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent UKM Applications</h2>
            <p className="text-sm text-gray-600 mt-1">Latest applications from UKM sellers</p>
          </div>
          <div className="divide-y divide-gray-200">
            {ukmApplications.slice(0, 5).map((app) => (
              <div key={app.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{app.ukm_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{app.user?.full_name} • {app.user?.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(app.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : app.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {app.status}
                    </span>
                    {app.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproval(app.id, 'approve')}
                          disabled={processing === app.id}
                        >
                          {processing === app.id ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproval(app.id, 'reject')}
                          disabled={processing === app.id}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Link href="/admin/ukm-applications" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all applications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
