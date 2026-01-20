'use client';

import { useState } from 'react';
import { Category } from '@/types';

interface ProductFiltersProps {
  categories: Category[];
  onFilterChange: (filters: ProductFilterValues) => void;
}

export interface ProductFilterValues {
  q: string;
  category_id: string;
  condition: string;
  min_price: string;
  max_price: string;
  sort: string;
}

export function ProductFilters({ categories, onFilterChange }: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilterValues>({
    q: '',
    category_id: '',
    condition: '',
    min_price: '',
    max_price: '',
    sort: 'newest',
  });

  const handleChange = (key: keyof ProductFilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ProductFilterValues = {
      q: '',
      category_id: '',
      condition: '',
      min_price: '',
      max_price: '',
      sort: 'newest',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filter</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Reset
        </button>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cari Produk
        </label>
        <input
          type="text"
          value={filters.q}
          onChange={(e) => handleChange('q', e.target.value)}
          placeholder="Kata kunci..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori
        </label>
        <select
          value={filters.category_id}
          onChange={(e) => handleChange('category_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kondisi
        </label>
        <select
          value={filters.condition}
          onChange={(e) => handleChange('condition', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua</option>
          <option value="NEW">Baru</option>
          <option value="USED">Bekas</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rentang Harga
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => handleChange('min_price', e.target.value)}
            placeholder="Min"
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => handleChange('max_price', e.target.value)}
            placeholder="Max"
            className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Urutkan
        </label>
        <select
          value={filters.sort}
          onChange={(e) => handleChange('sort', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="price_asc">Harga Terendah</option>
          <option value="price_desc">Harga Tertinggi</option>
        </select>
      </div>
    </div>
  );
}
