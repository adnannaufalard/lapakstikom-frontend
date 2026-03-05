import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Slugify text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Check if file is image
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Get role label for display
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: 'Admin',
    UKM_OFFICIAL: 'UKM Official',
    MAHASISWA: 'Mahasiswa',
    DOSEN: 'Dosen',
    KARYAWAN: 'Karyawan',
  };
  return labels[role] || role;
}

// Get order status label for display
export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    WAITING_PAYMENT: 'Menunggu Pembayaran',
    PAID_ESCROW: 'Dibayar (Escrow)',
    SHIPPED: 'Dikirim',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
    REFUND_REQUESTED: 'Refund Diminta',
    REFUNDED: 'Direfund',
  };
  return labels[status] || status;
}
