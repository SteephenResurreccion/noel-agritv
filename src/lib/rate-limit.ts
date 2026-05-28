/**
 * In-memory per-IP rate limiter for low-traffic API routes.
 *
 * Two enforced limits per key:
 *   - At most one request per `intervalMs` (default 1000 ms).
 *   - At most `maxPerWindow` requests per `windowMs` (default 30 per 60_000 ms).
 *
 * Caveats:
 *   - Module-scoped state. Does NOT survive Vercel cold starts and does NOT
 *     coordinate across serverless instances. Good enough for v1 against
 *     casual abuse from a single client; for production-grade defense add a
 *     Cloudflare WAF rule or an Upstash Redis bucket.
 *   - Eviction is inline (no setInterval — those don't run reliably on
 *     serverless): once the map exceeds `maxEntries` we drop entries older
 *     than `staleAfterMs`.
 *
 * The clock is injected so tests can advance time deterministically.
 */

export interface RateLimitOptions {
  /** Min ms between two consecutive requests from the same key. Default 1000. */
  intervalMs?: number;
  /** Rolling window length in ms. Default 60_000 (1 minute). */
  windowMs?: number;
  /** Max requests per `windowMs` for one key. Default 30. */
  maxPerWindow?: number;
  /** Soft cap on the internal map size; eviction kicks in past this. Default 1000. */
  maxEntries?: number;
  /** Entries with no activity for this long are removed during eviction. Default 5 min. */
  staleAfterMs?: number;
  /** Injectable clock — defaults to `Date.now`. */
  now?: () => number;
}

interface KeyState {
  /** Most recent request timestamp (ms). */
  lastRequest: number;
  /** Number of requests in the active window. */
  count: number;
  /** Timestamp the active window started (ms). */
  windowStart: number;
}

export interface RateLimitResult {
  /** True if the request is within both limits and has been recorded. */
  allowed: boolean;
  /** Seconds the caller should wait before retrying (HTTP Retry-After). */
  retryAfterSec: number;
}

export interface RateLimiter {
  /** Check and record a request for `key`. */
  check: (key: string) => RateLimitResult;
  /** Test helper — wipe internal state. */
  reset: () => void;
  /** Test helper — current key count (for assertions on eviction). */
  size: () => number;
}

export function createRateLimiter(opts: RateLimitOptions = {}): RateLimiter {
  const intervalMs = opts.intervalMs ?? 1000;
  const windowMs = opts.windowMs ?? 60_000;
  const maxPerWindow = opts.maxPerWindow ?? 30;
  const maxEntries = opts.maxEntries ?? 1000;
  const staleAfterMs = opts.staleAfterMs ?? 5 * 60_000;
  const now = opts.now ?? Date.now;

  const states = new Map<string, KeyState>();

  function prune(currentTime: number) {
    // Walk once, drop anything that hasn't been touched recently. Map
    // iteration order is insertion order; oldest-touched aren't guaranteed to
    // come first, but a single linear pass is cheap at our sizes.
    for (const [key, state] of states) {
      if (currentTime - state.lastRequest > staleAfterMs) {
        states.delete(key);
      }
    }
  }

  function check(key: string): RateLimitResult {
    const t = now();

    if (states.size > maxEntries) {
      prune(t);
    }

    const state = states.get(key);

    if (!state) {
      states.set(key, { lastRequest: t, count: 1, windowStart: t });
      return { allowed: true, retryAfterSec: 0 };
    }

    // Interval check: enforce a minimum gap between consecutive requests.
    const sinceLast = t - state.lastRequest;
    if (sinceLast < intervalMs) {
      const waitMs = intervalMs - sinceLast;
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)) };
    }

    // Window check: roll the window if it expired, otherwise enforce the cap.
    const sinceWindowStart = t - state.windowStart;
    if (sinceWindowStart >= windowMs) {
      state.windowStart = t;
      state.count = 1;
      state.lastRequest = t;
      return { allowed: true, retryAfterSec: 0 };
    }

    if (state.count >= maxPerWindow) {
      const waitMs = windowMs - sinceWindowStart;
      return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(waitMs / 1000)) };
    }

    state.count += 1;
    state.lastRequest = t;
    return { allowed: true, retryAfterSec: 0 };
  }

  function reset() {
    states.clear();
  }

  function size() {
    return states.size;
  }

  return { check, reset, size };
}
