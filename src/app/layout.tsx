import type { Metadata } from "next";
import { Noto_Sans, Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-montserrat",
});

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
    <html lang="en" className={`${notoSans.variable} ${montserrat.variable} antialiased`}>
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
