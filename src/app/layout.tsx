import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
