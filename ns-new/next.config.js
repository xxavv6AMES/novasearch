/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY,
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
      }
    ],
  },
}

module.exports = nextConfig
