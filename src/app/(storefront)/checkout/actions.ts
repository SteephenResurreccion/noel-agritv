"use server";

import {
  checkoutSchema,
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
import { appendOrderRow, buildSheetRow } from "@/lib/sheets";

export async function submitOrder(payload: unknown): Promise<SubmitResult> {
  // 1. Validate
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      message: "Please check the form and try again.",
    };
  }
  const data = parsed.data;

  // 2. Turnstile (server-side)
  if (!(await verifyTurnstile(data.turnstileToken))) {
    return {
      ok: false,
      error: "turnstile",
      message: "Anti-spam check failed. Please retry.",
    };
  }

  // 3. Authoritative prices AND names (never trust client)
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
    .map(adminToProduct);
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
        message: "An item in your cart is no longer available.",
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

  // 4. Order number + shipping + region label + timestamp
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

  // 5. Append to Sheet (failure ⇒ Messenger fallback)
  try {
    const row = buildSheetRow({
      orderNumber,
      timestampManila,
      name: data.name,
      phone: normalizePhPhone(data.phone) ?? data.phone,
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
    });
    await appendOrderRow(row);
  } catch (e) {
    console.error("submitOrder: sheets append failed", e);
    return {
      ok: false,
      error: "sheets",
      message:
        "We couldn't submit your order right now — please message us to complete it.",
    };
  }

  return { ok: true, orderNumber };
}
