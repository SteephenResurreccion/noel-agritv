import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

interface SocialProofStripProps {
  variant?: "light" | "dark";
}

export async function SocialProofStrip({ variant = "light" }: SocialProofStripProps) {
  const copy = getCopy(await getLangFromRequest());
  return (
    <p
      className={`text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest ${
        variant === "dark"
          ? "text-brand-darkest/50"
          : "text-white/60"
      }`}
    >
      {copy.socialProof.strip}
    </p>
  );
}
