import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for faster development
  typescript: {
    // Skip type checking during dev for faster compilation
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  // Note: `eslint` option removed because Next.js no longer supports it in `next.config`.
  // Manage ESLint separately via .eslintrc or CI scripts (e.g. `npm run lint`).
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
  turbopack: {
    root: process.cwd(), // Set root to current working directory to avoid multiple lockfile warning
  },
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
