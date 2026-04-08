"use client";

import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MESSENGER_URL } from "@/lib/constants";
import { trackMessengerClick } from "@/lib/analytics";
import { openMessenger } from "@/lib/open-messenger";
import { cn } from "@/lib/utils";

interface MessengerCTAProps {
  productName?: string;
  packSize?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  context?: string;
}

export function MessengerCTA({
  productName,
  label,
  variant = "default",
  size = "default",
  className,
  context,
}: MessengerCTAProps) {
  const displayLabel =
    label ?? (productName ? "Message Us About This Product" : "Message Us");

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    trackMessengerClick(context ?? productName ?? "general");
    openMessenger();
  }

  return (
    <a
      href={MESSENGER_URL}
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={handleClick}
    >
      <MessageCircle className="mr-2 h-4 w-4 shrink-0" />
      {displayLabel}
    </a>
  );
}
