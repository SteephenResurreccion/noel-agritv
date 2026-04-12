import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FACEBOOK_URL, YOUTUBE_URL, PHONE_TEL, EMAIL } from "@/lib/constants";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://noelagritv.com";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Noel AgriTV",
  url: siteUrl,
  logo: `${siteUrl}/images/whitebglogo.png`,
  description:
    "Bio-organic crop care products and quality seeds trusted by Filipino farmers since 2021.",
  foundingDate: "2021",
  founder: { "@type": "Person", name: "Noel Tolentino" },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+639272743281",
    contactType: "customer service",
    availableLanguage: ["English", "Filipino"],
  },
  email: EMAIL,
  sameAs: [FACEBOOK_URL, YOUTUBE_URL],
};

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-source-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-source-serif",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Noel AgriTV — Natural Solutions for Better Harvests",
    template: "%s | Noel AgriTV",
  },
  description:
    "Bio-organic crop care products and quality seeds trusted by Filipino farmers since 2021. Browse our products and message us to order.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://noelagritv.com"
  ),
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  verification: {
    google: "iI7HQwTmcRxEY3GRemJ8OqkqyukHxWXcfhoq9MKXha8",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Noel AgriTV",
    images: [{ url: "/images/og-default.webp", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${sourceSerif.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://i.ytimg.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
