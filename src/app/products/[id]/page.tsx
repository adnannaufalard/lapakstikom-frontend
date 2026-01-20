'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { getProduct, formatPrice, getPrimaryImage } from '@/lib/products';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;

      try {
        const data = await getProduct(params.id as string);
        setProduct(data);
      } catch (err) {
        setError('Produk tidak ditemukan');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleBuy = () => {
    if (!isLoggedIn) {
      router.push('/login?redirect=' + encodeURIComponent(`/products/${params.id}`));
      return;
    }

    // TODO: Implement checkout flow
    router.push(`/checkout?product=${params.id}&qty=${quantity}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Produk Tidak Ditemukan
            </h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <Link href="/products">
              <Button className="mt-4">Kembali ke Produk</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: '1', product_id: product.id, image_url: getPrimaryImage(product), is_primary: true }];

  const isOwner = user && user.id === product.seller_id;
  const canBuy = product.stock > 0 && !isOwner;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-600">
            <li>
              <Link href="/" className="hover:text-blue-600">Beranda</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/products" className="hover:text-blue-600">Produk</Link>
            </li>
            {product.category && (
              <>
                <li>/</li>
                <li>
                  <Link href={`/products?category_id=${product.category.id}`} className="hover:text-blue-600">
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden">
              <img
                src={images[selectedImage].image_url}
                alt={product.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    product.condition === 'NEW'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {product.condition === 'NEW' ? 'Baru' : 'Bekas'}
                </span>
                {product.category && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {product.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {product.title}
              </h1>
              <p className="mt-4 text-3xl font-bold text-blue-600">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Stock & Quantity */}
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-gray-600">Stok: </span>
                <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `${product.stock} tersedia` : 'Habis'}
                </span>
              </div>
              {canBuy && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Jumlah:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-1 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Seller Info */}
            {product.seller && (
              <div className="p-4 bg-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {product.seller.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.seller.full_name}</p>
                    <p className="text-sm text-gray-600">{product.seller.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {isOwner ? (
                <Link href={`/products/${product.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Edit Produk
                  </Button>
                </Link>
              ) : canBuy ? (
                <>
                  <Button onClick={handleBuy} className="flex-1">
                    Beli Sekarang
                  </Button>
                  <Button variant="outline" className="flex-1">
                    + Keranjang
                  </Button>
                </>
              ) : (
                <Button disabled className="flex-1">
                  Stok Habis
                </Button>
              )}
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Deskripsi Produk</h2>
              <div className="prose prose-gray max-w-none">
                {product.description ? (
                  <p className="whitespace-pre-wrap text-gray-600">{product.description}</p>
                ) : (
                  <p className="text-gray-400 italic">Tidak ada deskripsi</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
