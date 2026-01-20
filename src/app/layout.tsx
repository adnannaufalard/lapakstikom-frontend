import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";

export const metadata: Metadata = {
  title: {
    default: "Lapak STIKOM - Marketplace Kampus",
    template: "%s | Lapak STIKOM",
  },
  description: "Marketplace internal kampus STIKOM untuk jual-beli dan sewa berbagai produk antar civitas akademika.",
  keywords: ["marketplace", "stikom", "jual beli", "kampus", "mahasiswa"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
