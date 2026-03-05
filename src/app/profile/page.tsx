'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { getRoleLabel, formatCurrency } from '@/lib/utils';
import { apiPut, apiPost, apiGet, ApiResponse } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ImageCropModal } from '@/components/profile/ImageCropModal';
import { Store, Package, ShoppingCart, Wallet, ArrowRight, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { HiUser, HiShoppingBag } from 'react-icons/hi2';
import { RiLockPasswordFill, RiStore2Fill } from 'react-icons/ri';

interface SellerStatus {
  is_seller: boolean;
  seller_type: 'UKM' | 'CIVITAS' | null;
  profile: {
    id: string;
    store_name: string;
    store_description: string;
    status: string;
  } | null;
}

interface SellerDashboard {
  profile: SellerStatus['profile'];
  stats: {
    total_products: number;
    active_products: number;
    total_orders: number;
    pending_orders: number;
    total_revenue: number;
  };
}

const SELLER_TERMS = [
  'Hanya menjual produk legal dan sesuai ketentuan kampus',
  'Deskripsi dan foto produk harus akurat',
  'Kirim produk dalam 3 hari kerja',
  'Respon pembeli dalam 24 jam',
  'Terima pengembalian jika produk tidak sesuai',
  'Biaya platform 5% per transaksi',
];

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isLoggedIn, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'orders' | 'seller'>('profile');
  const [orderTab, setOrderTab] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set tab from URL param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders' || tab === 'profile' || tab === 'password' || tab === 'seller') {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  // Seller states
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null);
  const [sellerDashboard, setSellerDashboard] = useState<SellerDashboard | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerRegistering, setSellerRegistering] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

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

      // Fetch seller status for civitas users
      if (user.role !== 'ADMIN' && user.role !== 'UKM_OFFICIAL') {
        fetchSellerStatus();
      }
    }
  }, [user]);

  // Fetch seller status
  const fetchSellerStatus = async () => {
    // Ensure token exists before making API call
    const token = getToken();
    if (!token) {
      console.warn('No token available for seller status fetch');
      return;
    }
    
    setSellerLoading(true);
    try {
      const response = await apiGet<ApiResponse<SellerStatus>>('/seller/status');
      if (response.success && response.data) {
        setSellerStatus(response.data);
        
        // If already a seller, fetch dashboard data
        if (response.data.is_seller) {
          fetchSellerDashboard();
        }
      }
    } catch (err) {
      console.error('Error fetching seller status:', err);
    } finally {
      setSellerLoading(false);
    }
  };

  // Fetch seller dashboard
  const fetchSellerDashboard = async () => {
    // Ensure token exists before making API call
    const token = getToken();
    if (!token) {
      console.warn('No token available for seller dashboard fetch');
      return;
    }
    
    try {
      const response = await apiGet<ApiResponse<SellerDashboard>>('/seller/dashboard');
      if (response.success && response.data) {
        setSellerDashboard(response.data);
      }
    } catch (err) {
      console.error('Error fetching seller dashboard:', err);
    }
  };

  // Register as seller
  const handleSellerRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    // Ensure token exists before making API call
    const token = getToken();
    if (!token) {
      setError('Sesi telah berakhir. Silakan login kembali.');
      return;
    }

    setSellerRegistering(true);
    setError('');

    try {
      const response = await apiPost<ApiResponse>('/seller/register', {
        terms_accepted: termsAccepted,
      });

      if (response.success) {
        setSuccess('Berhasil mendaftar sebagai seller!');
        fetchSellerStatus();
      } else {
        setError(response.message || 'Gagal mendaftar sebagai seller');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar sebagai seller');
    } finally {
      setSellerRegistering(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.gender) { setError('Jenis kelamin wajib diisi'); setLoading(false); return; }
    if (!formData.nim.trim()) { setError('NIM wajib diisi'); setLoading(false); return; }
    if (!formData.program_studi.trim()) { setError('Program studi wajib diisi'); setLoading(false); return; }
    if (!formData.phone.trim()) { setError('Nomor telepon wajib diisi'); setLoading(false); return; }

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
    { id: 'profile' as const, label: 'Profil Saya', icon: <HiUser className="w-5 h-5" /> },
    { id: 'password' as const, label: 'Ubah Password', icon: <RiLockPasswordFill className="w-5 h-5" /> },
    { id: 'orders' as const, label: 'Pesanan Saya', icon: <HiShoppingBag className="w-5 h-5" /> },
    // Only show seller menu for civitas (non-UKM, non-ADMIN)
    ...(user.role !== 'ADMIN' && user.role !== 'UKM_OFFICIAL' 
      ? [{ id: 'seller' as const, label: 'Dashboard Seller', icon: <RiStore2Fill className="w-5 h-5" /> }] 
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
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
                    {item.icon}
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
                          Nomor Telepon <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jenis Kelamin <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          required
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
                          NIM <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.nim}
                          onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="NIM Mahasiswa"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Program Studi <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.program_studi}
                          onChange={(e) => setFormData({ ...formData, program_studi: e.target.value })}
                          required
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Pesanan Saya</h2>

                  {/* Search bar */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Cari pesanan (nama produk, no. pesanan...)"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Status tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1 mb-6 border-b border-gray-100">
                    {[
                      { key: 'all',       label: 'Semua' },
                      { key: 'unpaid',    label: 'Belum Bayar' },
                      { key: 'packed',    label: 'Sedang Dikemas' },
                      { key: 'shipped',   label: 'Dikirim' },
                      { key: 'done',      label: 'Selesai' },
                      { key: 'cancelled', label: 'Dibatalkan' },
                      { key: 'return',    label: 'Pengembalian' },
                    ].map(t => (
                      <button
                        key={t.key}
                        onClick={() => setOrderTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                          orderTab === t.key
                            ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Empty state */}
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">Belum ada pesanan</h3>
                    <p className="text-sm text-gray-500 mb-4">Mulai berbelanja dan pesanan Anda akan muncul di sini</p>
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
                  
                  {sellerLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : sellerStatus?.is_seller ? (
                    /* Already registered - Show overview */
                    <div className="space-y-6">
                      {/* Store Info */}
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                          <Store className="w-6 h-6" />
                          <h3 className="text-lg font-semibold">{sellerStatus.profile?.store_name || 'Toko Anda'}</h3>
                        </div>
                        <p className="text-blue-100 text-sm">
                          {sellerStatus.profile?.store_description || 'Toko Anda siap untuk berjualan!'}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {sellerDashboard?.stats.total_products || 0}
                              </p>
                              <p className="text-sm text-gray-600">Total Produk</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                              <ShoppingCart className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {sellerDashboard?.stats.pending_orders || 0}
                              </p>
                              <p className="text-sm text-gray-600">Pesanan Masuk</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(sellerDashboard?.stats.total_revenue || 0)}
                              </p>
                              <p className="text-sm text-gray-600">Saldo</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link href="/seller/dashboard">
                        <Button className="w-full flex items-center justify-center gap-2">
                          <Store className="w-4 h-4" />
                          Buka Dashboard Seller
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    /* Not registered - Show registration form */
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="text-center pb-4 border-b border-gray-200">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-3">
                          <Store className="w-7 h-7 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Mulai Berjualan</h3>
                        <p className="text-sm text-gray-600">Daftarkan toko Anda dan mulai raih keuntungan</p>
                      </div>

                      {/* Terms */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-medium text-gray-900">Syarat & Ketentuan Seller</h4>
                        </div>
                        <ul className="space-y-2">
                          {SELLER_TERMS.map((term, index) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-gray-600">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                              {term}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Registration Form */}
                      <form onSubmit={handleSellerRegistration} className="space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            Saya telah membaca dan menyetujui <span className="font-medium text-blue-600">Syarat dan Ketentuan Seller</span>
                          </span>
                        </label>

                        <Button
                          type="submit"
                          disabled={sellerRegistering || !termsAccepted}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          {sellerRegistering ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Store className="w-4 h-4" />
                              Daftar Sebagai Seller
                            </>
                          )}
                        </Button>
                      </form>
                    </div>
                  )}
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

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageContent />
    </Suspense>
  );
}
