'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MdVerified, MdSearch, MdOutlineStorefront, MdShoppingBag } from 'react-icons/md';
import { RiUserFollowLine } from 'react-icons/ri';
import { IoChatbubbleEllipsesOutline, IoPeopleOutline } from 'react-icons/io5';
import { IoMdStarOutline } from 'react-icons/io';
import { HiOutlineCalendarDateRange } from 'react-icons/hi2';
import { apiGet, ApiResponse } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Footer } from '@/components/layout/Footer';

interface StoreData {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  role: string;
  created_at: string;
  stats: {
    total_products: number;
    followers: number;
    following: number;
    rating: number;
    chat_response_rate: number;
  };
  banner_data?: {
    background_url?: string;
    layout?: string;
    banners?: string[];
    urls?: string[]; // Keep for backwards compatibility
  } | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  created_at?: string;
}

export default function PublicStorePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const { user } = useAuth();

  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'bestseller' | 'price-asc' | 'price-desc'>('popular');

  useEffect(() => {
    if (username) {
      loadStoreData();
      loadProducts();
    }
  }, [username]);

  const loadStoreData = async () => {
    try {
      const response = await apiGet<ApiResponse<StoreData>>(`/stores/${username}`);
      if (response.success && response.data) {
        setStoreData(response.data);
      } else {
        router.push('/404');
      }
    } catch (error) {
      console.error('Failed to load store data:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiGet<ApiResponse<any>>(`/stores/${username}/products`);
      if (response.success && response.data) {
        setProducts(response.data.products || []);
        setCategories(response.data.categories || []);
      } else {
        // Handle unsuccessful response but don't throw error
        setProducts([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      // Set empty arrays on error so page still renders
      setProducts([]);
      setCategories([]);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort products based on sortBy
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'bestseller':
        // If sales data exists in future, use it. For now, sort by stock (lower stock = more sold)
        return a.stock - b.stock;
      case 'popular':
      default:
        // For now, show products with lower stock first (assuming more popular)
        return a.stock - b.stock;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!storeData) {
    return null;
  }

  const joinDate = new Date(storeData.created_at).toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Background */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 h-96">
        {storeData.banner_data?.background_url ? (
          <img 
            src={storeData.banner_data.background_url} 
            alt="Store Background" 
            className="w-full h-full object-cover"
          />
        ) : (storeData.banner_data?.banners && storeData.banner_data.banners.length > 0) ? (
          <img 
            src={storeData.banner_data.banners[0]} 
            alt="Store Banner" 
            className="w-full h-full object-cover"
          />
        ) : (storeData.banner_data?.urls && storeData.banner_data.urls.length > 0) ? (
          <img 
            src={storeData.banner_data.urls[0]} 
            alt="Store Banner" 
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        
        {/* Search Bar with Glassmorphism - Top Center */}
        <div className="absolute top-6 left-0 right-0 px-4">
          <div className="max-w-7xl mx-auto flex justify-center">
            <div className="flex items-center gap-4 max-w-3xl w-full">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full px-14 py-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/70"
                />
                <MdSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white text-2xl" />
              </div>
              
              {/* Bag Icon - No Background */}
              <button className="relative hover:opacity-80 transition-opacity">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Profile Card - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 transform translate-y-1/2">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 flex items-start gap-6">
              {/* Logo */}
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                {storeData.avatar_url ? (
                  <img src={storeData.avatar_url} alt={storeData.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">{storeData.full_name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{storeData.full_name}</h1>
                  {storeData.role === 'UKM_OFFICIAL' && (
                    <MdVerified className="text-blue-600 text-xl" title="Verified UKM" />
                  )}
                </div>
                <p className="text-gray-600 mb-2">@{storeData.username}</p>
                {storeData.bio && (
                  <p className="text-gray-700 text-sm">{storeData.bio}</p>
                )}
              </div>

              {/* Action Buttons - Moved Here */}
              {user?.username !== storeData.username && (
                <div className="flex gap-3">
                  <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                    Follow
                  </button>
                  <button className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2">
                    <IoChatbubbleEllipsesOutline className="text-lg" />
                    Chat
                  </button>
                </div>
              )}

              {/* Stats Grid 3 Columns on Right */}
              <div className="grid grid-cols-3 gap-4 border-l border-gray-200 pl-8">
                {/* Row 1 */}
                <div className="flex items-center gap-2">
                  <MdOutlineStorefront className="text-xl text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Produk:</span>
                  <span className="text-sm text-blue-600">{storeData.stats.total_products}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <IoPeopleOutline className="text-xl text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Pengikut:</span>
                  <span className="text-sm text-blue-600">{storeData.stats.followers}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <RiUserFollowLine className="text-xl text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Mengikuti:</span>
                  <span className="text-sm text-blue-600">{storeData.stats.following}</span>
                </div>
                
                {/* Row 2 */}
                <div className="flex items-center gap-2">
                  <IoChatbubbleEllipsesOutline className="text-xl text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Chat:</span>
                  <span className="text-sm text-blue-600">{storeData.stats.chat_response_rate}%</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <IoMdStarOutline className="text-xl text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Rating:</span>
                  <span className="text-sm text-blue-600">{storeData.stats.rating.toFixed(1)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <HiOutlineCalendarDateRange className="text-xl text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">Bergabung:</span>
                  <span className="text-sm text-blue-600">{joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-12">
        {/* 1. Rekomendasi Buat Kamu */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rekomendasi Buat Kamu</h2>
          {products.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {products.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-48 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MdShoppingBag className="text-6xl" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">{product.name}</h3>
                    <p className="text-blue-600 font-bold text-sm">Rp {product.price.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 mt-1">Stok: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MdShoppingBag className="text-6xl mx-auto mb-3 opacity-30" />
              <p>Belum ada produk</p>
            </div>
          )}
        </div>

        {/* 2. Product Banner Section */}
        {storeData.banner_data && (storeData.banner_data.banners || storeData.banner_data.urls) && 
         (storeData.banner_data.banners ? storeData.banner_data.banners.length > 0 : storeData.banner_data.urls && storeData.banner_data.urls.length > 0) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6"></h2>
            {(() => {
              const bannerUrls = storeData.banner_data.banners || storeData.banner_data.urls || [];
              const layout = storeData.banner_data.layout || 'layout_1';
              
              if (layout === 'layout_1') {
                return (
                  <div className="grid grid-cols-2 gap-4">
                    {bannerUrls.map((url, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <img src={url} alt={`Banner ${idx + 1}`} className="w-full h-80 object-cover" />
                      </div>
                    ))}
                  </div>
                );
              }
              
              if (layout === 'layout_2' && bannerUrls.length >= 3) {
                return (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                      <img src={bannerUrls[0]} alt="Large Banner" className="w-full h-full object-cover" />
                    </div>
                    {bannerUrls.slice(1).map((url, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <img src={url} alt={`Banner ${idx + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                );
              }
              
              if (layout === 'layout_3' && bannerUrls.length >= 4) {
                return (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                      <img src={bannerUrls[0]} alt="Top Banner" className="w-full h-80 object-cover" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {bannerUrls.slice(1).map((url, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                          <img src={url} alt={`Banner ${idx + 2}`} className="w-full h-60 object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              return null;
            })()}
          </div>
        )}

        {/* 3. Katalog by Categories */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Katalog Produk</h2>
            
            {/* Filter Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="popular">Populer</option>
                <option value="newest">Terbaru</option>
                <option value="bestseller">Terlaris</option>
                <option value="price-asc">Harga: Rendah ke Tinggi</option>
                <option value="price-desc">Harga: Tinggi ke Rendah</option>
              </select>
            </div>
          </div>

          {/* Empty State for Categories */}
          {categories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
              <MdShoppingBag className="text-6xl mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Produk</h3>
            </div>
          ) : (
            <>
              {/* Category Tabs */}
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    Semua
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {searchQuery && (
                <p className="text-sm text-gray-600 mb-4">
                  Hasil pencarian untuk: <span className="font-semibold">&quot;{searchQuery}&quot;</span>
                </p>
              )}
              
              {sortedProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl">
                  <MdShoppingBag className="text-6xl mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Tidak ada produk ditemukan</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {sortedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                    >
                      <div className="aspect-square bg-gray-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <MdShoppingBag className="text-6xl" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                        <p className="text-blue-600 font-bold">Rp {product.price.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-gray-500 mt-1">Stok: {product.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
