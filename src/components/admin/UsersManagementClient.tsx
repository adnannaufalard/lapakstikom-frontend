'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  Shield,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ChevronRight,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  nim?: string;
  program_studi?: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
}

export function UsersManagementClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, verified: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    role: '',
  });
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    role: 'MAHASISWA',
    phone: '',
    nim: '',
    program_studi: '',
    ketua_ukm_id: '',
  });
  const [processing, setProcessing] = useState(false);
  const [ketuaSearch, setKetuaSearch] = useState('');
  const [ketuaResults, setKetuaResults] = useState<User[]>([]);
  const [selectedKetua, setSelectedKetua] = useState<User | null>(null);
  const [searchingKetua, setSearchingKetua] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.append('role', roleFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiGet<ApiResponse<{ users: User[]; stats: Stats }>>(`/admin/users?${params.toString()}`, true);
      
      if (response.success && response.data) {
        setUsers(response.data.users);
        setStats(response.data.stats);
      } else {
        throw new Error(response.message || 'Gagal memuat data users');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      let errorMessage = 'Gagal memuat data users';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        errorMessage = 'Backend server tidak dapat diakses. Pastikan backend sudah running.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Koneksi timeout. Database server mungkin lambat.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      if (!createFormData.email || !createFormData.password || !createFormData.full_name || !createFormData.role) {
        throw new Error('Email, password, nama lengkap, dan role harus diisi');
      }
      if (!createFormData.username || createFormData.username.trim() === '') {
        throw new Error('Username harus diisi');
      }
      if (createFormData.username.includes(' ')) {
        throw new Error('Username tidak boleh mengandung spasi');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(createFormData.username)) {
        throw new Error('Username hanya boleh mengandung huruf, angka, dan underscore');
      }
      if (!createFormData.phone || createFormData.phone.trim() === '') {
        throw new Error('Nomor telepon harus diisi');
      }
      if (createFormData.role !== 'UKM_OFFICIAL') {
        const emailDomain = createFormData.email.split('@')[1];
        if (emailDomain !== 'student.stikomyos.ac.id' && emailDomain !== 'stikomyos.ac.id') {
          throw new Error('Email harus menggunakan domain @student.stikomyos.ac.id atau @stikomyos.ac.id');
        }
      }
      if (createFormData.role === 'MAHASISWA') {
        if (!createFormData.nim || !createFormData.program_studi) {
          throw new Error('NIM dan Program Studi harus diisi untuk role Mahasiswa');
        }
      }
      if (createFormData.role === 'UKM_OFFICIAL') {
        if (!createFormData.ketua_ukm_id || createFormData.ketua_ukm_id.trim() === '') {
          throw new Error('Ketua UKM harus dipilih untuk role UKM Official');
        }
      }

      const response = await apiPost<ApiResponse<User>>('/admin/users', createFormData, true);
      
      if (response.success && response.data) {
        setSuccess('User berhasil dibuat');
        setShowCreateForm(false);
        resetCreateForm();
        fetchUsers();
      } else {
        throw new Error(response.message || 'Gagal membuat user');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal membuat user');
    } finally {
      setProcessing(false);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      email: '',
      password: '',
      full_name: '',
      username: '',
      role: 'MAHASISWA',
      phone: '',
      nim: '',
      program_studi: '',
      ketua_ukm_id: '',
    });
    setSelectedKetua(null);
    setKetuaSearch('');
    setKetuaResults([]);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPost<ApiResponse<{ is_active: boolean }>>(`/admin/users/${userId}/toggle-status`, {}, true);
      
      if (response.success && response.data) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_active: response.data!.is_active } : user
        ));
        setStats(prev => ({
          ...prev,
          active: response.data!.is_active ? prev.active + 1 : prev.active - 1,
          inactive: response.data!.is_active ? prev.inactive - 1 : prev.inactive + 1,
        }));
        setSuccess(response.message || `User berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      } else {
        throw new Error(response.message || 'Gagal mengubah status user');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal mengubah status user');
    } finally {
      setProcessing(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    setSearchQuery(value);
  };

  const searchKetua = async (query: string) => {
    if (!query || query.length < 2) {
      setKetuaResults([]);
      return;
    }
    setSearchingKetua(true);
    try {
      const response = await apiGet<ApiResponse<User[]>>(`/admin/users/search?q=${encodeURIComponent(query)}`, true);
      if (response.success && response.data) {
        const filtered = response.data.filter(u => u.role !== 'UKM_OFFICIAL' && u.role !== 'ADMIN');
        setKetuaResults(filtered);
      }
    } catch (err) {
      console.error('Error searching ketua:', err);
    } finally {
      setSearchingKetua(false);
    }
  };

  const handleKetuaSearch = (value: string) => {
    setKetuaSearch(value);
    if (selectedKetua) {
      setSelectedKetua(null);
      setCreateFormData({ ...createFormData, ketua_ukm_id: '' });
    }
    searchKetua(value);
  };

  const selectKetua = (user: User) => {
    setSelectedKetua(user);
    setCreateFormData({ ...createFormData, ketua_ukm_id: user.id });
    setKetuaSearch('');
    setKetuaResults([]);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      full_name: user.full_name,
      phone: user.phone || '',
      role: user.role,
    });
    setSelectedUser(null);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPost<ApiResponse<User>>(`/admin/users/${editingUser.id}/update`, editFormData, true);
      if (response.success && response.data) {
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id ? { ...user, ...editFormData } : user
        ));
        setSuccess(response.message || 'User berhasil diupdate');
        setEditingUser(null);
      } else {
        throw new Error(response.message || 'Gagal update user');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal update user');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPost<ApiResponse<null>>(`/admin/users/${deletingUser.id}/delete`, {}, true);
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== deletingUser.id));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          active: deletingUser.is_active ? prev.active - 1 : prev.active,
          inactive: deletingUser.is_active ? prev.inactive : prev.inactive - 1,
        }));
        setSuccess(response.message || 'User berhasil dihapus');
        setDeletingUser(null);
      } else {
        throw new Error(response.message || 'Gagal hapus user');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal hapus user');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiPost<ApiResponse<null>>(`/admin/users/${userId}/reset-password`, {}, true);
      if (response.success) {
        setSuccess(response.message || 'Password reset email telah dikirim');
      } else {
        throw new Error(response.message || 'Gagal reset password');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal reset password');
    } finally {
      setProcessing(false);
    }
  };

  const handleResendVerification = async (userId: string, email: string) => {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiPost<ApiResponse<null>>(`/admin/users/${userId}/resend-verification`, { email }, true);
      if (response.success) {
        setSuccess(response.message || 'Email verifikasi telah dikirim');
      } else {
        throw new Error(response.message || 'Gagal kirim email verifikasi');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal kirim email verifikasi');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      UKM_OFFICIAL: 'UKM Official',
      MAHASISWA: 'Mahasiswa',
      DOSEN: 'Dosen',
      KARYAWAN: 'Karyawan',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      UKM_OFFICIAL: 'bg-purple-100 text-purple-700',
      MAHASISWA: 'bg-blue-100 text-blue-700',
      DOSEN: 'bg-emerald-100 text-emerald-700',
      KARYAWAN: 'bg-amber-100 text-amber-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-lg h-64 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <a
            href="/admin/activity-logs"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FileText className="w-3 h-3" />
            Activity Logs
          </a>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <UserPlus className="w-3 h-3" />
            Tambah User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] text-gray-500">Total Users</p>
          <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] text-emerald-600">Active</p>
          <p className="text-lg font-semibold text-emerald-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] text-red-600">Inactive</p>
          <p className="text-lg font-semibold text-red-600">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-[10px] text-blue-600">Verified</p>
          <p className="text-lg font-semibold text-blue-600">{stats.verified}</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <button onClick={fetchUsers} className="text-[10px] text-red-600 hover:text-red-700 font-medium">
            Coba Lagi
          </button>
          <button onClick={() => setError('')}>
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

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau username..."
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-36 px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="ALL">Semua Role</option>
            <option value="ADMIN">Admin</option>
            <option value="UKM_OFFICIAL">UKM Official</option>
            <option value="MAHASISWA">Mahasiswa</option>
            <option value="DOSEN">Dosen</option>
            <option value="KARYAWAN">Karyawan</option>
          </select>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Bergabung</th>
                <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-gray-500">
                    Tidak ada user ditemukan
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username || user.full_name}
                            className="w-7 h-7 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-[10px]">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {user.username ? `@${user.username}` : user.full_name}
                          </p>
                          <p className="text-[10px] text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn("px-1.5 py-0.5 text-[10px] font-medium rounded", getRoleBadgeColor(user.role))}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={cn(
                          "px-1.5 py-0.5 text-[10px] font-medium rounded w-fit",
                          user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        )}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {user.is_email_verified && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Detail User</h2>
                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-lg">{selectedUser.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-900">{selectedUser.username ? `@${selectedUser.username}` : selectedUser.full_name}</p>
                    <p className="text-[10px] text-gray-500">{selectedUser.email}</p>
                    <span className={cn("inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium rounded", getRoleBadgeColor(selectedUser.role))}>
                      {getRoleLabel(selectedUser.role)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Username</p>
                    <p className="font-medium text-gray-900">{selectedUser.username || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Telepon</p>
                    <p className="font-medium text-gray-900">{selectedUser.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Status</p>
                    <span className={cn(
                      "px-1.5 py-0.5 text-[10px] font-medium rounded",
                      selectedUser.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">Email Verified</p>
                    <span className={cn(
                      "px-1.5 py-0.5 text-[10px] font-medium rounded",
                      selectedUser.is_email_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    )}>
                      {selectedUser.is_email_verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-gray-500 mb-0.5">Bergabung</p>
                    <p className="font-medium text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(selectedUser.id, selectedUser.is_active)}
                      disabled={processing}
                      className={cn(
                        "flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md",
                        selectedUser.is_active ? "text-red-700 border border-red-300 hover:bg-red-50" : "text-white bg-emerald-600 hover:bg-emerald-700"
                      )}
                    >
                      {selectedUser.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleEditUser(selectedUser)}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Edit User
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResetPassword(selectedUser.id)}
                      disabled={processing}
                      className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Reset Password
                    </button>
                    {!selectedUser.is_email_verified && (
                      <button
                        onClick={() => handleResendVerification(selectedUser.id, selectedUser.email)}
                        disabled={processing}
                        className="flex-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Kirim Verifikasi
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => { setDeletingUser(selectedUser); setSelectedUser(null); }}
                    className="w-full px-2.5 py-1.5 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                  >
                    Hapus User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Tambah User Baru</h2>
                <button onClick={() => { setShowCreateForm(false); resetCreateForm(); }} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Email *</label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    placeholder="email@student.stikomyos.ac.id"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  />
                  {createFormData.role !== 'UKM_OFFICIAL' && (
                    <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      Harus domain @student.stikomyos.ac.id atau @stikomyos.ac.id
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Password *</label>
                  <input
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">
                    {createFormData.role === 'UKM_OFFICIAL' ? 'Nama UKM' : 'Nama Lengkap'} *
                  </label>
                  <input
                    type="text"
                    value={createFormData.full_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Username *</label>
                  <input
                    type="text"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value.replace(/\s/g, '') })}
                    placeholder="johndoe"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Role *</label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  >
                    <option value="MAHASISWA">Mahasiswa</option>
                    <option value="DOSEN">Dosen</option>
                    <option value="KARYAWAN">Karyawan</option>
                    <option value="UKM_OFFICIAL">UKM Official</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {createFormData.role === 'UKM_OFFICIAL' && (
                  <div className="relative">
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Ketua UKM *</label>
                    <input
                      type="text"
                      value={ketuaSearch}
                      onChange={(e) => handleKetuaSearch(e.target.value)}
                      placeholder="Cari nama atau email ketua..."
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                    />
                    {ketuaResults.length > 0 && !selectedKetua && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {ketuaResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => selectKetua(user)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 text-xs"
                          >
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <p className="text-[10px] text-gray-500">{user.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedKetua && (
                      <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-blue-900">{selectedKetua.full_name}</p>
                          <p className="text-[10px] text-blue-600">{selectedKetua.email}</p>
                        </div>
                        <button type="button" onClick={() => { setSelectedKetua(null); setCreateFormData({ ...createFormData, ketua_ukm_id: '' }); }}>
                          <X className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {createFormData.role === 'MAHASISWA' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">NIM *</label>
                      <input
                        type="text"
                        value={createFormData.nim}
                        onChange={(e) => setCreateFormData({ ...createFormData, nim: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-1">Program Studi *</label>
                      <select
                        value={createFormData.program_studi}
                        onChange={(e) => setCreateFormData({ ...createFormData, program_studi: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                      >
                        <option value="">Pilih Program Studi</option>
                        <option value="Teknik Informatika">Teknik Informatika</option>
                        <option value="Sistem Informasi">Sistem Informasi</option>
                        <option value="Komputerisasi Akuntansi">Komputerisasi Akuntansi</option>
                        <option value="Desain Komunikasi Visual">Desain Komunikasi Visual</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Nomor Telepon *</label>
                  <input
                    type="text"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); resetCreateForm(); }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateUser}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                    Buat User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Edit User</h2>
                <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md"
                  >
                    <option value="MAHASISWA">Mahasiswa</option>
                    <option value="DOSEN">Dosen</option>
                    <option value="KARYAWAN">Karyawan</option>
                    <option value="UKM_OFFICIAL">UKM Official</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateUser}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                    Simpan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full">
            <div className="p-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mx-auto mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900 text-center mb-1">Hapus User</h2>
              <p className="text-xs text-gray-600 text-center mb-4">
                Yakin ingin menghapus <strong>{deletingUser.full_name}</strong>?
                <br />
                <span className="text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
