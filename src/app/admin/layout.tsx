'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Bypass AdminLayout for auth pages (login)
  if (pathname.startsWith('/admin/auth')) {
    return <>{children}</>;
  }
  
  return <AdminLayout>{children}</AdminLayout>;
}
