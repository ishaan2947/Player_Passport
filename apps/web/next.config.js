/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Disable x-powered-by header
  poweredByHeader: false,
  // Enable strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;

