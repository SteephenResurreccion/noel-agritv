import { describe, it, expect, vi } from "vitest";
import { reverseGeocode, NominatimError } from "@/lib/nominatim";

const SAMPLE = {
  address: {
    region: "Metro Manila",
    province: "Metro Manila",
    city: "Manila",
    suburb: "Tondo",
    road: "Recto Avenue",
  },
};

function okFetch(body: unknown): typeof fetch {
  return (() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as unknown as Response)) as unknown as typeof fetch;
}

describe("reverseGeocode", () => {
  it("calls the /api/geocode proxy with lat and lon query params", async () => {
    const fetchImpl = vi.fn(okFetch(SAMPLE));
    const result = await reverseGeocode(14.5995, 120.9842, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const url = fetchImpl.mock.calls[0]?.[0] as string;
    expect(url).toContain("/api/geocode");
    expect(url).toContain("lat=14.5995");
    expect(url).toContain("lon=120.9842");
    expect(result.address?.city).toBe("Manila");
  });

  it("throws NominatimError when the proxy responds non-ok", async () => {
    const fetchImpl = (() =>
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.resolve({ error: "upstream" }),
      } as unknown as Response)) as unknown as typeof fetch;
    await expect(reverseGeocode(0, 0, fetchImpl)).rejects.toBeInstanceOf(
      NominatimError
    );
  });

  it("throws NominatimError when fetch itself rejects", async () => {
    const fetchImpl = (() =>
      Promise.reject(new Error("offline"))) as unknown as typeof fetch;
    await expect(reverseGeocode(0, 0, fetchImpl)).rejects.toBeInstanceOf(
      NominatimError
    );
  });

  it("rejects coordinates outside lat/lon bounds without calling fetch", async () => {
    const fetchImpl = vi.fn(okFetch(SAMPLE));
    await expect(
      reverseGeocode(999, 0, fetchImpl as unknown as typeof fetch)
    ).rejects.toBeInstanceOf(NominatimError);
    await expect(
      reverseGeocode(0, 999, fetchImpl as unknown as typeof fetch)
    ).rejects.toBeInstanceOf(NominatimError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
