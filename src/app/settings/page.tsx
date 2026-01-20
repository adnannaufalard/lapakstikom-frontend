'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button, Input, Alert } from '@/components/ui';
import { getRoleLabel } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn, refresh } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile form
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/settings');
    }
  }, [isLoading, isLoggedIn, router]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name,
        email: user.email,
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // TODO: Implement API call to update profile
      // await apiPatch('/auth/profile', profileData);
      setSuccess('Profil berhasil diperbarui!');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    setSaving(true);

    try {
      // TODO: Implement API call to change password
      // await apiPost('/auth/change-password', passwordData);
      setSuccess('Password berhasil diubah!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-8" />
            <div className="bg-white rounded-xl p-6 h-96 animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'password', label: 'Ubah Password' },
    { id: 'account', label: 'Akun' },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Pengaturan</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <nav className="bg-white rounded-xl border border-gray-200 p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="md:col-span-3">
              {error && (
                <Alert variant="error" className="mb-6">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="mb-6">
                  {success}
                </Alert>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    Informasi Profil
                  </h2>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <Input
                      label="Nama Lengkap"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleProfileChange}
                      required
                    />
                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      helperText="Email tidak dapat diubah"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600">
                        {getRoleLabel(user.role)}
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button type="submit" isLoading={saving}>
                        Simpan Perubahan
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    Ubah Password
                  </h2>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <Input
                      label="Password Saat Ini"
                      name="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <Input
                      label="Password Baru"
                      name="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      helperText="Minimal 6 karakter"
                      required
                    />
                    <Input
                      label="Konfirmasi Password Baru"
                      name="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <div className="pt-4">
                      <Button type="submit" isLoading={saving}>
                        Ubah Password
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    Pengaturan Akun
                  </h2>

                  {/* Account Info */}
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">
                      Status Akun
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Email Terverifikasi</span>
                        {user.is_email_verified ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                            Terverifikasi
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                            Belum Verifikasi
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status Akun</span>
                        {user.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Bergabung Sejak</span>
                        <span className="text-gray-900">
                          {new Date(user.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* UKM Section - hanya untuk non-admin dan non-ukm */}
                  {(user.role === 'MAHASISWA' || user.role === 'DOSEN' || user.role === 'KARYAWAN') && (
                    <div className="mb-8 pb-8 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700 mb-4">
                        Upgrade ke Akun UKM
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Ingin menjadi penjual resmi UKM? Ajukan permohonan untuk
                        mendapatkan akun UKM Official.
                      </p>
                      <Link href="/ukm/apply">
                        <Button variant="outline">Ajukan Akun UKM</Button>
                      </Link>
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div>
                    <h3 className="text-sm font-medium text-red-600 mb-4">
                      Zona Berbahaya
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Menghapus akun akan menghapus semua data Anda secara permanen.
                      Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <Button variant="danger">Hapus Akun</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
