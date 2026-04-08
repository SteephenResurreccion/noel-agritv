"use client";

import { useTransition } from "react";
import { seedBuiltInProducts } from "../actions";

export function SeedButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-4 rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-4">
      <p className="text-sm font-medium text-brand-darkest">
        Import the 4 default products so you can edit them?
      </p>
      <p className="mt-1 text-xs text-text-secondary">
        This copies Bio Plant Booster, Bio Enzyme, Jasmine 479, and Mayumi into
        your editable product list.
      </p>
      <button
        onClick={() => startTransition(() => seedBuiltInProducts())}
        disabled={isPending}
        className="mt-3 rounded-md bg-brand-darkest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {isPending ? "Importing..." : "Import Default Products"}
      </button>
    </div>
  );
}
