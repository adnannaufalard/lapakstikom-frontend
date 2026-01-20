import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice, getPrimaryImage } from '@/lib/products';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = getPrimaryImage(product);
  
  return (
    <Link href={`/products/${product.id}`}>
      <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/placeholder-product.png';
            }}
          />
          {/* Condition Badge */}
          <div className="absolute top-2 left-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                product.condition === 'NEW'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {product.condition === 'NEW' ? 'Baru' : 'Bekas'}
            </span>
          </div>
          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>
          
          <p className="mt-2 text-lg font-bold text-blue-600">
            {formatPrice(product.price)}
          </p>

          {/* Seller Info */}
          {product.seller && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {product.seller.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="truncate">{product.seller.full_name}</span>
            </div>
          )}

          {/* Category */}
          {product.category && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                {product.category.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
