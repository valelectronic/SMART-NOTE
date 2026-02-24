import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  serverExternalPackages: [
    'tesseract.js',
    'sharp',
    'mermaid',
    'html2pdf.js',
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        crypto: false,
      };
    }

    if (isServer) {
      // Prevent server bundle from trying to process browser-only packages
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'mermaid',
        'html2pdf.js',
      ];
    }

    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;