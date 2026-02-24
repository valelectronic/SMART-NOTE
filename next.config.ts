import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //  Move out of experimental for Next.js 16+
  serverExternalPackages: ['tesseract.js', 'sharp'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**', // Simplified for all paths
      },
    ],
  }
};

export default nextConfig;