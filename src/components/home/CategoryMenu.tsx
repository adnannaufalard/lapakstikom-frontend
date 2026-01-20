'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Category {
  name: string;
  icon: string;
  slug: string;
}

const categories: Category[] = [
  { 
    name: 'Rekomendasi', 
    icon: '/images/icons/rekomendasi.png', 
    slug: 'rekomendasi',
  },
  { 
    name: 'Gadget & Elektronik', 
    icon: '/images/icons/gadget.png', 
    slug: 'gadget-elektronik',
  },
  { 
    name: 'Fashion', 
    icon: '/images/icons/fashion.png', 
    slug: 'fashion',
  },
  { 
    name: 'Makanan & Minuman', 
    icon: '/images/icons/makanan&minuman.png', 
    slug: 'makanan-minuman',
  },
  { 
    name: 'Aksesoris', 
    icon: '/images/icons/aksesoris.png', 
    slug: 'aksesoris',
  },
  { 
    name: 'Hobi & Koleksi', 
    icon: '/images/icons/hobi&koleksi.png', 
    slug: 'hobi-koleksi',
  },
];

export function CategoryMenu() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/products?category=${category.slug}`}
          className="group"
        >
          <div className="bg-white rounded-xl px-4 py-4 hover:shadow-md transition-all duration-300 border border-gray-100 flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-lg">
              <img 
                src={category.icon} 
                alt={category.name}
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="font-semibold text-gray-900 text-xs group-hover:text-blue-600 transition-colors">
              {category.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
