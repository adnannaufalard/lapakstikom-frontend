'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { Product, Category } from '@/types';
import { updateProduct, getCategories, getProduct } from '@/lib/products';
import { apiUpload, apiDelete } from '@/lib/api';
import {
  MdClose, MdCloudUpload, MdImage, MdDelete, MdCheck,
  MdAdd, MdRemove, MdExpandMore, MdExpandLess, MdSave,
} from 'react-icons/md';

interface ProductEditPanelProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onUpdated: (product: Product) => void;
}

const CONDITION_OPTIONS = [
  { value: 'NEW',   label: 'Baru',  color: 'blue' },
  { value: 'USED',  label: 'Bekas', color: 'amber' },
  { value: 'FOODS', label: 'Foods', color: 'green' },
] as const;

const STATUS_OPTIONS = [
  { value: 'ACTIVE',   label: 'Aktif' },
  { value: 'DRAFT',    label: 'Draft' },
  { value: 'INACTIVE', label: 'Nonaktif' },
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

export default function ProductEditPanel({ open, product, onClose, onUpdated }: ProductEditPanelProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceStrikedInput, setPriceStrikedInput] = useState('');
  const [stock, setStock] = useState(1);
  const [condition, setCondition] = useState<'NEW' | 'USED' | 'FOODS'>('NEW');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isPreorder, setIsPreorder] = useState(false);
  const [preorderDays, setPreorderDays] = useState(7);
  const [variations, setVariations] = useState<{ name: string; options: string[]; required: boolean }[]>([]);
  const [variationRaws, setVariationRaws] = useState<string[]>([]);
  const [showVariations, setShowVariations] = useState(false);
  const [variationOptionPrices, setVariationOptionPrices] = useState<Record<number, Record<string, number>>>({});
  const [variationOptionStocks, setVariationOptionStocks] = useState<Record<number, Record<string, number>>>({});
  const [variationUseStocks, setVariationUseStocks] = useState<Record<number, boolean>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; image_url: string; is_primary: boolean }[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when product changes
  useEffect(() => {
    if (open && product) {
      setTitle(product.title);
      setDescription(product.description || '');
      setPriceInput(formatRupiah(String(Math.round(product.price))));
      const ps = product.price_striked
        ? (typeof product.price_striked === 'string' ? parseFloat(product.price_striked) : product.price_striked)
        : 0;
      setPriceStrikedInput(ps > 0 ? formatRupiah(String(Math.round(ps))) : '');
      setStock(product.stock);
      setCondition((product.condition as 'NEW' | 'USED' | 'FOODS') || 'NEW');
      setCategoryId(product.category_id || '');
      setStatus((product.status as 'DRAFT' | 'ACTIVE' | 'INACTIVE') || 'ACTIVE');
      setIsPreorder(product.is_preorder || false);
      setPreorderDays(product.preorder_days || 7);
      const existingVariations = Array.isArray((product as any).variations)
        ? (product as any).variations
        : [];
      setVariations(existingVariations.map((v: any) => ({ name: v.name || '', options: Array.isArray(v.options) ? v.options : [], required: v.required !== false })));
      setVariationRaws(existingVariations.map((v: any) => Array.isArray(v.options) ? v.options.join(', ') : ''));
      const prices: Record<number, Record<string, number>> = {};
      existingVariations.forEach((v: any, i: number) => { if (v.option_prices) prices[i] = v.option_prices; });
      setVariationOptionPrices(prices);
      const stocks: Record<number, Record<string, number>> = {};
      existingVariations.forEach((v: any, i: number) => { if (v.option_stocks) stocks[i] = v.option_stocks; });
      setVariationOptionStocks(stocks);
      const useStocks: Record<number, boolean> = {};
      existingVariations.forEach((v: any, i: number) => { if (v.option_stocks != null) useStocks[i] = true; });
      setVariationUseStocks(useStocks);
      const existingTags = Array.isArray((product as any).tags) ? (product as any).tags : [];
      setTags(existingTags);
      setExistingImages(product.images || []);
      setNewImages([]);
      setNewImagePreviews([]);
      setError('');

      // Fetch fresh product data to get current stock and variations
      getProduct(product.id).then((full: any) => {
        setExistingImages(full.images || []);
        // Override with latest stock and variations from server
        setStock(full.stock ?? product.stock);
        const freshVariations = Array.isArray(full.variations) ? full.variations : [];
        if (freshVariations.length > 0) {
          setVariations(freshVariations.map((v: any) => ({ name: v.name || '', options: Array.isArray(v.options) ? v.options : [], required: v.required !== false })));
          setVariationRaws(freshVariations.map((v: any) => Array.isArray(v.options) ? v.options.join(', ') : ''));
          const fp: Record<number, Record<string, number>> = {};
          freshVariations.forEach((v: any, i: number) => { if (v.option_prices) fp[i] = v.option_prices; });
          setVariationOptionPrices(fp);
          const fs: Record<number, Record<string, number>> = {};
          freshVariations.forEach((v: any, i: number) => { if (v.option_stocks) fs[i] = v.option_stocks; });
          setVariationOptionStocks(fs);
          const fu: Record<number, boolean> = {};
          freshVariations.forEach((v: any, i: number) => { if (v.option_stocks != null) fu[i] = true; });
          setVariationUseStocks(fu);
        }
      }).catch(() => {});

      getCategories()
        .then(all => setCategories(all.filter(c => ALLOWED_CATEGORIES.includes(c.name))))
        .catch(() => setCategories([]));
    }
  }, [open, product]);

  // Cleanup when closed
  useEffect(() => {
    if (!open) {
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
      setNewImages([]);
      setNewImagePreviews([]);
      setVariationRaws([]);
      setVariationOptionPrices({});
      setVariationOptionStocks({});
      setVariationUseStocks({});
      setTags([]);
      setTagInput('');
      setError('');
    }
  }, [open]);

  const totalImages = existingImages.length + newImages.length;

  const addFiles = useCallback(
    (files: File[]) => {
      const remaining = 5 - totalImages;
      if (remaining <= 0) { setError('Maksimal 5 foto produk'); return; }
      const valid = files.filter(f => f.type.startsWith('image/')).slice(0, remaining);
      if (!valid.length) return;
      const previews = valid.map(f => URL.createObjectURL(f));
      setNewImages(prev => [...prev, ...valid]);
      setNewImagePreviews(prev => [...prev, ...previews]);
      setError('');
    },
    [totalImages]
  );

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!product) return;
    setDeletingImageId(imageId);
    try {
      await apiDelete(`/products/${product.id}/images/${imageId}`);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch {
      setError('Gagal menghapus gambar');
    } finally {
      setDeletingImageId(null);
    }
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

  const uploadNewImages = async (productId: string) => {
    for (const file of newImages) {
      const fd = new FormData();
      fd.append('image', file);
      try {
        await apiUpload(`/products/${productId}/upload-image`, fd);
      } catch { /* non-fatal */ }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !validate()) return;
    setLoading(true); setError('');
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        price,
        price_striked: priceStriked > 0 ? priceStriked : null,
        stock: (() => {
          const allStocks: number[] = [];
          Object.entries(variationUseStocks).forEach(([k, enabled]) => {
            if (enabled) allStocks.push(...Object.values(variationOptionStocks[Number(k)] || {}));
          });
          if (allStocks.length > 0) return allStocks.reduce((a, b) => a + b, 0);
          return stock;
        })(),
        condition,
        category_id: categoryId || undefined,
        status,
        is_preorder: isPreorder,
        preorder_days: isPreorder ? preorderDays : undefined,
        variations: variations.length > 0 ? variations.map((v, i) => {
          const opts = (variationRaws[i] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
          const prices = variationOptionPrices[i] || {};
          return { name: v.name, options: opts, option_prices: Object.fromEntries(opts.map(o => [o, prices[o] ?? 0])), ...(variationUseStocks[i] ? { option_stocks: Object.fromEntries(opts.map(o => [o, variationOptionStocks[i]?.[o] ?? 0])) } : {}), required: v.required !== false };
        }) : [],
        tags: tags.length > 0 ? tags : [],
      };
      const updated = await updateProduct(product.id, payload);
      if (newImages.length > 0) {
        setUploadingImages(true);
        await uploadNewImages(product.id);
        setUploadingImages(false);
      }
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setLoading(false); setUploadingImages(false);
    }
  };

  if (!product) return null;

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
            <h2 className="text-base font-bold text-gray-900">Edit Produk</h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.title}</p>
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
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Section: Foto Produk ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <MdImage className="text-blue-500" />
              Foto Produk
              <span className="text-xs text-gray-400 font-normal">({totalImages}/5)</span>
            </h3>

            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Foto saat ini</p>
                <div className="grid grid-cols-5 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={img.image_url} alt="Foto produk" className="w-full h-full object-cover" />
                      {img.is_primary && (
                        <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 text-[10px] text-white text-center py-0.5 font-medium">
                          Utama
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        disabled={deletingImageId === img.id}
                        className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow disabled:opacity-50"
                      >
                        {deletingImageId === img.id
                          ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <MdClose className="text-xs" />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New images preview */}
            {newImagePreviews.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Foto baru yang akan ditambahkan</p>
                <div className="grid grid-cols-5 gap-2">
                  {newImagePreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-blue-300">
                      <Image src={src} alt={`Foto ${i + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <MdClose className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drop Zone */}
            {totalImages < 5 && (
              <div
                onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors p-5 text-center ${
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
                <MdCloudUpload className={`text-3xl mx-auto mb-1 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-500">
                  {isDragging ? 'Lepaskan untuk upload' : 'Klik atau seret foto baru di sini'}
                </p>
              </div>
            )}
          </div>

          {/* ── Section: Info Produk ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Info Produk</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nama produk"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Deskripsi produk..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* ── Section: Harga & Stok ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Harga & Stok</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Harga Jual <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={e => setPriceInput(formatRupiah(e.target.value))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            {discount > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-red-600">Diskon {discount}%</span>
                <span className="text-xs text-gray-500">· Produk akan tampil dengan label diskon</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Stok <span className="text-red-500">*</span>
              </label>
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

          {/* ── Section: Detail ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Detail Produk</h3>

            {/* Kondisi */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Kondisi <span className="text-red-500">*</span>
              </label>
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

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      status === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-order */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
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
                <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
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

          {/* ── Section: Tag ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Tag Produk <span className="text-xs font-normal text-gray-400">(opsional)</span></h3>
              <p className="text-xs text-gray-400 mt-0.5">Tambah tag untuk memudahkan pencarian. Maks 10 tag.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault();
                    const norm = tagInput.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
                    if (norm && !tags.includes(norm) && tags.length < 10) {
                      setTags(prev => [...prev, norm]);
                    }
                    setTagInput('');
                  }
                }}
                placeholder="Ketik tag lalu tekan Enter"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  const norm = tagInput.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
                  if (norm && !tags.includes(norm) && tags.length < 10) {
                    setTags(prev => [...prev, norm]);
                  }
                  setTagInput('');
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >+</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                    #{tag}
                    <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="ml-0.5 text-blue-400 hover:text-blue-700">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Section: Variasi ── */}
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
                <p className="text-xs text-gray-500">Tambahkan variasi seperti warna, ukuran, dll. Atur harga tiap opsi.</p>
                {variations.map((v, idx) => {
                  const opts = (variationRaws[idx] || '').split(',').map(s => s.trim()).filter(Boolean);
                  return (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nama variasi (cth: Ukuran)"
                          value={v.name}
                          onChange={e => {
                            const next = [...variations];
                            next[idx].name = e.target.value;
                            setVariations(next);
                          }}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={() => { setVariations(prev => prev.filter((_, i) => i !== idx)); setVariationRaws(prev => prev.filter((_, i) => i !== idx)); setVariationOptionPrices(prev => { const next = { ...prev }; delete next[idx]; return next; }); setVariationOptionStocks(prev => { const next = { ...prev }; delete next[idx]; return next; }); setVariationUseStocks(prev => { const next = { ...prev }; delete next[idx]; return next; }); }} className="text-red-400 hover:text-red-600 p-1">
                          <MdDelete />
                        </button>
                      </div>
                      {/* Toggles: Wajib/Opsional + Stok per opsi */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-500">Pilihan:</span>
                          <button type="button" onClick={() => { const next = [...variations]; next[idx].required = true; setVariations(next); }} className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${v.required !== false ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Wajib</button>
                          <button type="button" onClick={() => { const next = [...variations]; next[idx].required = false; setVariations(next); }} className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${v.required === false ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>Opsional</button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-500">Stok per opsi:</span>
                          <button type="button" onClick={() => setVariationUseStocks(prev => ({ ...prev, [idx]: !prev[idx] }))} className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${variationUseStocks[idx] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{variationUseStocks[idx] ? 'Aktif' : 'Nonaktif'}</button>
                        </div>
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
                      {opts.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                            <span className="w-24">Opsi</span>
                            <span className="flex-1">Harga tambahan (Rp 0 = harga produk)</span>
                            {variationUseStocks[idx] && <span className="w-24 text-center">Stok</span>}
                          </div>
                          {opts.map(opt => (
                            <div key={opt} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 w-24 truncate">{opt}</span>
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                                <input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  value={variationOptionPrices[idx]?.[opt] ?? ''}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setVariationOptionPrices(prev => ({
                                      ...prev,
                                      [idx]: { ...(prev[idx] || {}), [opt]: val }
                                    }));
                                  }}
                                  className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              {variationUseStocks[idx] && (
                                <input
                                  type="number"
                                  min={0}
                                  placeholder="Stok"
                                  value={variationOptionStocks[idx]?.[opt] ?? ''}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setVariationOptionStocks(prev => ({
                                      ...prev,
                                      [idx]: { ...(prev[idx] || {}), [opt]: val }
                                    }));
                                  }}
                                  className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              )}
                            </div>
                          ))}
                          {variationUseStocks[idx] && Object.values(variationOptionStocks[idx] || {}).some(v => v > 0) && (
                            <p className="text-[10px] text-blue-500 mt-1">Total stok = {Object.values(variationOptionStocks[idx] || {}).reduce((a, b) => a + b, 0)} (dihitung otomatis dari stok tiap opsi)</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setVariations(prev => [...prev, { name: '', options: [], required: true }]);
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
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {uploadingImages ? 'Upload foto...' : 'Menyimpan...'}
              </>
            ) : (
              <>
                <MdSave className="text-base" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
