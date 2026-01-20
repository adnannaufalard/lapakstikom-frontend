'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { getProducts, formatPrice, getPrimaryImage, deleteProduct } from '@/lib/products';
import { useAuth } from '@/hooks/useAuth';
import UkmDashboardLayout from '@/components/layout/UkmDashboardLayout';
import { Button, Alert } from '@/components/ui';

export default function MyProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?redirect=/dashboard/products');
    } else if (!authLoading && user && user.role !== 'UKM_OFFICIAL') {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, user, router]);

  // Fetch user's products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      try {
        const response = await getProducts({ seller_id: user.id } as never);
        setProducts(response.data || []);
      } catch (err) {
        console.error('Gagal memuat produk:', err);
        setError('Gagal memuat produk Anda');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [user]);

  const handleDelete = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan produk ini?')) return;

    setDeleting(productId);
    setError('');
    setSuccess('');

    try {
      await deleteProduct(productId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: 'INACTIVE' as const } : p
        )
      );
      setSuccess('Produk berhasil dinonaktifkan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menonaktifkan produk');
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'UKM_OFFICIAL') {
    return null;
  }

  const activeProducts = (products || []).filter((p) => p.status === 'ACTIVE');
  const inactiveProducts = (products || []).filter((p) => p.status !== 'ACTIVE');

  return (
    <UkmDashboardLayout ukmName={user.full_name || 'UKM'} avatarUrl={user.avatar_url}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-8">
          <Link href="/products/create">
            <Button>+ Tambah Produk</Button>
          </Link>
        </div>

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

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Belum Ada Produk
            </h2>
            <p className="mt-2 text-gray-600">
              Mulai jual produk Anda di Lapak STIKOM
            </p>
            <Link href="/products/create">
              <Button className="mt-6">Tambah Produk Pertama</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Products */}
            {activeProducts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Produk Aktif ({activeProducts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onDelete={handleDelete}
                      deleting={deleting}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Products */}
            {inactiveProducts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-500 mb-4">
                  Produk Nonaktif ({inactiveProducts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                  {inactiveProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onDelete={handleDelete}
                      deleting={deleting}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </UkmDashboardLayout>
  );
}

// Product Card Component
function ProductCard({
  product,
  onDelete,
  deleting,
}: {
  product: Product;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={getPrimaryImage(product)}
          alt={product.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder-product.svg';
          }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              product.status === 'ACTIVE'
                ? 'bg-green-100 text-green-700'
                : product.status === 'DRAFT'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {product.status === 'ACTIVE'
              ? 'Aktif'
              : product.status === 'DRAFT'
              ? 'Draft'
              : 'Nonaktif'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-1">{product.title}</h3>
        <p className="text-blue-600 font-bold mt-1">{formatPrice(product.price)}</p>
        <p className="text-sm text-gray-500 mt-1">Stok: {product.stock}</p>

        <div className="flex gap-2 mt-4">
          <Link href={`/products/${product.id}/edit`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Edit
            </Button>
          </Link>
          <Link href={`/products/${product.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              Lihat
            </Button>
          </Link>
          {product.status === 'ACTIVE' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(product.id)}
              isLoading={deleting === product.id}
              disabled={deleting !== null}
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
