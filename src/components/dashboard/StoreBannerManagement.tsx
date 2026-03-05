'use client';

import { useState, useEffect } from 'react';
import { MdImage, MdClose, MdCheck, MdPhotoLibrary, MdDragIndicator, MdDelete } from 'react-icons/md';
import { useToast } from '@/contexts/ToastContext';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
interface BannerLayout {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const BANNER_LAYOUTS: BannerLayout[] = [
  {
    id: 'layout_1',
    name: 'Layout 1 - Side by Side',
    description: '2 produk kiri-kanan dengan ukuran sama',
    preview: 'grid grid-cols-2 gap-2',
  },
  {
    id: 'layout_2',
    name: 'Layout 2 - Large + 2 Small',
    description: '1 besar kiri, 2 kecil kanan (atas-bawah)',
    preview: 'grid grid-cols-3 gap-2',
  },
  {
    id: 'layout_3',
    name: 'Layout 3 - Large Top + 3 Small',
    description: '1 besar atas, 3 kecil sejajar dibawah',
    preview: 'flex flex-col gap-2',
  },
];

interface StoreBannerManagementProps {
  currentLogo?: string;
  currentBio?: string;
  currentBackgroundUrl?: string;
  currentBanners?: any[];
  currentLayout?: string;
  onUpdate: () => void;
}

export function StoreBannerManagement({ 
  currentLogo, 
  currentBio, 
  currentBackgroundUrl,
  currentBanners = [],
  currentLayout = 'layout_1',
  onUpdate 
}: StoreBannerManagementProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogo || null);
  const [bio, setBio] = useState(currentBio || '');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(currentBackgroundUrl || null);
  const [selectedLayout, setSelectedLayout] = useState<string>(currentLayout);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);
  const [bannerPreviews, setBannerPreviews] = useState<string[]>([]);
    const [bannerUrlInput, setBannerUrlInput] = useState<string>('');
    const [bannerUrlPreviews, setBannerUrlPreviews] = useState<string[]>([]);
  
  // State untuk existing banners
  const [existingBanners, setExistingBanners] = useState<string[]>(currentBanners || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Update state when props change
  useEffect(() => {
    setLogoPreview(currentLogo || null);
    setBio(currentBio || '');
    setBackgroundPreview(currentBackgroundUrl || null);
    setExistingBanners(currentBanners || []);
    setSelectedLayout(currentLayout || 'layout_1');
  }, [currentLogo, currentBio, currentBackgroundUrl, currentBanners, currentLayout]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB', 'error');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar', 'error');
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Get max files based on layout
    const maxFiles = selectedLayout === 'layout_1' ? 2 : selectedLayout === 'layout_2' ? 3 : 4;
    
    if (files.length > maxFiles) {
      showToast(`Layout ini maksimal ${maxFiles} gambar`, 'error');
      return;
    }

    // Check file sizes
    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran file maksimal 2MB per gambar', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar', 'error');
        return;
      }
    }

    setBannerFiles(files);
    setBannerUrlInput(''); // reset manual URL jika upload file
    setBannerUrlPreviews([]);

    // Generate previews
    const previews: string[] = [];
    let loaded = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        loaded++;
        if (loaded === files.length) {
          setBannerPreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handler untuk input URL manual banner (didefinisikan di level komponen)
  const handleBannerUrlInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const url = e.target.value;
    setBannerUrlInput(url);
    setBannerFiles([]); // reset file jika input URL
    setBannerPreviews([]);
    if (url.trim() !== '') {
      // Support multiple URL dipisah koma/enter
      const urls = url.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
      setBannerUrlPreviews(urls);
    } else {
      setBannerUrlPreviews([]);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB for background)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5MB', 'error');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar', 'error');
      return;
    }

    setBackgroundFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBackgroundPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    if (!logoFile) {
      showToast('Pilih logo terlebih dahulu', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ukm/store/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast('Logo berhasil diupload!', 'success');
        setLogoFile(null);
        onUpdate();
      } else {
        showToast(data.message || 'Gagal upload logo', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal upload logo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBio = async () => {
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ukm/store/bio`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Deskripsi berhasil diperbarui!', 'success');
        onUpdate();
      } else {
        showToast(data.message || 'Gagal memperbarui deskripsi', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal memperbarui deskripsi', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Get layout class based on selected layout
  const getLayoutClass = (layout: string) => {
    switch(layout) {
      case 'layout_1': return 'grid grid-cols-2 gap-2';
      case 'layout_2': return 'grid grid-cols-3 gap-2';
      case 'layout_3': return 'space-y-2';
      default: return 'grid grid-cols-2 gap-2';
    }
  };

  // Get item class for specific position in layout
  const getItemClass = (layout: string, index: number) => {
    if (layout === 'layout_2' && index === 0) {
      return 'col-span-2 row-span-2 aspect-square';
    }
    if (layout === 'layout_3') {
      return index === 0 ? 'w-full h-64' : '';
    }
    return 'aspect-square';
  };

  const handleSaveBanners = async () => {
    if (bannerFiles.length === 0) {
      showToast('Pilih gambar banner terlebih dahulu', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('layout', selectedLayout);
      bannerFiles.forEach((file, index) => {
        formData.append(`banner_${index}`, file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ukm/store/banners`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast('Banner berhasil diupload!', 'success');
        setBannerFiles([]);
        setBannerPreviews([]);
        onUpdate();
      } else {
        showToast(data.message || 'Gagal upload banner', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal upload banner', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBackground = async () => {
    if (!backgroundFile) {
      showToast('Pilih gambar background terlebih dahulu', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', backgroundFile); // Using 'logo' field name as defined in uploadSingle

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ukm/store/background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast('Background banner berhasil diupload!', 'success');
        setBackgroundFile(null);
        onUpdate();
      } else {
        showToast(data.message || 'Gagal upload background', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal upload background', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Drag and Drop handlers untuk reorder banners
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBanners = [...existingBanners];
    const draggedItem = newBanners[draggedIndex];
    newBanners.splice(draggedIndex, 1);
    newBanners.splice(index, 0, draggedItem);

    setExistingBanners(newBanners);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    // Save new order to backend
    await savebannerOrder();
  };

  const savebannerOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ukm/store/banners/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ banners: existingBanners }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Urutan banner berhasil diperbarui!', 'success');
        onUpdate();
      } else {
        showToast(data.message || 'Gagal memperbarui urutan banner', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal memperbarui urutan banner', 'error');
    }
  };

  const handleDeleteBanner = async (index: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return;

    try {
      const newBanners = existingBanners.filter((_, i) => i !== index);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/ukm/store/banners`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ banners: newBanners }),
      });

      const data = await response.json();

      if (data.success) {
        setExistingBanners(newBanners);
        showToast('Banner berhasil dihapus!', 'success');
        onUpdate();
      } else {
        showToast(data.message || 'Gagal menghapus banner', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal menghapus banner', 'error');
    }
  };

  // Update layout when user selects different layout
  const handleLayoutChange = async (newLayout: string) => {
    setSelectedLayout(newLayout);
    
    // If there are existing banners, update the layout in backend
    if (existingBanners.length > 0) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/ukm/store/banners/layout`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ layout: newLayout }),
        });

        const data = await response.json();

        if (data.success) {
          showToast('Layout berhasil diperbarui!', 'success');
          onUpdate();
        }
      } catch (error: any) {
        console.error('Failed to update layout:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MdImage className="text-blue-600 text-2xl" />
          <h2 className="font-semibold text-gray-900">Logo Toko</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Upload logo toko Anda (maksimal 2MB, format: JPG, PNG)
        </p>
        
        <div className="flex items-center gap-4">
          {logoPreview && (
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
              <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={handleSaveLogo}
            disabled={uploading || !logoFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? 'Uploading...' : 'Simpan Logo'}
          </button>
        </div>
      </div>

      {/* Bio/Description */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MdImage className="text-blue-600 text-2xl" />
          <h2 className="font-semibold text-gray-900">Deskripsi Toko</h2>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Ceritakan tentang toko Anda..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveBio}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Menyimpan...' : 'Simpan Deskripsi'}
          </button>
        </div>
      </div>

      {/* Background Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MdPhotoLibrary className="text-blue-600 text-2xl" />
          <div>
            <h2 className="font-semibold text-gray-900">Background Banner Toko</h2>
            <p className="text-xs text-gray-500">Banner latar belakang header toko (1920x400px rekomendasi, maksimal 5MB)</p>
          </div>
        </div>
        
        {backgroundPreview && (
          <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200">
            <img src={backgroundPreview} alt="Background Preview" className="w-full h-48 object-cover" />
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundChange}
            className="block flex-1 text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <button
            onClick={handleSaveBackground}
            disabled={uploading || !backgroundFile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {uploading ? 'Uploading...' : 'Simpan Background'}
          </button>
        </div>
      </div>

      {/* Banner Upload with Layout Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MdImage className="text-blue-600 text-2xl" />
          <h2 className="font-semibold text-gray-900">Banner Produk</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Upload banner untuk menampilkan produk unggulan (600x600px, maksimal 2MB per gambar)
        </p>

        {/* Existing Banners - Draggable */}
        {existingBanners.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Banner Saat Ini</h3>
              <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                Layout: {BANNER_LAYOUTS.find(l => l.id === selectedLayout)?.name}
              </div>
            </div>
            
            <div className={getLayoutClass(selectedLayout)}>
              {selectedLayout === 'layout_3' ? (
                <>
                  {/* First banner - full width */}
                  {existingBanners[0] && (
                    <div
                      draggable
                      onDragStart={() => handleDragStart(0)}
                      onDragOver={(e) => handleDragOver(e, 0)}
                      onDragEnd={handleDragEnd}
                      className={`relative group rounded-lg overflow-hidden border-2 border-gray-300 cursor-move hover:border-blue-500 transition-all ${
                        draggedIndex === 0 ? 'opacity-50 scale-95' : ''
                      } ${getItemClass(selectedLayout, 0)}`}
                    >
                      <img src={existingBanners[0]} alt="Banner 1" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MdDragIndicator className="text-lg" />
                      </div>
                      <button
                        onClick={() => handleDeleteBanner(0)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                      >
                        <MdDelete className="text-lg" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        1
                      </div>
                    </div>
                  )}
                  {/* Remaining banners in 3-column grid */}
                  {existingBanners.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {existingBanners.slice(1).map((banner, idx) => {
                        const index = idx + 1;
                        return (
                          <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`relative group rounded-lg overflow-hidden border-2 border-gray-300 cursor-move hover:border-blue-500 transition-all aspect-square ${
                              draggedIndex === index ? 'opacity-50 scale-95' : ''
                            }`}
                          >
                            <img src={banner} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-black/50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MdDragIndicator className="text-lg" />
                            </div>
                            <button
                              onClick={() => handleDeleteBanner(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                            >
                              <MdDelete className="text-lg" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                              {index + 1}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                existingBanners.map((banner, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`relative group rounded-lg overflow-hidden border-2 border-gray-300 cursor-move hover:border-blue-500 transition-all ${
                      draggedIndex === index ? 'opacity-50 scale-95' : ''
                    } ${getItemClass(selectedLayout, index)}`}
                  >
                    <img src={banner} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/50 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MdDragIndicator className="text-lg" />
                    </div>
                    <button
                      onClick={() => handleDeleteBanner(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                    >
                      <MdDelete className="text-lg" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Drag banner untuk mengubah urutan, klik <MdDelete className="inline text-red-500" /> untuk hapus
            </p>
          </div>
        )}

        {/* Separator if there are existing banners */}
        {existingBanners.length > 0 && (
          <div className="border-t border-gray-200 my-6"></div>
        )}

        {/* Upload New Banners Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Banner Baru</h3>

        {/* Layout Selection */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Layout Banner
          </label>
          {BANNER_LAYOUTS.map((layout) => (
            <div
              key={layout.id}
              onClick={() => handleLayoutChange(layout.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedLayout === layout.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{layout.name}</h3>
                    {selectedLayout === layout.id && (
                      <MdCheck className="text-blue-600 text-xl" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{layout.description}</p>
                  
                  {/* Layout Preview */}
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <p className="text-xs text-gray-500 mb-2">Preview layout:</p>
                    {layout.id === 'layout_1' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded aspect-square flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">1</span>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded aspect-square flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">2</span>
                        </div>
                      </div>
                    )}
                    {layout.id === 'layout_2' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 row-span-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded aspect-square flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">1</span>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded aspect-square flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">2</span>
                        </div>
                        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded aspect-square flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">3</span>
                        </div>
                      </div>
                    )}
                    {layout.id === 'layout_3' && (
                      <div className="flex flex-col gap-2">
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded h-24 flex items-center justify-center">
                          <span className="text-white font-semibold">1</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded aspect-square flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">2</span>
                          </div>
                          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded aspect-square flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">3</span>
                          </div>
                          <div className="bg-gradient-to-br from-pink-400 to-pink-600 rounded aspect-square flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">4</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Opsi A: Upload file ke Supabase */}
        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">Upload Gambar ke Supabase Storage</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleBannerChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-2">
            Upload {selectedLayout === 'layout_1' ? '2' : selectedLayout === 'layout_2' ? '3' : '4'} gambar sesuai layout yang dipilih
          </p>
        </div>

        {/* Pembatas visual */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="mx-4 text-gray-400 font-semibold">ATAU</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Opsi B: Input URL manual */}
        <div className="mb-4">
          <label className="block font-medium text-gray-700 mb-1">Masukkan URL Gambar Manual</label>
          <textarea
            placeholder="https://... (bisa lebih dari satu, pisahkan dengan enter/koma)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={bannerUrlInput}
            onChange={handleBannerUrlInput}
            disabled={uploading}
            rows={2}
          />
          <p className="text-xs text-gray-500 mt-2">Masukkan URL gambar jika tidak ingin upload file.</p>
        </div>

        {/* Preview */}
        {(bannerPreviews.length > 0 /* file upload */ || false /* TODO: manual URL state */) && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <div className={getLayoutClass(selectedLayout)}>
              {selectedLayout === 'layout_3' ? (
                <>
                  {bannerPreviews[0] && (
                    <div className={`rounded-lg overflow-hidden border-2 border-gray-200 ${getItemClass(selectedLayout, 0)}`}>
                      <img src={bannerPreviews[0]} alt="Banner 1" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {bannerPreviews.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {bannerPreviews.slice(1).map((preview, idx) => (
                        <div key={idx + 1} className="rounded-lg overflow-hidden border-2 border-gray-200 aspect-square">
                          <img src={preview} alt={`Banner ${idx + 2}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                bannerPreviews.map((preview, index) => (
                  <div
                    key={index}
                    className={`rounded-lg overflow-hidden border-2 border-gray-200 ${getItemClass(selectedLayout, index)}`}
                  >
                    <img src={preview} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSaveBanners}
            disabled={uploading || (bannerFiles.length === 0 && bannerUrlPreviews.length === 0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? 'Uploading...' : 'Simpan Banner'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
