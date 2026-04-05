"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { Category } from "@/data/categories";
import { compressImage } from "@/lib/compress-image";
import { addProduct } from "../actions";

export function AddProductForm({ categories }: { categories: Category[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([]);
  const [crops, setCrops] = useState<string[]>([]);
  const [cropInput, setCropInput] = useState("");
  const router = useRouter();

  function addSpec() {
    setSpecs([...specs, { label: "", value: "" }]);
  }

  function removeSpec(index: number) {
    setSpecs(specs.filter((_, i) => i !== index));
  }

  function updateSpec(index: number, field: "label" | "value", val: string) {
    setSpecs(specs.map((s, i) => (i === index ? { ...s, [field]: val } : s)));
  }

  function addCrop() {
    const trimmed = cropInput.trim();
    if (trimmed && !crops.includes(trimmed)) {
      setCrops([...crops, trimmed]);
      setCropInput("");
    }
  }

  function removeCrop(crop: string) {
    setCrops(crops.filter((c) => c !== crop));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Compress image before upload
    const imageFile = formData.get("image") as File;
    if (imageFile && imageFile.size > 0) {
      const compressed = await compressImage(imageFile, 800, 0.8);
      formData.set("image", compressed);
    }

    // Add structured data as JSON strings
    const validSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
    if (validSpecs.length > 0) {
      formData.set("specs", JSON.stringify(validSpecs));
    }
    if (crops.length > 0) {
      formData.set("compatibleCrops", JSON.stringify(crops));
    }

    startTransition(async () => {
      await addProduct(formData);
      router.refresh();
      form.reset();
      setSpecs([]);
      setCrops([]);
      setCropInput("");
      setShowForm(false);
    });
  }

  return (
    <div className="mt-6">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-darkest px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Product
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <h3 className="mb-4 text-sm font-semibold text-text-primary">
            Add New Product
          </h3>

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Product Name *
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Bio Plant Booster"
                className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Category *
              </label>
              <select
                name="categorySlug"
                required
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
                placeholder="What this product does (shown on product detail page)"
                className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-text-secondary">
                Product Image *
              </label>
              <input
                name="image"
                type="file"
                required
                accept="image/*"
                className="w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand-accent/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-accent hover:file:bg-brand-accent/20"
              />
            </div>
          </div>

          {/* Specs */}
          <div className="mt-6 border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                Specs (Type, Variety, Application, etc.)
              </label>
              <button
                type="button"
                onClick={addSpec}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-accent hover:underline"
              >
                <Plus className="h-3 w-3" /> Add Spec
              </button>
            </div>
            {specs.length === 0 && (
              <p className="text-xs text-text-secondary/50">
                No specs added yet. Click &quot;Add Spec&quot; to add product details like Type, Variety, Season, etc.
              </p>
            )}
            <div className="space-y-2">
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="Label (e.g. Type)"
                    value={spec.label}
                    onChange={(e) => updateSpec(i, "label", e.target.value)}
                    className="h-8 w-1/3 rounded-md border border-border bg-bg px-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
                  />
                  <input
                    placeholder="Value (e.g. Liquid)"
                    value={spec.value}
                    onChange={(e) => updateSpec(i, "value", e.target.value)}
                    className="h-8 flex-1 rounded-md border border-border bg-bg px-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpec(i)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* How to Apply */}
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              How to Apply
            </label>
            <textarea
              name="howToApply"
              rows={2}
              placeholder="Application instructions (optional)"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
            />
          </div>

          {/* Compatible Crops */}
          <div className="mt-4">
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
                    addCrop();
                  }
                }}
                className="h-8 flex-1 rounded-md border border-border bg-bg px-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={addCrop}
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
                      onClick={() => removeCrop(crop)}
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
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold text-text-secondary">
              Safety &amp; Handling Notes
            </label>
            <textarea
              name="safetyNotes"
              rows={2}
              placeholder="Storage and safety instructions (optional)"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand-accent focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-brand-darkest px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add Product"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
