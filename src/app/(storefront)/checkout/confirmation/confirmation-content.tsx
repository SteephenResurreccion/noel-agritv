"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";

export function ConfirmationContent() {
  const params = useSearchParams();
  const order = params.get("order") ?? "";
  // Defensive safety-net: the checkout form clears the cart before navigating,
  // but if a user reaches this page via direct URL, clear here too. Idempotent.
  useEffect(() => {
    useCart.getState().clear();
  }, []);

  return (
    <div className="container-site py-[var(--spacing-section)] text-center">
      <h1 className="text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
        Order received
      </h1>
      <p className="mt-3 text-text-secondary">
        Our team will text/call you to confirm your order before shipping.
      </p>
      {order && (
        <p className="mt-4 text-lg font-semibold text-text-primary">
          Order number:{" "}
          <span className="text-brand-darkest">{order}</span>
        </p>
      )}
      <Link
        href="/products"
        className="mt-6 inline-block rounded-md bg-brand-darkest px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Continue shopping
      </Link>
    </div>
  );
}
