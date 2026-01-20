'use client';

import { useState, useEffect } from 'react';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';

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

      const response = await apiGet<ApiResponse<{ users: User[]; stats: Stats }>>(`/admin/users?${params.toString()}`);
      
      if (response.success && response.data) {
        setUsers(response.data.users);
        setStats(response.data.stats);
      } else {
        throw new Error(response.message || 'Gagal memuat data users');
      }
    } catch (err: any) {
      let errorMessage = 'Gagal memuat data users';
      
      if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch')) {
        errorMessage = 'Backend server tidak dapat diakses. Pastikan backend sudah running di http://localhost:4000';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Koneksi timeout. Database server mungkin lambat atau tidak merespons.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!createFormData.email || !createFormData.password || !createFormData.full_name || !createFormData.role) {
        throw new Error('Email, password, nama lengkap, dan role harus diisi');
      }

      // Validate username (REQUIRED)
      if (!createFormData.username || createFormData.username.trim() === '') {
        throw new Error('Username harus diisi');
      }

      // Validate username no spaces
      if (createFormData.username.includes(' ')) {
        throw new Error('Username tidak boleh mengandung spasi');
      }

      // Validate username format (alphanumeric and underscore only)
      if (!/^[a-zA-Z0-9_]+$/.test(createFormData.username)) {
        throw new Error('Username hanya boleh mengandung huruf, angka, dan underscore');
      }

      // Validate phone number (REQUIRED)
      if (!createFormData.phone || createFormData.phone.trim() === '') {
        throw new Error('Nomor telepon harus diisi');
      }

      // Validate email domain (except for UKM_OFFICIAL)
      if (createFormData.role !== 'UKM_OFFICIAL') {
        const emailDomain = createFormData.email.split('@')[1];
        if (emailDomain !== 'student.stikomyos.ac.id' && emailDomain !== 'stikomyos.ac.id') {
          throw new Error('Email harus menggunakan domain @student.stikomyos.ac.id atau @stikomyos.ac.id');
        }
      }

      // Additional validation for MAHASISWA
      if (createFormData.role === 'MAHASISWA') {
        if (!createFormData.nim || !createFormData.program_studi) {
          throw new Error('NIM dan Program Studi harus diisi untuk role Mahasiswa');
        }
      }

      // Additional validation for UKM_OFFICIAL
      if (createFormData.role === 'UKM_OFFICIAL') {
        if (!createFormData.ketua_ukm_id || createFormData.ketua_ukm_id.trim() === '') {
          throw new Error('Ketua UKM harus dipilih untuk role UKM Official');
        }
      }

      const response = await apiPost<ApiResponse<User>>('/admin/users', createFormData);
      
      if (response.success && response.data) {
        setSuccess('User berhasil dibuat');
        setShowCreateForm(false);
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
        fetchUsers();
      } else {
        throw new Error(response.message || 'Gagal membuat user');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat user');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPost<ApiResponse<{ is_active: boolean }>>(`/admin/users/${userId}/toggle-status`, {});
      
      if (response.success && response.data) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_active: response.data!.is_active } : user
        ));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          active: response.data!.is_active ? prev.active + 1 : prev.active - 1,
          inactive: response.data!.is_active ? prev.inactive - 1 : prev.inactive + 1,
        }));
        
        setSuccess(response.message || `User berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
        
        // Close modal if open
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      } else {
        throw new Error(response.message || 'Gagal mengubah status user');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status user');
      console.error('Error toggling user status:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Realtime search - trigger on input change with debounce
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    // Set search query immediately for realtime search
    setSearchQuery(value);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Already searching in realtime, just prevent default
      e.preventDefault();
    }
  };

  const searchKetua = async (query: string) => {
    if (!query || query.length < 2) {
      setKetuaResults([]);
      return;
    }

    setSearchingKetua(true);
    try {
      console.log('Searching ketua with query:', query); // Debug log
      const response = await apiGet<ApiResponse<User[]>>(`/admin/users/search?q=${encodeURIComponent(query)}`);
      console.log('Search response:', response); // Debug log
      
      if (response.success && response.data) {
        // Filter only non-UKM and non-ADMIN roles
        const filtered = response.data.filter(u => 
          u.role !== 'UKM_OFFICIAL' && u.role !== 'ADMIN'
        );
        console.log('Filtered results:', filtered.length, 'users'); // Debug log
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
    // Clear selected ketua if user is typing again
    if (selectedKetua) {
      setSelectedKetua(null);
      setCreateFormData({ ...createFormData, ketua_ukm_id: '' });
    }
    searchKetua(value);
  };

  const selectKetua = (user: User) => {
    setSelectedKetua(user);
    setCreateFormData({ ...createFormData, ketua_ukm_id: user.id });
    setKetuaSearch(''); // Clear search input after selection
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
      const response = await apiPost<ApiResponse<User>>(`/admin/users/${editingUser.id}/update`, editFormData);
      
      if (response.success && response.data) {
        setUsers(prev => prev.map(user => 
          user.id === editingUser.id ? { ...user, ...editFormData } : user
        ));
        setSuccess(response.message || 'User berhasil diupdate');
        setEditingUser(null);
      } else {
        throw new Error(response.message || 'Gagal update user');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal update user');
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
      const response = await apiPost<ApiResponse<null>>(`/admin/users/${deletingUser.id}/delete`, {});
      
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
    } catch (err: any) {
      setError(err.message || 'Gagal hapus user');
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPost<ApiResponse<null>>(`/admin/users/${userId}/reset-password`, {});
      
      if (response.success) {
        setSuccess(response.message || 'Password reset email telah dikirim');
      } else {
        throw new Error(response.message || 'Gagal reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal reset password');
    } finally {
      setProcessing(false);
    }
  };

  const handleResendVerification = async (userId: string, email: string) => {
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPost<ApiResponse<null>>(`/admin/users/${userId}/resend-verification`, { email });
      
      if (response.success) {
        setSuccess(response.message || 'Email verifikasi telah dikirim');
      } else {
        throw new Error(response.message || 'Gagal kirim email verifikasi');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal kirim email verifikasi');
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
      ADMIN: 'bg-red-100 text-red-800',
      UKM_OFFICIAL: 'bg-purple-100 text-purple-800',
      MAHASISWA: 'bg-blue-100 text-blue-800',
      DOSEN: 'bg-green-100 text-green-800',
      KARYAWAN: 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-xl h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">Kelola semua pengguna platform</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => window.location.href = '/admin/activity-logs'}
              variant="outline"
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Activity Logs
            </Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah User
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="text-sm text-green-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-700">{stats.active}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <p className="text-sm text-red-600 mb-1">Inactive</p>
            <p className="text-3xl font-bold text-red-700">{stats.inactive}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <p className="text-sm text-blue-600 mb-1">Verified</p>
            <p className="text-3xl font-bold text-blue-700">{stats.verified}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-800 font-medium mb-1">{error}</p>
                {error.includes('Backend server tidak dapat diakses') && (
                  <div className="mt-2 text-sm text-red-700 space-y-1">
                    <p>Cara menjalankan backend:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Buka terminal baru</li>
                      <li>Jalankan: <code className="bg-red-100 px-2 py-0.5 rounded">npm run dev</code> (untuk menjalankan frontend & backend)</li>
                      <li>Atau: <code className="bg-red-100 px-2 py-0.5 rounded">npm run dev:backend</code> (hanya backend)</li>
                    </ol>
                  </div>
                )}
              </div>
              <Button
                onClick={fetchUsers}
                variant="outline"
                size="sm"
                className="flex-shrink-0 border-red-300 text-red-700 hover:bg-red-100"
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        )}
        {success && <Alert variant="success">{success}</Alert>}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari nama, email, atau username... (realtime)"
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">Semua Role</option>
                <option value="ADMIN">Admin</option>
                <option value="UKM_OFFICIAL">UKM Official</option>
                <option value="MAHASISWA">Mahasiswa</option>
                <option value="DOSEN">Dosen</option>
                <option value="KARYAWAN">Karyawan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bergabung
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username || user.full_name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-600 font-semibold">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.username ? `@${user.username}` : user.full_name}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {user.username && (
                              <p className="text-xs text-gray-400">{user.full_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.is_email_verified && (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            title="Lihat Detail"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-green-600 hover:text-green-700 font-medium text-sm"
                            title="Edit User"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                            title="Hapus User"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
        {/* Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">User Detail</h2>
                    <p className="text-sm text-gray-500 mt-1">Informasi lengkap user</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.username || selectedUser.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-2xl">
                          {selectedUser.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedUser.username ? `@${selectedUser.username}` : selectedUser.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedUser.email}</p>
                      {selectedUser.username && (
                        <p className="text-xs text-gray-400">{selectedUser.full_name}</p>
                      )}
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Username</p>
                      <p className="font-medium text-gray-900">{selectedUser.username || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nomor Telepon</p>
                      <p className="font-medium text-gray-900">{selectedUser.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email Verified</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.is_email_verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.is_email_verified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Bergabung</p>
                      <p className="font-medium text-gray-900">
                        {new Date(selectedUser.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <div className="flex gap-3">
                      <Button
                        variant={selectedUser.is_active ? 'danger' : 'primary'}
                        onClick={() => handleToggleStatus(selectedUser.id, selectedUser.is_active)}
                        isLoading={processing}
                        className="flex-1"
                      >
                        {selectedUser.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleEditUser(selectedUser)}
                        className="flex-1"
                      >
                        Edit User
                      </Button>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleResetPassword(selectedUser.id)}
                        isLoading={processing}
                        className="flex-1"
                      >
                        Reset Password
                      </Button>
                      {!selectedUser.is_email_verified && (
                        <Button
                          variant="outline"
                          onClick={() => handleResendVerification(selectedUser.id, selectedUser.email)}
                          isLoading={processing}
                          className="flex-1"
                        >
                          Kirim Verifikasi
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => {
                        setDeletingUser(selectedUser);
                        setSelectedUser(null);
                      }}
                      className="w-full"
                    >
                      Hapus User
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Tambah User Baru</h2>
                    <p className="text-sm text-gray-500 mt-1">Buat akun user baru</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
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
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      placeholder="email@student.stikomyos.ac.id"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {createFormData.role !== 'UKM_OFFICIAL' && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Harus menggunakan domain @student.stikomyos.ac.id atau @stikomyos.ac.id
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {createFormData.role === 'UKM_OFFICIAL' ? 'Nama UKM' : 'Nama Lengkap'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.full_name}
                      onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                      placeholder={createFormData.role === 'UKM_OFFICIAL' ? 'Contoh: BEM STIKOM' : 'John Doe'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.username}
                      onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value.replace(/\s/g, '') })}
                      placeholder="johndoe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Harus unik, tanpa spasi, hanya huruf/angka/underscore</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="MAHASISWA">Mahasiswa</option>
                      <option value="DOSEN">Dosen</option>
                      <option value="KARYAWAN">Karyawan</option>
                      <option value="UKM_OFFICIAL">UKM Official</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {/* Conditional field for UKM_OFFICIAL - Ketua UKM */}
                  {createFormData.role === 'UKM_OFFICIAL' && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ketua UKM <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ketuaSearch}
                          onChange={(e) => handleKetuaSearch(e.target.value)}
                          placeholder="Cari nama atau email ketua (min. 2 karakter)..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {searchingKetua && (
                          <div className="absolute right-3 top-2.5">
                            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Search Results Dropdown */}
                      {ketuaResults.length > 0 && !selectedKetua && ketuaSearch.length >= 2 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {ketuaResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => selectKetua(user)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{user.full_name}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  {user.role}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedKetua && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">{selectedKetua.full_name}</p>
                            <p className="text-xs text-blue-600">{selectedKetua.email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedKetua(null);
                              setCreateFormData({ ...createFormData, ketua_ukm_id: '' });
                              setKetuaSearch('');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-1">
                        Pilih ketua UKM dari user yang sudah terdaftar.
                      </p>
                    </div>
                  )}

                  {/* Conditional fields for MAHASISWA */}
                  {createFormData.role === 'MAHASISWA' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NIM <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={createFormData.nim}
                          onChange={(e) => setCreateFormData({ ...createFormData, nim: e.target.value })}
                          placeholder="12345678"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Program Studi <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={createFormData.program_studi}
                          onChange={(e) => setCreateFormData({ ...createFormData, program_studi: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                      placeholder="08123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
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
                      }}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreateUser}
                      isLoading={processing}
                      className="flex-1"
                    >
                      Buat User
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6"> 
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
                    <p className="text-sm text-gray-500 mt-1">Update informasi user</p>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={editFormData.full_name}
                      onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="MAHASISWA">Mahasiswa</option>
                      <option value="DOSEN">Dosen</option>
                      <option value="KARYAWAN">Karyawan</option>
                      <option value="UKM_OFFICIAL">UKM Official</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditingUser(null)}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleUpdateUser}
                      isLoading={processing}
                      className="flex-1"
                    >
                      Simpan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Hapus User</h2>
                <p className="text-gray-600 text-center mb-6">
                  Apakah Anda yakin ingin menghapus user <strong>{deletingUser.full_name}</strong>?
                  <br />
                  <span className="text-sm text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeletingUser(null)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeleteUser}
                    isLoading={processing}
                    className="flex-1"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
