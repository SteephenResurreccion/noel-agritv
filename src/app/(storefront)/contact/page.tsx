import type { Metadata } from "next";

import { copy } from "@/lib/copy";

import { ContactPageClient } from "./contact-client";

export const metadata: Metadata = {
  title: copy.meta.contactTitle,
  description: copy.meta.contactDescription,
};

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

export default function ContactPage() {
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
