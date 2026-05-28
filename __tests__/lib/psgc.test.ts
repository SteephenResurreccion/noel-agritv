import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadRegion, clearPsgcCache, PsgcLoadError } from "@/lib/psgc";

const NCR_FIXTURE = {
  region: "NCR",
  provinces: [
    {
      name: "National Capital Region",
      cities: [
        { name: "City of Manila", barangays: ["Barangay 1", "Barangay 2"] },
      ],
    },
  ],
};

function okFetch(body: unknown): typeof fetch {
  return (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as unknown as Response)) as unknown as typeof fetch;
}

function notFoundFetch(): typeof fetch {
  return (() =>
    Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    } as unknown as Response)) as unknown as typeof fetch;
}

function throwFetch(): typeof fetch {
  return (() =>
    Promise.reject(new Error("network down"))) as unknown as typeof fetch;
}

describe("loadRegion", () => {
  beforeEach(() => {
    clearPsgcCache();
    vi.restoreAllMocks();
  });

  it("fetches the JSON file for a valid region value", async () => {
    const fetchImpl = vi.fn(okFetch(NCR_FIXTURE));
    const data = await loadRegion("NCR", fetchImpl);
    expect(data.region).toBe("NCR");
    expect(data.provinces).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const call = fetchImpl.mock.calls[0]?.[0] as string;
    expect(call).toContain("/data/psgc/NCR.json");
  });

  it("returns the cached value on a second call (no second fetch)", async () => {
    const fetchImpl = vi.fn(okFetch(NCR_FIXTURE));
    await loadRegion("NCR", fetchImpl);
    await loadRegion("NCR", fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("throws PsgcLoadError for an unknown region value", async () => {
    const fetchImpl = vi.fn(okFetch(NCR_FIXTURE));
    await expect(loadRegion("ATLANTIS", fetchImpl)).rejects.toBeInstanceOf(
      PsgcLoadError
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("throws PsgcLoadError when the fetch returns a non-ok response", async () => {
    await expect(loadRegion("NCR", notFoundFetch())).rejects.toBeInstanceOf(
      PsgcLoadError
    );
  });

  it("throws PsgcLoadError when fetch itself throws", async () => {
    await expect(loadRegion("NCR", throwFetch())).rejects.toBeInstanceOf(
      PsgcLoadError
    );
  });
});
