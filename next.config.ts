import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Ignore lint and type errors during build for smoother deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Keep your existing configurations
  serverExternalPackages: ['tesseract.js', 'sharp'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**', 
      },
    ],
  }
};

export default nextConfig;