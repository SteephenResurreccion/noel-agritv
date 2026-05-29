import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomProductRow } from "@/app/(admin)/admin/products/custom-product-row";
import type { AdminProduct } from "@/lib/admin-store";
import type { Category } from "@/data/categories";

// Server actions — mock the module the row imports. We capture the FormData
// passed to updateProduct so we can assert the priceTiers field it submits.
const updateProductMock = vi.fn(async (_id: string, _formData: FormData) => {});
vi.mock("@/app/(admin)/admin/actions", () => ({
  updateProduct: (id: string, formData: FormData) =>
    updateProductMock(id, formData),
  toggleCustomProductVisibility: vi.fn(async () => {}),
  removeProduct: vi.fn(async () => {}),
  toggleFeaturedProduct: vi.fn(async () => {}),
}));

// Next router — the row calls router.refresh() after save.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

// compressImage only runs when a new image file is attached; never in these
// tests, but the row imports it so it must resolve.
vi.mock("@/lib/compress-image", () => ({
  compressImage: vi.fn(async (f: File) => f),
}));

const categories: Category[] = [
  { slug: "fertilizers", name: "Fertilizers" } as Category,
];

function makeProduct(overrides: Partial<AdminProduct> = {}): AdminProduct {
  return {
    id: "p1",
    slug: "bio-plant-booster",
    name: "Bio Plant Booster",
    description: "A booster.",
    image: "/x.png",
    categorySlug: "fertilizers",
    visible: true,
    priceCentavos: 54800,
    priceTiers: [
      { minQty: 1, priceCentavos: 54800 },
      { minQty: 12, priceCentavos: 52000 },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  updateProductMock.mockClear();
});

describe("CustomProductRow — volume tier editor", () => {
  it("renders the product's existing tiers as pesos + minQty in the edit form", async () => {
    render(<CustomProductRow product={makeProduct()} categories={categories} />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Min qty values for the two tiers (scoped by aria-label — the base Price
    // field also shows 548, so a bare getByDisplayValue("548") would be
    // ambiguous; query the tier inputs directly instead).
    expect(screen.getByLabelText(/tier 1 minimum quantity/i)).toHaveValue(1);
    expect(screen.getByLabelText(/tier 2 minimum quantity/i)).toHaveValue(12);
    // Prices converted centavos -> pesos for display.
    expect(screen.getByLabelText(/tier 1 price each in pesos/i)).toHaveValue(548);
    expect(screen.getByLabelText(/tier 2 price each in pesos/i)).toHaveValue(520);
  });

  it("preserves the existing tier ladder when only a non-tier field is edited", async () => {
    render(<CustomProductRow product={makeProduct()} categories={categories} />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Touch ONLY the name field — never the tier rows.
    const nameInput = screen.getByDisplayValue("Bio Plant Booster");
    await userEvent.type(nameInput, " 2");

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateProductMock).toHaveBeenCalledTimes(1));
    const formData = updateProductMock.mock.calls[0][1];
    const raw = formData.get("priceTiers");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toEqual([
      { minQty: 1, priceCentavos: 54800 },
      { minQty: 12, priceCentavos: 52000 },
    ]);
  });
});
