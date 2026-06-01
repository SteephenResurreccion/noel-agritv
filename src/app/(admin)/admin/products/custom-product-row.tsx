"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Pencil, X, Plus, Star } from "lucide-react";
import type { AdminProduct } from "@/lib/admin-store";
import type { PriceTier } from "@/lib/pricing";
import type { Category } from "@/data/categories";
import { getCategoryBySlug, localizeCategory } from "@/data/categories";
import { compressImage } from "@/lib/compress-image";
import {
  toggleCustomProductVisibility,
  removeProduct,
  updateProduct,
  toggleFeaturedProduct,
} from "../actions";

/** A volume-tier row as held in the form: price in pesos for the number input. */
export interface TierRow {
  minQty: number;
  pricePesos: number;
  /** Stable React key for this row; never serialized to the server. */
  uid: string;
}

/** Existing centavos tiers -> editable peso rows for the form. */
export function tiersToPesos(tiers: PriceTier[] | undefined): TierRow[] {
  return (tiers ?? []).map((t) => ({
    minQty: t.minQty,
    pricePesos: t.priceCentavos / 100,
    uid: crypto.randomUUID(),
  }));
}

/**
 * Serialize the peso tier rows back to the centavos JSON the server action
 * parses. Same rounding as the Price field (`Math.round(pesos * 100)`).
 * Emits ONLY { minQty, priceCentavos } — the client-only `uid` row key is
 * dropped here so it never reaches the server.
 * ALWAYS produce a value (possibly "[]") so handleSave can submit it on every
 * save — never omit the field, or updateProduct would silently clear tiers.
 */
export function serializeTiers(rows: TierRow[]): string {
  return JSON.stringify(
    rows.map((r) => ({
      minQty: Math.trunc(r.minQty),
      priceCentavos: Math.round(r.pricePesos * 100),
    }))
  );
}

export function CustomProductRow({
  product,
  categories,
  isFeatured = false,
}: {
  product: AdminProduct;
  isFeatured?: boolean;
  categories: Category[];
}) {
  // Admin UI is English-only, so resolve the category name to English.
  const sourceCategory = getCategoryBySlug(product.categorySlug);
  const category = sourceCategory
    ? localizeCategory(sourceCategory, "en")
    : undefined;
  const [isPending, startTransition] = useTransition();
  const [optimisticVisible, setOptimisticVisible] = useOptimistic(
    product.visible
  );
  const [editing, setEditing] = useState(false);
  const [specs, setSpecs] = useState(product.specs ?? []);
  const [crops, setCrops] = useState(product.compatibleCrops ?? []);
  const [cropInput, setCropInput] = useState("");
  // English (optional) counterparts, seeded from the product's existing En
  // fields. Mirror the Filipino editors: parallel spec rows + crop tag list.
  const [specsEn, setSpecsEn] = useState(product.specsEn ?? []);
  const [cropsEn, setCropsEn] = useState(product.compatibleCropsEn ?? []);
  const [cropEnInput, setCropEnInput] = useState("");
  // Volume tiers, held in pesos for the inputs. Initialized from the product's
  // existing centavos tiers so a routine edit re-submits (preserves) them.
  const [tiers, setTiers] = useState(() => tiersToPesos(product.priceTiers));
  const router = useRouter();

  function handleToggle() {
    if (isPending) return;
    startTransition(async () => {
      setOptimisticVisible(!optimisticVisible);
      await toggleCustomProductVisibility(product.id);
      router.refresh();
    });
  }

  function handleFeatured() {
    if (isPending) return;
    startTransition(async () => {
      await toggleFeaturedProduct(product.id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (isPending) return;
    if (confirm("Remove this product?")) {
      startTransition(async () => {
        await removeProduct(product.id);
        router.refresh();
      });
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Compress image if a new one was selected
    const imageFile = formData.get("image") as File;
    if (imageFile && imageFile.size > 0) {
      const compressed = await compressImage(imageFile, 800, 0.8);
      formData.set("image", compressed);
    }

    const validSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
    if (validSpecs.length > 0) {
      formData.set("specs", JSON.stringify(validSpecs));
    }
    if (crops.length > 0) {
      formData.set("compatibleCrops", JSON.stringify(crops));
    }

    // English (optional) structured data. Only set when filled — an emptied
    // English list is left unset, which the server reads as "cleared" (the En
    // field is then omitted from the saved product, falling back to Filipino).
    const validSpecsEn = specsEn.filter((s) => s.label.trim() && s.value.trim());
    if (validSpecsEn.length > 0) {
      formData.set("specsEn", JSON.stringify(validSpecsEn));
    }
    if (cropsEn.length > 0) {
      formData.set("compatibleCropsEn", JSON.stringify(cropsEn));
    }

    // ALWAYS submit tiers — even when untouched — so a routine edit preserves
    // the existing ladder. updateProduct fully replaces tiers from this field;
    // omitting it would silently revert the product to flat pricing.
    // Drop incomplete rows (a freshly-added, unfilled row defaults to 0/0): a
    // row only submits when BOTH its qty and its peso price are filled in (> 0).
    // Seeded tiers are always complete, so this never drops them.
    formData.set(
      "priceTiers",
      serializeTiers(tiers.filter((t) => t.minQty > 0 && t.pricePesos > 0))
    );

    startTransition(async () => {
      await updateProduct(product.id, formData);
      router.refresh();
      setEditing(false);
    });
  }

  function openEdit() {
    setSpecs(product.specs ?? []);
    setCrops(product.compatibleCrops ?? []);
    setCropInput("");
    setSpecsEn(product.specsEn ?? []);
    setCropsEn(product.compatibleCropsEn ?? []);
    setCropEnInput("");
    setTiers(tiersToPesos(product.priceTiers));
    setEditing(true);
  }

  if (editing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={5} className="px-4 py-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                Edit Product
              </h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Product Name *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={product.name}
                  className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Category *
                </label>
                <select
                  name="categorySlug"
                  required
                  defaultValue={product.categorySlug}
                  className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Short Description (Filipino) *
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  defaultValue={product.description}
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Short Description (English)
                </label>
                <textarea
                  name="descriptionEn"
                  rows={3}
                  defaultValue={product.descriptionEn ?? ""}
                  placeholder="Optional — falls back to Filipino if empty"
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Price (₱) — leave blank for inquiry-only
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={
                    product.priceCentavos !== undefined
                      ? (product.priceCentavos / 100).toString()
                      : ""
                  }
                  placeholder="e.g. 250.00"
                  className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-text-secondary">
                  Product Image
                </label>
                <p className="mb-1 text-xs text-text-secondary/60">
                  Leave empty to keep current image
                </p>
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand-accent/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-accent hover:file:bg-brand-accent/20"
                />
              </div>
            </div>

            {/* Wholesale tiers (volume pricing) */}
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Wholesale tiers (volume pricing)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setTiers([
                      ...tiers,
                      {
                        minQty: tiers.length === 0 ? 1 : 0,
                        pricePesos: 0,
                        uid: crypto.randomUUID(),
                      },
                    ])
                  }
                  className="inline-flex min-h-12 items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add tier
                </button>
              </div>
              <p className="mb-2 text-xs text-text-secondary/60">
                First tier must start at qty 1. Quantities ascend; price per item
                must not increase as quantity rises.
              </p>
              <div className="space-y-2">
                {tiers.map((tier, i) => (
                  <div key={tier.uid} className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Min qty"
                      aria-label={`Tier ${i + 1} minimum quantity`}
                      value={Number.isNaN(tier.minQty) ? "" : tier.minQty}
                      onChange={(e) =>
                        setTiers(
                          tiers.map((t, j) =>
                            j === i
                              ? { ...t, minQty: e.target.valueAsNumber }
                              : t
                          )
                        )
                      }
                      className="h-12 w-1/3 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price each (₱)"
                      aria-label={`Tier ${i + 1} price each in pesos`}
                      value={Number.isNaN(tier.pricePesos) ? "" : tier.pricePesos}
                      onChange={(e) =>
                        setTiers(
                          tiers.map((t, j) =>
                            j === i
                              ? { ...t, pricePesos: e.target.valueAsNumber }
                              : t
                          )
                        )
                      }
                      className="h-12 flex-1 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label={`Remove tier ${i + 1}`}
                      onClick={() =>
                        setTiers(tiers.filter((_, j) => j !== i))
                      }
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs (Filipino) */}
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Product Specs (Filipino)
                </label>
                <button
                  type="button"
                  onClick={() => setSpecs([...specs, { label: "", value: "" }])}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add Spec
                </button>
              </div>
              <div className="space-y-2">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      placeholder="Label"
                      value={spec.label}
                      onChange={(e) =>
                        setSpecs(
                          specs.map((s, j) =>
                            j === i ? { ...s, label: e.target.value } : s
                          )
                        )
                      }
                      className="h-8 w-1/3 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                    />
                    <input
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) =>
                        setSpecs(
                          specs.map((s, j) =>
                            j === i ? { ...s, value: e.target.value } : s
                          )
                        )
                      }
                      className="h-8 flex-1 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs (English) */}
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Product Specs (English)
                </label>
                <button
                  type="button"
                  onClick={() => setSpecsEn([...specsEn, { label: "", value: "" }])}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add Spec
                </button>
              </div>
              <p className="mb-2 text-xs text-text-secondary/60">
                Optional — falls back to Filipino specs if empty.
              </p>
              <div className="space-y-2">
                {specsEn.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      placeholder="Label"
                      value={spec.label}
                      onChange={(e) =>
                        setSpecsEn(
                          specsEn.map((s, j) =>
                            j === i ? { ...s, label: e.target.value } : s
                          )
                        )
                      }
                      className="h-8 w-1/3 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                    />
                    <input
                      placeholder="Value"
                      value={spec.value}
                      onChange={(e) =>
                        setSpecsEn(
                          specsEn.map((s, j) =>
                            j === i ? { ...s, value: e.target.value } : s
                          )
                        )
                      }
                      className="h-8 flex-1 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecsEn(specsEn.filter((_, j) => j !== i))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Apply (Filipino) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                How to Apply (Filipino)
              </label>
              <textarea
                name="howToApply"
                rows={2}
                defaultValue={product.howToApply ?? ""}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
              />
            </div>

            {/* How to Apply (English) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                How to Apply (English)
              </label>
              <textarea
                name="howToApplyEn"
                rows={2}
                defaultValue={product.howToApplyEn ?? ""}
                placeholder="Optional — falls back to Filipino if empty"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
              />
            </div>

            {/* Compatible Crops (Filipino) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Compatible Crops (Filipino)
              </label>
              <div className="flex items-center gap-2">
                <input
                  placeholder="e.g. Palay"
                  value={cropInput}
                  onChange={(e) => setCropInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = cropInput.trim();
                      if (trimmed && !crops.includes(trimmed)) {
                        setCrops([...crops, trimmed]);
                        setCropInput("");
                      }
                    }
                  }}
                  className="h-8 flex-1 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = cropInput.trim();
                    if (trimmed && !crops.includes(trimmed)) {
                      setCrops([...crops, trimmed]);
                      setCropInput("");
                    }
                  }}
                  className="h-8 rounded-md bg-bg px-3 text-xs font-semibold text-text-secondary hover:bg-border"
                >
                  Add
                </button>
              </div>
              {crops.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {crops.map((crop) => (
                    <span
                      key={crop}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2.5 py-1 text-xs font-medium text-brand-accent"
                    >
                      {crop}
                      <button
                        type="button"
                        onClick={() =>
                          setCrops(crops.filter((c) => c !== crop))
                        }
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Compatible Crops (English) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Compatible Crops (English)
              </label>
              <p className="mb-1 text-xs text-text-secondary/60">
                Optional — falls back to Filipino crops if empty.
              </p>
              <div className="flex items-center gap-2">
                <input
                  placeholder="e.g. Rice"
                  value={cropEnInput}
                  onChange={(e) => setCropEnInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = cropEnInput.trim();
                      if (trimmed && !cropsEn.includes(trimmed)) {
                        setCropsEn([...cropsEn, trimmed]);
                        setCropEnInput("");
                      }
                    }
                  }}
                  className="h-8 flex-1 rounded-md border border-border bg-bg px-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = cropEnInput.trim();
                    if (trimmed && !cropsEn.includes(trimmed)) {
                      setCropsEn([...cropsEn, trimmed]);
                      setCropEnInput("");
                    }
                  }}
                  className="h-8 rounded-md bg-bg px-3 text-xs font-semibold text-text-secondary hover:bg-border"
                >
                  Add
                </button>
              </div>
              {cropsEn.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {cropsEn.map((crop) => (
                    <span
                      key={crop}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2.5 py-1 text-xs font-medium text-brand-accent"
                    >
                      {crop}
                      <button
                        type="button"
                        onClick={() =>
                          setCropsEn(cropsEn.filter((c) => c !== crop))
                        }
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Safety Notes (Filipino) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Safety &amp; Handling Notes (Filipino)
              </label>
              <textarea
                name="safetyNotes"
                rows={2}
                defaultValue={product.safetyNotes ?? ""}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
              />
            </div>

            {/* Safety Notes (English) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Safety &amp; Handling Notes (English)
              </label>
              <textarea
                name="safetyNotesEn"
                rows={2}
                defaultValue={product.safetyNotesEn ?? ""}
                placeholder="Optional — falls back to Filipino if empty"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-brand-darkest px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg"
              >
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`border-b border-border last:border-0 ${
        !optimisticVisible ? "opacity-50" : ""
      } ${isPending ? "pointer-events-none opacity-40" : ""}`}
    >
      <td className="px-4 py-3">
        <p className="font-semibold text-text-primary">{product.name}</p>
        <p className="text-xs text-text-secondary">
          {product.description.slice(0, 60)}
          {product.description.length > 60 ? "..." : ""}
        </p>
      </td>
      <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
        {category?.name ?? product.categorySlug}
      </td>
      <td className="w-16 px-2 py-3 text-center">
        <button
          onClick={handleFeatured}
          disabled={isPending}
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-brand-accent/10"
          title={isFeatured ? "Remove from Top Picks" : "Add to Top Picks"}
        >
          <Star
            className={`h-4 w-4 ${
              isFeatured
                ? "fill-brand-accent text-brand-accent"
                : "text-text-secondary/40"
            }`}
          />
        </button>
      </td>
      <td className="w-16 px-2 py-3 text-center">
        <button
          onClick={openEdit}
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-brand-accent/10 hover:text-brand-accent"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </td>
      <td className="w-20 px-2 py-3 text-center">
        <div className="inline-flex items-center gap-2">
          {isPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-accent" />
          )}
          <button
            disabled={isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              optimisticVisible ? "bg-brand-accent" : "bg-gray-300"
            } ${isPending ? "cursor-wait opacity-60" : "cursor-pointer"}`}
            aria-label={optimisticVisible ? "Hide product" : "Show product"}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                optimisticVisible ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </td>
      <td className="w-16 px-2 py-3 text-center">
        <button
          disabled={isPending}
          onClick={handleDelete}
          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 ${
            isPending ? "cursor-wait opacity-60" : ""
          }`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
