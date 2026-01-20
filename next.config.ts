import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for faster development
  typescript: {
    // Skip type checking during dev for faster compilation
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    // Skip ESLint during dev for faster compilation
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ['@/components', '@/lib'],
    // Faster compile with optimized module resolution
    optimizeCss: true,
  },
  // Faster reloads
  reactStrictMode: true,
  // Disable x-powered-by header
  poweredByHeader: false,
  // Enable Turbopack explicitly (no webpack config needed)
  turbopack: {},
  // Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nubeywkwvladjfcwgbav.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
