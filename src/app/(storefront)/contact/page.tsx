import type { Metadata } from "next";

import { ContactPageClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact | Noel AgriTV",
  description:
    "Get in touch with Noel AgriTV. Message us on Facebook Messenger, call, or email — we'd love to hear from you.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this the same Noel AgriTV from Facebook?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, this is the official website of Noel AgriTV. You can verify by checking our Facebook page — the link is the same one Noel shares in his videos.",
      },
    },
    {
      "@type": "Question",
      name: "Do you deliver nationwide?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we deliver nationwide through J&T Express. Delivery times vary by province — typically 3-7 business days depending on your location.",
      },
    },
    {
      "@type": "Question",
      name: "How do I order?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Message us on Facebook or call — we'll confirm your order and arrange delivery via J&T.",
      },
    },
    {
      "@type": "Question",
      name: "How long does delivery take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Delivery times vary by province. Metro Manila typically receives orders within 2-3 business days. Provincial deliveries usually take 3-7 business days through J&T Express.",
      },
    },
  ],
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
