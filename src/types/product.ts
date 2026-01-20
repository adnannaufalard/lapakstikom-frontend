/**
 * Product types
 */

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  condition: 'NEW' | 'USED';
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'BANNED';
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    full_name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  price: number;
  stock: number;
  condition: 'NEW' | 'USED';
  category_id?: string;
}
