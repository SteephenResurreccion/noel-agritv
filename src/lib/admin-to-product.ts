import type { Product } from "@/data/products";
import type { AdminProduct } from "@/lib/admin-store";
import type { Lang } from "@/lib/copy";

/**
 * Convert an admin-created product to a full Product object for storefront
 * rendering, resolved to one language.
 *
 * - `lang === "fil"` (the default): uses the base fields verbatim — exactly the
 *   pre-bilingual behavior. The default keeps any un-updated call site working.
 * - `lang === "en"`: each prose field resolves to its `*En` counterpart, and
 *   falls back INDEPENDENTLY to the Filipino base value when the English field
 *   is absent/null. So a partially translated product shows English where it
 *   exists and Filipino everywhere else.
 *
 * oneLiner is always derived by truncating the language-resolved description,
 * so the truncated preview matches the language being shown.
 */
export function adminToProduct(p: AdminProduct, lang: Lang = "fil"): Product {
  const en = lang === "en";

  const description = en ? p.descriptionEn ?? p.description : p.description;
  const specs = en ? p.specsEn ?? p.specs : p.specs;
  const howToApply = en ? p.howToApplyEn ?? p.howToApply : p.howToApply;
  const compatibleCrops = en
    ? p.compatibleCropsEn ?? p.compatibleCrops
    : p.compatibleCrops;
  const safetyNotes = en ? p.safetyNotesEn ?? p.safetyNotes : p.safetyNotes;

  return {
    slug: p.slug,
    name: p.name,
    categorySlug: p.categorySlug,
    oneLiner:
      description.length > 100 ? description.slice(0, 100) + "..." : description,
    description,
    specs: specs ?? [],
    image: p.image,
    imageLarge: p.image,
    priceCentavos: p.priceCentavos,
    priceTiers: p.priceTiers,
    youtubeId: null,
    compatibleCrops: compatibleCrops ?? [],
    howToApply: howToApply ?? null,
    safetyNotes: safetyNotes ?? null,
  };
}
