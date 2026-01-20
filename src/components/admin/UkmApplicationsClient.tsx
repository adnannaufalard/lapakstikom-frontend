'use client';

import { useState, useEffect } from 'react';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';

interface UkmApplication {
  id: string;
  ukm_name: string;
  description: string;
  category: string;
  pic_name: string;
  pic_email: string;
  pic_phone: string;
  pic_position?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

export function UkmApplicationsClient() {
  const [applications, setApplications] = useState<UkmApplication[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedApp, setSelectedApp] = useState<UkmApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Auto refresh hanya jika tidak ada modal yang terbuka
    const interval = setInterval(() => {
      if (!selectedApp) {
        fetchData();
      }
    }, 30000); // Ubah ke 30 detik agar tidak terlalu sering
    
    return () => clearInterval(interval);
  }, [filter, selectedApp]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        apiGet<ApiResponse & { data: { applications: UkmApplication[] } }>(`/ukm/admin/applications${filter !== 'ALL' ? `?status=${filter}` : ''}`),
        apiGet<ApiResponse<Stats>>('/ukm/admin/applications/stats'),
      ]);
      
      if (appsRes.success && appsRes.data?.applications) {
        setApplications(Array.isArray(appsRes.data.applications) ? appsRes.data.applications : []);
      }
      
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Gagal memuat data pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app: UkmApplication) => {
    if (!confirm(`Setujui pendaftaran UKM "${app.ukm_name}"?`)) return;

    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiPost<ApiResponse>(`/ukm/admin/applications/${app.id}/approve`, {});
      if (response.success) {
        setSuccess(`UKM "${app.ukm_name}" berhasil disetujui`);
        fetchData();
        setSelectedApp(null);
      } else {
        setError(response.message || 'Gagal menyetujui pendaftaran');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyetujui pendaftaran');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (app: UkmApplication) => {
    if (!rejectReason.trim()) {
      setError('Alasan penolakan wajib diisi');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiPost<ApiResponse>(`/ukm/admin/applications/${app.id}/reject`, {
        reason: rejectReason,
      });
      
      if (response.success) {
        setSuccess(`Pendaftaran UKM "${app.ukm_name}" telah ditolak`);
        fetchData();
        setSelectedApp(null);
        setRejectReason('');
      } else {
        setError(response.message || 'Gagal menolak pendaftaran');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menolak pendaftaran');
    } finally {
      setProcessing(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>,
      APPROVED: <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Disetujui</span>,
      REJECTED: <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Ditolak</span>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-xl h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">UKM Applications</h1>
            <p className="text-gray-600 mt-1">Review dan kelola pendaftaran UKM</p>
          </div>
          <Button
            onClick={() => fetchData()}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-sm text-yellow-600">Menunggu</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
            <p className="text-sm text-green-600">Disetujui</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
            <p className="text-sm text-red-600">Ditolak</p>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              {status === 'ALL' ? 'Semua' : status === 'PENDING' ? 'Menunggu' : status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Tidak ada pendaftaran {filter !== 'ALL' && `dengan status "${filter.toLowerCase()}"`}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{app.ukm_name}</h3>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{app.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>📧 {app.pic_email}</span>
                        <span>📱 {app.pic_phone}</span>
                        <span>📁 {app.category}</span>
                        <span>📅 {formatDate(app.created_at)}</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedApp(null)}>
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedApp.ukm_name}</h2>
                    <p className="text-sm text-gray-500">{selectedApp.category}</p>
                  </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Deskripsi</p>
                    <p className="text-gray-900">{selectedApp.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Penanggung Jawab</p>
                      <p className="text-gray-900">{selectedApp.pic_name}</p>
                      {selectedApp.pic_position && (
                        <p className="text-sm text-gray-500">{selectedApp.pic_position}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Kontak</p>
                      <p className="text-gray-900">{selectedApp.pic_phone}</p>
                      <p className="text-sm text-gray-500">{selectedApp.pic_email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    {getStatusBadge(selectedApp.status)}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Tanggal Pengajuan</p>
                    <p className="text-gray-900">{formatDate(selectedApp.created_at)}</p>
                  </div>

                  {selectedApp.admin_notes && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Catatan Admin</p>
                      <p className="text-sm text-red-700">{selectedApp.admin_notes}</p>
                    </div>
                  )}

                  {selectedApp.status === 'PENDING' && (
                    <>
                      <hr />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alasan Penolakan (jika ditolak)
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Masukkan alasan jika menolak pendaftaran..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(selectedApp)}
                          disabled={processing}
                          isLoading={processing}
                          className="flex-1"
                        >
                          ✓ Setujui
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(selectedApp)}
                          disabled={processing || !rejectReason.trim()}
                          isLoading={processing}
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          ✕ Tolak
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
