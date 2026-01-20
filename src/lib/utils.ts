/**
 * Utility functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format harga ke Rupiah
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format tanggal
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date(date));
}

// Format tanggal dan waktu
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(date));
}

// Validasi email STIKOM
export function isValidStikomEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@student.stikomyos.ac.id');
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Status order ke bahasa Indonesia
export function getOrderStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    WAITING_PAYMENT: 'Menunggu Pembayaran',
    PAID_ESCROW: 'Dibayar (Escrow)',
    SHIPPED: 'Dikirim',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REFUND_REQUESTED: 'Permintaan Refund',
    REFUNDED: 'Direfund',
  };
  return statusMap[status] || status;
}

// Product condition ke bahasa Indonesia
export function getConditionLabel(condition: string): string {
  return condition === 'NEW' ? 'Baru' : 'Bekas';
}

// Role label
export function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    ADMIN: 'Administrator',
    UKM_OFFICIAL: 'Official UKM',
    MAHASISWA: 'Mahasiswa',
    DOSEN: 'Dosen',
    KARYAWAN: 'Karyawan',
  };
  return roleMap[role] || role;
}
