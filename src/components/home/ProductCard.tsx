'use client';

import Link from 'next/link';
import { MdVerified, MdShoppingBag, MdStar } from 'react-icons/md';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  rating?: number;
  stock?: number;
  condition?: string;
  price_striked?: number | null;
  seller_role?: string;
  is_ukm_official?: boolean;
  is_preorder?: boolean;
}

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

/** Locale-independent Rupiah formatter: 165000 → "165.000" */
const rp = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function ProductCard({ product }: { product: Product }) {
  const discount =
    product.price_striked && product.price_striked > product.price
      ? Math.round(((product.price_striked - product.price) / product.price_striked) * 100)
      : 0;
  const conditionCfg = CONDITION_LABEL[(product.condition ?? '').toUpperCase()];
  const rating = product.rating ?? 0;
  const stock = product.stock ?? 0;
  const roleBadge = ROLE_BADGE[product.seller_role ?? ''];

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex flex-col">
        {/* Image – fixed height */}
        <div className="relative h-44 bg-gray-100 shrink-0 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-product.png'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <MdShoppingBag className="text-5xl" />
            </div>
          )}

          {/* Condition ribbon – top-right */}
          {conditionCfg && (
            <div className={`absolute top-0 right-0 px-2.5 py-0.5 text-[11px] font-bold rounded-bl-xl rounded-tr-2xl ${conditionCfg.className}`}>
              {conditionCfg.label}
            </div>
          )}

          {/* Out-of-stock overlay */}
          {stock <= 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Stok Habis</span>
            </div>
          )}

          {/* PRE-ORDER bar */}
          {product.is_preorder && (
            <div className="absolute bottom-0 inset-x-0 bg-orange-500 text-white text-[10px] font-bold text-center py-1 tracking-wide">
              PRE-ORDER
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1">
          {/* Name – max 2 lines with ellipsis */}
          <h3 className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem] overflow-hidden">
            {product.title}
          </h3>

          {/* Price + strikethrough + discount on one row */}
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
            <span>Stok {stock}</span>
          </div>

          {/* Seller footer */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span className="text-[10px] text-gray-400 font-normal truncate max-w-[120px]">
              @{product.seller}
            </span>
            {product.is_ukm_official ? (
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
      </div>
    </Link>
  );
}

