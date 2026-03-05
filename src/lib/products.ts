/**
 * Product API utilities
 */

import { apiGet, apiPost, apiPatch, apiDelete, ApiResponse } from './api';
import { Product, ProductsResponse, Category, CreateProductRequest } from '@/types';

// Query params untuk list produk
export interface ProductQueryParams {
  q?: string;
  category_id?: string;
  condition?: 'NEW' | 'USED';
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

// Fetch semua produk
export async function getProducts(params?: ProductQueryParams): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const response = await apiGet<ApiResponse<ProductsResponse>>(
    `/products${query ? `?${query}` : ''}`
  );
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal mengambil data produk');
}

// Fetch detail produk
export async function getProduct(id: string): Promise<Product> {
  const response = await apiGet<ApiResponse<Product>>(`/products/${id}`);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Produk tidak ditemukan');
}

// Fetch kategori
export async function getCategories(): Promise<Category[]> {
  try {
    const response = await apiGet<ApiResponse<Category[]>>('/products/categories');
    
    if (response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

// Create produk baru
export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const response = await apiPost<ApiResponse<Product>>('/products', data);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal membuat produk');
}

// Update produk
export async function updateProduct(id: string, data: Partial<CreateProductRequest>): Promise<Product> {
  const response = await apiPatch<ApiResponse<Product>>(`/products/${id}`, data);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal mengupdate produk');
}

// Delete produk (soft delete)
export async function deleteProduct(id: string): Promise<void> {
  await apiDelete<ApiResponse>(`/products/${id}`);
}

// Format harga
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Get primary image URL
export function getPrimaryImage(product: Product): string {
  // Support for both images array and primary_image string
  if (product.images && product.images.length > 0) {
    const primaryImage = product.images.find(img => img.is_primary);
    return primaryImage?.image_url || product.images[0].image_url;
  }
  if (product.primary_image) {
    return product.primary_image;
  }
  return '/images/placeholder-product.png';
}
