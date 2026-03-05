'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiGet, apiPut, ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  User,
  Shield,
  Mail,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  username?: string;
  phone?: string;
  role: string;
  avatar_url?: string;
}

export default function AdminAccountsPage() {
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Fetch profile on mount
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiGet<ApiResponse<AdminProfile>>('/profile', true);
      if (response.success && response.data) {
        setProfile(response.data);
        setProfileForm({
          full_name: response.data.full_name || '',
          username: response.data.username || '',
          phone: response.data.phone || '',
        });
      }
    } catch (err: unknown) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiPut<ApiResponse<AdminProfile>>('/profile', profileForm, true);
      if (response.success) {
        setSuccess('Profil berhasil diperbarui');
        fetchProfile();
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal memperbarui profil');
    } finally {
      setProcessing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setSuccess('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('Password baru tidak cocok');
      setProcessing(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError('Password minimal 8 karakter');
      setProcessing(false);
      return;
    }

    try {
      const response = await apiPut<ApiResponse<unknown>>('/profile/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      }, true);
      if (response.success) {
        setSuccess('Password berhasil diubah');
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Gagal mengubah password');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'ADMIN': return 'bg-indigo-100 text-indigo-700';
      case 'MODERATOR': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-sm font-semibold text-gray-900">My Profile</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">Kelola profil akun administrator</p>
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

      {/* Profile Content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-xs font-medium text-gray-900 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Informasi Profil
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Email</label>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{profile?.email || user?.email}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Email tidak dapat diubah</p>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-gray-400" />
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] font-medium rounded",
                    getRoleBadge(profile?.role || user?.role || 'ADMIN')
                  )}>
                    {(profile?.role || user?.role || 'ADMIN').replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">Username</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-1">No. Telepon</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="flex items-center justify-center gap-1 w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Simpan Perubahan
                </button>
              </form>
            )}
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-xs font-medium text-gray-900 mb-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Ubah Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Minimal 8 karakter</p>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-3 py-1.5 pr-8 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="flex items-center justify-center gap-1 w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                Ubah Password
              </button>
            </form>
          </div>
        </div>
    </div>
  );
}
