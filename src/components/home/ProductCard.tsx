'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  rating?: number;
  sold?: number;
  location?: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
        {/* Product Image */}
        <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[40px]">
            {product.title}
          </h3>
          
          <div className="text-lg font-bold text-gray-900 mb-2">
            {formatPrice(product.price)}
          </div>

          {product.location && (
            <div className="flex items-center text-xs text-gray-500 mb-2">
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {product.location}
            </div>
          )}

          <div className="flex items-center justify-between">
            {product.rating && product.sold && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center">
                  <svg className="w-3 h-3 text-yellow-400 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {product.rating}
                </span>
                <span className="text-gray-300">|</span>
                <span>{product.sold} terjual</span>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-600 truncate">{product.seller}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
