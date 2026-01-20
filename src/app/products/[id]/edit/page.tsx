'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Category, Product } from '@/types';
import { getProduct, updateProduct, getCategories } from '@/lib/products';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    stock: 0,
    condition: 'NEW' as 'NEW' | 'USED',
    category_id: '',
    status: 'ACTIVE' as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
  });

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productData, categoriesData] = await Promise.all([
          getProduct(productId),
          getCategories(),
        ]);
        
        setProduct(productData);
        setCategories(categoriesData);
        setFormData({
          title: productData.title,
          description: productData.description || '',
          price: productData.price,
          stock: productData.stock,
          condition: productData.condition,
          category_id: productData.category_id || '',
          status: productData.status as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
        });
      } catch (err) {
        setError('Gagal memuat produk');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push(`/login?redirect=/products/${productId}/edit`);
    }
  }, [authLoading, isLoggedIn, router, productId]);

  // Check ownership
  useEffect(() => {
    if (product && user && product.seller_id !== user.id && user.role !== 'ADMIN') {
      router.push(`/products/${productId}`);
    }
  }, [product, user, router, productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Judul produk wajib diisi');
      return false;
    }
    if (formData.price <= 0) {
      setError('Harga harus lebih dari 0');
      return false;
    }
    if (formData.stock < 0) {
      setError('Stok tidak boleh negatif');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateProduct(productId, formData);
      setSuccess('Produk berhasil diperbarui!');
      setTimeout(() => {
        router.push(`/products/${productId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui produk');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/3" />
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="h-10 bg-gray-200 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900">Produk Tidak Ditemukan</h2>
            <Link href="/products">
              <Button className="mt-4">Kembali ke Produk</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-gray-600">
              <li>
                <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/products/${productId}`} className="hover:text-blue-600">
                  {product.title}
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Edit</li>
            </ol>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Produk</h1>

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

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="space-y-6">
              {/* Title */}
              <Input
                label="Judul Produk"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Contoh: Laptop Asus X441U"
                required
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jelaskan detail produk Anda..."
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Harga (Rp)"
                  name="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Stok"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kondisi
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NEW">Baru</option>
                    <option value="USED">Bekas</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Produk
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                  <option value="DRAFT">Draft</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Hanya produk dengan status "Aktif" yang akan tampil di marketplace.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button type="submit" isLoading={saving} disabled={saving}>
                  Simpan Perubahan
                </Button>
                <Link href={`/products/${productId}`}>
                  <Button type="button" variant="outline">
                    Batal
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
