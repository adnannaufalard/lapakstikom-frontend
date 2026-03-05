import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice, getPrimaryImage } from '@/lib/products';
import { MdVerified } from 'react-icons/md';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getPrimaryImage(product);
  // Harga coret dan diskon
  const priceStriked = (product as any).price_striked || 0;
  const hasDiscount = priceStriked > product.price;
  const discount = hasDiscount ? Math.round(((priceStriked - product.price) / priceStriked) * 100) : 0;
  // Badge overlay
  let badgeText = '';
  let badgeColor = '';
  if (product.condition === 'NEW') {
    badgeText = 'New';
    badgeColor = 'bg-blue-600';
  } else if (product.condition === 'USED') {
    badgeText = 'Second';
    badgeColor = 'bg-red-600';
  } else if ((product as any).condition === 'FOODS') {
    badgeText = 'Foods';
    badgeColor = 'bg-green-600';
  }
  // Seller role badge
  const role = product.seller?.role;
  let roleBadge = null;
  if (role === 'MAHASISWA') roleBadge = <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">Mahasiswa</span>;
  else if (role === 'KARYAWAN') roleBadge = <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">Karyawan</span>;
  else if (role === 'DOSEN') roleBadge = <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">Dosen</span>;
  // UKM Official badge
  const isUkm = role === 'UKM_OFFICIAL';

  // Dummy rating & stok (replace with real data if available)
  const rating = (product as any).rating || 5.0;
  const stock = product.stock;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image & badge overlay */}
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
            }}
          />
          {/* Overlay badge kanan atas */}
          {badgeText && (
            <div className={`absolute top-2 right-2 px-3 py-1 rounded text-xs font-bold text-white ${badgeColor}`} style={{boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
              {badgeText}
            </div>
          )}
          {/* Stock Badge */}
          {stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Stok Habis
              </span>
            </div>
          )}
        </div>
        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-1">
            {product.title}
          </h3>
          {/* Harga & diskon */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 mr-0.5">Rp</span>
            <span className="text-2xl font-bold text-blue-700 leading-none">{formatPrice(product.price).replace('Rp', '').trim()}</span>
            {hasDiscount && (
              <>
                <span className="text-sm text-gray-400 line-through ml-2">{formatPrice(priceStriked)}</span>
                <span className="ml-1 px-2 py-0.5 rounded bg-red-100 text-red-600 text-xs font-bold">-{discount}%</span>
              </>
            )}
          </div>
          {/* Rating & stok */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <svg className="w-4 h-4 text-yellow-400 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z"/></svg>
            <span>{rating.toFixed(1)}</span>
            <span className="mx-1">|</span>
            <span>Stok {stock}</span>
          </div>
          {/* Seller & badge */}
          {product.seller && (
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-gray-700 font-semibold">@{product.seller.username || product.seller.full_name}</span>
              {roleBadge}
              {isUkm && (
                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold"><MdVerified className="inline text-blue-500"/> UKM Official</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
