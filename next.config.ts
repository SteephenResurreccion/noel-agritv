import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    optimizePackageImports: ["lucide-react", "@base-ui/react"],
  },
  images: {
    formats: ["image/webp"],
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
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://i.ytimg.com https://lh3.googleusercontent.com",
              "font-src 'self'",
              "connect-src 'self' https://va.vercel-scripts.com https://*.blob.vercel-storage.com https://challenges.cloudflare.com",
              "frame-src https://www.youtube.com https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
