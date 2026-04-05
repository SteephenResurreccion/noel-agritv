# Wholesale CTA Section — Design Spec

## Overview

Add a wholesale call-to-action section to two existing pages (homepage + contact page) to capture bulk-buyer interest and funnel them to Messenger/phone. No dedicated wholesale page. No checkout or pricing logic — purely informational.

## Context

- E-commerce is on hold (fertilizer ban + pending CPR). Site is informational only.
- Prices have been removed site-wide — all sales happen via Messenger/phone.
- Wholesale = "bigger quantities, better prices" — no distinct audience segmentation.
- Primary sales channel: Facebook Messenger. Secondary: phone.

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Dedicated page? | No | Not enough distinct content; site already funnels to Messenger |
| Placement | Homepage + Contact page | Two touchpoints: discovery (homepage) + intent (contact) |
| Homepage style | Dark full-width banner | Matches existing dark sections (hero, social CTAs at bottom of About page) |
| Contact page style | Highlighted card | Compact block between contact method cards and FAQ, similar to existing Messenger card style |

## Homepage Section

**Location:** Between the Mission section and the Video Reels section.

**Style:** Full-width dark banner (`bg-brand-darkest`), centered text, single CTA.

**Content:**
- Label: "WHOLESALE" (small uppercase tracking text, `text-brand-accent`)
- Headline: "Buying in Bulk? We've Got You Covered"
- Subtext: 4 bullet points:
  - Volume discounts available
  - Nationwide delivery via J&T
  - All products available in bulk
  - Message us on Facebook or call to inquire
- CTA button: "Message Us for Wholesale" → links to `MESSENGER_URL`

**Responsive behavior:**
- Mobile: stacked, full-width padding, same content
- Desktop: max-width container, centered

## Contact Page Section

**Location:** Between the contact method cards section and the FAQ section.

**Style:** A highlighted card matching the existing card layout. Uses `bg-brand-darkest` with white text (same as the existing Messenger card) to stand out from the other cards.

**Content:**
- Icon: `Package` from lucide-react (or similar bulk/box icon)
- Title: "Wholesale Inquiries"
- Description: "Buying in bulk? We offer volume discounts on all products with nationwide J&T delivery. Message us or call for wholesale pricing."
- CTA text: "Inquire on Messenger" → links to `MESSENGER_URL` with prefilled text "Hi, I'm interested in wholesale pricing"

## Files to Modify

1. `src/app/(storefront)/page.tsx` — Add `WholesaleBanner` component between Mission and VideoReelSection
2. `src/app/(storefront)/contact/contact-client.tsx` — Add wholesale card between contact cards and FAQ
3. `src/components/wholesale-banner.tsx` — New component for the homepage dark banner
4. `src/lib/constants.ts` — Add `messengerWholesaleLink` helper (prefilled wholesale inquiry text)

## Out of Scope

- Wholesale pricing tiers or logic
- Inquiry form (all inquiries go through Messenger)
- Admin management of wholesale content
- Separate wholesale product listings
- Any checkout or cart functionality
