"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { formatCentavos } from "@/lib/utils";
import { useCopy } from "@/lib/lang-context";
import { AddToCart } from "@/components/add-to-cart";
import { MessengerCTA } from "./messenger-cta";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const copy = useCopy();
  const isExternal = product.image.startsWith("http") || product.image.startsWith("/api/blob-image");

  return (
    <div className="group flex flex-col overflow-hidden rounded-md bg-surface shadow-sm">
      <Link href={`/products/${product.slug}`} className="block overflow-hidden">
        {isExternal ? (
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            width={500}
            height={500}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 374px) 100vw, (max-width: 740px) 50vw, (max-width: 999px) 33vw, 25vw"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        <Link href={`/products/${product.slug}`} className="hover:underline">
          <h3 className="text-base font-bold leading-snug text-brand-darkest">
            {product.name}
          </h3>
        </Link>
        <p className="text-[13px] text-text-secondary">
          {product.oneLiner}
        </p>
        {product.priceCentavos !== undefined ? (
          <div className="mt-auto pt-3">
            <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <p className="text-base font-bold text-brand-darkest tabular-nums">
                {formatCentavos(product.priceCentavos)}
              </p>
              {product.priceTiers && product.priceTiers.length > 0 && (
                <span className="rounded-full bg-bg-wheat px-2.5 py-1 text-xs font-semibold text-brand-accent">
                  {copy.productCard.wholesaleAvailable}
                </span>
              )}
            </div>
            <AddToCart
              slug={product.slug}
              name={product.name}
              priceCentavos={product.priceCentavos}
              image={product.image}
              priceTiers={product.priceTiers}
              layout="card"
            />
          </div>
        ) : (
          <div className="mt-auto pt-3">
            <MessengerCTA
              productName={product.name}
              packSize=""
              label={copy.common.messenger}
              variant="default"
              size="default"
              context="catalog"
              className="w-full truncate rounded-[4px] bg-brand-darkest text-xs font-semibold hover:bg-brand-dark"
            />
          </div>
        )}
      </div>
    </div>
  );
}
