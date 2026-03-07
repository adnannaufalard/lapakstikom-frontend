'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, ApiResponse } from '@/lib/api';

export interface SellerBadgeCounts {
  new_orders: number;
  processing: number;
  shipped: number;
  arrived: number;
  new_reviews: number;
}

export interface RecentOrder {
  id: string;
  order_code: string;
  status: string;
  total_amount: number;
  created_at: string;
  buyer_name: string;
  item_count: number;
}

export interface RecentReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
  product_name: string;
  product_id: string;
}

interface NotificationData {
  badge_counts: SellerBadgeCounts;
  recent_orders: RecentOrder[];
  recent_reviews: RecentReview[];
}

const EMPTY_COUNTS: SellerBadgeCounts = {
  new_orders: 0,
  processing: 0,
  shipped: 0,
  arrived: 0,
  new_reviews: 0,
};

const READ_KEY = 'seller_notif_read_ids';

function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  // Keep only last 200 to avoid unbounded growth
  const arr = Array.from(ids).slice(-200);
  localStorage.setItem(READ_KEY, JSON.stringify(arr));
}

export function useSellerNotifications(enabled: boolean, intervalMs = 30_000) {
  const [badgeCounts, setBadgeCounts] = useState<SellerBadgeCounts>(EMPTY_COUNTS);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load read IDs from localStorage on mount
  useEffect(() => {
    setReadIds(getReadIds());
  }, []);

  const fetchCounts = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiGet<ApiResponse<NotificationData>>('/orders/seller/counts');
      if (res.data) {
        setBadgeCounts(res.data.badge_counts);
        setRecentOrders(res.data.recent_orders ?? []);
        setRecentReviews(res.data.recent_reviews ?? []);
      }
    } catch {
      // silent — notifications are non-critical
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchCounts();
    if (!enabled) return;
    const id = setInterval(fetchCounts, intervalMs);
    return () => clearInterval(id);
  }, [fetchCounts, enabled, intervalMs]);

  const markRead = useCallback((...ids: string[]) => {
    setReadIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const ids = [
      ...recentOrders.map(o => o.id),
      ...recentReviews.map(r => r.id),
    ];
    markRead(...ids);
  }, [recentOrders, recentReviews, markRead]);

  // Unread = items not yet in readIds
  const unreadOrderCount  = recentOrders.filter(o => !readIds.has(o.id)).length;
  const unreadReviewCount = recentReviews.filter(r => !readIds.has(r.id)).length;
  const totalUnread = unreadOrderCount + unreadReviewCount;

  return {
    badgeCounts,
    recentOrders,
    recentReviews,
    readIds,
    totalUnread,
    unreadOrderCount,
    unreadReviewCount,
    loading,
    refresh: fetchCounts,
    markRead,
    markAllRead,
  };
}
