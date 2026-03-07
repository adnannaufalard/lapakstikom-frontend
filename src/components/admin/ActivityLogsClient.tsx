'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { apiGet, ApiResponse } from '@/lib/api';

interface ActivityLog {
  id: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
  action_type: string;
  target_user_id?: string;
  target_user_email?: string;
  target_user_name?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

interface ActivityStats {
  total: number;
  by_action: Record<string, number>;
}

export function ActivityLogsClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, currentPage]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'ALL') params.append('action_type', actionFilter);
      params.append('limit', pageSize.toString());
      params.append('offset', ((currentPage - 1) * pageSize).toString());

      const response = await apiGet<ApiResponse<{ logs: ActivityLog[]; total: number }>>(`/admin/activity-logs?${params.toString()}`);
      
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotalLogs(response.data.total);
      } else {
        throw new Error(response.message || 'Gagal memuat activity logs');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat activity logs');
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiGet<ApiResponse<ActivityStats>>('/admin/activity-logs/stats');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE_USER':
        return 'bg-green-100 text-green-800';
      case 'UPDATE_USER':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE_USER':
        return 'bg-red-100 text-red-800';
      case 'TOGGLE_STATUS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESEND_VERIFICATION':
        return 'bg-purple-100 text-purple-800';
      case 'RESET_PASSWORD':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE_USER':
        return 'Buat User';
      case 'UPDATE_USER':
        return 'Update User';
      case 'DELETE_USER':
        return 'Hapus User';
      case 'TOGGLE_STATUS':
        return 'Ubah Status';
      case 'RESEND_VERIFICATION':
        return 'Kirim Verifikasi';
      case 'RESET_PASSWORD':
        return 'Reset Password';
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Aktivitas</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">User Dibuat</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.by_action.CREATE_USER || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">User Diupdate</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.by_action.UPDATE_USER || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">User Dihapus</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.by_action.DELETE_USER || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Action</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Semua Aktivitas</option>
              <option value="CREATE_USER">Buat User</option>
              <option value="UPDATE_USER">Update User</option>
              <option value="DELETE_USER">Hapus User</option>
              <option value="TOGGLE_STATUS">Ubah Status</option>
              <option value="RESEND_VERIFICATION">Kirim Verifikasi</option>
              <option value="RESET_PASSWORD">Reset Password</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Activity Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada activity log
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.admin_name}</div>
                      <div className="text-sm text-gray-500">{log.admin_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(log.action_type)}`}>
                        {getActionLabel(log.action_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.target_user_name ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.target_user_name}</div>
                          <div className="text-sm text-gray-500">{log.target_user_email}</div>
                        </div>
                      ) : log.target_user_email ? (
                        <div className="text-sm text-gray-500">{log.target_user_email}</div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, totalLogs)}</span> of{' '}
                  <span className="font-medium">{totalLogs}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === i + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Activity Log Detail</h2>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(selectedLog.created_at)}</p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Action Type</p>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getActionBadgeColor(selectedLog.action_type)}`}>
                    {getActionLabel(selectedLog.action_type)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Performed By</p>
                  <p className="text-gray-900 font-medium">{selectedLog.admin_name}</p>
                  <p className="text-sm text-gray-500">{selectedLog.admin_email}</p>
                </div>

                {selectedLog.target_user_email && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Target User</p>
                    {selectedLog.target_user_name && (
                      <p className="text-gray-900 font-medium">{selectedLog.target_user_name}</p>
                    )}
                    <p className="text-sm text-gray-500">{selectedLog.target_user_email}</p>
                  </div>
                )}

                {selectedLog.details && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Details</p>
                    <pre className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">IP Address</p>
                  <p className="text-gray-900">{selectedLog.ip_address || 'Unknown'}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedLog(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
