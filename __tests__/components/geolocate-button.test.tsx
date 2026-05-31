import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GeolocateButton } from "@/components/geolocate-button";
import { clearPsgcCache } from "@/lib/psgc";
import { copy } from "@/lib/copy";

const NCR_FIXTURE = {
  region: "NCR",
  provinces: [
    {
      name: "National Capital Region",
      cities: [
        {
          name: "City of Manila",
          barangays: ["Tondo", "Sampaloc"],
        },
      ],
    },
  ],
};

function stubGeo(success: { lat: number; lon: number } | "denied" | "error") {
  const getCurrentPosition = vi.fn(
    (
      onOk: PositionCallback,
      onErr?: PositionErrorCallback
    ) => {
      if (typeof success === "object") {
        onOk({
          coords: {
            latitude: success.lat,
            longitude: success.lon,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      } else if (success === "denied") {
        onErr?.({ code: 1, message: "denied" } as GeolocationPositionError);
      } else {
        onErr?.({ code: 2, message: "position unavailable" } as GeolocationPositionError);
      }
    }
  );
  vi.stubGlobal("navigator", {
    ...navigator,
    geolocation: { getCurrentPosition },
  });
  return getCurrentPosition;
}

// Mock fetch: first call hits /api/geocode (returns NCR area), second hits PSGC JSON.
function stubFetch(geocodeBody: unknown, psgcBody: unknown = NCR_FIXTURE) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/geocode")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(geocodeBody),
      } as unknown as Response);
    }
    if (url.includes("/data/psgc/")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(psgcBody),
      } as unknown as Response);
    }
    return Promise.reject(new Error("unstubbed url: " + url));
  });
}

describe("GeolocateButton", () => {
  beforeEach(() => {
    clearPsgcCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders a tappable button", () => {
    const onPrefill = vi.fn();
    render(<GeolocateButton onPrefill={onPrefill} />);
    expect(
      screen.getByRole("button", { name: copy.geolocate.use })
    ).toBeInTheDocument();
  });

  it("calls onPrefill with mapped fields after a successful geocode", async () => {
    stubGeo({ lat: 14.5995, lon: 120.9842 });
    vi.stubGlobal(
      "fetch",
      stubFetch({
        address: {
          region: "Metro Manila",
          state: "Metro Manila",
          city: "City of Manila",
          suburb: "Tondo",
          road: "Recto Avenue",
        },
      })
    );
    const onPrefill = vi.fn();
    render(<GeolocateButton onPrefill={onPrefill} />);
    await userEvent.click(
      screen.getByRole("button", { name: copy.geolocate.use })
    );
    await waitFor(() => {
      expect(onPrefill).toHaveBeenCalledTimes(1);
    });
    const payload = onPrefill.mock.calls[0]?.[0];
    expect(payload.region).toBe("NCR");
    expect(payload.province).toBe("National Capital Region");
    expect(payload.city).toBe("City of Manila");
    expect(payload.barangay).toBe("Tondo");
    expect(payload.street).toBe("Recto Avenue");
  });

  it("shows a denied message when the user blocks geolocation", async () => {
    stubGeo("denied");
    const onPrefill = vi.fn();
    render(<GeolocateButton onPrefill={onPrefill} />);
    await userEvent.click(
      screen.getByRole("button", { name: copy.geolocate.use })
    );
    await waitFor(() => {
      expect(
        screen.getByText(copy.geolocate.denied)
      ).toBeInTheDocument();
    });
    expect(onPrefill).not.toHaveBeenCalled();
  });

  it("shows a polite error when the geocode proxy fails", async () => {
    stubGeo({ lat: 14.5995, lon: 120.9842 });
    vi.stubGlobal("fetch", () =>
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.resolve({}),
      } as unknown as Response)
    );
    const onPrefill = vi.fn();
    render(<GeolocateButton onPrefill={onPrefill} />);
    await userEvent.click(
      screen.getByRole("button", { name: copy.geolocate.use })
    );
    await waitFor(() => {
      expect(screen.getByText(copy.geolocate.unavailable)).toBeInTheDocument();
    });
    expect(onPrefill).not.toHaveBeenCalled();
  });
});
