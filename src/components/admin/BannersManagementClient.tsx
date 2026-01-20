'use client';

import { useState, useEffect } from 'react';
import { Button, Alert } from '@/components/ui';
import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from '@/lib/api';

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  banner_type: 'HERO' | 'PROMO_FULL' | 'PROMO_LARGE' | 'PROMO_SMALL';
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export function BannersManagementClient() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    banner_type: 'HERO' as 'HERO' | 'PROMO_FULL' | 'PROMO_LARGE' | 'PROMO_SMALL',
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiGet<ApiResponse<Banner[]>>('/homepage/banners');
      
      if (response.success && response.data) {
        setBanners(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data, convert empty strings to null for optional date fields
      const dataToSend = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (editingBanner) {
        const response = await apiPut<ApiResponse<Banner>>(`/homepage/banners/${editingBanner.id}`, dataToSend);
        if (response.success) {
          setSuccess('Banner berhasil diupdate');
          fetchBanners();
          handleCancel();
        }
      } else {
        const response = await apiPost<ApiResponse<Banner>>('/homepage/banners', dataToSend);
        if (response.success) {
          setSuccess('Banner berhasil ditambahkan');
          fetchBanners();
          handleCancel();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan banner');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      banner_type: banner.banner_type || 'HERO',
      display_order: banner.display_order,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    
    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiDelete<ApiResponse<null>>(`/homepage/banners/${deletingBanner.id}`);
      if (response.success) {
        setSuccess('Banner berhasil dihapus');
        fetchBanners();
        setDeletingBanner(null);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus banner');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      banner_type: 'HERO',
      display_order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="bg-gray-200 rounded-xl h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-gray-600 mt-1">Kelola banner homepage</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          + Tambah Banner
        </Button>
      </div>

      {/* Alerts */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="relative h-48">
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                {banner.is_active ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Active</span>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">Inactive</span>
                )}
              </div>
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {banner.banner_type}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{banner.title}</h3>
              {banner.description && (
                <p className="text-sm text-gray-600 mb-3">{banner.description}</p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span className="text-xs">
                  {banner.banner_type === 'HERO' && '📐 1368x442'}
                  {banner.banner_type === 'PROMO_FULL' && '📐 1368x310'}
                  {banner.banner_type === 'PROMO_LARGE' && '📐 680x680'}
                  {banner.banner_type === 'PROMO_SMALL' && '📐 330x330'}
                </span>
                <span>Order: {banner.display_order}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingBanner(banner)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {banners.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada banner. Klik "Tambah Banner" untuk membuat banner baru.</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
                  </h2>
                  <div className="text-sm text-gray-600 mt-2 bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="font-medium text-blue-900 mb-1">📌 Cara upload gambar ke Cloudinary (Recommended):</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Daftar gratis di <a href="https://cloudinary.com" target="_blank" className="text-blue-600 underline">cloudinary.com</a> (10GB gratis)</li>
                      <li>Upload gambar via dashboard</li>
                      <li>Klik gambar → klik <strong>"Link"</strong> icon → pilih <strong>"Copy URL"</strong></li>
                      <li>⚠️ Pastikan dapat <strong>full image URL</strong> (bukan thumbnail)</li>
                      <li>✅ URL benar: <code className="bg-white px-1 rounded text-green-600">https://res.cloudinary.com/xxx/image/upload/vxxx/file.jpg</code></li>
                    </ol>
                    <p className="text-xs text-gray-500 mt-2">Alternatif: ImgBB, Imgur (pastikan dapat direct image URL)</p>
                  </div>
                </div>
                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Banner *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL * (1200x400 recommended)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <p><strong>💡 Tips agar gambar tidak pecah:</strong></p>
                    <ul className="list-disc list-inside ml-2">
                      <li>Upload gambar dengan resolusi <strong>MINIMAL 1920x620 pixels</strong></li>
                      <li>Untuk hasil terbaik: <strong>2736x884 pixels</strong> (2x retina)</li>
                      <li>Format: JPG quality 85-90% atau PNG</li>
                      <li>Ukuran file: max 1MB</li>
                    </ul>
                    <p className="text-blue-600">Ukuran sesuai tipe: HERO (1368x442), PROMO_FULL (1368x310), PROMO_LARGE (680x680), PROMO_SMALL (330x330)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Banner *
                  </label>
                  <select
                    value={formData.banner_type}
                    onChange={(e) => setFormData({ ...formData, banner_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="HERO">HERO - Carousel Utama (1368x442)</option>
                    <option value="PROMO_FULL">PROMO_FULL - Banner Full Width (1368x310)</option>
                    <option value="PROMO_LARGE">PROMO_LARGE - Banner Besar (680x680)</option>
                    <option value="PROMO_SMALL">PROMO_SMALL - Banner Kecil (330x330)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/products"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.is_active ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Kosongkan jika aktif dari sekarang</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ada batas waktu</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                    Batal
                  </Button>
                  <Button type="submit" isLoading={processing} className="flex-1">
                    {editingBanner ? 'Update' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Hapus Banner</h2>
            <p className="text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus banner "{deletingBanner.title}"?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeletingBanner(null)} className="flex-1">
                Batal
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={processing} className="flex-1">
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
