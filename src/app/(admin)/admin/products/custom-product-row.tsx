"use client";

import { useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import type { AdminProduct } from "@/lib/admin-store";
import { toggleCustomProductVisibility, removeProduct } from "../actions";

export function CustomProductRow({ product }: { product: AdminProduct }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr
      className={`border-b border-border last:border-0 ${
        !product.visible ? "opacity-50" : ""
      } ${isPending ? "pointer-events-none opacity-30" : ""}`}
    >
      <td className="px-4 py-3">
        <p className="font-semibold text-text-primary">{product.name}</p>
        <p className="text-xs text-text-secondary">{product.description.slice(0, 60)}...</p>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() =>
              startTransition(() => toggleCustomProductVisibility(product.id))
            }
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            title={product.visible ? "Hide" : "Show"}
          >
            {product.visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => {
              if (confirm("Remove this product?")) {
                startTransition(() => removeProduct(product.id));
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
