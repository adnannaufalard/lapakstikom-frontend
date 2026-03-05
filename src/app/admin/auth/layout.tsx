/**
 * Admin Auth Layout - Layout untuk halaman login admin
 * Bypass AdminLayout untuk menghindari redirect loop
 */

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
