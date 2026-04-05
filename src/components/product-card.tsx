import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import { formatPrice } from "@/lib/utils";
import { MessengerCTA } from "./messenger-cta";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const category = getCategoryBySlug(product.categorySlug);
  const defaultVariant = product.variants[0];

  return (
    <div className="group flex flex-col overflow-hidden rounded-md bg-surface shadow-sm">
      <Link href={`/products/${product.slug}`} className="block overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          width={500}
          height={500}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 374px) 100vw, (max-width: 740px) 50vw, (max-width: 999px) 33vw, 25vw"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            <h3 className="text-base font-bold leading-snug text-brand-darkest">
              {product.name}
            </h3>
          </Link>
          <p className="shrink-0 text-base font-bold text-brand-darkest">
            {formatPrice(defaultVariant.price)}
          </p>
        </div>
        <p className="text-[13px] text-text-secondary">
          {product.oneLiner}
          {product.variants.length > 1 && (
            <span> · {defaultVariant.packSize}</span>
          )}
          {product.variants.length === 1 && (
            <span> · {defaultVariant.packSize}</span>
          )}
        </p>
        <div className="mt-auto pt-3">
          <MessengerCTA
            productName={product.name}
            packSize={defaultVariant.packSize}
            label="ASK ON MESSENGER"
            variant="default"
            size="default"
            context="catalog"
            className="w-full rounded-[4px] bg-brand-darkest text-xs font-bold uppercase tracking-wider hover:bg-brand-dark"
          />
        </div>
      </div>
    </div>
  );
}
