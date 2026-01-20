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
  const response = await apiGet<ApiResponse<OrdersResponse>>(
    `/orders/my${query ? `?${query}` : ''}`
  );
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal mengambil data pesanan');
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
  const response = await apiGet<ApiResponse<OrdersResponse>>(
    `/orders/seller${query ? `?${query}` : ''}`
  );
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal mengambil data pesanan');
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
export async function cancelOrder(orderId: string): Promise<Order> {
  const response = await apiPost<ApiResponse<Order>>(`/orders/${orderId}/cancel`);
  
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Gagal membatalkan pesanan');
}
