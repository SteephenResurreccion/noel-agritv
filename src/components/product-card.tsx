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
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <Link href={`/products/${product.slug}`} className="block overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          width={500}
          height={625}
          className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 374px) 100vw, (max-width: 740px) 50vw, (max-width: 999px) 33vw, 25vw"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {category && (
          <span className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-wider text-brand-accent">
            {category.name}
          </span>
        )}
        <Link href={`/products/${product.slug}`} className="hover:underline">
          <h3 className="text-base font-bold text-brand-darkest">
            {product.name}
          </h3>
        </Link>
        <p className="text-base font-bold text-text-primary">
          {defaultVariant.packSize} · {formatPrice(defaultVariant.price)}
        </p>
        <div className="mt-auto pt-2">
          <MessengerCTA
            productName={product.name}
            packSize={defaultVariant.packSize}
            label="Ask on Messenger"
            variant="outline"
            size="sm"
            context="catalog"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
