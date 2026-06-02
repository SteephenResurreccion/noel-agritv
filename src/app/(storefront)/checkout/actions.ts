"use server";

import { headers } from "next/headers";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  makeCheckoutSchema,
  generateOrderNumber,
  normalizePhPhone,
  type SubmitResult,
} from "@/lib/order";
import { verifyTurnstile } from "@/lib/turnstile";
import { resolveShipping } from "@/lib/shipping";
import { PH_REGIONS } from "@/lib/ph-regions";
import { getAdminConfig } from "@/lib/admin-store";
import { adminToProduct } from "@/lib/admin-to-product";
import { products } from "@/data/products";
import { priceForQuantity } from "@/lib/pricing";
import { after } from "next/server";
import { appendOrderRow, buildSheetRow, type OrderRowInput } from "@/lib/sheets";
import { sendNewOrderEmail } from "@/lib/notify-email";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

// Per-identifier throttle in FRONT of the Sheet append + Resend email — the two
// consequential effects of submitOrder. Same module-scoped limiter + same
// 1-req/sec, 30-req/min budget as `/lookup` (lookup/actions.ts) and `/api/geocode`.
//
// ⚠ This is a single-warm-instance SPEED BUMP, not a real flood ceiling: the
// limiter is module-scoped, so it does NOT survive Vercel cold starts and does
// NOT coordinate across serverless instances (see @/lib/rate-limit and the
// "Security hardening" section of AGENTS.md). A Turnstile-solving farm that
// keeps hitting freshly-spun lambdas routes around it. The REAL cross-instance
// ceiling for the checkout POST is a Cloudflare WAF rate-rule on the POST path
// — already documented in AGENTS.md, NOT yet configured. Until that lands this
// limiter only blunts casual single-client replay/abuse on a warm instance.
const limiter = createRateLimiter({
  intervalMs: 1000,
  windowMs: 60_000,
  maxPerWindow: 30,
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function submitOrder(payload: unknown): Promise<SubmitResult> {
  const lang = await getLangFromRequest();
  const copy = getCopy(lang);

  // 1. Validate (schema messages localize to the buyer's language)
  const parsed = makeCheckoutSchema(copy).safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      message: copy.errors.formCheck,
    };
  }
  const data = parsed.data;

  // 2. Turnstile (server-side)
  if (!(await verifyTurnstile(data.turnstileToken))) {
    return {
      ok: false,
      error: "turnstile",
      message: copy.common.antiSpam,
    };
  }

  // 3. Rate-limit BEFORE the Sheet append + owner email (production only — dev
  //    shares the "unknown" bucket, matching /lookup and /api/geocode). Key by
  //    phone AND IP so neither a single number nor a single source IP can flood
  //    on a warm instance even with fresh Turnstile tokens. Best-effort only:
  //    see the limiter note above. On exceed → "sheets" so the form surfaces the
  //    Messenger-fallback banner (copy.errors.submitFailed), letting a blocked
  //    buyer still complete the order via Messenger.
  if (process.env.NODE_ENV === "production") {
    const ip = await clientIp();
    const key = `${normalizePhPhone(data.phone) ?? data.phone}|${ip}`;
    if (!limiter.check(key).allowed) {
      console.warn("submitOrder: rate limited", { ip });
      return {
        ok: false,
        error: "sheets",
        message: copy.errors.submitFailed,
      };
    }
  }

  // 4. Authoritative prices AND names (never trust client)
  const config = await getAdminConfig();
  const productBySlug = new Map<
    string,
    {
      name: string;
      priceCentavos: number;
      priceTiers?: { minQty: number; priceCentavos: number }[];
    }
  >();
  const custom = (config.customProducts ?? [])
    .filter((p) => p.visible)
    .map((p) => adminToProduct(p, lang));
  const source = custom.length > 0 ? custom : products;
  for (const p of source) {
    if (p.priceCentavos !== undefined) {
      productBySlug.set(p.slug, {
        name: p.name,
        priceCentavos: p.priceCentavos,
        priceTiers: p.priceTiers,
      });
    }
  }
  let subtotalCentavos = 0;
  const items: { name: string; qty: number; priceCentavos: number }[] = [];
  for (const i of data.items) {
    const product = productBySlug.get(i.slug);
    if (!product) {
      return {
        ok: false,
        error: "validation",
        message: copy.errors.itemUnavailable,
      };
    }
    // Server-authoritative unit price: re-derive the tier from the catalog,
    // NEVER from the client's snapshot (priceCentavos/priceTiers on the wire).
    const unit = priceForQuantity(product, i.qty) ?? product.priceCentavos;
    subtotalCentavos += unit * i.qty;
    items.push({
      name: product.name,
      qty: i.qty,
      priceCentavos: unit,
    });
  }

  // 5. Order number + shipping + region label + timestamp
  const orderNumber = generateOrderNumber();
  const totalUnits = data.items.reduce((sum, i) => sum + i.qty, 0);
  const shipping = resolveShipping(config.shipping, data.region, totalUnits);
  const regionLabel =
    PH_REGIONS.find((r) => r.value === data.region)?.label ?? data.region;
  const timestampManila = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

  // 6. Append to Sheet (failure ⇒ Messenger fallback)
  // Fail closed: the schema already refines on normalizePhPhone, so this should
  // be unreachable — but never write a raw, unnormalized phone if it somehow is.
  const normalizedPhone = normalizePhPhone(data.phone);
  if (!normalizedPhone) {
    return {
      ok: false,
      error: "validation",
      message: copy.errors.formCheck,
    };
  }

  // Declared AFTER the normalizedPhone guard (so TS has narrowed string | null
  // → string) and BEFORE the try (so it is in scope at the after() call below).
  // The same input feeds the Sheet row AND the owner email.
  const orderInput: OrderRowInput = {
    orderNumber,
    timestampManila,
    name: data.name,
    phone: normalizedPhone,
    region: regionLabel,
    province: data.province,
    city: data.city,
    barangay: data.barangay,
    street: data.street,
    landmark: data.landmark ?? "",
    items,
    subtotalCentavos,
    shipping,
    notes: data.notes ?? "",
  };

  try {
    const row = buildSheetRow(orderInput);
    await appendOrderRow(row);
  } catch (e) {
    console.error("submitOrder: sheets append failed", e);
    return {
      ok: false,
      error: "sheets",
      message: copy.errors.submitFailed,
    };
  }

  // 7. Owner email notification — fire-and-forget AFTER the response is sent.
  // Sits between the catch close and the success return so it registers ONLY
  // when the Sheets append succeeded (the failure path returned above). The
  // try/catch lives INSIDE the callback: after() itself registers synchronously
  // and never throws, so an outer try/catch would protect nothing. An email
  // failure can never fail the order — the response is already sent when this
  // callback runs (spec §4.2).
  after(async () => {
    try {
      await sendNewOrderEmail(orderInput);
    } catch (e) {
      console.error("sendNewOrderEmail: failed", e);
    }
  });

  return { ok: true, orderNumber };
}
