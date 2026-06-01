"use client";

import { Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PHONE_TEL } from "@/lib/constants";
import { trackCallClick } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useCopy } from "@/lib/lang-context";

interface CallCTAProps {
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  context?: string;
}

export function CallCTA({
  label,
  variant = "outline",
  size = "default",
  className,
  context,
}: CallCTAProps) {
  const copy = useCopy();
  const displayLabel = label ?? copy.common.callToOrder;
  return (
    <a
      href={PHONE_TEL}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={() => trackCallClick(context ?? "general")}
    >
      <Phone className="mr-2 h-4 w-4 shrink-0" />
      {displayLabel}
    </a>
  );
}
