"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin-store";
import { toggleCustomProductVisibility, removeProduct } from "../actions";

export function CustomProductRow({ product }: { product: AdminProduct }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <tr
      className={`border-b border-border last:border-0 ${
        !product.visible ? "opacity-50" : ""
      } ${isPending ? "pointer-events-none opacity-40" : ""}`}
    >
      <td className="px-4 py-3">
        <p className="font-semibold text-text-primary">{product.name}</p>
        <p className="text-xs text-text-secondary">{product.description.slice(0, 60)}...</p>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          {isPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-accent" />
          )}
          <button
            disabled={isPending}
            onClick={() => {
              if (isPending) return;
              startTransition(async () => {
                await toggleCustomProductVisibility(product.id);
                router.refresh();
              });
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg hover:text-text-primary ${
              isPending ? "cursor-wait" : ""
            }`}
            title={product.visible ? "Hide" : "Show"}
          >
            {product.visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (isPending) return;
              if (confirm("Remove this product?")) {
                startTransition(async () => {
                  await removeProduct(product.id);
                  router.refresh();
                });
              }
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 ${
              isPending ? "cursor-wait" : ""
            }`}
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
