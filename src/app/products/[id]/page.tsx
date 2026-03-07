'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { apiGet, ApiResponse } from '@/lib/api';
import {
  MdVerified, MdStar, MdStarOutline, MdShoppingBag,
  MdAdd, MdRemove, MdStore, MdShield, MdLocalShipping, MdLoop,
  MdClose, MdPhotoCamera, MdVideoCall, MdSend, MdDelete,
} from 'react-icons/md';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';

interface ReviewMedia {
  url: string;
  type: 'image' | 'video';
}

interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string | null;
  user_username?: string | null;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  media_urls: string[];
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  user_username: string | null;
  user_role?: string | null;
  replies?: ReviewReply[];
}

interface ReviewStats {
  avg_rating: number;
  total: number;
  counts: Record<number, number>;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
}

interface ProductDetail {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  price: number | string;
  price_striked?: number | string | null;
  stock: number;
  condition: 'NEW' | 'USED' | 'FOODS';
  status: string;
  is_preorder?: boolean;
  preorder_days?: number | null;
  created_at: string;
  seller_name?: string;
  seller_username?: string;
  seller_role?: string;
  seller_avatar?: string;
  seller_bio?: string;
  category_name?: string;
  category_slug?: string;
  images?: ProductImage[];
  variations?: { name: string; options: string[]; option_prices?: Record<string, number>; option_stocks?: Record<string, number>; required?: boolean }[];
}

const rp = (n: number) =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const CONDITION_CFG: Record<string, { label: string; pill: string; ribbon: string }> = {
  NEW:   { label: 'Baru',  pill: 'bg-blue-100 text-blue-700',   ribbon: 'bg-blue-600 text-white' },
  USED:  { label: 'Bekas', pill: 'bg-amber-100 text-amber-700', ribbon: 'bg-amber-500 text-white' },
  FOODS: { label: 'Foods', pill: 'bg-green-100 text-green-700', ribbon: 'bg-green-600 text-white' },
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  MAHASISWA:    { label: 'Mahasiswa',    className: 'bg-blue-100 text-blue-700' },
  DOSEN:        { label: 'Dosen',        className: 'bg-green-100 text-green-700' },
  KARYAWAN:     { label: 'Karyawan',     className: 'bg-orange-100 text-orange-700' },
  UKM_OFFICIAL: { label: 'UKM Official', className: 'bg-blue-100 text-blue-700' },
};

const ROLE_BADGE_REVIEW: Record<string, { label: string; className: string }> = {
  MAHASISWA: { label: 'Mahasiswa', className: 'bg-blue-100 text-blue-700' },
  DOSEN:     { label: 'Dosen',     className: 'bg-green-100 text-green-700' },
  KARYAWAN:  { label: 'Karyawan',  className: 'bg-orange-100 text-orange-700' },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'deskripsi' | 'ulasan'>('deskripsi');

  // ── Action Sheet state ───────────────────────────────────────────────────
  const [sheetAction, setSheetAction] = useState<'buy' | 'cart' | null>(null);
  const [sheetQty, setSheetQty] = useState(1);
  const [sheetVariations, setSheetVariations] = useState<Record<string, string>>({});

  // ── Review state ─────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ avg_rating: 0, total: 0, counts: {1:0,2:0,3:0,4:0,5:0} });
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMedia, setReviewMedia] = useState<File[]>([]);
  const [reviewMediaPreviews, setReviewMediaPreviews] = useState<ReviewMedia[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [myExistingReview, setMyExistingReview] = useState<Review | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const fetchReviews = async (productId: string) => {
    try {
      const res = await apiGet<ApiResponse<{ reviews: Review[]; stats: ReviewStats }>>(`/reviews/product/${productId}`);
      const data = (res as any).data;
      setReviews(data?.reviews ?? []);
      setReviewStats(data?.stats ?? { avg_rating: 0, total: 0, counts: {1:0,2:0,3:0,4:0,5:0} });
    } catch { /* ignore */ }
    setReviewsLoaded(true);
  };

  // Sync existing review; don't pre-fill form so it resets after submit
  useEffect(() => {
    if (!reviewsLoaded || !user) return;
    const mine = reviews.find(r => r.user_id === user.id) ?? null;
    setMyExistingReview(mine);
  }, [reviewsLoaded, reviews, user]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) return;
      try {
        const response = await apiGet<ApiResponse<ProductDetail>>(`/products/${params.id}`);
        if (response.data) {
          setProduct(response.data);
          fetchReviews(params.id as string);
        } else {
          setError('Produk tidak ditemukan');
        }
      } catch {
        setError('Produk tidak ditemukan');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  // Lazy-load reviews when tab is first opened
  useEffect(() => {
    if (activeTab === 'ulasan' && !reviewsLoaded && params.id) {
      fetchReviews(params.id as string);
    }
  }, [activeTab, reviewsLoaded, params.id]);

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6">
            <div className="space-y-3">
              <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse max-w-[540px]" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse" />)}
              </div>
            </div>
            <div className="space-y-4 pt-1">
              {[80, 55, 100, 100, 70].map((w, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-xl animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* Error state */
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Produk Tidak Ditemukan</h2>
            <p className="text-gray-500 mb-6 text-sm">{error}</p>
            <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              Kembali ke Beranda
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* Derived values */
  const price = Number(product.price);
  const priceStriked = product.price_striked ? Number(product.price_striked) : null;
  const discount =
    priceStriked && priceStriked > price
      ? Math.round(((priceStriked - price) / priceStriked) * 100)
      : 0;

  // Effective price updates when a variation option with its own price is selected
  const effectivePrice = (product.variations ?? []).reduce<number>((p, v) => {
    const sel = sheetVariations[v.name];
    const optPrice = sel ? (v.option_prices?.[sel] ?? 0) : 0;
    return optPrice > 0 ? optPrice : p;
  }, price);

  // Effective stock: use option-specific stock if a variation with stock is selected
  const effectiveStock = (() => {
    let result: number | null = null;
    for (const v of product.variations ?? []) {
      const sel = sheetVariations[v.name];
      if (sel && v.option_stocks && v.option_stocks[sel] !== undefined) {
        const s = v.option_stocks[sel];
        if (result === null || s < result) result = s;
      }
    }
    return result ?? product.stock;
  })();

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [{ id: '1', product_id: product.id, image_url: '/images/placeholder-product.png', is_primary: true }];

  const isOwner = user && user.id === product.seller_id;

  // ── Review helpers ───────────────────────────────────────────────────────
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 4 - reviewMedia.length;
    const toAdd = files.slice(0, remaining);
    setReviewMedia(prev => [...prev, ...toAdd]);
    const previews = toAdd.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video') ? 'video' as const : 'image' as const,
    }));
    setReviewMediaPreviews(prev => [...prev, ...previews]);
    if (e.target) e.target.value = '';
  };

  const removeMedia = (idx: number) => {
    URL.revokeObjectURL(reviewMediaPreviews[idx].url);
    setReviewMedia(prev => prev.filter((_, i) => i !== idx));
    setReviewMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) { router.push('/login?redirect=' + encodeURIComponent(`/products/${params.id}`)); return; }
    if (myRating === 0) { showToast('Pilih rating terlebih dahulu', 'error'); return; }
    setSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('rating', String(myRating));
      if (reviewComment.trim()) formData.append('comment', reviewComment.trim());
      reviewMedia.forEach(f => formData.append('media', f));

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/reviews/${params.id}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengirim ulasan');
      showToast(data.message || 'Ulasan berhasil dikirim', 'success');
      setMyRating(0);
      setReviewComment('');
      setReviewMedia([]);
      setReviewMediaPreviews([]);
      setIsEditingReview(false);
      setReviewsLoaded(false);
      await fetchReviews(params.id as string);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim ulasan', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Hapus ulasan ini?')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      showToast('Ulasan dihapus', 'success');
      setMyRating(0); setReviewComment(''); setMyExistingReview(null);
      setReviewsLoaded(false);
      await fetchReviews(params.id as string);
    } catch {
      showToast('Gagal menghapus ulasan', 'error');
    }
  };
  const handleAddReply = async (reviewId: string) => {
    const comment = (replyInputs[reviewId] ?? '').trim();
    if (!comment) return;
    setSubmittingReply(reviewId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/reviews/${reviewId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Gagal'); }
      setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
      setShowReplies(prev => ({ ...prev, [reviewId]: true }));
      setReviewsLoaded(false);
      await fetchReviews(params.id as string);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim balasan', 'error');
    } finally {
      setSubmittingReply(null);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Hapus balasan ini?')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/reviews/replies/${replyId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      showToast('Balasan dihapus', 'success');
      setReviewsLoaded(false);
      await fetchReviews(params.id as string);
    } catch {
      showToast('Gagal menghapus balasan', 'error');
    }
  };

  const isBuyer = !user || ['MAHASISWA', 'DOSEN', 'KARYAWAN'].includes(user.role);
  const canBuy = product.stock > 0 && !isOwner && isBuyer;

  const conditionCfg = CONDITION_CFG[product.condition] ?? CONDITION_CFG.NEW;
  const roleBadge = ROLE_BADGE[product.seller_role ?? ''];
  const isUkm = product.seller_role === 'UKM_OFFICIAL';
  const sellerInitial = (product.seller_name || 'S').charAt(0).toUpperCase();

  const openSheet = (action: 'buy' | 'cart') => {
    if (!isLoggedIn) {
      router.push('/login?redirect=' + encodeURIComponent(`/products/${params.id}`));
      return;
    }
    setSheetQty(1);
    setSheetVariations({});
    setSheetAction(action);
  };

  const handleSheetConfirm = () => {
    if (!product) return;

    // Validate all variations have been selected
    if (product.variations && product.variations.length > 0) {
      const missing = product.variations.filter(v => v.required !== false && !sheetVariations[v.name]);
      if (missing.length > 0) {
        showToast(`Pilih ${missing[0].name} terlebih dahulu`, 'error');
        return;
      }
    }

    if (sheetAction === 'buy') {
      const variantParam = Object.keys(sheetVariations).length > 0
        ? '&variations=' + encodeURIComponent(JSON.stringify(sheetVariations))
        : '';
      router.push(`/checkout?product=${params.id}&qty=${sheetQty}${variantParam}`);
    } else {
      addToCart({
        productId: product.id,
        title: product.title,
        price: effectivePrice,
        imageUrl: images[0]?.image_url ?? '/images/placeholder-product.png',
        stock: effectiveStock,
        sellerId: product.seller_id,
        sellerName: product.seller_name ?? '',
        sellerAvatar: product.seller_avatar,
        variations: Object.keys(sheetVariations).length > 0 ? sheetVariations : undefined,
      }, sheetQty);
      showToast('Produk ditambahkan ke keranjang', 'success');
    }
    setSheetAction(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Main Product Grid */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_420px] items-start">

            {/* LEFT: Gallery */}
            <div className="lg:sticky lg:top-6 space-y-3 p-4 lg:border-r border-gray-100">
              <div className="relative bg-gray-50 rounded-xl overflow-hidden aspect-square">
                <img
                  src={images[selectedImage]?.image_url}
                  alt={product.title}
                  className="w-full h-full object-contain p-3"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
                />
                <div className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-lg ${conditionCfg.ribbon}`}>
                  {conditionCfg.label}
                </div>
                {discount > 0 && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
                    -{discount}%
                  </div>
                )}
                {product.is_preorder && (
                  <div className="absolute bottom-0 inset-x-0 bg-orange-500/90 text-white text-xs font-semibold text-center py-2 tracking-widest">
                    PRE-ORDER
                  </div>
                )}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow">Stok Habis</span>
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 bg-white transition-all ${
                        selectedImage === i ? 'border-blue-500 shadow-sm scale-[1.04]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Unified info panel */}
            <div className="divide-y divide-gray-100 lg:sticky lg:top-6">

              {/* Section 1: Title + Badges + Rating */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {product.category_name && (
                    <span className="px-2.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-500 rounded-full">{product.category_name}</span>
                  )}
                  <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${conditionCfg.pill}`}>{conditionCfg.label}</span>
                  {product.is_preorder && (
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-orange-100 text-orange-600 rounded-full">
                      PRE-ORDER{product.preorder_days ? ` · ${product.preorder_days} hari` : ''}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-semibold text-gray-900 leading-snug">{product.title}</h1>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      s <= Math.round(reviewStats.avg_rating)
                        ? <MdStar key={s} className="text-yellow-400 text-sm" />
                        : <MdStarOutline key={s} className="text-gray-300 text-sm" />
                    ))}
                  </div>
                  <span>·</span>
                  <span>
                    {reviewStats.total > 0
                      ? <>{reviewStats.avg_rating.toFixed(1)} ({reviewStats.total} ulasan)</>
                      : 'Belum ada ulasan'}
                  </span>
                </div>
              </div>

              {/* Section 2: Price */}
              <div className="px-5 py-4">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl font-semibold text-blue-600">Rp{rp(price)}</span>
                  {discount > 0 && priceStriked && (
                    <>
                      <span className="text-sm text-gray-400 line-through">Rp{rp(priceStriked)}</span>
                      <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Hemat {discount}%</span>
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Stock */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600">
                      {product.stock > 0
                        ? <><span className="font-semibold text-green-600">{product.stock}</span> stok tersedia</>
                        : <span className="font-semibold text-red-500">Stok habis</span>}
                    </span>
                  </div>
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="text-[11px] bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-full border border-orange-100">
                      Sisa sedikit!
                    </span>
                  )}
                </div>
              </div>

              {/* Section 4: CTA Buttons + inline trust micro-labels */}
              <div className="p-5 space-y-2.5">
                {isOwner ? (
                  <Link href="/dashboard/products">
                    <button className="w-full py-3.5 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors">
                      Kelola Produk
                    </button>
                  </Link>
                ) : !isBuyer && user ? (
                  <div className="p-3 bg-gray-50 rounded-xl text-center text-sm text-gray-500 border border-gray-200">
                    {user.role === 'ADMIN' ? 'Admin tidak dapat melakukan pembelian' : 'Akun UKM tidak dapat membeli produk'}
                  </div>
                ) : product.stock === 0 ? (
                  <button disabled className="w-full py-3.5 bg-gray-100 text-gray-400 rounded-xl font-semibold text-sm cursor-not-allowed">
                    Stok Habis
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => openSheet('buy')}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                    >
                      Beli Sekarang
                    </button>
                    <button
                      onClick={() => openSheet('cart')}
                      className="w-full py-3.5 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors"
                    >
                      {isInCart(product.id) ? 'Tambah lagi ke keranjang' : 'Tambah ke keranjang'}
                    </button>
                  </>
                )}
                {/* Trust micro-labels */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <MdShield className="text-gray-400 text-sm shrink-0" />Transaksi Aman
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <MdLocalShipping className="text-gray-400 text-sm shrink-0" />Pengiriman Cepat
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <MdLoop className="text-gray-400 text-sm shrink-0" />Garansi Retur
                  </span>
                </div>
              </div>

              {/* Section 5: Seller */}
              {product.seller_name && (
                <div className="p-5 space-y-3">
                  {/* Avatar + info row */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {product.seller_avatar ? (
                        <img
                          src={product.seller_avatar}
                          alt={product.seller_name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-gray-100"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-lg">{sellerInitial}</span>
                        </div>
                      )}
  
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm leading-tight">{product.seller_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {product.seller_username && (
                          <span className="text-xs text-gray-400">@{product.seller_username}</span>
                        )}
                        {roleBadge && (
                          isUkm ? (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600">
                              <MdVerified className="text-sm" />{roleBadge.label}
                            </span>
                          ) : (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadge.className}`}>
                              {roleBadge.label}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    {product.seller_username && (
                      <Link
                        href={`/${product.seller_username}`}
                        className="shrink-0 flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        <MdStore className="text-base" />
                        Toko
                      </Link>
                    )}
                  </div>
                  {product.seller_bio && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{product.seller_bio}</p>
                  )}
                  <button
                    disabled={!isLoggedIn || !!isOwner}
                    title={!isLoggedIn ? 'Login untuk chat' : isOwner ? 'Ini produk Anda' : undefined}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <IoChatbubbleEllipsesOutline className="text-base" />
                    Chat Penjual
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* TABS: Deskripsi + Ulasan */}
          <div className="mt-6 bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="flex border-b border-gray-100">
              {(['deskripsi', 'ulasan'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-semibold transition-colors relative ${
                    activeTab === tab
                      ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'deskripsi' ? 'Deskripsi Produk' : 'Ulasan Pembeli'}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === 'deskripsi' && (
                <div className="max-w-3xl">
                  {product.description ? (
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <MdShoppingBag className="text-5xl text-gray-200 mb-3" />
                      <p className="text-gray-400 italic text-sm">Tidak ada deskripsi untuk produk ini.</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'ulasan' && (
                <div className="space-y-6">

                  {/* ── Stats summary ──────────────────────────────────────── */}
                  <div className="flex items-center gap-8 pb-6 border-b border-gray-100">
                    <div className="text-center shrink-0">
                      <p className="text-5xl font-semibold text-gray-900">{reviewStats.avg_rating.toFixed(1)}</p>
                      <div className="flex justify-center mt-1.5 gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          s <= Math.round(reviewStats.avg_rating)
                            ? <MdStar key={s} className="text-yellow-400 text-lg" />
                            : <MdStarOutline key={s} className="text-gray-300 text-lg" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{reviewStats.total} ulasan</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5,4,3,2,1].map(star => {
                        const cnt = reviewStats.counts[star] ?? 0;
                        const pct = reviewStats.total > 0 ? Math.round((cnt / reviewStats.total) * 100) : 0;
                        return (
                          <div key={star} className="flex items-center gap-2.5">
                            <span className="text-xs text-gray-500 w-3 text-right">{star}</span>
                            <MdStar className="text-yellow-400 text-xs shrink-0" />
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-4 text-right">{cnt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Review form (logged-in, not owner, buyer role) ──────── */}
                  {isLoggedIn && !isOwner && ['MAHASISWA','DOSEN','KARYAWAN'].includes(user?.role ?? '') && (
                    <>
                      {/* Read-only card when review exists and not editing */}
                      {myExistingReview && !isEditingReview ? (
                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-blue-800">Ulasan kamu</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setIsEditingReview(true); setMyRating(myExistingReview.rating); setReviewComment(myExistingReview.comment ?? ''); }}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                              >Edit</button>
                              <button
                                onClick={() => handleDeleteReview(myExistingReview.id)}
                                className="flex items-center gap-0.5 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                              ><MdDelete className="text-sm" />Hapus</button>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => s <= myExistingReview.rating
                              ? <MdStar key={s} className="text-yellow-400 text-lg" />
                              : <MdStarOutline key={s} className="text-gray-300 text-lg" />)}
                          </div>
                          {myExistingReview.comment && (
                            <p className="text-sm text-gray-700 leading-relaxed">{myExistingReview.comment}</p>
                          )}
                          {myExistingReview.media_urls?.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {myExistingReview.media_urls.map((url, i) => {
                                const isVid = url.match(/\.(mp4|mov|webm)$/i);
                                return isVid
                                  ? <video key={i} src={url} controls className="w-20 h-20 rounded-xl object-cover bg-black" />
                                  : <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover border border-blue-100 cursor-pointer" onClick={() => window.open(url, '_blank')} />;
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700">
                              {isEditingReview ? 'Edit ulasan kamu' : 'Tulis ulasan'}
                            </p>
                            {isEditingReview && (
                              <button
                                onClick={() => { setIsEditingReview(false); setMyRating(0); setReviewComment(''); }}
                                className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                              >Batal</button>
                            )}
                          </div>

                          {/* Star picker */}
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button
                                key={s}
                                type="button"
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setMyRating(s)}
                                className="text-3xl transition-transform hover:scale-110"
                              >
                                {(hoverRating || myRating) >= s
                                  ? <MdStar className="text-yellow-400" />
                                  : <MdStarOutline className="text-gray-300" />}
                              </button>
                            ))}
                            {myRating > 0 && (
                              <span className="ml-2 text-xs text-gray-500">
                                {['','Sangat Buruk','Buruk','Cukup','Bagus','Sangat Bagus'][myRating]}
                              </span>
                            )}
                          </div>

                          {/* Comment */}
                          <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Ceritakan pengalamanmu dengan produk ini (opsional)..."
                            rows={3}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />

                          {/* Media previews */}
                          {reviewMediaPreviews.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {reviewMediaPreviews.map((m, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                                  {m.type === 'video'
                                    ? <video src={m.url} className="w-full h-full object-cover" />
                                    : <img src={m.url} className="w-full h-full object-cover" alt="" />}
                                  <button
                                    onClick={() => removeMedia(i)}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                                  >
                                    <MdClose className="text-xs" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Actions row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                ref={mediaInputRef}
                                type="file"
                                accept="image/*,video/mp4,video/quicktime,video/webm"
                                multiple
                                className="hidden"
                                onChange={handleMediaSelect}
                              />
                              <button
                                type="button"
                                onClick={() => mediaInputRef.current?.click()}
                                disabled={reviewMedia.length >= 4}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 disabled:opacity-40 transition-colors"
                              >
                                <MdPhotoCamera className="text-base" />
                                Foto/Video ({reviewMedia.length}/4)
                              </button>
                            </div>
                            <button
                              onClick={handleSubmitReview}
                              disabled={submittingReview || myRating === 0}
                              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-xl transition-colors"
                            >
                              <MdSend className="text-sm" />
                              {submittingReview ? 'Mengirim...' : isEditingReview ? 'Perbarui' : 'Kirim Ulasan'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── Login prompt ───────────────────────────────────────── */}
                  {!isLoggedIn && (
                    <div className="text-center py-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">Login untuk memberikan ulasan</p>
                      <Link
                        href={`/login?redirect=${encodeURIComponent(`/products/${params.id}`)}`}
                        className="text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Masuk sekarang
                      </Link>
                    </div>
                  )}

                  {/* ── Review list ────────────────────────────────────────── */}
                  {!reviewsLoaded ? (
                    <div className="text-center py-10 text-gray-400 text-sm">Memuat ulasan...</div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="text-5xl mb-3">⭐</div>
                      <p className="text-gray-600 font-semibold text-sm">Belum ada ulasan</p>
                      <p className="text-gray-400 text-xs mt-1">Jadilah yang pertama memberikan ulasan</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {reviews.map(review => (
                        <div key={review.id} className="flex gap-3">
                          {/* Avatar */}
                          <div className="shrink-0">
                            {review.user_avatar
                              ? <img src={review.user_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                              : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center">
                                  <span className="text-white text-sm font-semibold">{(review.user_name || 'U').charAt(0).toUpperCase()}</span>
                                </div>}
                          </div>
                          <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{review.user_name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {review.user_username && (
                                    <span className="text-xs text-gray-400">@{review.user_username}</span>
                                  )}
                                  {review.user_role && ROLE_BADGE_REVIEW[review.user_role] && (
                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BADGE_REVIEW[review.user_role].className}`}>
                                      {ROLE_BADGE_REVIEW[review.user_role].label}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">
                                {new Date(review.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                              </span>
                            </div>
                            {/* Stars */}
                            <div className="flex gap-0.5 mt-0.5">
                              {[1,2,3,4,5].map(s => (
                                s <= review.rating
                                  ? <MdStar key={s} className="text-yellow-400 text-sm" />
                                  : <MdStarOutline key={s} className="text-gray-300 text-sm" />
                              ))}
                            </div>
                            {/* Comment */}
                            {review.comment && (
                              <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{review.comment}</p>
                            )}
                            {/* Media */}
                            {review.media_urls?.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {review.media_urls.map((url, i) => {
                                  const isVid = url.match(/\.(mp4|mov|webm)$/i);
                                  return isVid
                                    ? <video key={i} src={url} controls className="w-24 h-24 rounded-xl object-cover bg-black" />
                                    : <img key={i} src={url} alt="" className="w-24 h-24 rounded-xl object-cover border border-gray-100 cursor-pointer hover:opacity-90" onClick={() => window.open(url, '_blank')} />;
                                })}
                              </div>
                            )}

                            {/* ── Replies ─────────────────────────────────── */}
                            {(review.replies?.length ?? 0) > 0 && (
                              <div className="mt-2">
                                <button
                                  className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                                  onClick={() => setShowReplies(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                                >
                                  {showReplies[review.id]
                                    ? 'Sembunyikan balasan'
                                    : `Lihat ${review.replies!.length} balasan`}
                                </button>
                                {showReplies[review.id] && (
                                  <div className="mt-2 space-y-2 pl-3 border-l-2 border-gray-100">
                                    {review.replies!.map(reply => (
                                      <div key={reply.id} className="flex gap-2 items-start">
                                        <div className="shrink-0">
                                          {reply.user_avatar
                                            ? <img src={reply.user_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                            : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                                                <span className="text-white text-xs font-semibold">{(reply.user_name || 'U').charAt(0).toUpperCase()}</span>
                                              </div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 justify-between">
                                            <span className="text-xs font-semibold text-gray-800">{reply.user_name}</span>
                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-gray-400">
                                                {new Date(reply.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                                              </span>
                                              {user && user.id === reply.user_id && (
                                                <button
                                                  onClick={() => handleDeleteReply(reply.id)}
                                                  className="text-[10px] text-red-400 hover:text-red-600 ml-1"
                                                  title="Hapus balasan"
                                                >
                                                  <MdDelete className="text-sm" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{reply.comment}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Reply input */}
                            {isLoggedIn && (
                              <div className="flex gap-2 mt-2 items-center">
                                <input
                                  type="text"
                                  value={replyInputs[review.id] ?? ''}
                                  onChange={e => setReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddReply(review.id); } }}
                                  placeholder="Balas ulasan ini..."
                                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
                                />
                                <button
                                  onClick={() => handleAddReply(review.id)}
                                  disabled={submittingReply === review.id || !(replyInputs[review.id] ?? '').trim()}
                                  className="text-blue-600 hover:text-blue-700 disabled:text-gray-300 transition-colors"
                                >
                                  <MdSend className="text-base" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <Footer />

      {/* ── Action Sheet: Pilih Jumlah & Variasi ── */}
      {sheetAction && product && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetAction(null)}
          />
          {/* Sheet */}
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Handle bar (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-900 text-sm">
                {sheetAction === 'buy' ? 'Beli Sekarang' : 'Tambah ke Keranjang'}
              </h3>
              <button
                onClick={() => setSheetAction(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <MdClose className="text-lg" />
              </button>
            </div>
            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              {/* Product preview row */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <img
                  src={images[0]?.image_url ?? '/images/placeholder-product.png'}
                  alt={product.title}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0"
                  onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.title}</p>
                  <p className="text-base font-bold text-blue-600 mt-1">Rp{rp(effectivePrice)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{effectiveStock} stok tersedia</p>
                </div>
              </div>

              {/* Variations */}
              {product.variations && product.variations.length > 0 && (
                <div className="space-y-4">
                  {product.variations.map((variation, vi) => (
                    <div key={vi}>
                      <p className="text-sm font-semibold text-gray-700 mb-2.5">
                        {variation.name}
                        {variation.required === false
                          ? <span className="ml-1.5 text-[11px] font-normal text-gray-400">(opsional)</span>
                          : !sheetVariations[variation.name] && <span className="ml-1.5 text-[11px] font-normal text-orange-500">Pilih salah satu</span>
                        }
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {variation.options.map(opt => {
                          const optStock = variation.option_stocks?.[opt];
                          const isOutOfStock = optStock !== undefined && optStock <= 0;
                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => !isOutOfStock && setSheetVariations(prev => ({ ...prev, [variation.name]: opt }))}
                              className={`px-3.5 py-1.5 rounded-lg border-2 text-sm font-medium transition-all ${
                                sheetVariations[variation.name] === opt
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : isOutOfStock
                                    ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <span>{opt}</span>
                              {optStock !== undefined && (
                                <span className={`text-[10px] ml-1 ${isOutOfStock ? 'text-red-400' : 'text-gray-400'}`}>
                                  ({isOutOfStock ? 'habis' : `${optStock}`})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity picker */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Jumlah</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSheetQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors active:bg-gray-100"
                    >
                      <MdRemove />
                    </button>
                    <span className="w-14 text-center text-sm font-bold border-x border-gray-200 py-2.5">{sheetQty}</span>
                    <button
                      type="button"
                      onClick={() => setSheetQty(q => Math.min(effectiveStock, q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors active:bg-gray-100"
                    >
                      <MdAdd />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">maks. {effectiveStock} item</span>
                </div>
              </div>
            </div>

            {/* Footer / Confirm */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total Harga</span>
                <span className="text-lg font-bold text-gray-900">Rp{rp(effectivePrice * sheetQty)}</span>
              </div>
              <button
                onClick={handleSheetConfirm}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm ${
                  sheetAction === 'buy'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-600'
                }`}
              >
                {sheetAction === 'buy' ? 'Lanjut ke Pembayaran' : 'Tambah ke Keranjang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
