"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toggleProductVisibility } from "../actions";

export function ProductToggle({
  slug,
  visible,
}: {
  slug: string;
  visible: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      await toggleProductVisibility(slug);
      router.refresh();
    });
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          visible ? "bg-brand-accent" : "bg-gray-300"
        } ${isPending ? "opacity-50" : ""}`}
        aria-label={visible ? "Hide product" : "Show product"}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            visible ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("Hide this product permanently?")) {
            handleToggle();
          }
        }}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
