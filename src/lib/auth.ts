/**
 * Auth utilities - Token management & auth state
 */

import { apiGet, apiPost, apiPostWithToken, ApiResponse } from './api';
import { User, UserRole } from '@/types';

// Re-export types untuk compatibility
export type { User, UserRole };

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  username?: string;
  role?: 'MAHASISWA' | 'DOSEN' | 'KARYAWAN';
  nim?: string;
  program_studi?: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp_code: string;
}

export interface OnboardingRequest {
  username: string;
  role: 'MAHASISWA' | 'DOSEN' | 'KARYAWAN';
  bio?: string;
  phone?: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requiresVerification: boolean;
}

export interface VerifyOTPResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    username?: string;
    role: UserRole;
    avatar_url?: string;
  };
}

export interface OnboardingResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  requiresOnboarding?: boolean;
  onboardingToken?: string;
  message?: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  username: string;
}

// Token management - User Session (for marketplace)
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// Admin Token management - Isolated Session (admin panel only)
export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function removeAdminToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

export function isAdminAuthenticated(): boolean {
  return !!getAdminToken();
}

// Onboarding token (temporary)
export function setOnboardingToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('onboarding_token', token);
  }
}

export function getOnboardingToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('onboarding_token');
}

export function removeOnboardingToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('onboarding_token');
  }
}

// Pending email for OTP verification
export function setPendingEmail(email: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pending_email', email);
  }
}

export function getPendingEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('pending_email');
}

export function removePendingEmail(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('pending_email');
  }
}

// Auth API calls

// Admin Login - Isolated session for admin panel
export async function adminLogin(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiPost<ApiResponse<LoginResponse>>('/auth/admin/login', data);
  if (response.data) {
    if (response.data.token && response.data.user) {
      setAdminToken(response.data.token);
    }
    return response.data;
  }
  throw new Error(response.message || 'Login admin gagal');
}

// User Login - Block ADMIN from this endpoint
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiPost<ApiResponse<LoginResponse>>('/auth/login', data);
  if (response.data) {
    if (response.data.token && response.data.user) {
      setToken(response.data.token);
    }
    return response.data;
  }
  throw new Error(response.message || 'Login gagal');
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiPost<ApiResponse<RegisterResponse>>('/auth/register', data);
  if (response.data) {
    setPendingEmail(data.email);
    return response.data;
  }
  throw new Error(response.message || 'Registrasi gagal');
}

export async function verifyOTP(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
  const response = await apiPost<ApiResponse<VerifyOTPResponse>>('/auth/verify-otp', data);
  if (response.data) {
    // Set token and user data after successful OTP verification
    if (response.data.token) {
      setToken(response.data.token);
    }
    removePendingEmail();
    return response.data;
  }
  throw new Error(response.message || 'Verifikasi OTP gagal');
}

export async function completeOnboarding(data: OnboardingRequest): Promise<OnboardingResponse> {
  const onboardingToken = getOnboardingToken();
  if (!onboardingToken) {
    throw new Error('Sesi onboarding tidak ditemukan');
  }
  
  const response = await apiPostWithToken<ApiResponse<OnboardingResponse>>('/auth/onboarding', data, onboardingToken);
  
  if (response.data) {
    removeOnboardingToken();
    removePendingEmail();
    setToken(response.data.token);
    return response.data;
  }
  throw new Error(response.message || 'Gagal menyelesaikan onboarding');
}

export async function resendOTP(email: string): Promise<ApiResponse> {
  return apiPost<ApiResponse>('/auth/resend-otp', { email });
}

export async function checkUsername(username: string): Promise<CheckUsernameResponse> {
  const response = await apiGet<ApiResponse<CheckUsernameResponse>>(`/auth/check-username?username=${encodeURIComponent(username)}`);
  if (response.data) {
    return response.data;
  }
  throw new Error('Gagal memeriksa username');
}

export async function verifyEmail(token: string): Promise<ApiResponse> {
  return apiGet<ApiResponse>(`/auth/verify-email?token=${token}`);
}

export async function getMe(): Promise<User> {
  const response = await apiGet<ApiResponse<User>>('/auth/me');
  if (response.data) {
    return response.data;
  }
  throw new Error('Gagal mengambil data user');
}

export function logout(): void {
  removeToken();
  removeOnboardingToken();
  removePendingEmail();
}

export function adminLogout(): void {
  removeAdminToken();
}
