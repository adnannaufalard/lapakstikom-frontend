'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
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
  Newspaper,
  Lock,
  Ticket,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  Loader2,
  House,
  Bell,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  badge?: 'pending';
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
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
    icon: Newspaper,
    items: [
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

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isLoggedIn } = useAdminAuth();

  // Sidebar: collapsible, persist in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // User menu dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [pendingCount, setPendingCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Accordion: auto-open the section that contains the current path
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const active = NAV_SECTIONS.find(s => s.items.some(i => pathname === i.href || pathname?.startsWith(i.href + '/')));
    return active ? [active.title] : ['Overview'];
  });

  useEffect(() => { setMounted(true); }, []);

  // Persist collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_sidebar_collapsed', String(collapsed));
    }
  }, [collapsed]);

  // Auth redirect
  useEffect(() => {
    if (!mounted || isLoading || hasRedirected) return;
    if (!isLoggedIn) { setHasRedirected(true); router.push('/admin/auth/login'); return; }
    if (user && user.role !== 'ADMIN') { setHasRedirected(true); router.push('/'); return; }
  }, [mounted, isLoading, isLoggedIn, user?.role, hasRedirected, router]);

  // Fetch pending UKM applications badge count
  useEffect(() => {
    if (!mounted || isLoading || !isLoggedIn || user?.role !== 'ADMIN') return;
    const fetch = async () => {
      try {
        const res = await apiGet<ApiResponse<{ pending: number }>>('/ukm/admin/applications/stats', true);
        if (res.success && res.data) setPendingCount(res.data.pending);
      } catch { /* silent */ }
    };
    fetch();
    const t = setInterval(fetch, 60000);
    return () => clearInterval(t);
  }, [mounted, isLoading, isLoggedIn, user?.role]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

  if (!isLoggedIn || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Redirecting...</span>
        </div>
      </div>
    );
  }

  // Resolve current page title for header
  const activeItem = NAV_SECTIONS.flatMap(s => s.items).find(
    i => pathname === i.href || (i.href !== '/admin' && pathname?.startsWith(i.href + '/'))
  );
  const currentPageTitle = activeItem?.name ?? 'Dashboard';

  const handleLogout = () => { logout(); router.push('/admin/auth/login'); };

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-gray-800 flex flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo + hamburger — h-16, NOT inside scroll area */}
        <div className={cn(
          'flex items-center h-16 border-b border-gray-700 flex-shrink-0',
          collapsed ? 'justify-center' : 'justify-between px-4'
        )}>
          {!collapsed && (
            <Image
              src="/images/logo.png"
              alt="Lapak STIKOM"
              width={110}
              height={32}
              className="object-contain brightness-0 invert"
            />
          )}
          <button
            onClick={() => { setCollapsed(c => !c); setMobileOpen(false); }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation — flex-1 scroll area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {NAV_SECTIONS.map(section => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.includes(section.title);
            const hasActive = section.items.some(i => pathname === i.href || (i.href !== '/admin' && pathname?.startsWith(i.href + '/')));

            if (collapsed) {
              // Collapsed mode: icon + hover tooltip panel
              return (
                <div key={section.title} className="relative group">
                  <button className={cn(
                    'w-full flex items-center justify-center py-2.5 rounded-lg transition-colors',
                    hasActive ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  )}>
                    <SectionIcon className="w-5 h-5" />
                  </button>
                  {/* Flyout submenu */}
                  <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50 bg-gray-900 rounded-xl py-2 w-52 shadow-xl border border-gray-700">
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{section.title}</p>
                    {section.items.map(item => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center justify-between px-3 py-1.5 text-xs transition-colors',
                            isActive ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
                          )}
                        >
                          <span>{item.name}</span>
                          {item.badge === 'pending' && pendingCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium bg-red-500 text-white rounded-full">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Expanded mode: accordion
            return (
              <div key={section.title} className="mb-0.5">
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    hasActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  )}
                >
                  <SectionIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left text-sm">{section.title}</span>
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform duration-200 flex-shrink-0',
                    isExpanded ? 'rotate-180' : ''
                  )} />
                </button>

                <div className={cn(
                  'overflow-hidden transition-all duration-200',
                  isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}>
                  <div className="mt-0.5 ml-4 space-y-0.5 border-l border-gray-700 pl-3 pb-1">
                    {section.items.map(item => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors',
                            isActive
                              ? 'bg-white/20 text-white font-medium'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          )}
                        >
                          <span>{item.name}</span>
                          {item.badge === 'pending' && pendingCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium bg-red-500 text-white rounded-full">
                              {pendingCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: Lihat Beranda */}
        <div className="border-t border-gray-700 py-3 px-2 flex-shrink-0">
          <Link
            href="/"
            title={collapsed ? 'Lihat Beranda' : undefined}
            className={cn(
              'flex items-center rounded-lg py-2.5 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors group relative',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3'
            )}
          >
            <House className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Lihat Beranda</span>}
            {collapsed && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-gray-700">
                Lihat Beranda
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className={cn(
        'transition-all duration-300',
        collapsed ? 'lg:pl-16' : 'lg:pl-64'
      )}>
        {/* Header — h-16 to match sidebar top */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          {/* Left: mobile hamburger + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-900">{currentPageTitle}</h1>
          </div>

          {/* Right: notification bell + avatar + name + dropdown */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* User menu dropdown */}
            <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {user.full_name?.charAt(0).toUpperCase() ?? 'A'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[200px] truncate">
                {user.full_name ?? 'Admin'}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', userMenuOpen ? 'rotate-180' : '')} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name ?? 'Admin'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user.email ?? 'Administrator'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
            </div>{/* end user menu */}
          </div>{/* end right flex */}
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
