"use client";

import { useTransition } from "react";
import { toggleProductVisibility } from "../actions";

export function ProductToggle({
  slug,
  visible,
}: {
  slug: string;
  visible: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => toggleProductVisibility(slug))}
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
  );
}
