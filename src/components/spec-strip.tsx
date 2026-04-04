import type { ProductSpec } from "@/data/products";

interface SpecStripProps {
  specs: ProductSpec[];
}

export function SpecStrip({ specs }: SpecStripProps) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border">
      {specs.map((spec) => (
        <div key={spec.label} className="bg-surface p-3">
          <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-wider text-text-secondary">
            {spec.label}
          </p>
          <p className="text-sm font-bold text-text-primary">{spec.value}</p>
        </div>
      ))}
    </div>
  );
}
