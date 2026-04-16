import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { products, getProductBySlug, type Product } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import { getAdminConfig } from "@/lib/admin-store";
import { adminToProduct } from "@/lib/admin-to-product";
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

async function findProduct(slug: string): Promise<Product | undefined> {
  // Check custom products first (includes seeded built-in products)
  try {
    const config = await getAdminConfig();
    const custom = (config.customProducts ?? []).find(
      (p) => p.slug === slug && p.visible
    );
    if (custom) return adminToProduct(custom);
  } catch {
    // Blob not configured
  }

  // Fallback to hardcoded built-in products (before admin seeds them)
  return getProductBySlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.oneLiner,
    openGraph: {
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
  const product = await findProduct(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.categorySlug);

  // Get all visible products for "related" section
  let allProducts = products;
  try {
    const config = await getAdminConfig();
    const custom = (config.customProducts ?? [])
      .filter((p) => p.visible)
      .map(adminToProduct);

    if (custom.length > 0) {
      allProducts = custom;
    } else {
      allProducts = products.filter(
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
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container-site">
        {/* Two-column layout: image left, info right */}
        <div className="grid grid-cols-1 gap-8 min-[768px]:grid-cols-2 min-[768px]:gap-12">
          {/* Product Image */}
          <div className="overflow-hidden rounded-[var(--radius-card)]">
            {isExternal ? (
              <img
                src={product.imageLarge}
                alt={product.name}
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

            <div className="flex flex-col gap-3">
              <MessengerCTA
                productName={product.name}
                packSize=""
                label="Ask on Messenger"
                variant="default"
                size="lg"
                context="product-detail"
                className="w-full justify-center"
              />
              <CallCTA
                label="Call to Order"
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
            What It Does
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
                  <AccordionTrigger>How to Apply</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-text-primary">{product.howToApply}</p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {hasCompatibleCrops && (
                <AccordionItem value="compatible-crops">
                  <AccordionTrigger>Compatible Crops</AccordionTrigger>
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
                  <AccordionTrigger>Safety &amp; Handling</AccordionTrigger>
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
              Watch
            </h2>
            <YouTubeFacade
              videoId={product.youtubeId}
              title={`${product.name} — Demo Video`}
            />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-[length:var(--font-size-h2)] font-bold text-brand-darkest">
              You May Also Like
            </h2>
            <div className="flex gap-[var(--spacing-grid-gap)] overflow-x-auto pb-4">
              {relatedProducts.map((rp) => (
                <div
                  key={rp.slug}
                  className="w-[240px] shrink-0 min-[1000px]:w-auto min-[1000px]:flex-1"
                >
                  <ProductCard product={rp} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
