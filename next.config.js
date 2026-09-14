/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' } // dev-only placeholder imagery
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' }
  }
};

module.exports = nextConfig;
