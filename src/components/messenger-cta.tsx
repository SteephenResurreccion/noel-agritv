"use client";

import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { MESSENGER_URL, messengerProductLink } from "@/lib/constants";
import { trackMessengerClick } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** On mobile/tablet, use _self so iOS Universal Links open Messenger directly.
 *  _blank forces a new Safari tab which bypasses Universal Link handling. */
function messengerTarget(): "_self" | "_blank" {
  if (typeof navigator === "undefined") return "_blank";
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    ? "_self"
    : "_blank";
}

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
  packSize,
  label,
  variant = "default",
  size = "default",
  className,
  context,
}: MessengerCTAProps) {
  const href = productName
    ? messengerProductLink(productName, packSize)
    : MESSENGER_URL;

  const displayLabel =
    label ?? (productName ? "Message Us About This Product" : "Message Us");

  return (
    <a
      href={href}
      target={messengerTarget()}
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={() => trackMessengerClick(context ?? productName ?? "general")}
    >
      <MessageCircle className="mr-2 h-4 w-4 shrink-0" />
      {displayLabel}
    </a>
  );
}
