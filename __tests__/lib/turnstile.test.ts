import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { verifyTurnstile } from "@/lib/turnstile";

const okFetch = ((): Promise<Response> =>
  Promise.resolve({ json: () => Promise.resolve({ success: true }) } as Response)) as typeof fetch;
const failFetch = ((): Promise<Response> =>
  Promise.resolve({ json: () => Promise.resolve({ success: false }) } as Response)) as typeof fetch;

describe("verifyTurnstile", () => {
  beforeEach(() => { process.env.TURNSTILE_SECRET_KEY = "secret"; });
  afterEach(() => { delete process.env.TURNSTILE_SECRET_KEY; vi.restoreAllMocks(); });

  it("returns true when Cloudflare reports success", async () => {
    expect(await verifyTurnstile("tok", okFetch)).toBe(true);
  });
  it("returns false when Cloudflare reports failure", async () => {
    expect(await verifyTurnstile("tok", failFetch)).toBe(false);
  });
  it("returns false for an empty token without calling fetch", async () => {
    const spy = vi.fn();
    expect(await verifyTurnstile("", spy as unknown as typeof fetch)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
  it("returns false when the secret is missing", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(await verifyTurnstile("tok", okFetch)).toBe(false);
  });
  it("returns false when fetch throws", async () => {
    const throwing = (() => Promise.reject(new Error("network"))) as typeof fetch;
    expect(await verifyTurnstile("tok", throwing)).toBe(false);
  });
});
