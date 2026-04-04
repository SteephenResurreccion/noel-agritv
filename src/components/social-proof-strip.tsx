interface SocialProofStripProps {
  variant?: "light" | "dark";
}

export function SocialProofStrip({ variant = "light" }: SocialProofStripProps) {
  return (
    <p
      className={`text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest ${
        variant === "dark"
          ? "text-brand-darkest/50"
          : "text-white/60"
      }`}
    >
      250k+ Followers · Since 2021 · Nationwide via J&amp;T
    </p>
  );
}
