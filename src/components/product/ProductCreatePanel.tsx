'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent, DragEvent } from 'react';
import { CreateProductRequest, Product, Category } from '@/types';
import { createProduct, getCategories } from '@/lib/products';
import { apiUpload } from '@/lib/api';
import Image from 'next/image';
import {
  MdClose, MdCloudUpload, MdImage, MdDelete, MdCheck,
  MdAdd, MdRemove, MdExpandMore, MdExpandLess,
} from 'react-icons/md';

interface ProductCreatePanelProps {
  open: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}

const CONDITION_OPTIONS = [
  { value: 'NEW',   label: 'Baru',  color: 'blue' },
  { value: 'USED',  label: 'Bekas', color: 'amber' },
  { value: 'FOODS', label: 'Foods', color: 'green' },
] as const;

const ALLOWED_CATEGORIES = [
  'Gadget & Elektronik', 'Fashion', 'Makanan & Minuman', 'Aksesoris', 'Hobi & Koleksi',
];

function formatRupiah(value: string) {
  const clean = value.replace(/[^\d]/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function parseRupiah(value: string) {
  return parseInt(value.replace(/\D/g, '') || '0', 10);
}

export default function ProductCreatePanel({ open, onClose, onCreated }: ProductCreatePanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceStrikedInput, setPriceStrikedInput] = useState('');
  const [stock, setStock] = useState(1);
  const [condition, setCondition] = useState<'NEW' | 'USED' | 'FOODS'>('NEW');
  const [categoryId, setCategoryId] = useState('');
  const [isPreorder, setIsPreorder] = useState(false);
  const [preorderDays, setPreorderDays] = useState(7);
  const [variations, setVariations] = useState<{ name: string; options: string[] }[]>([]);
  const [variationRaws, setVariationRaws] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      getCategories()
        .then(all => setCategories(all.filter(c => ALLOWED_CATEGORIES.includes(c.name))))
        .catch(() => setCategories([]));
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      // reset form when closed
      setTitle(''); setDescription(''); setPriceInput(''); setPriceStrikedInput('');
      setStock(1); setCondition('NEW'); setCategoryId(''); setIsPreorder(false);
      setPreorderDays(7); setVariations([]); setVariationRaws([]); setShowVariations(false);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setSelectedImages([]); setImagePreviews([]); setError('');
    }
  }, [open]);

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter(f => f.type.startsWith('image/')).slice(0, 5 - selectedImages.length);
    if (selectedImages.length + valid.length > 5) {
      setError('Maksimal 5 foto produk'); return;
    }
    if (!valid.length) return;
    const previews = valid.map(f => URL.createObjectURL(f));
    setSelectedImages(prev => [...prev, ...valid]);
    setImagePreviews(prev => [...prev, ...previews]);
    setError('');
  }, [selectedImages]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const price = parseRupiah(priceInput);
  const priceStriked = parseRupiah(priceStrikedInput);
  const discount = priceStriked > price && priceStriked > 0
    ? Math.round(((priceStriked - price) / priceStriked) * 100) : 0;

  const validate = () => {
    if (!title.trim()) { setError('Nama produk wajib diisi'); return false; }
    if (!price || price <= 0) { setError('Harga harus lebih dari 0'); return false; }
    if (stock < 0) { setError('Stok tidak boleh negatif'); return false; }
    return true;
  };

  const uploadImages = async (productId: string) => {
    for (const file of selectedImages) {
      const fd = new FormData();
      fd.append('image', file);
      try {
        await apiUpload(`/products/${productId}/upload-image`, fd);
      } catch { /* non-fatal */ }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setError('');
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        price,
        price_striked: priceStriked > 0 ? priceStriked : null,
        stock,
        condition,
        category_id: categoryId || undefined,
        is_preorder: isPreorder,
        preorder_days: isPreorder ? preorderDays : undefined,
        variations: variations.length > 0 ? variations.map((v, i) => ({
          name: v.name,
          options: (variationRaws[i] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
        })) : [],
        status: 'ACTIVE',
      };
      const product = await createProduct(payload);
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        await uploadImages(product.id);
        setUploadingImages(false);
      }
      onCreated(product);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambah produk');
    } finally {
      setLoading(false); setUploadingImages(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all duration-300 ${open ? '' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-gray-50 shadow-2xl transform transition-transform duration-300 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tambah Produk</h2>
            <p className="text-xs text-gray-500 mt-0.5">Isi detail produk yang ingin dijual</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex gap-2 items-start">
              <span className="shrink-0 mt-0.5"></span>
              <span>{error}</span>
            </div>
          )}

          {/*  Section: Foto Produk  */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MdImage className="text-blue-500" />
              Foto Produk
              <span className="text-xs text-gray-400 font-normal">({selectedImages.length}/5)</span>
            </h3>

            {/* Drop Zone */}
            {selectedImages.length < 5 && (
              <div
                onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors p-6 text-center ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <MdCloudUpload className={`text-4xl mx-auto mb-2 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-300'}`} />
                <p className="text-sm font-medium text-gray-600">
                  {isDragging ? 'Lepaskan untuk mengunggah' : 'Klik atau seret foto ke sini'}
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP  Maks. 5 foto  5MB per foto</p>
              </div>
            )}

            {/* Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image src={src} alt={`Foto ${i + 1}`} fill className="object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 text-[10px] text-white text-center py-0.5 font-medium">
                        Utama
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    >
                      <MdClose className="text-xs" />
                    </button>
                  </div>
                ))}
                {selectedImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors flex items-center justify-center text-gray-400 hover:text-blue-400"
                  >
                    <MdAdd className="text-xl" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/*  Section: Info Dasar  */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Info Produk</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nama Produk <span className="text-red-500">*</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Jaket Anime Attack on Titan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Deskripsikan produk Anda secara detail..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/*  Section: Harga & Stok  */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Harga & Stok</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Harga Jual <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={e => setPriceInput(formatRupiah(e.target.value))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Harga Coret
                  <span className="ml-1 text-[10px] text-gray-400">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceStrikedInput}
                    onChange={e => setPriceStrikedInput(formatRupiah(e.target.value))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            {discount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-red-600">Diskon {discount}%</span>
                <span className="text-xs text-gray-500"> Produk akan tampil dengan label diskon</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stok <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStock(s => Math.max(0, s - 1))}
                  className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                >
                  <MdRemove />
                </button>
                <input
                  type="number"
                  value={stock}
                  onChange={e => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setStock(s => s + 1)}
                  className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                >
                  <MdAdd />
                </button>
              </div>
            </div>
          </div>

          {/*  Section: Detail  */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Detail Produk</h3>

            {/* Kondisi */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Kondisi <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {CONDITION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCondition(opt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      condition === opt.value
                        ? opt.color === 'blue'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : opt.color === 'amber'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {condition === opt.value && <MdCheck className="inline mr-1 text-sm -mt-0.5" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Pilih Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Pre-order */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setIsPreorder(p => !p)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${isPreorder ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPreorder ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Pre-Order</span>
                  <p className="text-xs text-gray-400">Produk dipesan sebelum tersedia</p>
                </div>
              </label>
              {isPreorder && (
                <div className="mt-3 ml-13 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
                  <span className="text-sm text-gray-600">Estimasi ready</span>
                  <input
                    type="number"
                    min={1} max={90}
                    value={preorderDays}
                    onChange={e => setPreorderDays(parseInt(e.target.value) || 7)}
                    className="w-16 border border-orange-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-600">hari</span>
                </div>
              )}
            </div>
          </div>

          {/*  Section: Variasi  */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVariations(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Variasi Produk <span className="text-xs font-normal text-gray-400">(opsional)</span></span>
              {showVariations ? <MdExpandLess className="text-gray-400" /> : <MdExpandMore className="text-gray-400" />}
            </button>

            {showVariations && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                <p className="text-xs text-gray-500">Tambahkan variasi seperti warna, ukuran, dll.</p>
                {variations.map((v, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nama variasi (Warna, Ukuran...)"
                        value={v.name}
                        onChange={e => {
                          const next = [...variations];
                          next[idx].name = e.target.value;
                          setVariations(next);
                        }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="button" onClick={() => { setVariations(prev => prev.filter((_, i) => i !== idx)); setVariationRaws(prev => prev.filter((_, i) => i !== idx)); }} className="text-red-400 hover:text-red-600 p-1">
                        <MdDelete />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Opsi dipisah koma: Merah, Biru, Hijau"
                      value={variationRaws[idx] ?? ''}
                      onChange={e => {
                        const newRaws = [...variationRaws];
                        newRaws[idx] = e.target.value;
                        setVariationRaws(newRaws);
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setVariations(prev => [...prev, { name: '', options: [] }]);
                    setVariationRaws(prev => [...prev, '']);
                  }}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <MdAdd className="text-base" /> Tambah Variasi
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-white px-5 py-4 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {uploadingImages ? 'Mengupload foto...' : 'Menyimpan...'}
              </>
            ) : (
              'Simpan Produk'
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
