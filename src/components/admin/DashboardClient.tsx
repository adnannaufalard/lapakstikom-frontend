'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';
import {
  Users,
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  Lock,
  FileText,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface UkmApplication {
  id: string;
  user_id: string;
  ukm_name: string;
  description?: string;
  logo_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface DashboardStats {
  total_users: number;
  total_ukm: number;
  total_products: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: number;
  pending_escrow: number;
  pending_tickets: number;
  pending_disputes: number;
  pending_refunds: number;
  pending_ukm: number;
}

interface OrderTrendData {
  date: string;
  orders: number;
  revenue: number;
}

interface RevenueByCategory {
  category_name: string;
  total_revenue: number;
  order_count: number;
}

// Simple Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className 
}: { 
  title: string; 
  value: string | number; 
  icon: any;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className="text-lg font-semibold text-gray-900 mt-0.5">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={cn(
                "text-[10px] font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}>
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className="p-2 bg-gray-50 rounded-lg">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ 
  href, 
  label, 
  count, 
  icon: Icon 
}: { 
  href: string; 
  label: string; 
  count: number; 
  icon: any;
}) {
  const hasItems = count > 0;
  return (
    <Link href={href}>
      <div className={cn(
        "bg-white rounded-lg border p-3 transition-all hover:shadow-sm cursor-pointer",
        hasItems ? "border-amber-200 bg-amber-50/50" : "border-gray-200"
      )}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600">{label}</p>
            <p className={cn(
              "text-lg font-semibold mt-0.5",
              hasItems ? "text-amber-700" : "text-gray-400"
            )}>
              {count}
            </p>
          </div>
          <div className={cn(
            "p-1.5 rounded-lg",
            hasItems ? "bg-amber-100" : "bg-gray-100"
          )}>
            <Icon className={cn(
              "w-4 h-4",
              hasItems ? "text-amber-600" : "text-gray-400"
            )} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orderTrend, setOrderTrend] = useState<OrderTrendData[]>([]);
  const [revenueByCategory, setRevenueByCategory] = useState<RevenueByCategory[]>([]);
  const [ukmApplications, setUkmApplications] = useState<UkmApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendRes, categoryRes, ukmRes] = await Promise.all([
          apiGet<ApiResponse<DashboardStats>>('/admin/dashboard/stats', true),
          apiGet<ApiResponse<OrderTrendData[]>>('/admin/dashboard/order-trend?days=7', true),
          apiGet<ApiResponse<RevenueByCategory[]>>('/admin/dashboard/revenue-by-category', true),
          apiGet<ApiResponse<UkmApplication[]>>('/admin/ukm/applications', true),
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (trendRes.data) setOrderTrend(trendRes.data);
        if (categoryRes.data) setRevenueByCategory(categoryRes.data);
        if (ukmRes.data) setUkmApplications(ukmRes.data);
      } catch (err: any) {
        console.error('Gagal memuat data admin:', err);
        setError(err.message || 'Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApproval = async (applicationId: string, action: 'approve' | 'reject') => {
    setProcessing(applicationId);
    setError(null);
    setSuccess('');

    try {
      const endpoint = `/admin/ukm/applications/${applicationId}/${action}`;
      const response = await apiPost<ApiResponse<any>>(endpoint, {}, true);
      
      if (response.success) {
        setSuccess(`Aplikasi berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
        const ukmRes = await apiGet<ApiResponse<UkmApplication[]>>('/admin/ukm/applications', true);
        if (ukmRes.data) setUkmApplications(ukmRes.data);
      } else {
        setError(response.message || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses aplikasi');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          <p className="text-xs text-gray-500 mt-2">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-md">
          <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700">{success}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.total_users?.toLocaleString('id-ID') || '0'}
          icon={Users}
        />
        <StatsCard
          title="Active UKM"
          value={stats?.total_ukm?.toLocaleString('id-ID') || '0'}
          icon={Building2}
        />
        <StatsCard
          title="Total Products"
          value={stats?.total_products?.toLocaleString('id-ID') || '0'}
          icon={Package}
        />
        <StatsCard
          title="Total Orders"
          value={stats?.total_orders?.toLocaleString('id-ID') || '0'}
          icon={ShoppingCart}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(stats?.total_revenue || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Escrow</p>
              <p className="text-base font-semibold text-gray-900">{formatCurrency(stats?.pending_escrow || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Orders</p>
              <p className="text-base font-semibold text-gray-900">{stats?.pending_orders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div>
        <h2 className="text-xs font-medium text-gray-700 mb-2">Pending Tasks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TaskCard
            href="/admin/ukm-applications"
            label="UKM Applications"
            count={stats?.pending_ukm || 0}
            icon={FileText}
          />
          <TaskCard
            href="/admin/tickets"
            label="Support Tickets"
            count={stats?.pending_tickets || 0}
            icon={MessageSquare}
          />
          <TaskCard
            href="/admin/disputes"
            label="Disputes"
            count={stats?.pending_disputes || 0}
            icon={AlertTriangle}
          />
          <TaskCard
            href="/admin/refund-requests"
            label="Refund Requests"
            count={stats?.pending_refunds || 0}
            icon={RotateCcw}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Order Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-3">
            <h3 className="text-xs font-medium text-gray-900">Orders Trend</h3>
            <p className="text-[10px] text-gray-500">7 hari terakhir</p>
          </div>
          {orderTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={orderTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  fontSize={11}
                  stroke="#94a3b8"
                  tickLine={false}
                />
                <YAxis 
                  fontSize={11} 
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    fontSize: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400">
              <p className="text-xs">No data available</p>
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="mb-3">
            <h3 className="text-xs font-medium text-gray-900">Revenue by Category</h3>
            <p className="text-[10px] text-gray-500">Distribusi pendapatan</p>
          </div>
          {revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis 
                  type="number" 
                  fontSize={11} 
                  stroke="#94a3b8"
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <YAxis 
                  dataKey="category_name" 
                  type="category"
                  fontSize={11}
                  stroke="#94a3b8"
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    fontSize: '12px',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar 
                  dataKey="total_revenue" 
                  fill="#6366f1" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400">
              <p className="text-xs">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent UKM Applications */}
      {ukmApplications.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-medium text-gray-900">Recent UKM Applications</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Aplikasi terbaru dari UKM</p>
            </div>
            <Link 
              href="/admin/ukm-applications" 
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100">
            {ukmApplications.slice(0, 5).map((app) => (
              <div key={app.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-medium text-gray-900 truncate">{app.ukm_name}</h4>
                      <p className="text-[10px] text-gray-500 truncate">{app.user?.full_name} • {app.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn(
                      "px-1.5 py-0.5 text-[10px] font-medium rounded-full",
                      app.status === 'PENDING' && "bg-amber-100 text-amber-700",
                      app.status === 'APPROVED' && "bg-emerald-100 text-emerald-700",
                      app.status === 'REJECTED' && "bg-red-100 text-red-700"
                    )}>
                      {app.status}
                    </span>
                    {app.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApproval(app.id, 'approve')}
                          disabled={processing === app.id}
                          className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === app.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Approve'
                          )}
                        </button>
                        <button
                          onClick={() => handleApproval(app.id, 'reject')}
                          disabled={processing === app.id}
                          className="px-2 py-1 bg-white text-gray-700 text-[10px] font-medium rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
