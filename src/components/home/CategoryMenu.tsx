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
    <div className="flex">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/products?category=${category.slug}`}
          className="group flex flex-1 items-center justify-center gap-2 py-2 px-2 rounded-xl hover:bg-blue-50 transition-colors min-w-0"
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-lg shrink-0">
            <img
              src={category.icon}
              alt={category.name}
              className="w-12 h-12 object-contain"
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 transition-colors leading-tight whitespace-nowrap">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
