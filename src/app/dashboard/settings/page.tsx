'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { ImageCropModal } from '@/components/profile/ImageCropModal';
import { MdEdit, MdSecurity, MdNotifications, MdLanguage, MdPerson, MdCameraAlt } from 'react-icons/md';
import { apiGet, apiPut, apiPost, ApiResponse } from '@/lib/api';
import Image from 'next/image';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn, refresh } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    newOrder: true,
    newMessage: true,
    productUpdate: false,
    newsletter: true,
  });
  const [linkedChairmen, setLinkedChairmen] = useState<any>(null);
  const [loadingChairmen, setLoadingChairmen] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [avatarImageSrc, setAvatarImageSrc] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/settings');
    } else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, user, router]);

  // Load linked chairman (single chairman now, not array)
  const loadLinkedChairmen = async () => {
    if (!user) return;
    setLoadingChairmen(true);
    try {
      const response = await apiGet<ApiResponse<any>>('/ukm/linked-chairmen');
      if (response.success) {
        // Backend returns single chairman object or null, not array
        setLinkedChairmen(response.data);
      }
    } catch (err) {
      console.error('Failed to load chairman:', err);
      setLinkedChairmen(null);
    } finally {
      setLoadingChairmen(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'UKM_OFFICIAL') {
      loadLinkedChairmen();
    }
  }, [user]);

  // Load user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setUsername(user.username || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiPut<ApiResponse<any>>('/profile', {
        full_name: fullName,
        phone: phone,
      });

      if (response.success) {
        showToast('Profil berhasil diperbarui!', 'success');
        await refresh();
      } else {
        showToast(response.message || 'Gagal memperbarui profil', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);

    if (newPassword !== confirmPassword) {
      showToast('Password baru dan konfirmasi password tidak cocok', 'error');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await apiPut<ApiResponse<any>>('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.success) {
        showToast('Password berhasil diubah!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(response.message || 'Gagal mengubah password', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarCrop = async (croppedBlob: Blob) => {
    setUploadingAvatar(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      // Upload using multipart/form-data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Now update to sync with ukm_profiles
        await apiPost<ApiResponse<any>>('/profile/avatar', {
          avatar_url: data.data.avatar_url,
        });

        showToast('Logo berhasil diperbarui!', 'success');
        await refresh(); // Refresh user data to update avatar immediately
        setShowAvatarCrop(false);
      } else {
        throw new Error(data.message || 'Gagal memperbarui logo');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showToast(err.message || 'Gagal mengunggah logo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user.role !== 'UKM_OFFICIAL') {
    return null;
  }

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      <div className="space-y-6">
        {/* Ketua UKM Information (Read-only) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MdPerson className="text-blue-600 text-2xl" />
            <div>
              <h2 className="font-semibold text-gray-900">Penanggung Jawab UKM</h2>
              <p className="text-xs text-gray-500">Informasi kontak penanggung jawab</p>
            </div>
          </div>
          
          {loadingChairmen ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : linkedChairmen ? (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                {linkedChairmen.avatar_url ? (
                  <Image
                    src={linkedChairmen.avatar_url}
                    alt={linkedChairmen.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {linkedChairmen.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{linkedChairmen.full_name}</p>
                <p className="text-sm text-gray-600">{linkedChairmen.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-gray-500">@{linkedChairmen.username}</p>
                  {linkedChairmen.nim && (
                    <>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-500">NIM: {linkedChairmen.nim}</p>
                    </>
                  )}
                  <span className="text-gray-300">•</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {linkedChairmen.role === 'MAHASISWA' ? 'Mahasiswa' : 'Dosen'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <MdPerson className="text-4xl mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada penanggung jawab yang ditautkan</p>
            </div>
          )}
        </div>

        {/* Account Information */}
        <form onSubmit={handleUpdateProfile}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MdEdit className="text-blue-600 text-2xl" />
              <h2 className="font-semibold text-gray-900">Informasi Akun</h2>
            </div>
            <div className="space-y-4">
              {/* Logo UKM Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo UKM
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt="Logo UKM"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {user?.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setAvatarImageSrc(reader.result as string);
                            setShowAvatarCrop(true);
                          };
                          reader.readAsDataURL(file);
                        }
                        // Reset input
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <MdCameraAlt />
                      {uploadingAvatar ? 'Uploading...' : 'Ganti Logo'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG. Maks 2MB</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Security Settings */}
        <form onSubmit={handleChangePassword}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MdSecurity className="text-blue-600 text-2xl" />
              <h2 className="font-semibold text-gray-900">Keamanan</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? 'Mengubah...' : 'Ubah Password'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <MdNotifications className="text-blue-600 text-2xl" />
            <h2 className="font-semibold text-gray-900">Notifikasi</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Pesanan Baru</h3>
                <p className="text-xs text-gray-600">Dapatkan notifikasi saat ada pesanan baru</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.newOrder}
                  onChange={(e) => setNotifications({ ...notifications, newOrder: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Pesan Baru</h3>
                <p className="text-xs text-gray-600">Dapatkan notifikasi saat ada pesan dari pelanggan</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.newMessage}
                  onChange={(e) => setNotifications({ ...notifications, newMessage: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Update Produk</h3>
                <p className="text-xs text-gray-600">Dapatkan notifikasi tentang update produk</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.productUpdate}
                  onChange={(e) => setNotifications({ ...notifications, productUpdate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Newsletter</h3>
                <p className="text-xs text-gray-600">Terima tips dan update dari Lapak STIKOM</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.newsletter}
                  onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <MdLanguage className="text-blue-600 text-2xl" />
            <h2 className="font-semibold text-gray-900">Bahasa & Region</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bahasa
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Bahasa Indonesia</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Waktu
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>WIB - Jakarta</option>
                <option>WITA - Makassar</option>
                <option>WIT - Jayapura</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showAvatarCrop && avatarImageSrc && (
        <ImageCropModal
          isOpen={showAvatarCrop}
          imageSrc={avatarImageSrc}
          onCropComplete={handleAvatarCrop}
          onClose={() => {
            setShowAvatarCrop(false);
            setAvatarImageSrc('');
          }}
          isLoading={uploadingAvatar}
        />
      )}
    </UkmDashboardLayout>
  );
}
