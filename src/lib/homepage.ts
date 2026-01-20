/**
 * API functions for homepage content (banners and announcements)
 */

import { apiGet } from './api';

export interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  banner_type: 'HERO' | 'PROMO_FULL' | 'PROMO_LARGE' | 'PROMO_SMALL';
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  priority: number;
  is_active: boolean;
  is_pinned: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface BannersResponse {
  success: boolean;
  data: Banner[];
}

export interface AnnouncementsResponse {
  success: boolean;
  data: Announcement[];
}

/**
 * Fetch active banners (public endpoint)
 */
export async function getActiveBanners(): Promise<Banner[]> {
  try {
    const response = await apiGet<any>('/homepage/banners?active_only=true');
    console.log('API Response for banners:', response);
    
    // Handle both response formats: { data: [] } and direct array
    if (Array.isArray(response)) {
      return response;
    }
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch banners:', error);
    return [];
  }
}

/**
 * Fetch active banners by type (public endpoint)
 */
export async function getActiveBannersByType(type: string): Promise<Banner[]> {
  try {
    const response = await apiGet<BannersResponse>(`/homepage/banners?active_only=true&type=${type}`);
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch banners by type:', error);
    return [];
  }
}

/**
 * Fetch active announcements (public endpoint)
 */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const response = await apiGet<any>('/homepage/announcements?active_only=true');
    console.log('API Response for announcements:', response);
    
    // Handle both response formats: { data: [] } and direct array
    if (Array.isArray(response)) {
      return response;
    }
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
}
