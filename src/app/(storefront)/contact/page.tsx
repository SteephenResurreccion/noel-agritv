import type { Metadata } from "next";

import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

import { ContactPageClient } from "./contact-client";

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getCopy(await getLangFromRequest());
  return {
    // `absolute` bypasses the root layout's "%s | Noel AgriTV" template.
    // meta.contactTitle already carries the "| Noel AgriTV" suffix in both
    // languages, so the template would otherwise double it.
    title: { absolute: meta.contactTitle },
    description: meta.contactDescription,
  };
}

export default async function ContactPage() {
  const copy = getCopy(await getLangFromRequest());
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ContactPageClient />
    </>
  );
}
