'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { getRoleLabel } from '@/lib/utils';
import { apiPut, apiPost } from '@/lib/api';
import { ImageCropModal } from '@/components/profile/ImageCropModal';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isLoggedIn, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'orders' | 'seller'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    birth_date: '',
    bio: '',
    avatar_url: '',
    nim: '',
    program_studi: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (user) {
      // Format birth_date untuk input date (YYYY-MM-DD)
      let formattedBirthDate = '';
      if (user.birth_date) {
        const date = new Date(user.birth_date);
        if (!isNaN(date.getTime())) {
          formattedBirthDate = date.toISOString().split('T')[0];
        }
      }
      
      console.log('User birth_date from API:', user.birth_date);
      console.log('Formatted birth_date:', formattedBirthDate);
      
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        birth_date: formattedBirthDate,
        bio: user.bio || '',
        avatar_url: user.avatar_url || '',
        nim: user.nim || '',
        program_studi: user.program_studi || '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiPut('/profile', {
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
        birth_date: formData.birth_date,
        bio: formData.bio,
        nim: formData.nim,
        program_studi: formData.program_studi,
      });

      setSuccess('Profil berhasil diperbarui!');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Password baru tidak cocok');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiPost('/profile/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      setSuccess('Password berhasil diubah!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF');
      return;
    }

    // Read file and show crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingAvatar(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengupload avatar');
      }

      const data = await response.json();
      const newAvatarUrl = data.data?.avatar_url || data.avatar_url;
      
      setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      setSuccess('Avatar berhasil diupload!');
      await refresh();
      
      // Close modal
      setShowCropModal(false);
      setImageToCrop('');
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop('');
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) {
      return;
    }

    setUploadingAvatar(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/avatar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus foto profil');
      }

      setSuccess('Foto profil berhasil dihapus!');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus foto profil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="h-96 bg-gray-200 rounded-xl" />
              <div className="lg:col-span-3 h-96 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  const menuItems = [
    { id: 'profile' as const, label: 'Profil Saya', icon: '' },
    { id: 'password' as const, label: 'Ubah Password', icon: '' },
    { id: 'orders' as const, label: 'Pesanan Saya', icon: '' },
    { id: 'seller' as const, label: 'Dashboard Seller', icon: '' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pengaturan Akun</h1>
          <p className="text-gray-600 mt-1">Kelola informasi profil dan keamanan akun Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              {/* Profile Card */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                {/* Avatar */}
                <div className="relative w-24 h-24 mx-auto mb-4">
                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt={user.full_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-3xl">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Username */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {formData.username || 'username'}
                </h3>
                
                {/* Bio */}
                {formData.bio ? (
                  <p className="text-sm text-gray-600 mb-3 px-2 line-clamp-3">
                    {formData.bio}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 mb-3 italic">
                    Belum ada bio
                  </p>
                )}
                
                {/* Role Badge */}
                <span className="inline-block px-4 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {getRoleLabel(user.role)}
                </span>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />

              {/* Menu */}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {/* Alerts */}
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Informasi Profil</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    {/* Avatar Upload Section */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Foto Profil
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {formData.avatar_url ? (
                            <img
                              src={formData.avatar_url}
                              alt="Avatar"
                              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleAvatarClick}
                              isLoading={uploadingAvatar}
                              variant="outline"
                            >
                              {uploadingAvatar ? 'Mengupload...' : 'Upload Foto'}
                            </Button>
                            {formData.avatar_url && (
                              <Button
                                type="button"
                                onClick={handleDeleteAvatar}
                                isLoading={uploadingAvatar}
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Hapus Foto
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            JPG, PNG, WebP, atau GIF. Maksimal 5MB.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Ceritakan tentang diri Anda..."
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {formData.bio.length}/500 karakter
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nama lengkap"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                          placeholder="email@example.com"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nomor Telepon
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jenis Kelamin
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Pilih jenis kelamin</option>
                          <option value="LAKI_LAKI">Laki-laki</option>
                          <option value="PEREMPUAN">Perempuan</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NIM
                        </label>
                        <input
                          type="text"
                          value={formData.nim}
                          onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="NIM Mahasiswa"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Program Studi
                        </label>
                        <input
                          type="text"
                          value={formData.program_studi}
                          onChange={(e) => setFormData({ ...formData, program_studi: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contoh: Teknik Informatika"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" isLoading={loading}>
                        Simpan Perubahan
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Ubah Password</h2>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Saat Ini <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan password saat ini"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Baru <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        required
                        minLength={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Minimal 8 karakter"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Konfirmasi Password Baru <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        required
                        minLength={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ulangi password baru"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" isLoading={loading}>
                        Ubah Password
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Pesanan Saya</h2>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pesanan</h3>
                    <p className="text-gray-600 mb-4">Mulai berbelanja dan pesanan Anda akan muncul di sini</p>
                    <Link href="/products">
                      <Button>Mulai Belanja</Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Seller Tab */}
              {activeTab === 'seller' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Seller</h2>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                      <h3 className="text-lg font-semibold mb-2">Mulai Berjualan di Lapak STIKOM</h3>
                      <p className="text-blue-100 mb-4">Jual produk Anda dan raih peluang bisnis baru</p>
                      <Link href="/products/create">
                        <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-50">
                          Tambah Produk
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Produk</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Pesanan Masuk</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total Penjualan</p>
                        <p className="text-2xl font-bold text-gray-900">Rp 0</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link href="/dashboard/products" className="flex-1">
                        <Button variant="outline" className="w-full">
                          Kelola Produk
                        </Button>
                      </Link>
                      <Link href="/dashboard/orders" className="flex-1">
                        <Button variant="outline" className="w-full">
                          Pesanan Masuk
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        imageSrc={imageToCrop}
        onClose={handleCropCancel}
        onCropComplete={handleCropComplete}
        isLoading={uploadingAvatar}
      />

      <Footer />
    </div>
  );
}
