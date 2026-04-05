"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import type { Category } from "@/data/categories";
import { addProduct } from "../actions";

export function AddProductForm({ categories }: { categories: Category[] }) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      await addProduct(formData);
      form.reset();
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
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={3}
                placeholder="Short description of the product"
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
