'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ClipboardList, MessageCircle,
  Store, BarChart3, Settings, Menu, Bell, LogOut,
  ChevronDown, House, Star, ShoppingCart, X,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useSellerNotifications } from '@/hooks/useSellerNotifications';
import { formatCurrency } from '@/lib/utils';

interface UkmDashboardLayoutProps {
  children: ReactNode;
  ukmName?: string;
  avatarUrl?: string | null;
}

interface MenuItem {
  name: string;
  href: string;
  icon: ReactNode;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard',        href: '/dashboard',          icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Kelola Produk',    href: '/dashboard/products', icon: <Package className="w-5 h-5" /> },
  { name: 'Pesanan Masuk',    href: '/dashboard/orders',   icon: <ClipboardList className="w-5 h-5" /> },
  { name: 'Chat',             href: '/dashboard/chat',     icon: <MessageCircle className="w-5 h-5" /> },
  { name: 'Halaman Toko',     href: '/dashboard/store',    icon: <Store className="w-5 h-5" /> },
  { name: 'Laporan Keuangan', href: '/dashboard/finance',  icon: <BarChart3 className="w-5 h-5" /> },
  { name: 'Pengaturan',       href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
];

export default function UkmDashboardLayout({ children, ukmName: nameProp, avatarUrl: avatarProp }: UkmDashboardLayoutProps) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout, isLoggedIn } = useAuth();

  // Desktop sidebar: expanded / collapsed — persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  // Mobile sidebar: overlay open/close
  const [mobileOpen, setMobileOpen]   = useState(false);
  // Header user menu dropdown
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // Notification panel
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName   = nameProp ?? user?.full_name ?? 'UKM';
  const displayAvatar = avatarProp ?? user?.avatar_url ?? null;

  const { badgeCounts, recentOrders, recentReviews, readIds, totalUnread, markRead, markAllRead } =
    useSellerNotifications(isLoggedIn);

  // Persist collapsed when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', String(collapsed));
    }
  }, [collapsed]);

  // Badge map: href → count from backend (not affected by notification read state)
  const badgeMap: Record<string, number> = {
    '/dashboard/orders': badgeCounts.new_orders,
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeItem = menuItems.find(item => {
    if (item.href === '/dashboard') return pathname === '/dashboard';
    return pathname === item.href || pathname?.startsWith(item.href + '/');
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-blue-700 flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Sidebar top: logo + hamburger */}
        <div className={`flex items-center h-16 border-b border-blue-600 flex-shrink-0 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
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
            onClick={() => {
              setCollapsed(c => !c);
              setMobileOpen(false);
            }}
            className="p-2 text-blue-200 hover:text-white hover:bg-blue-600 rounded-lg transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
          {menuItems.map((item) => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            const badge = badgeMap[item.href] ?? 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={`flex items-center rounded-lg py-2.5 transition-colors group relative
                  ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}
                  ${isActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className="flex-shrink-0 relative">
                  {item.icon}
                  {/* Badge on icon when collapsed */}
                  {collapsed && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {!collapsed && <span className="text-sm truncate flex-1">{item.name}</span>}
                {/* Badge on label when expanded */}
                {!collapsed && badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.name}{badge > 0 ? ` (${badge})` : ''}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className={`border-t border-blue-600 py-3 px-2 flex-shrink-0`}>
          <Link
            href="/"
            title={collapsed ? 'Beranda' : undefined}
            className={`flex items-center rounded-lg py-2.5 text-blue-200 hover:bg-white/10 hover:text-white transition-colors group relative
              ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}
          >
            <House className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Kembali ke Beranda</span>}
            {collapsed && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                Beranda
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* ─── Main area ─── */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          {/* Left: mobile menu button + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 hidden sm:block">
              {activeItem?.name ?? 'Dashboard'}
            </h1>
          </div>

          {/* Right: bell + user menu */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>

              {/* Notification dropdown panel */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 max-h-[480px] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">Notifikasi</p>
                      {totalUnread > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                          {totalUnread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {totalUnread > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Tandai semua dibaca
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {/* New orders section */}
                    {recentOrders.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <ShoppingCart className="w-3 h-3" />
                            Pesanan Baru
                            {recentOrders.filter(o => !readIds.has(o.id)).length > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold">{recentOrders.filter(o => !readIds.has(o.id)).length}</span>
                            )}
                          </p>
                        </div>
                        {recentOrders.map(order => {
                          const isRead = readIds.has(order.id);
                          return (
                            <Link
                              key={order.id}
                              href={`/dashboard/orders?highlight=${order.id}`}
                              onClick={() => { markRead(order.id); setNotifOpen(false); }}
                              className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${isRead ? 'opacity-60' : ''}`}
                            >
                              {!isRead && <span className="flex-shrink-0 mt-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
                              {isRead  && <span className="flex-shrink-0 mt-2.5 w-1.5 h-1.5" />}
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 font-mono">{order.order_code}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  {order.buyer_name} · {order.item_count} item
                                </p>
                                <p className="text-xs font-bold text-blue-600 mt-0.5">{formatCurrency(order.total_amount)}</p>
                              </div>
                            </Link>
                          );
                        })}
                        <Link
                          href="/dashboard/orders"
                          onClick={() => { markAllRead(); setNotifOpen(false); }}
                          className="block px-4 py-2 text-center text-xs text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
                        >
                          Lihat Semua Pesanan →
                        </Link>
                      </>
                    )}

                    {/* New reviews section */}
                    {recentReviews.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 border-t border-gray-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Star className="w-3 h-3" />
                            Ulasan Terbaru
                            {recentReviews.filter(r => !readIds.has(r.id)).length > 0 && (
                              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[9px] font-bold">{recentReviews.filter(r => !readIds.has(r.id)).length}</span>
                            )}
                          </p>
                        </div>
                        {recentReviews.map(review => {
                          const isRead = readIds.has(review.id);
                          return (
                            <Link
                              key={review.id}
                              href={`/dashboard/products/${review.product_id}?tab=reviews`}
                              onClick={() => { markRead(review.id); setNotifOpen(false); }}
                              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isRead ? 'opacity-60' : ''}`}
                            >
                              {!isRead && <span className="flex-shrink-0 mt-2.5 w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
                              {isRead  && <span className="flex-shrink-0 mt-2.5 w-1.5 h-1.5" />}
                              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Star className="w-4 h-4 text-yellow-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{review.product_name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className={`text-[10px] ${i < review.rating ? 'text-yellow-500' : 'text-gray-200'}`}>★</span>
                                  ))}
                                  <span className="text-[10px] text-gray-500 ml-1">oleh {review.reviewer_name}</span>
                                </div>
                                {review.comment && (
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">{review.comment}</p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </>
                    )}

                    {/* Empty state */}
                    {recentOrders.length === 0 && recentReviews.length === 0 && (
                      <div className="py-10 text-center">
                        <Bell className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Tidak ada notifikasi baru</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {displayAvatar ? (
                    <Image src={displayAvatar} alt={displayName} width={32} height={32} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-white text-sm font-bold">{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[200px] truncate">{displayName}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl py-1.5 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user?.email ?? 'UKM Official'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              )}
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
