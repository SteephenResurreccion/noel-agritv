"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin-store";
import { toggleFeaturedProduct, moveFeaturedProduct } from "../actions";

export function FeaturedProductRow({
  product,
  index,
  total,
}: {
  product: AdminProduct;
  index: number;
  total: number;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleMove(dir: "up" | "down") {
    if (isPending) return;
    startTransition(async () => {
      await moveFeaturedProduct(product.id, dir);
      router.refresh();
    });
  }

  function handleRemove() {
    if (isPending) return;
    startTransition(async () => {
      await toggleFeaturedProduct(product.id);
      router.refresh();
    });
  }

  return (
    <tr
      className={`border-b border-brand-accent/10 last:border-0 ${
        isPending ? "pointer-events-none opacity-40" : ""
      }`}
    >
      <td className="w-10 px-2 py-3 text-center">
        <Star className="mx-auto h-4 w-4 fill-brand-accent text-brand-accent" />
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold text-text-primary">{product.name}</p>
      </td>
      <td className="w-16 px-2 py-3 text-center">
        <div className="flex items-center justify-center gap-0.5">
          {isPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-accent" />
          )}
          {!isPending && (
            <>
              <button
                onClick={() => handleMove("up")}
                disabled={index === 0}
                className="flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-brand-accent/10 hover:text-brand-accent disabled:opacity-20"
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleMove("down")}
                disabled={index === total - 1}
                className="flex h-7 w-7 items-center justify-center rounded text-text-secondary hover:bg-brand-accent/10 hover:text-brand-accent disabled:opacity-20"
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
      <td className="w-16 px-2 py-3 text-center">
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
          title="Remove from Top Picks"
        >
          <Star className="h-4 w-4 fill-brand-accent text-brand-accent" />
        </button>
      </td>
    </tr>
  );
}
