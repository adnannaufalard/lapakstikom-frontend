'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  rating?: number;
  sold?: number;
  location?: string;
  category?: string;
}

interface ProductCatalogProps {
  title: string;
  products: Product[];
  showTabs?: boolean;
  viewMoreLink?: string;
}

const tabs = [
  { id: 'untukmu', label: 'Untukmu' },
  { id: 'populer', label: 'Paling Banyak Dicari' },
  { id: 'terjual', label: 'Paling Banyak Terjual' },
  { id: 'mahasiswa', label: 'Produk Mahasiswa' },
  { id: 'dosen', label: 'Produk Dosen' },
  { id: 'karyawan', label: 'Produk Karyawan' },
];

export function ProductCatalog({ title, products, showTabs = false, viewMoreLink }: ProductCatalogProps) {
  const [activeTab, setActiveTab] = useState('untukmu');

  return (
    <div className="space-y-6">
      {/* Header - Only show if title exists */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
      )}

      {/* Tabs */}
      {showTabs && (
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-8 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Produk</h3>
          <p className="text-gray-600">Produk akan ditampilkan di sini setelah diposting.</p>
        </div>
      )}

      {/* View More Button - Remove from here */}
    </div>
  );
}
