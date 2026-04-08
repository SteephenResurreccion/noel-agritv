"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Pencil, X, Plus } from "lucide-react";
import type { AdminProduct } from "@/lib/admin-store";
import type { Category } from "@/data/categories";
import { getCategoryBySlug } from "@/data/categories";
import { compressImage } from "@/lib/compress-image";
import {
  toggleCustomProductVisibility,
  removeProduct,
  updateProduct,
} from "../actions";

export function CustomProductRow({
  product,
  categories,
}: {
  product: AdminProduct;
  categories: Category[];
}) {
  const category = getCategoryBySlug(product.categorySlug);
  const [isPending, startTransition] = useTransition();
  const [optimisticVisible, setOptimisticVisible] = useOptimistic(
    product.visible
  );
  const [editing, setEditing] = useState(false);
  const [specs, setSpecs] = useState(product.specs ?? []);
  const [crops, setCrops] = useState(product.compatibleCrops ?? []);
  const [cropInput, setCropInput] = useState("");
  const router = useRouter();

  function handleToggle() {
    if (isPending) return;
    startTransition(async () => {
      setOptimisticVisible(!optimisticVisible);
      await toggleCustomProductVisibility(product.id);
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
                  Short Description *
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

            {/* Specs */}
            <div className="border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">
                  Product Specs
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

            {/* How to Apply */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                How to Apply
              </label>
              <textarea
                name="howToApply"
                rows={2}
                defaultValue={product.howToApply ?? ""}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
              />
            </div>

            {/* Compatible Crops */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Compatible Crops
              </label>
              <div className="flex items-center gap-2">
                <input
                  placeholder="e.g. Rice"
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

            {/* Safety Notes */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Safety &amp; Handling Notes
              </label>
              <textarea
                name="safetyNotes"
                rows={2}
                defaultValue={product.safetyNotes ?? ""}
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-brand-accent focus:outline-none"
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
      <td className="px-4 py-3 text-right">
        <button
          onClick={openEdit}
          className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-brand-accent/10 hover:text-brand-accent"
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-3 text-right">
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
      <td className="px-4 py-3 text-right">
        <button
          disabled={isPending}
          onClick={handleDelete}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 ${
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
