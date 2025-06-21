/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
  },
  output: 'standalone',
  experimental: {
    disableOptimizedLoading: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imgs.search.brave.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.brave.com',
        pathname: '/**',
      },
      {
        // Allow all domains for favicons
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }
    ],
    // Allow unoptimized images for favicons
    unoptimized: true,
  },
  // Add build caching configuration
  generateBuildId: async () => {
    // You can, for example, get the latest git commit hash here
    return 'build-' + Date.now();
  },
}

module.exports = nextConfig
