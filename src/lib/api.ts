/**
 * API Helper untuk konsumsi REST API backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Type untuk response API
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Custom error untuk API
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Helper untuk get token dari localStorage
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Helper untuk get admin token dari localStorage (isolated session)
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

// Helper untuk clear token saat 401
function clearTokenOnUnauthorized(useAdminToken: boolean = false): void {
  if (typeof window === 'undefined') return;
  
  if (useAdminToken) {
    localStorage.removeItem('admin_token');
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem('onboarding_token');
    localStorage.removeItem('pending_email');
  }
}

// Base fetch dengan error handling
async function baseFetch<T>(
  path: string,
  options: RequestInit = {},
  useAdminToken: boolean = false
): Promise<T> {
  const token = useAdminToken ? getAdminToken() : getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Auto-clear token on authentication errors
    if (response.status === 401 && token) {
      clearTokenOnUnauthorized(useAdminToken);
    }
    
    throw new ApiError(
      data.message || 'Terjadi kesalahan pada server',
      response.status,
      data
    );
  }

  return data;
}

// GET request
export async function apiGet<T>(path: string, useAdminToken: boolean = false): Promise<T> {
  return baseFetch<T>(path, { method: 'GET' }, useAdminToken);
}

// POST request
export async function apiPost<T>(path: string, body?: unknown, useAdminToken: boolean = false): Promise<T> {
  return baseFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  }, useAdminToken);
}

// POST request with custom token (for onboarding)
export async function apiPostWithToken<T>(path: string, body: unknown, token: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Terjadi kesalahan pada server',
      response.status,
      data
    );
  }

  return data;
}

// PATCH request
export async function apiPatch<T>(path: string, body?: unknown, useAdminToken: boolean = false): Promise<T> {
  return baseFetch<T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  }, useAdminToken);
}

// PUT request
export async function apiPut<T>(path: string, body?: unknown, useAdminToken: boolean = false): Promise<T> {
  return baseFetch<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  }, useAdminToken);
}

// DELETE request
export async function apiDelete<T>(path: string, body?: unknown, useAdminToken: boolean = false): Promise<T> {
  return baseFetch<T>(path, {
    method: 'DELETE',
    body: body ? JSON.stringify(body) : undefined,
  }, useAdminToken);
}

// Upload file (multipart/form-data)
export async function apiUpload<T>(path: string, formData: FormData, useAdminToken: boolean = false): Promise<T> {
  const token = useAdminToken ? getAdminToken() : getToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.message || 'Gagal mengupload file',
      response.status,
      data
    );
  }

  return data;
}
