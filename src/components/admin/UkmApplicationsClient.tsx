'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  RefreshCw,
  ChevronRight,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

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
    const interval = setInterval(() => {
      if (!selectedApp) {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [filter, selectedApp]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        apiGet<ApiResponse & { data: { applications: UkmApplication[] } }>(`/ukm/admin/applications${filter !== 'ALL' ? `?status=${filter}` : ''}`, true),
        apiGet<ApiResponse<Stats>>('/ukm/admin/applications/stats', true),
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
      const response = await apiPost<ApiResponse>(`/ukm/admin/applications/${app.id}/approve`, {}, true);
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
      }, true);
      
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
    const styles = {
      PENDING: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
    };
    const labels = {
      PENDING: 'Pending',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak',
    };
    return (
      <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", styles[status as keyof typeof styles])}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-lg h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">UKM Applications</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Review dan kelola pendaftaran UKM</p>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-600">{stats.pending}</p>
              <p className="text-[10px] text-gray-500">Menunggu</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-600">{stats.approved}</p>
              <p className="text-[10px] text-gray-500">Disetujui</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-red-600">{stats.rejected}</p>
              <p className="text-[10px] text-gray-500">Ditolak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-3 h-3 text-red-400" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X className="w-3 h-3 text-emerald-400" />
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
              filter === status
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {status === 'ALL' ? 'Semua' : status === 'PENDING' ? 'Menunggu' : status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              Tidak ada pendaftaran {filter !== 'ALL' && `dengan status "${filter.toLowerCase()}"`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xs font-medium text-gray-900 truncate">{app.ukm_name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-[10px] text-gray-600 mb-1.5 line-clamp-1">{app.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <Mail className="w-3 h-3" />
                        {app.pic_email}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Phone className="w-3 h-3" />
                        {app.pic_phone}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <FileText className="w-3 h-3" />
                        {app.category}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(app.created_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{selectedApp.ukm_name}</h2>
                  <p className="text-[10px] text-gray-500">{selectedApp.category}</p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-medium text-gray-500 mb-1">Deskripsi</p>
                  <p className="text-xs text-gray-900">{selectedApp.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Penanggung Jawab</p>
                    <p className="text-xs text-gray-900">{selectedApp.pic_name}</p>
                    {selectedApp.pic_position && (
                      <p className="text-[10px] text-gray-500">{selectedApp.pic_position}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Kontak</p>
                    <p className="text-xs text-gray-900">{selectedApp.pic_phone}</p>
                    <p className="text-[10px] text-gray-500">{selectedApp.pic_email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Status</p>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-500 mb-1">Tanggal Pengajuan</p>
                    <p className="text-xs text-gray-900">{formatDate(selectedApp.created_at)}</p>
                  </div>
                </div>

                {selectedApp.admin_notes && (
                  <div className="bg-red-50 rounded-md p-2.5">
                    <p className="text-[10px] font-medium text-red-800 mb-0.5">Catatan Admin</p>
                    <p className="text-xs text-red-700">{selectedApp.admin_notes}</p>
                  </div>
                )}

                {selectedApp.status === 'PENDING' && (
                  <>
                    <hr className="border-gray-200" />
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">
                        Alasan Penolakan (jika ditolak)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Masukkan alasan jika menolak pendaftaran..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(selectedApp)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                        <CheckCircle2 className="w-3 h-3" />
                        Setujui
                      </button>
                      <button
                        onClick={() => handleReject(selectedApp)}
                        disabled={processing || !rejectReason.trim()}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                      >
                        {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                        <XCircle className="w-3 h-3" />
                        Tolak
                      </button>
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
