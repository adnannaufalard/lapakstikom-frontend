/**
 * Order API utilities
 */

import { apiGet, apiPost, ApiResponse } from './api';
import { Order, CheckoutRequest, CheckoutResponse, PaginationMeta } from '@/types';

// Query params untuk list orders
export interface OrderQueryParams {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// Response untuk list orders
export interface OrdersResponse {
  data: Order[];
  meta: PaginationMeta;
}

// Fetch orders sebagai buyer
export async function getMyOrders(params?: OrderQueryParams): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  // Backend returns { success, data: Order[], meta } at the top level (flat), not nested
  const response = await apiGet<{ success: boolean; message?: string; data: Order[]; meta: PaginationMeta }>(
    `/orders/my${query ? `?${query}` : ''}`
  );
  
  return {
    data: response.data || [],
    meta: response.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

// Fetch orders sebagai seller
export async function getSellerOrders(params?: OrderQueryParams): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
  }

  const query = searchParams.toString();
  const response = await apiGet<{ success: boolean; message?: string; data: Order[]; meta: PaginationMeta }>(
    `/orders/seller${query ? `?${query}` : ''}`
  );
  
  return {
    data: response.data || [],
    meta: response.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

// Fetch detail order
export async function getOrder(id: string): Promise<Order> {
  const response = await apiGet<ApiResponse<Order>>(`/orders/${id}`);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Pesanan tidak ditemukan');
}

// Checkout / buat order baru
export async function checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await apiPost<ApiResponse<CheckoutResponse>>('/orders/checkout', data);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal membuat pesanan');
}

// Konfirmasi pesanan diterima (buyer)
export async function confirmOrder(orderId: string): Promise<Order> {
  const response = await apiPost<ApiResponse<Order>>(`/orders/${orderId}/confirm`);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal mengkonfirmasi pesanan');
}

// Kirim pesanan (seller)
export async function shipOrder(orderId: string, data: { courier: string; tracking_number: string }): Promise<Order> {
  const response = await apiPost<ApiResponse<Order>>(`/orders/${orderId}/ship`, data);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal mengirim pesanan');
}

// Batalkan pesanan
export async function cancelOrder(orderId: string, reason?: string): Promise<Order> {
  const response = await apiPost<ApiResponse<Order>>(`/orders/${orderId}/cancel`, { reason });
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal membatalkan pesanan');
}

// Tandai dikemas (seller: PAID_ESCROW → PROCESSING)
export async function packageOrder(orderId: string): Promise<Order> {
  const response = await apiPost<ApiResponse<Order>>(`/orders/${orderId}/package`);
  if (response.data) return response.data;
  throw new Error(response.message || 'Gagal memproses pesanan');
}

// Tandai tiba (admin: SHIPPED → ARRIVED)
export async function arriveOrder(orderId: string): Promise<Order> {
  const response = await apiPost<ApiResponse<Order>>(`/orders/${orderId}/arrive`);
  if (response.data) return response.data;
  throw new Error(response.message || 'Gagal memperbarui status pesanan');
}

// Ajukan pengembalian (buyer: COMPLETED → REFUND_REQUESTED, dalam 2 hari)
export async function requestRefund(orderId: string, reason: string): Promise<Order> {
  const response = await apiPost<ApiResponse<Order>>(`/orders/${orderId}/request-refund`, { reason });
  if (response.data) return response.data;
  throw new Error(response.message || 'Gagal mengajukan pengembalian');
}
