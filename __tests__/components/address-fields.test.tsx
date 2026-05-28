import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddressFields } from "@/components/address-fields";
import { PH_REGIONS } from "@/lib/ph-regions";
import { clearPsgcCache } from "@/lib/psgc";

const NCR_FIXTURE = {
  region: "NCR",
  provinces: [
    {
      name: "National Capital Region",
      cities: [
        {
          name: "City of Manila",
          barangays: ["Barangay 1", "Barangay 2"],
        },
        {
          name: "Quezon City",
          barangays: ["Diliman", "Cubao"],
        },
      ],
    },
  ],
};

function withFetchOk(body: unknown) {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as unknown as Response)
  );
}

function harness(initial?: Partial<Parameters<typeof AddressFields>[0]>) {
  const onChange = vi.fn();
  function Wrapper() {
    return (
      <AddressFields
        regions={PH_REGIONS}
        region={initial?.region ?? ""}
        province={initial?.province ?? ""}
        city={initial?.city ?? ""}
        barangay={initial?.barangay ?? ""}
        street={initial?.street ?? ""}
        landmark={initial?.landmark ?? ""}
        onChange={onChange}
      />
    );
  }
  return { onChange, Wrapper };
}

describe("AddressFields", () => {
  beforeEach(() => {
    clearPsgcCache();
    vi.restoreAllMocks();
  });

  it("renders the region select populated from PH_REGIONS", () => {
    const { Wrapper } = harness();
    render(<Wrapper />);
    const regionSelect = screen.getByLabelText(/region/i) as HTMLSelectElement;
    expect(regionSelect).toBeInTheDocument();
    expect(regionSelect.tagName).toBe("SELECT");
    // 17 regions + 1 placeholder
    expect(regionSelect.options).toHaveLength(PH_REGIONS.length + 1);
  });

  it("keeps Province / City / Barangay disabled when Region is empty", () => {
    const { Wrapper } = harness();
    render(<Wrapper />);
    expect(screen.getByLabelText(/^province/i)).toBeDisabled();
    expect(screen.getByLabelText(/city/i)).toBeDisabled();
    expect(screen.getByLabelText(/barangay/i)).toBeDisabled();
  });

  it("fires onChange when the user picks a region", async () => {
    const { onChange, Wrapper } = harness();
    render(<Wrapper />);
    const regionSelect = screen.getByLabelText(/region/i);
    await userEvent.selectOptions(regionSelect, "NCR");
    expect(onChange).toHaveBeenCalledWith("region", "NCR");
  });

  it("loads and renders provinces once a region is set", async () => {
    vi.stubGlobal("fetch", withFetchOk(NCR_FIXTURE));
    const { Wrapper } = harness({ region: "NCR" });
    render(<Wrapper />);
    await waitFor(() => {
      const provinceSelect = screen.getByLabelText(
        /^province/i
      ) as HTMLSelectElement;
      expect(provinceSelect).not.toBeDisabled();
      expect(
        Array.from(provinceSelect.options).map((o) => o.value)
      ).toContain("National Capital Region");
    });
  });

  it("enables City once a Province is set and lists its cities", async () => {
    vi.stubGlobal("fetch", withFetchOk(NCR_FIXTURE));
    const { Wrapper } = harness({
      region: "NCR",
      province: "National Capital Region",
    });
    render(<Wrapper />);
    await waitFor(() => {
      const citySelect = screen.getByLabelText(/city/i) as HTMLSelectElement;
      expect(citySelect).not.toBeDisabled();
      const vals = Array.from(citySelect.options).map((o) => o.value);
      expect(vals).toContain("City of Manila");
      expect(vals).toContain("Quezon City");
    });
  });

  it("enables Barangay once a City is set and lists its barangays", async () => {
    vi.stubGlobal("fetch", withFetchOk(NCR_FIXTURE));
    const { Wrapper } = harness({
      region: "NCR",
      province: "National Capital Region",
      city: "City of Manila",
    });
    render(<Wrapper />);
    await waitFor(() => {
      const brgy = screen.getByLabelText(/barangay/i) as HTMLSelectElement;
      expect(brgy).not.toBeDisabled();
      const vals = Array.from(brgy.options).map((o) => o.value);
      expect(vals).toContain("Barangay 1");
      expect(vals).toContain("Barangay 2");
    });
  });

  it("renders street and landmark as text inputs", () => {
    const { Wrapper } = harness();
    render(<Wrapper />);
    expect(
      (screen.getByLabelText(/street/i) as HTMLInputElement).tagName
    ).toBe("INPUT");
    expect(
      (screen.getByLabelText(/landmark/i) as HTMLInputElement).tagName
    ).toBe("INPUT");
  });
});
