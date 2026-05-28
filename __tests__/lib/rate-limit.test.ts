import { describe, it, expect } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Drives the limiter with an injected clock so behaviour is deterministic.
 * `setT` shifts the virtual "now" forward (ms) between checks.
 */
function makeLimiter(opts: Partial<Parameters<typeof createRateLimiter>[0]> = {}) {
  let t = 0;
  const limiter = createRateLimiter({
    intervalMs: 1000,
    windowMs: 60_000,
    maxPerWindow: 30,
    now: () => t,
    ...opts,
  });
  return {
    limiter,
    setT: (next: number) => {
      t = next;
    },
    advance: (delta: number) => {
      t += delta;
    },
  };
}

describe("createRateLimiter", () => {
  it("allows the first request from a new IP", () => {
    const { limiter } = makeLimiter();
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("blocks a second request from the same IP within 1s", () => {
    const { limiter, advance } = makeLimiter();
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
    advance(500);
    const res = limiter.check("1.1.1.1");
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it("allows the next request after the 1s interval elapses", () => {
    const { limiter, advance } = makeLimiter();
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
    advance(1000);
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("does not couple unrelated IPs together", () => {
    const { limiter } = makeLimiter();
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
    expect(limiter.check("2.2.2.2").allowed).toBe(true);
  });

  it("blocks the 31st request inside the same 60s window", () => {
    const { limiter, advance } = makeLimiter();
    // 30 evenly-spaced requests: t=0, 1000, 2000, ..., 29000 ms
    for (let i = 0; i < 30; i++) {
      if (i > 0) advance(1000);
      expect(limiter.check("1.1.1.1").allowed).toBe(true);
    }
    // Window started at t=0; we're at t=29000, still inside the 60_000 window.
    advance(1000); // t=30_000
    const res = limiter.check("1.1.1.1");
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSec).toBeGreaterThan(0);
  });

  it("allows requests again once the 60s window rolls over", () => {
    const { limiter, advance } = makeLimiter();
    expect(limiter.check("1.1.1.1").allowed).toBe(true); // t=0
    advance(60_000); // t=60_000 — window rolls
    expect(limiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("returns a sane retry-after when blocked by the interval rule", () => {
    const { limiter, advance } = makeLimiter();
    limiter.check("1.1.1.1");
    advance(200); // 800ms left in the gap
    const res = limiter.check("1.1.1.1");
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSec).toBe(1);
  });
});
