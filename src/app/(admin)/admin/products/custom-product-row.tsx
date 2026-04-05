"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin-store";
import { toggleCustomProductVisibility, removeProduct } from "../actions";

export function CustomProductRow({ product }: { product: AdminProduct }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticVisible, setOptimisticVisible] = useOptimistic(
    product.visible
  );
  const router = useRouter();

  function handleToggle() {
    if (isPending) return;
    startTransition(async () => {
      setOptimisticVisible(!optimisticVisible);
      await toggleCustomProductVisibility(product.id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (isPending) return;
    if (confirm("Remove this product?")) {
      startTransition(async () => {
        await removeProduct(product.id);
        router.refresh();
      });
    }
  }

  return (
    <tr
      className={`border-b border-border last:border-0 ${
        !optimisticVisible ? "opacity-50" : ""
      } ${isPending ? "pointer-events-none opacity-40" : ""}`}
    >
      <td className="px-4 py-3">
        <p className="font-semibold text-text-primary">{product.name}</p>
        <p className="text-xs text-text-secondary">
          {product.description.slice(0, 60)}
          {product.description.length > 60 ? "..." : ""}
        </p>
      </td>
      <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
        {product.categorySlug}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-2">
          {isPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-accent" />
          )}
          <button
            disabled={isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              optimisticVisible ? "bg-brand-accent" : "bg-gray-300"
            } ${isPending ? "cursor-wait opacity-60" : "cursor-pointer"}`}
            aria-label={optimisticVisible ? "Hide product" : "Show product"}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                optimisticVisible ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          disabled={isPending}
          onClick={handleDelete}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 ${
            isPending ? "cursor-wait opacity-60" : ""
          }`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
