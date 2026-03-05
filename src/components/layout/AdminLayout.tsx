'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { apiGet, ApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Package,
  LayoutDashboard,
  Lock,
  Ticket,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  Loader2,
  Search,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavigationSection {
  title: string;
  icon: any;
  items: {
    name: string;
    href: string;
    badge?: 'pending';
  }[];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isLoggedIn } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Overview']);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading || hasRedirected) return;
    
    if (!isLoggedIn) {
      setHasRedirected(true);
      router.push('/admin/auth/login');
      return;
    }
    
    if (user && user.role !== 'ADMIN') {
      setHasRedirected(true);
      router.push('/');
      return;
    }
  }, [mounted, isLoading, isLoggedIn, user?.role, hasRedirected, router]);

  useEffect(() => {
    if (!mounted || isLoading || !isLoggedIn || user?.role !== 'ADMIN') {
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const response = await apiGet<ApiResponse<{ pending: number }>>('/ukm/admin/applications/stats', true);
        if (response.success && response.data) {
          setPendingCount(response.data.pending);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    fetchPendingCount();
    
    const interval = setInterval(fetchPendingCount, 60000);
    return () => clearInterval(interval);
  }, [mounted, isLoading, isLoggedIn, user?.role]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecting...</span>
        </div>
      </div>
    );
  }

  const navigationSections: NavigationSection[] = [
    {
      title: 'Overview',
      icon: Home,
      items: [
        { name: 'Dashboard', href: '/admin' },
        { name: 'System Status', href: '/admin/system-status' },
      ],
    },
    {
      title: 'User & Seller',
      icon: Users,
      items: [
        { name: 'All Users', href: '/admin/users' },
        { name: 'UKM Applications', href: '/admin/ukm-applications', badge: 'pending' },
        { name: 'UKM Sellers', href: '/admin/ukm-sellers' },
      ],
    },
    {
      title: 'Marketplace',
      icon: Package,
      items: [
        { name: 'Products', href: '/admin/products' },
        { name: 'Categories', href: '/admin/categories' },
        { name: 'Orders', href: '/admin/orders' },
        { name: 'Transactions', href: '/admin/transactions' },
      ],
    },
    {
      title: 'Content',
      icon: LayoutDashboard,
      items: [
        { name: 'Homepage', href: '/admin/homepage' },
        { name: 'Announcements', href: '/admin/announcements' },
        { name: 'Banners', href: '/admin/banners' },
      ],
    },
    {
      title: 'Escrow & Payment',
      icon: Lock,
      items: [
        { name: 'Escrow Overview', href: '/admin/escrow' },
        { name: 'Release/Refund', href: '/admin/escrow/actions' },
      ],
    },
    {
      title: 'Promotion',
      icon: Ticket,
      items: [
        { name: 'Vouchers', href: '/admin/vouchers' },
        { name: 'Voucher Usage', href: '/admin/voucher-usage' },
      ],
    },
    {
      title: 'Customer Service',
      icon: MessageSquare,
      items: [
        { name: 'Tickets', href: '/admin/tickets' },
        { name: 'Disputes', href: '/admin/disputes' },
        { name: 'Refund Requests', href: '/admin/refund-requests' },
      ],
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      items: [
        { name: 'Analytics', href: '/admin/analytics' },
        { name: 'Reports', href: '/admin/reports' },
      ],
    },
    {
      title: 'System',
      icon: Settings,
      items: [
        { name: 'Admin Accounts', href: '/admin/admin-accounts' },
        { name: 'Activity Logs', href: '/admin/activity-logs' },
        { name: 'Settings', href: '/admin/settings' },
      ],
    },
  ];

  const handleLogout = async () => {
    logout();
    router.push('/admin/auth/login');
  };

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((title) => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-out lg:translate-x-0 flex flex-col",
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-center h-14 px-4 border-b border-gray-200 flex-shrink-0">
          <Image
            src="/images/logo.png"
            alt="Lapak STIKOM"
            width={120}
            height={40}
            className="h-9 w-auto object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navigationSections.map((section) => {
            const isExpanded = expandedSections.includes(section.title);
            const SectionIcon = section.icon;
            const hasActiveItem = section.items.some(item => pathname === item.href);
            
            return (
              <div key={section.title} className="mb-1">
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    "w-full flex items-center justify-between py-1.5 px-3 text-[13px] font-medium rounded-lg transition-colors",
                    hasActiveItem || isExpanded
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-3.5 h-3.5" />
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-gray-400 transition-transform duration-200",
                      isExpanded ? "rotate-180" : ""
                    )}
                  />
                </button>
                
                <div
                  className={cn(
                    "mt-1 ml-3 space-y-0.5 overflow-hidden transition-all duration-200",
                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        prefetch={true}
                        className={cn(
                          "flex items-center justify-between px-3 py-1.5 pl-6 rounded-lg text-xs transition-colors",
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-gray-900 hover:bg-gray-50"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>{item.name}</span>
                        {item.badge === 'pending' && pendingCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium leading-none bg-red-100 text-red-700 rounded-full">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-gray-900 truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-[11px] text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-1.5 mt-1 rounded-lg text-xs text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-4 bg-white border-b border-gray-200 lg:px-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-600" />
          </button>

          {/* Spacer for desktop */}
          <div className="flex-1" />

          {/* Search & Actions - aligned right */}
          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-56 pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs cursor-pointer hover:ring-2 hover:ring-indigo-200 transition-all">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
