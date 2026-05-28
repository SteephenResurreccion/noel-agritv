"use client";

import { useState, useTransition } from "react";
import type { ShippingConfig } from "@/lib/admin-store";
import { saveShippingConfig } from "../actions";

const ZONES = [
  { key: "ncr", label: "NCR (Metro Manila)" },
  { key: "luzon", label: "Luzon (rest of Luzon + CAR)" },
  { key: "visayas", label: "Visayas" },
  { key: "mindanao", label: "Mindanao + BARMM" },
] as const;

type ZoneKey = (typeof ZONES)[number]["key"];

export function ShippingForm({ initial }: { initial: ShippingConfig }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [pesos, setPesos] = useState<Record<ZoneKey, string>>({
    ncr: (initial.feesCentavos.ncr / 100).toString(),
    luzon: (initial.feesCentavos.luzon / 100).toString(),
    visayas: (initial.feesCentavos.visayas / 100).toString(),
    mindanao: (initial.feesCentavos.mindanao / 100).toString(),
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await saveShippingConfig({
          enabled,
          feesCentavos: {
            ncr: Math.round(Number(pesos.ncr || 0) * 100),
            luzon: Math.round(Number(pesos.luzon || 0) * 100),
            visayas: Math.round(Number(pesos.visayas || 0) * 100),
            mindanao: Math.round(Number(pesos.mindanao || 0) * 100),
          },
        });
        setSaved(true);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to save shipping settings. Please try again."
        );
      }
    });
  }

  return (
    <div className="max-w-md space-y-5">
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-border text-brand-accent focus:ring-brand-accent"
        />
        <span className="text-sm font-semibold text-text-primary">
          Show shipping estimates at checkout
        </span>
      </label>

      <div className="space-y-3">
        {ZONES.map((z) => (
          <div key={z.key}>
            <label
              htmlFor={`fee-${z.key}`}
              className="mb-1 block text-xs font-semibold text-text-secondary"
            >
              {z.label} fee (₱)
            </label>
            <input
              id={`fee-${z.key}`}
              type="number"
              step="0.01"
              min="0"
              value={pesos[z.key]}
              onChange={(e) =>
                setPesos((p) => ({ ...p, [z.key]: e.target.value }))
              }
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-brand-darkest px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {saved && !error && (
          <p className="text-sm text-brand-accent">Saved.</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
