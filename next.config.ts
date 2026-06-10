import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      "lucide-react",
      "@base-ui/react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [375, 750, 1000, 1500],
    // NOTE: `i.ytimg.com` is intentionally absent here even though it appears in
    // the CSP `img-src`. YouTube thumbnails render via a raw <img> in
    // youtube-facade.tsx (not next/image), so they need a CSP allowance but NOT
    // a next/image optimizer remotePattern. Only hosts passed through next/image
    // (Google avatar via lh3) belong in remotePatterns.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // NOTE: Content-Security-Policy is intentionally NOT set here. It is
          // generated per-request in `src/proxy.ts` with a fresh nonce so we
          // can drop 'unsafe-inline'/'unsafe-eval' from script-src. Defining a
          // second static CSP here would produce a conflicting double header.
        ],
      },
    ];
  },
};

export default nextConfig;
