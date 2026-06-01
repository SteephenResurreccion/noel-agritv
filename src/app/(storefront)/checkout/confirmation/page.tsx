"use client";

import { Suspense } from "react";
import { useCopy } from "@/lib/lang-context";
import { ConfirmationContent } from "./confirmation-content";

export default function ConfirmationPage() {
  const copy = useCopy();
  return (
    <Suspense
      fallback={
        <div className="container-site py-[var(--spacing-section)] text-center text-text-secondary">
          {copy.common.loading}
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
