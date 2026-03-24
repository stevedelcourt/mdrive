/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2GB',
    },
  },
  serverComponentsExternalPackages: [],
  modularizeImports: undefined,
};

module.exports = nextConfig;
