/**
 * Type definitions untuk Lapak STIKOM
 */

// User & Auth Types
// Role baru: gabungan role dan user_type
export type UserRole = 'ADMIN' | 'UKM_OFFICIAL' | 'MAHASISWA' | 'DOSEN' | 'KARYAWAN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  username?: string | null;
  role: UserRole;
  bio?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  nim?: string | null;
  program_studi?: string | null;
  is_email_verified: boolean;
  is_onboarded: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// UKM Types
export type UkmStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UkmProfile {
  id: string;
  user_id: string;
  ukm_name: string;
  description?: string;
  logo_url?: string;
  status: UkmStatus;
  created_at: string;
  updated_at: string;
}

// Product Types
export type ProductCondition = 'NEW' | 'USED' | 'FOODS';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface Product {
  id: string;
  seller_id: string;
  category_id?: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  condition: ProductCondition;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  // Relations
  seller?: User;
  category?: Category;
  images?: ProductImage[];
  // Tambahan agar sesuai backend
  primary_image?: string;
  price_striked?: number | string | null;
  is_preorder?: boolean;
  preorder_days?: number | null;
  variations?: Array<{ name: string; options: string[]; option_prices?: Record<string, number>; option_stocks?: Record<string, number>; required?: boolean }>;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

// Order Types
export type OrderStatus =
  | 'WAITING_PAYMENT'
  | 'PAID_ESCROW'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export interface Order {
  id: string;
  order_code: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  total_amount: number;
  payment_method?: string;
  product_amount?: number;
  voucher_discount_amount?: number;
  delivery_fee?: number;
  service_fee?: number;
  payment_method_fee?: number;
  shipping_address: string;
  courier?: string;
  tracking_number?: string;
  notes?: string;
  buyer_note?: string;
  // Snapshot fields (stored at order creation time)
  buyer_name_snapshot?: string;
  buyer_phone_snapshot?: string;
  buyer_prodi_snapshot?: string;
  buyer_nim_snapshot?: string;
  seller_name_snapshot?: string;
  seller_avatar_snapshot?: string;
  // Flat JOIN fields returned by API
  buyer_name?: string;
  seller_name?: string;
  seller_role?: string;
  seller_avatar?: string;
  created_at: string;
  updated_at: string;
  // Relations
  buyer?: User;
  seller?: User;
  items?: OrderItem[];
  payment?: Payment;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title_snapshot: string;
  price_snapshot: number;
  quantity: number;
  subtotal: number;
  variations?: Record<string, string>;
  product_image_url?: string;
  // Relations
  product?: Product;
}

// Payment Types
export interface Payment {
  id: string;
  order_id: string;
  midtrans_transaction_id?: string;
  payment_type?: string;
  gross_amount?: number;
  transaction_time?: string;
  transaction_status?: string;
  raw_response?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Escrow Types
export type EscrowEventType =
  | 'HELD'
  | 'RELEASE_REQUESTED'
  | 'RELEASED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'DISBURSEMENT_INITIATED'
  | 'DISBURSEMENT_SUCCESS'
  | 'DISBURSEMENT_FAILED';

export interface EscrowEvent {
  id: string;
  payment_id: string;
  event_type: EscrowEventType;
  amount: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Shipping Address
export interface ShippingAddress {
  id: string;
  user_id: string;
  label?: string;
  receiver_name: string;
  phone: string;
  address_line: string;
  city?: string;
  province?: string;
  postal_code?: string;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

// Products Response (for listing)
export interface ProductsResponse {
  data: Product[];
  meta: PaginationMeta;
}

// Create Product Request
export interface CreateProductRequest {
  title: string;
  description?: string;
  price: number;
  stock: number;
  condition: ProductCondition;
  category_id?: string;
  is_preorder?: boolean;
  preorder_days?: number;
}

// Checkout Request
export interface CheckoutRequest {
  seller_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  shipping_address: string;
}

// Checkout Response
export interface CheckoutResponse {
  order: Order;
  midtrans: {
    redirect_url: string;
    token: string;
  };
}
