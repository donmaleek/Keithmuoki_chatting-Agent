/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`
        }
      ]
    };
  }
};

export default nextConfig;
