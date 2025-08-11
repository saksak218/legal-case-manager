import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Dangerously allow production builds to successfully complete even if your project has ESLint errors.
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  /* other config options */
};

export default nextConfig;
