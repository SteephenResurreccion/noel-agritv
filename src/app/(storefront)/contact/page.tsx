import type { Metadata } from "next";

import { ContactPageClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact | Noel AgriTV",
  description:
    "Get in touch with Noel AgriTV. Message us on Facebook Messenger, call, or email — we'd love to hear from you.",
};

export default function ContactPage() {
  return <ContactPageClient />;
}
