"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toggleProductVisibility } from "../actions";

export function ProductToggle({
  slug,
  visible,
}: {
  slug: string;
  visible: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticVisible, setOptimisticVisible] = useOptimistic(visible);
  const router = useRouter();

  function handleToggle() {
    if (isPending) return;
    startTransition(async () => {
      setOptimisticVisible(!optimisticVisible);
      await toggleProductVisibility(slug);
      router.refresh();
    });
  }

  return (
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
  );
}
