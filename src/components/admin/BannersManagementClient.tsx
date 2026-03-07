'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload, ApiResponse } from '@/lib/api';
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react';

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

type BannerType = 'HERO' | 'PROMO_FULL' | 'PROMO_LARGE' | 'PROMO_SMALL';

const BANNER_TYPE_CONFIG: Record<BannerType, { label: string; size: string; width: number; height: number }> = {
  HERO: { label: 'Hero Carousel', size: '1368×442', width: 1368, height: 442 },
  PROMO_FULL: { label: 'Promo Full Width', size: '1368×310', width: 1368, height: 310 },
  PROMO_LARGE: { label: 'Promo Large', size: '680×680', width: 680, height: 680 },
  PROMO_SMALL: { label: 'Promo Small', size: '330×330', width: 330, height: 330 },
};

export function BannersManagementClient() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'promo'>('hero');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    banner_type: 'HERO' as BannerType,
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
    setError(null);
    try {
      const response = await apiGet<ApiResponse<Banner[]>>('/homepage/banners', true);
      if (response.success && response.data) {
        setBanners(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data banners');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran file maksimal 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append('image', file);

      const result = await apiUpload<ApiResponse<{ url: string }>>('/homepage/banners/upload', formDataObj, true);

      if (result.success && result.data?.url) {
        setFormData({ ...formData, image_url: result.data.url });
        setSuccess('Gambar berhasil diupload');
      } else {
        setError(result.message || 'Gagal upload gambar');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal upload gambar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);
    setSuccess('');

    try {
      const dataToSend = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      if (editingBanner) {
        const response = await apiPut<ApiResponse<Banner>>(`/homepage/banners/${editingBanner.id}`, dataToSend, true);
        if (response.success) {
          setSuccess('Banner berhasil diupdate');
          fetchBanners();
          handleCancel();
        }
      } else {
        const response = await apiPost<ApiResponse<Banner>>('/homepage/banners', dataToSend, true);
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
    setError(null);
    setSuccess('');

    try {
      const response = await apiDelete<ApiResponse<null>>(`/homepage/banners/${deletingBanner.id}`, true);
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
      banner_type: activeSection === 'hero' ? 'HERO' : 'PROMO_FULL',
      display_order: 0,
      is_active: true,
      start_date: '',
      end_date: '',
    });
  };

  const openAddForm = (type: BannerType) => {
    setFormData({
      ...formData,
      banner_type: type,
    });
    setShowForm(true);
  };

  const heroBanners = banners.filter(b => b.banner_type === 'HERO');
  const promoBanners = banners.filter(b => b.banner_type !== 'HERO');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
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

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveSection('hero')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            activeSection === 'hero' 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Hero Banner ({heroBanners.length})
        </button>
        <button
          onClick={() => setActiveSection('promo')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            activeSection === 'promo' 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Promo Banner ({promoBanners.length})
        </button>
      </div>

      {/* Hero Section */}
      {activeSection === 'hero' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-medium text-gray-900">Hero Carousel</h2>
              <p className="text-[10px] text-gray-500">Banner utama di homepage (1368×442 px)</p>
            </div>
            <button
              onClick={() => openAddForm('HERO')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-3 h-3" />
              Tambah Hero
            </button>
          </div>

          <div className="grid gap-3">
            {heroBanners.map((banner) => (
              <BannerCard 
                key={banner.id} 
                banner={banner} 
                onEdit={handleEdit} 
                onDelete={setDeletingBanner} 
              />
            ))}
            {heroBanners.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Belum ada hero banner</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promo Section */}
      {activeSection === 'promo' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-medium text-gray-900">Promo Banners</h2>
              <p className="text-[10px] text-gray-500">Banner promosi dengan berbagai ukuran</p>
            </div>
            <div className="relative group">
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-3 h-3" />
                Tambah Promo
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {(['PROMO_FULL', 'PROMO_LARGE', 'PROMO_SMALL'] as BannerType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => openAddForm(type)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <span className="font-medium">{BANNER_TYPE_CONFIG[type].label}</span>
                    <span className="text-gray-500 ml-1">({BANNER_TYPE_CONFIG[type].size})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group by type */}
          {(['PROMO_FULL', 'PROMO_LARGE', 'PROMO_SMALL'] as BannerType[]).map((type) => {
            const typeBanners = promoBanners.filter(b => b.banner_type === type);
            if (typeBanners.length === 0) return null;
            
            return (
              <div key={type} className="space-y-2">
                <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  {BANNER_TYPE_CONFIG[type].label} ({BANNER_TYPE_CONFIG[type].size})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {typeBanners.map((banner) => (
                    <BannerCard 
                      key={banner.id} 
                      banner={banner} 
                      onEdit={handleEdit} 
                      onDelete={setDeletingBanner} 
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {promoBanners.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Belum ada promo banner</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
                  </h2>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {BANNER_TYPE_CONFIG[formData.banner_type].label} • {BANNER_TYPE_CONFIG[formData.banner_type].size}
                  </p>
                </div>
                <button onClick={handleCancel} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Judul Banner *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gambar Banner *
                </label>
                
                {/* Upload Options */}
                <div className="space-y-2">
                  {/* Supabase Upload */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload ke Supabase'}
                    </button>
                    <span className="text-[10px] text-gray-500 self-center">atau</span>
                  </div>

                  {/* Manual URL */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://... (Cloudinary, ImgBB, dll)"
                        required
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {formData.image_url && (
                    <div className="mt-2 relative rounded-md overflow-hidden border border-gray-200">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/placeholder-product.svg';
                        }}
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-gray-500">
                    📐 Ukuran: {BANNER_TYPE_CONFIG[formData.banner_type].size} • Max 10MB
                  </p>
                </div>
              </div>

              {/* Banner Type (readonly when editing) */}
              {!editingBanner && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tipe Banner
                  </label>
                  <select
                    value={formData.banner_type}
                    onChange={(e) => setFormData({ ...formData, banner_type: e.target.value as BannerType })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.entries(BANNER_TYPE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label} ({config.size})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Link URL */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Link URL (opsional)
                </label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="/products atau https://..."
                />
              </div>

              {/* Order & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tanggal Berakhir
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editingBanner ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Hapus Banner</h2>
            <p className="text-xs text-gray-600 mb-4">
              Apakah Anda yakin ingin menghapus banner "{deletingBanner.title}"?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingBanner(null)}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {processing && <Loader2 className="w-3 h-3 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Banner Card Component
function BannerCard({ 
  banner, 
  onEdit, 
  onDelete 
}: { 
  banner: Banner; 
  onEdit: (banner: Banner) => void; 
  onDelete: (banner: Banner) => void;
}) {
  const config = BANNER_TYPE_CONFIG[banner.banner_type];
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="relative aspect-[16/6]">
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder-product.svg';
          }}
        />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-black/60 text-white rounded">
            {config?.size}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <span className={cn(
            "px-1.5 py-0.5 text-[10px] font-medium rounded",
            banner.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
          )}>
            {banner.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-xs font-medium text-gray-900 truncate">{banner.title}</h3>
        {banner.description && (
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{banner.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-400">Order: {banner.display_order}</span>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(banner)}
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(banner)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
