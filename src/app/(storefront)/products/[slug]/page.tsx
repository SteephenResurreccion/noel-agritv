import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  products,
  getLocalizedProductBySlug,
  getLocalizedProducts,
  type Product,
} from "@/data/products";
import { getCategoryBySlug, localizeCategory } from "@/data/categories";
import type { Lang } from "@/lib/copy";
import { getAdminConfig } from "@/lib/admin-store";
import { adminToProduct } from "@/lib/admin-to-product";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";
import { AddToCart } from "@/components/add-to-cart";
import { MessengerCTA } from "@/components/messenger-cta";
import { CallCTA } from "@/components/call-cta";
import { SpecStrip } from "@/components/spec-strip";
import { ProductCard } from "@/components/product-card";
import { YouTubeFacade } from "@/components/youtube-facade";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export const revalidate = 30; // ISR: revalidate every 30s instead of force-dynamic

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

async function findProduct(
  slug: string,
  lang: Lang
): Promise<Product | undefined> {
  // Check custom products first (includes seeded built-in products)
  try {
    const config = await getAdminConfig();
    const custom = (config.customProducts ?? []).find(
      (p) => p.slug === slug && p.visible
    );
    if (custom) return adminToProduct(custom, lang);
  } catch {
    // Blob not configured
  }

  // Fallback to hardcoded built-in products (before admin seeds them)
  return getLocalizedProductBySlug(slug, lang);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getLangFromRequest();
  const product = await findProduct(slug, lang);
  if (!product) return {};

  return {
    title: product.name,
    description: product.oneLiner,
    openGraph: {
      // Next.js metadata openGraph objects REPLACE the root layout's (no deep
      // merge), so re-declare the PH locale here or product pages emit none.
      // Mirrors the root layout's OG_LOCALE map (fil -> fil_PH, en -> en_PH).
      locale: lang === "en" ? "en_PH" : "fil_PH",
      title: `${product.name} | Noel AgriTV`,
      description: product.oneLiner,
      images: [{ url: product.imageLarge, width: 1000, height: 1250 }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lang = await getLangFromRequest();
  const copy = getCopy(lang);
  const product = await findProduct(slug, lang);
  if (!product) notFound();

  const sourceCategory = getCategoryBySlug(product.categorySlug);
  const category = sourceCategory
    ? localizeCategory(sourceCategory, lang)
    : undefined;

  // Get all visible products for "related" section
  let allProducts = getLocalizedProducts(lang);
  try {
    const config = await getAdminConfig();
    const custom = (config.customProducts ?? [])
      .filter((p) => p.visible)
      .map((p) => adminToProduct(p, lang));

    if (custom.length > 0) {
      allProducts = custom;
    } else {
      allProducts = allProducts.filter(
        (p) => !config.hiddenProducts.includes(p.slug)
      );
    }
  } catch {
    // use defaults
  }

  const relatedProducts = allProducts
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  const isExternal = product.image.startsWith("http") || product.image.startsWith("/api/blob-image");
  const hasHowToApply = product.howToApply !== null;
  const hasCompatibleCrops =
    product.compatibleCrops && product.compatibleCrops.length > 0;
  const hasSafetyNotes = product.safetyNotes !== null;
  const hasAccordions = hasHowToApply || hasCompatibleCrops || hasSafetyNotes;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://noelagritv.com";
  const absUrl = (u: string) => (u.startsWith("http") ? u : `${siteUrl}${u}`);
  const productUrl = `${siteUrl}/products/${product.slug}`;

  // Escape `<`, `>`, `&` in serialized JSON-LD (red-team R3): JSON.stringify does
  // NOT escape these, so admin-authored name/description/specs containing
  // `</script>` would break out and inject script into every visitor's page.
  const safeJsonLd = (o: unknown) =>
    JSON.stringify(o)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.oneLiner,
    image: [absUrl(product.imageLarge), absUrl(product.image)].filter(
      (v, i, a) => a.indexOf(v) === i
    ),
    sku: product.slug,
    url: productUrl,
    brand: { "@type": "Brand", name: "Noel AgriTV" },
    manufacturer: { "@type": "Organization", name: "Noel AgriTV" },
    ...(category && { category: category.name }),
    ...(product.specs.length > 0 && {
      additionalProperty: product.specs.map((s) => ({
        "@type": "PropertyValue",
        name: s.label,
        value: s.value,
      })),
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.meta.breadcrumbHome, item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: copy.meta.breadcrumbProducts,
        item: `${siteUrl}/products`,
      },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.name,
              item: `${siteUrl}/products?category=${category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: product.name,
              item: productUrl,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: product.name,
              item: productUrl,
            },
          ]),
    ],
  };

  return (
    <div className="bg-bg py-[var(--spacing-section)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="container-site">
        {/* Two-column layout: image left, info right */}
        <div className="grid grid-cols-1 gap-8 min-[768px]:grid-cols-2 min-[768px]:gap-12">
          {/* Product Image */}
          <div className="overflow-hidden rounded-[var(--radius-card)]">
            {isExternal ? (
              // Buyer-uploaded Blob image is served same-origin via the
              // SSRF/PII-hardened /api/blob-image proxy (red-team R1/R3) and can
              // also be an arbitrary external http host, so it stays a raw <img>
              // (NOT next/image: the Blob host is deliberately absent from both
              // next.config images.remotePatterns AND the CSP img-src, and the
              // optimizer would throw on un-allowlisted external hosts). To still
              // optimize the product-page LCP element: width/height match the
              // next/image branch (1000x1000) + aspect-square to reserve the box
              // and remove CLS, and fetchPriority="high" marks it for early fetch.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageLarge}
                alt={product.name}
                width={1000}
                height={1000}
                fetchPriority="high"
                className="aspect-square w-full object-cover"
              />
            ) : (
              <Image
                src={product.imageLarge}
                alt={product.name}
                width={1000}
                height={1000}
                priority
                className="aspect-square w-full object-cover"
                sizes="(max-width: 767px) 100vw, 50vw"
              />
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4">
            {category && (
              <Badge variant="outline" className="w-fit">
                {category.name}
              </Badge>
            )}

            <h1 className="text-[length:var(--font-size-h1)] font-bold leading-tight text-brand-darkest">
              {product.name}
            </h1>

            <p className="text-[length:var(--font-size-body)] text-text-secondary">
              {product.oneLiner}
            </p>

            {product.priceCentavos !== undefined && (
              <AddToCart
                slug={product.slug}
                name={product.name}
                priceCentavos={product.priceCentavos}
                image={product.image}
                priceTiers={product.priceTiers}
                layout="detail"
              />
            )}

            <div className="flex flex-col gap-3">
              <MessengerCTA
                productName={product.name}
                packSize=""
                label={copy.productDetail.askOnMessenger}
                variant="default"
                size="lg"
                context="product-detail"
                className="w-full justify-center"
              />
              <CallCTA
                label={copy.common.callToOrder}
                variant="outline"
                size="lg"
                context="product-detail"
                className="w-full justify-center"
              />
            </div>
          </div>
        </div>

        {/* Spec Strip */}
        {product.specs.length > 0 && (
          <div className="mt-12">
            <SpecStrip specs={product.specs} />
          </div>
        )}

        {/* What It Does */}
        <div className="mt-10">
          <h2 className="mb-3 text-[length:var(--font-size-h2)] font-bold text-brand-darkest">
            {copy.productDetail.whatItDoes}
          </h2>
          <p className="text-[length:var(--font-size-body)] leading-relaxed text-text-primary">
            {product.description}
          </p>
        </div>

        {/* Accordions */}
        {hasAccordions && (
          <div className="mt-10">
            <Accordion>
              {hasHowToApply && (
                <AccordionItem value="how-to-apply">
                  <AccordionTrigger>{copy.productDetail.howToApply}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-text-primary">{product.howToApply}</p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasCompatibleCrops && (
                <AccordionItem value="compatible-crops">
                  <AccordionTrigger>{copy.productDetail.compatibleCrops}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-wrap gap-2">
                      {product.compatibleCrops.map((crop) => (
                        <li key={crop}>
                          <Badge variant="secondary">{crop}</Badge>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasSafetyNotes && (
                <AccordionItem value="safety">
                  <AccordionTrigger>{copy.productDetail.safety}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-text-primary">{product.safetyNotes}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}

        {/* YouTube Video */}
        {product.youtubeId && (
          <div className="mt-10">
            <h2 className="mb-4 text-[length:var(--font-size-h2)] font-bold text-brand-darkest">
              {copy.productDetail.watch}
            </h2>
            <YouTubeFacade
              videoId={product.youtubeId}
              title={copy.productDetail.demoVideoSuffix(product.name)}
            />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-[length:var(--font-size-h2)] font-bold text-brand-darkest">
              {copy.productDetail.related}
            </h2>
            <div className="flex gap-[var(--spacing-grid-gap)] overflow-x-auto pb-4">
              {relatedProducts.map((rp) => (
                <div
                  key={rp.slug}
                  className="w-[240px] shrink-0 min-[1000px]:w-auto min-[1000px]:flex-1"
                >
                  <ProductCard
                    product={rp}
                    wholesaleLabel={copy.productCard.wholesaleAvailable}
                    messengerLabel={copy.common.messenger}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
