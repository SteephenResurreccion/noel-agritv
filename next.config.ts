import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-accordion"],
  },
  images: {
    formats: ["image/webp"],
    deviceSizes: [375, 750, 1000, 1500],
  },
};

export default nextConfig;
