'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MdVerified, MdSearch, MdOutlineStorefront, MdShoppingBag, MdStar } from 'react-icons/md';
import { RiUserFollowLine } from 'react-icons/ri';
import { IoChatbubbleEllipsesOutline, IoPeopleOutline } from 'react-icons/io5';
import { IoMdStarOutline } from 'react-icons/io';
import { HiShoppingBag } from 'react-icons/hi2';
import { HiOutlineCalendarDateRange } from 'react-icons/hi2';
import { apiGet, ApiResponse } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

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
  price_striked?: number | null;
  image_url: string;
  category: string;
  stock: number;
  condition?: string;
  rating?: number;
  is_preorder?: boolean;
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
  const { cartCount } = useCart();

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
    const matchesSearch = !searchQuery || (product.name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
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
      <div className="min-h-screen flex items-center justify-center bg-white">
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
    <div className="min-h-screen bg-white">
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
              
              {/* Bag Icon */}
              <Link href="/cart" className="relative hover:opacity-80 transition-opacity">
                <HiShoppingBag className="w-7 h-7 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded px-1 min-w-[16px] h-[16px] flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Profile Card - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 transform translate-y-1/2">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-6 flex items-start gap-6">
              {/* Avatar */}
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                {storeData.avatar_url ? (
                  <img src={storeData.avatar_url} alt={storeData.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">{storeData.full_name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Right side — name row + bio spanning full width */}
              <div className="flex-1 min-w-0">
                {/* Top row: Info + Buttons + Stats */}
                <div className="flex items-start gap-4">
                  {/* Name + Username */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900 leading-tight">{storeData.full_name}</h1>
                    </div>
                    <p className="text-gray-500 text-sm flex items-center gap-1.5">
                      @{storeData.username}
                      {storeData.role === 'UKM_OFFICIAL' && (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600 whitespace-nowrap flex-shrink-0">
                          <MdVerified className="text-sm" />
                          UKM Official
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {user?.username !== storeData.username && (
                    <div className="flex gap-3 flex-shrink-0">
                      <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
                        Follow
                      </button>
                      <button className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm flex items-center gap-2">
                        <IoChatbubbleEllipsesOutline className="text-lg" />
                        Chat
                      </button>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div
                    className="grid gap-x-5 gap-y-1.5 border-l border-gray-200 pl-4 flex-shrink-0"
                    style={{ gridTemplateColumns: 'repeat(3, max-content)' }}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <MdOutlineStorefront className="text-lg text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Produk:</span>
                      <span className="text-sm text-blue-600 font-medium">{storeData.stats.total_products}</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <IoPeopleOutline className="text-lg text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Pengikut:</span>
                      <span className="text-sm text-blue-600 font-medium">{storeData.stats.followers}</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <RiUserFollowLine className="text-lg text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Mengikuti:</span>
                      <span className="text-sm text-blue-600 font-medium">{storeData.stats.following}</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <IoChatbubbleEllipsesOutline className="text-lg text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Chat Dibalas:</span>
                      <span className="text-sm text-blue-600 font-medium">{storeData.stats.chat_response_rate}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <IoMdStarOutline className="text-lg text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Rating:</span>
                      <span className="text-sm text-blue-600 font-medium">{storeData.stats.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <HiOutlineCalendarDateRange className="text-lg text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Bergabung:</span>
                      <span className="text-sm text-blue-600 font-medium">{joinDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bio — spans full width of right column */}
                {storeData.bio && (
                  <p className="text-gray-600 text-sm mt-3 leading-relaxed">{storeData.bio}</p>
                )}
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.slice(0, 10).map((product) => (
                <PublicProductCard key={product.id} product={product} storeData={storeData} />
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
                    <PublicProductCard key={product.id} product={product} storeData={storeData} />
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

// ── Shared product card ───────────────────────────────────────────────────────
const CONDITION_LABEL: Record<string, { label: string; className: string }> = {
  NEW:   { label: 'New',    className: 'bg-blue-600 text-white' },
  USED:  { label: 'Second', className: 'bg-red-500 text-white' },
  FOODS: { label: 'Foods',  className: 'bg-green-500 text-white' },
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  MAHASISWA: { label: 'Mahasiswa', className: 'bg-blue-100 text-blue-700' },
  DOSEN:     { label: 'Dosen',     className: 'bg-green-100 text-green-700' },
  KARYAWAN:  { label: 'Karyawan',  className: 'bg-orange-100 text-orange-700' },
};

const rp = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function PublicProductCard({
  product,
  storeData,
}: {
  product: Product;
  storeData: StoreData;
}) {
  const discount =
    product.price_striked && product.price_striked > product.price
      ? Math.round(((product.price_striked - product.price) / product.price_striked) * 100)
      : 0;
  const conditionCfg = CONDITION_LABEL[(product.condition ?? '').toUpperCase()] ?? CONDITION_LABEL.NEW;
  const rating = product.rating ?? 0;
  const roleBadge = ROLE_BADGE[storeData.role];

  return (
    <Link href={`/products/${product.id}`} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Image – fixed height so all cards are uniform */}
      <div className="relative h-44 bg-gray-50 shrink-0 overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <MdShoppingBag className="text-5xl" />
          </div>
        )}

        {/* Condition ribbon – top-right */}
        <div className={`absolute top-0 right-0 px-2.5 py-0.5 text-[11px] font-bold rounded-bl-xl rounded-tr-2xl ${conditionCfg.className}`}>
          {conditionCfg.label}
        </div>

        {/* PRE-ORDER bar */}
        {product.is_preorder && (
          <div className="absolute bottom-0 inset-x-0 bg-orange-500 text-white text-[10px] font-bold text-center py-1 tracking-wide">
            PRE-ORDER
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {/* Name – always 2 lines max with ellipsis */}
        <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem] overflow-hidden">
          {product.name}
        </h3>

        {/* Price + strikethrough + badge — all on one row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            Rp{rp(product.price)}
          </span>
          {discount > 0 && product.price_striked && (
            <>
              <span className="text-[10px] text-gray-400 line-through">
                Rp{rp(product.price_striked)}
              </span>
              <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                {discount}%
              </span>
            </>
          )}
        </div>

        {/* Rating + Stock */}
        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
          <MdStar className="text-yellow-400 text-xs shrink-0" />
          <span className="text-gray-700 font-medium">{rating.toFixed(1)}</span>
          <span className="text-gray-300 mx-0.5">|</span>
          <span>Stok {product.stock}</span>
        </div>

        {/* Store footer */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-normal truncate max-w-[120px]">
            @{storeData.username}
          </span>
          {storeData.role === 'UKM_OFFICIAL' ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600">
              <MdVerified className="text-blue-600 shrink-0" />
              UKM Official
            </span>
          ) : roleBadge ? (
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
