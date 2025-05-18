/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
  },
  output: 'standalone',
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
}

module.exports = nextConfig
