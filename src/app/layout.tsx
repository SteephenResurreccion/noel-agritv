import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FACEBOOK_URL, YOUTUBE_URL, EMAIL } from "@/lib/constants";
import { getCopy, type Lang } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";
import { LangProvider } from "@/lib/lang-context";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://noelagritv.com";

/** Open Graph `locale` per language (PH-scoped). */
const OG_LOCALE: Record<Lang, string> = {
  fil: "fil_PH",
  en: "en_PH",
};

/** Build the Organization JSON-LD for a language. Non-copy fields are constant. */
function organizationJsonLd(lang: Lang) {
  const copy = getCopy(lang);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: copy.common.brand,
    url: siteUrl,
    logo: `${siteUrl}/images/whitebglogo.png`,
    description: copy.meta.orgDescription,
    foundingDate: "2021",
    founder: { "@type": "Person", name: "Noel Tolentino" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+639272743281",
      contactType: "customer service",
      availableLanguage: ["Filipino", "English"],
    },
    email: EMAIL,
    sameAs: [FACEBOOK_URL, YOUTUBE_URL],
  };
}

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

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLangFromRequest();
  const { meta, common } = getCopy(lang);
  return {
    title: {
      default: meta.rootTitleDefault,
      template: meta.rootTitleTemplate,
    },
    description: meta.rootDescription,
    metadataBase: new URL(siteUrl),
    icons: {
      icon: "/icon.png",
      apple: "/icon.png",
    },
    verification: {
      google: "iI7HQwTmcRxEY3GRemJ8OqkqyukHxWXcfhoq9MKXha8",
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[lang],
      siteName: common.brand,
      images: [{ url: "/images/og-default.webp", width: 1200, height: 630 }],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLangFromRequest();
  return (
    <html lang={lang} className={`${sourceSans.variable} ${sourceSerif.variable} antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(lang)) }}
        />
      </head>
      <body>
        <LangProvider initialLang={lang}>{children}</LangProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
