"use client";

import { Phone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PHONE_TEL } from "@/lib/constants";
import { trackCallClick } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface CallCTAProps {
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  context?: string;
}

export function CallCTA({
  label = "Call to Order",
  variant = "outline",
  size = "default",
  className,
  context,
}: CallCTAProps) {
  return (
    <a
      href={PHONE_TEL}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={() => trackCallClick(context ?? "general")}
    >
      <Phone className="mr-2 h-4 w-4" />
      {label}
    </a>
  );
}
