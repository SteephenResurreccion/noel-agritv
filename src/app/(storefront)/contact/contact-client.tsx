"use client";

import Link from "next/link";
import { Mail, MessageCircle, Package, Phone } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  EMAIL,
  FACEBOOK_URL,
  MESSENGER_URL,
  MESSENGER_WHOLESALE_URL,
  PHONE_NUMBER,
  PHONE_TEL,
} from "@/lib/constants";
import { copy } from "@/lib/copy";

export function ContactPageClient() {
  return (
    <>
      {/* ── Heading ────────────────────────────────────────────────────── */}
      <section className="bg-brand-darkest px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-xl text-center">
          <h1
            className="font-bold text-white"
            style={{ fontSize: "var(--font-size-h1)" }}
          >
            {copy.contact.heading}
          </h1>
          <p className="mt-3 text-white/70">
            {copy.contact.subheading}
          </p>
        </div>
      </section>

      {/* ── Contact Method Cards ────────────────────────────────────────── */}
      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-xl space-y-4">

          {/* 1. Facebook Messenger — PRIMARY */}
          <Link
            href={MESSENGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-[var(--radius-card)] bg-brand-darkest p-5 text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="mt-0.5 size-6 shrink-0 text-brand-accent" />
            <div>
              <p className="font-semibold">{copy.contact.messengerTitle}</p>
              <p className="mt-0.5 text-sm text-white/70">
                {copy.contact.messengerHours}
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-accent">
                {copy.contact.messengerCta}
              </p>
            </div>
          </Link>

          {/* 2. Phone */}
          <Link
            href={PHONE_TEL}
            className="flex items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-text-primary transition-colors hover:bg-bg"
          >
            <Phone className="mt-0.5 size-6 shrink-0 text-brand-accent" />
            <div>
              <p className="font-semibold">{copy.contact.phoneTitle}</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                {copy.contact.phoneHelp(PHONE_NUMBER)}
              </p>
            </div>
          </Link>

          {/* 3. Facebook Page */}
          <Link
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-text-primary transition-colors hover:bg-bg"
          >
            {/* Facebook icon SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mt-0.5 shrink-0 text-brand-accent"
              aria-hidden="true"
            >
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
            <div>
              <p className="font-semibold">{copy.contact.facebookPageTitle}</p>
              <p className="mt-0.5 text-sm text-text-secondary">
                {copy.contact.facebookPageHandle}
              </p>
            </div>
          </Link>

          {/* 4. Email */}
          <Link
            href={`mailto:${EMAIL}`}
            className="flex items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 text-text-primary transition-colors hover:bg-bg"
          >
            <Mail className="mt-0.5 size-6 shrink-0 text-brand-accent" />
            <div>
              <p className="font-semibold">{copy.contact.emailTitle}</p>
              <p className="mt-0.5 text-sm text-text-secondary">{EMAIL}</p>
            </div>
          </Link>

          {/* 5. Wholesale Inquiries */}
          <Link
            href={MESSENGER_WHOLESALE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 rounded-[var(--radius-card)] bg-brand-darkest p-5 text-white transition-opacity hover:opacity-90"
          >
            <Package className="mt-0.5 size-6 shrink-0 text-brand-accent" />
            <div>
              <p className="font-semibold">{copy.contact.wholesaleTitle}</p>
              <p className="mt-0.5 text-sm text-white/70">
                {copy.contact.wholesaleHelp}
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-accent">
                {copy.contact.wholesaleCta}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── FAQ Accordion ───────────────────────────────────────────────── */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-xl">
          <h2
            className="font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            {copy.contact.faqHeading}
          </h2>
          <div className="mt-6">
            <Accordion>
              {copy.faq.map((faq, index) => (
                <AccordionItem key={index} value={String(index)}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </>
  );
}
