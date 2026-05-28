"use client";

import { Suspense } from "react";
import { ConfirmationContent } from "./confirmation-content";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container-site py-[var(--spacing-section)] text-center text-text-secondary">
          Loading…
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
