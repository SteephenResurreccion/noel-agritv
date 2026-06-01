import Link from "next/link";

import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

export default async function NotFound() {
  const copy = getCopy(await getLangFromRequest());
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <h1 className="mb-2 text-6xl font-bold text-brand-darkest">
        {copy.notFound.code}
      </h1>
      <p className="mb-6 text-lg text-text-secondary">
        {copy.notFound.message}
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-brand-accent px-4 text-sm font-semibold text-white hover:bg-brand-mid"
        >
          {copy.notFound.home}
        </Link>
        <Link
          href="/products"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text-primary hover:bg-bg"
        >
          {copy.common.browseProducts}
        </Link>
      </div>
    </div>
  );
}
