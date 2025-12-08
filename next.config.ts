import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  images:{
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**/*', // Allows any path/folder after the hostname
      },
    ],
  }
};

export default nextConfig;
