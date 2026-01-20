'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product, Category } from '@/types';
import { getProducts, getCategories, ProductQueryParams } from '@/lib/products';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductFilters, ProductFilterValues } from '@/components/product/ProductFilters';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ProductFilterValues>({
    q: '',
    category_id: '',
    condition: '',
    min_price: '',
    max_price: '',
    sort: 'newest',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: ProductQueryParams = {
        page,
        limit: 12,
      };

      if (filters.q) params.q = filters.q;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.condition) params.condition = filters.condition as 'NEW' | 'USED';
      if (filters.min_price) params.min_price = Number(filters.min_price);
      if (filters.max_price) params.max_price = Number(filters.max_price);
      if (filters.sort) params.sort = filters.sort as ProductQueryParams['sort'];

      const response = await getProducts(params);
      setProducts(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err) {
      setError('Gagal memuat produk. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Gagal memuat kategori:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleFilterChange = (newFilters: ProductFilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset ke halaman pertama
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Semua Produk</h1>
          <p className="mt-2 text-gray-600">
            Temukan berbagai produk dari civitas STIKOM
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <ProductFilters
              categories={categories}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-6 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Coba Lagi
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Tidak ada produk
                </h3>
                <p className="mt-2 text-gray-600">
                  Tidak ada produk yang sesuai dengan filter Anda.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>
                    <span className="px-4 py-2 text-gray-600">
                      Halaman {page} dari {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
