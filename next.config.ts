import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Silences the Turbopack error while keeping webpack config for standalone build
  // @ts-ignore - turbopack is a valid key in Next.js 16 but might not be in types yet
  turbopack: {},
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@libsql/client', '@prisma/adapter-libsql');
    }
    return config;
  },
};

export default nextConfig;
