import { describe, it, expect, vi, afterEach } from "vitest";
import { isFacebookIAB } from "@/lib/facebook-iab";

describe("isFacebookIAB", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true for Facebook Android IAB", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 FBAN/FB4A FBAV/400.0",
    });
    expect(isFacebookIAB()).toBe(true);
  });

  it("returns true for Facebook iOS IAB", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 FBAN/FBIOS FBAV/400.0",
    });
    expect(isFacebookIAB()).toBe(true);
  });

  it("returns false for Chrome", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/110.0",
    });
    expect(isFacebookIAB()).toBe(false);
  });

  it("returns false when navigator is undefined (SSR)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(isFacebookIAB()).toBe(false);
  });
});
