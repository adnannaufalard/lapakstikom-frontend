import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

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
    <html lang="id" suppressHydrationWarning className={poppins.variable}>
      <body className="font-poppins antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
