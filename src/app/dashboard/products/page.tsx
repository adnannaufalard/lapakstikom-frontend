'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Product, Category } from '@/types';
import { getProducts, getCategories, formatPrice, getPrimaryImage, deleteProduct } from '@/lib/products';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import ProductCreatePanel from '@/components/product/ProductCreatePanel';
import ProductEditPanel from '@/components/product/ProductEditPanel';
import { MdAdd, MdSearch, MdEdit, MdVisibility, MdDelete, MdInventory2, MdFilterList } from 'react-icons/md';

const MARKETPLACE_CATEGORIES = [
  'Gadget & Elektronik', 'Fashion', 'Makanan & Minuman', 'Aksesoris', 'Hobi & Koleksi',
];

const CONDITION_CONFIG = {
  NEW:   { label: 'Baru',  className: 'bg-blue-100 text-blue-700' },
  USED:  { label: 'Bekas', className: 'bg-amber-100 text-amber-700' },
  FOODS: { label: 'Foods', className: 'bg-green-100 text-green-700' },
} as const;

const STATUS_CONFIG = {
  ACTIVE:   { label: 'Aktif',    className: 'bg-emerald-100 text-emerald-700' },
  DRAFT:    { label: 'Draft',    className: 'bg-gray-100 text-gray-600' },
  INACTIVE: { label: 'Nonaktif', className: 'bg-red-100 text-red-600' },
  BANNED:   { label: 'Banned',   className: 'bg-red-200 text-red-800' },
} as const;

export default function MyProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/products');
    } else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, user, router]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const response = await getProducts({ seller_id: user.id, status: 'ACTIVE' } as never);
      const raw = Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : []);
      setProducts(raw.map((p: any) => ({
        ...p,
        price: p.price == null ? 0 : (typeof p.price === 'string' ? parseFloat(p.price) : p.price),
      })));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat produk');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'UKM_OFFICIAL') {
      fetchProducts();
      getCategories().then(all => setCategories(all.filter(c => MARKETPLACE_CATEGORIES.includes(c.name)))).catch(() => {});
    }
  }, [user, fetchProducts]);

  // Refresh products when window regains focus (reflects latest stock changes)
  useEffect(() => {
    if (!user || user.role !== 'UKM_OFFICIAL') return;
    const onFocus = () => fetchProducts();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, fetchProducts]);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Nonaktifkan produk ini?')) return;
    setDeleting(productId);
    setError('');
    try {
      await deleteProduct(productId);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: 'INACTIVE' as const } : p));
      setSuccess('Produk berhasil dinonaktifkan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menonaktifkan produk');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user.role !== 'UKM_OFFICIAL') return null;

  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || p.category_id === selectedCategory;
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const activeCount = products.filter(p => p.status === 'ACTIVE').length;
  const inactiveCount = products.filter(p => p.status !== 'ACTIVE').length;

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <span className="shrink-0"></span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            <span className="shrink-0"></span>
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <MdFilterList className="text-gray-400 shrink-0" />
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap"
            >
              <MdAdd className="text-lg" />
              Tambah Produk
            </button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{activeCount} aktif{inactiveCount > 0 ? ` · ${inactiveCount} nonaktif` : ''}</p>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Kategori:</span>
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Semua
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
            <MdInventory2 className="text-5xl text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700">
              {products.length === 0 ? 'Belum Ada Produk' : 'Tidak ada produk ditemukan'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {products.length === 0
                ? 'Mulai jual produk Anda di Lapak STIKOM'
                : 'Coba ubah filter atau kata kunci pencarian'}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => setShowCreatePanel(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <MdAdd />
                Tambah Produk Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={setEditingProduct}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
          </div>
          </div>
        )}
      </div>

      <ProductCreatePanel
        open={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        onCreated={product => {
          setProducts(prev => [product, ...prev]);
          setSuccess('Produk berhasil ditambahkan!');
        }}
      />

      <ProductEditPanel
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onUpdated={updated => {
          setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
          setSuccess('Produk berhasil diperbarui!');
          setEditingProduct(null);
        }}
      />
    </UkmDashboardLayout>
  );
}

//  Product Card 
function ProductCard({
  product,
  onEdit,
  onDelete,
  deleting,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  const imageUrl = getPrimaryImage(product);
  const priceStriked = product.price_striked
    ? (typeof product.price_striked === 'string' ? parseFloat(product.price_striked) : product.price_striked)
    : null;
  const discount = priceStriked && priceStriked > product.price
    ? Math.round(((priceStriked - product.price) / priceStriked) * 100)
    : 0;

  const conditionCfg = CONDITION_CONFIG[product.condition as keyof typeof CONDITION_CONFIG] ?? CONDITION_CONFIG.NEW;
  const statusCfg = STATUS_CONFIG[product.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.ACTIVE;
  const isDeleting = deleting === product.id;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col transition-shadow hover:shadow-md ${product.status !== 'ACTIVE' ? 'opacity-60' : ''}`}>
      {/* Image */}
      <div className="relative h-48 bg-gray-100 shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
        />
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${conditionCfg.className}`}>
            {conditionCfg.label}
          </span>
        </div>
        {discount > 0 && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
              -{discount}%
            </span>
          </div>
        )}
        {product.is_preorder && (
          <div className="absolute bottom-0 inset-x-0 bg-orange-500/90 text-white text-[10px] font-semibold text-center py-0.5">
            PRE-ORDER{product.preorder_days ? `  ${product.preorder_days} hari` : ''}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className={`self-start px-2 py-0.5 text-[10px] font-medium rounded-full ${statusCfg.className}`}>
          {statusCfg.label}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mt-0.5">{product.title}</h3>
        <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
          <span className="text-sm font-bold text-blue-600">{formatPrice(product.price)}</span>
          {priceStriked && priceStriked > product.price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(priceStriked)}</span>
          )}
        </div>
        <p className="text-xs text-gray-500">Stok: {product.stock}</p>

        {/* Actions */}
        <div className="flex gap-1.5 mt-auto pt-2">
          <button
            onClick={() => onEdit(product)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <MdEdit className="text-sm" /> Edit
          </button>
          <Link href={`/products/${product.id}`} target="_blank" className="flex-1">
            <button className="w-full flex items-center justify-center gap-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <MdVisibility className="text-sm" /> Lihat
            </button>
          </Link>
          {product.status === 'ACTIVE' && (
            <button
              onClick={() => onDelete(product.id)}
              disabled={deleting !== null}
              className="flex items-center justify-center px-2 py-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              title="Nonaktifkan"
            >
              {isDeleting
                ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                : <MdDelete className="text-sm" />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
