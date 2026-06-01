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

describe("CustomProductRow — bilingual English fields", () => {
  it("renders the English prose inputs in the edit form", async () => {
    render(<CustomProductRow product={makeProduct()} categories={categories} />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // The (English) labels are present alongside the (Filipino) ones.
    expect(
      screen.getByText(/short description \(english\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/how to apply \(english\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(/safety .* handling notes \(english\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/product specs \(english\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/compatible crops \(english\)/i)
    ).toBeInTheDocument();
  });

  it("pre-fills the English prose textareas from the product's existing En values", async () => {
    const product = makeProduct({
      descriptionEn: "An English description",
      howToApplyEn: "Apply to soil",
      safetyNotesEn: "Keep away from children",
    });
    render(<CustomProductRow product={product} categories={categories} />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByDisplayValue("An English description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Apply to soil")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Keep away from children")).toBeInTheDocument();
  });

  it("submits the typed English description into the saved FormData", async () => {
    render(<CustomProductRow product={makeProduct()} categories={categories} />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Three prose textareas share the "Optional — falls back to Filipino…"
    // placeholder (descriptionEn, howToApplyEn, safetyNotesEn), in DOM order.
    // The first is the English description.
    const optionalTextareas = screen.getAllByPlaceholderText(
      /optional — falls back to filipino/i
    );
    const descEn = optionalTextareas[0];
    await userEvent.type(descEn, "Brand-new English copy");

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateProductMock).toHaveBeenCalledTimes(1));
    const formData = updateProductMock.mock.calls[0][1];
    expect(formData.get("descriptionEn")).toBe("Brand-new English copy");
  });

  it("submits typed English specs as the specsEn JSON field", async () => {
    render(<CustomProductRow product={makeProduct()} categories={categories} />);
    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    // Add one English spec row via the (English) section's "Add Spec" button.
    // There are two "Add Spec" buttons (FIL + EN); the second is English.
    const addSpecButtons = screen.getAllByRole("button", { name: /add spec/i });
    await userEvent.click(addSpecButtons[1]);

    // The newly added English spec row exposes empty Label/Value inputs. The
    // FIL section has no rows on this product (makeProduct sets no specs), so
    // these are the only Label/Value placeholders present.
    const labelInputs = screen.getAllByPlaceholderText("Label");
    const valueInputs = screen.getAllByPlaceholderText("Value");
    await userEvent.type(labelInputs[labelInputs.length - 1], "Type");
    await userEvent.type(valueInputs[valueInputs.length - 1], "Liquid");

    await userEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateProductMock).toHaveBeenCalledTimes(1));
    const formData = updateProductMock.mock.calls[0][1];
    const raw = formData.get("specsEn");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)).toEqual([
      { label: "Type", value: "Liquid" },
    ]);
  });
});
