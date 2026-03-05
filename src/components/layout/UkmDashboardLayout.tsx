'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdVerified } from 'react-icons/md';
import { HiHome, HiCube, HiClipboardDocumentList, HiChatBubbleOvalLeftEllipsis, HiBuildingStorefront, HiDocumentChartBar, HiCog6Tooth, HiBars3, HiXMark, HiBell, HiArrowLeftOnRectangle } from 'react-icons/hi2';
import Image from 'next/image';

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
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <HiHome className="w-5 h-5" />,
  },
  {
    name: 'Kelola Produk',
    href: '/dashboard/products',
    icon: <HiCube className="w-5 h-5" />,
  },
  {
    name: 'Pesanan Masuk',
    href: '/dashboard/orders',
    icon: <HiClipboardDocumentList className="w-5 h-5" />,
  },
  {
    name: 'Chat',
    href: '/dashboard/chat',
    icon: <HiChatBubbleOvalLeftEllipsis className="w-5 h-5" />,
  },
  {
    name: 'Halaman Toko',
    href: '/dashboard/store',
    icon: <HiBuildingStorefront className="w-5 h-5" />,
  },
  {
    name: 'Laporan Keuangan',
    href: '/dashboard/finance',
    icon: <HiDocumentChartBar className="w-5 h-5" />,
  },
  {
    name: 'Pengaturan',
    href: '/dashboard/settings',
    icon: <HiCog6Tooth className="w-5 h-5" />,
  },
];

export default function UkmDashboardLayout({ children, ukmName = 'UKM', avatarUrl }: UkmDashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* UKM Info */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={ukmName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{ukmName.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h2 className="text-sm font-semibold text-gray-900 truncate">{ukmName}</h2>
                <MdVerified className="text-blue-500 text-lg flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-500">Official Store</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {menuItems.map((item) => {
            // Untuk dashboard utama, hanya aktif jika pathname persis '/dashboard'
            // Untuk menu lainnya, aktif jika pathname sama atau dimulai dengan href menu
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <HiArrowLeftOnRectangle className="w-5 h-5 text-gray-400" />
            Kembali ke Beranda
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <HiBars3 className="w-6 h-6" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find(item => {
                if (item.href === '/dashboard') {
                  return pathname === '/dashboard';
                }
                return pathname === item.href || pathname?.startsWith(item.href + '/');
              })?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <HiBell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
