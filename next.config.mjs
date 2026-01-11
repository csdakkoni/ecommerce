/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: '/Users/erdemaslan/.gemini/antigravity/scratch/agoraloom-ecommerce',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
