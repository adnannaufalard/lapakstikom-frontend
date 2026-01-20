import { AdminLayout } from '@/components/layout/AdminLayout';

// Admin pages don't need SSR - disable it to prevent hydration mismatches
export const dynamic = 'force-dynamic';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
