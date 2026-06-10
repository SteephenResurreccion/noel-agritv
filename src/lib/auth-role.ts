import { resolveRoleStrict, type AdminRole } from "@/lib/admin-store";

/** Backoff before the single retry of a failed role read (ms). */
const ROLE_READ_RETRY_DELAY_MS = 250;

/**
 * Resolve an admin role with ONE retry on a transient failure, preserving a
 * prior successfully-read role only when both attempts fail.
 *
 * `resolveRoleStrict` reads the admin config from Vercel Blob and REJECTS on a
 * Blob outage (strict read — unlike the sign-in-gate `resolveRole`, it does NOT
 * swallow the error). A single transient blip would otherwise silently drop an
 * admin's role mid-session. So:
 *   - success (including a `null` result = de-authorized) → return that result.
 *     A successful `null` read CLEARS the role; we must never mask a real
 *     de-authorization by preserving a stale role.
 *   - reject → log `[auth]`, wait `delayMs`, retry once.
 *   - reject again → log `[auth]` and return `priorRole` (preserve). When
 *     `priorRole` is `undefined` this equals today's fail-closed behavior.
 *
 * Invariants: never invents/widens a role and never defaults one in on error.
 * The only values it can return are the freshly-resolved role (or `undefined`
 * when that read succeeds with `null`) or the caller-supplied `priorRole`.
 * Callers MUST only ever pass a `priorRole` that itself came from an earlier
 * successful read (see `src/auth.ts` — the JWT token's role is only ever set
 * from this function's return value).
 *
 * `delayMs` is injectable so unit tests can run without a real timer wait;
 * production always uses the 250ms default.
 */
export async function resolveRoleWithRetry(
  email: string,
  priorRole: AdminRole | undefined,
  delayMs: number = ROLE_READ_RETRY_DELAY_MS,
): Promise<AdminRole | undefined> {
  try {
    return (await resolveRoleStrict(email)) ?? undefined;
  } catch (firstErr) {
    console.error("[auth] resolveRoleStrict failed; retrying once after backoff:", firstErr);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      return (await resolveRoleStrict(email)) ?? undefined;
    } catch (retryErr) {
      console.error(
        "[auth] resolveRoleStrict failed on retry; preserving prior role:",
        retryErr,
      );
      return priorRole;
    }
  }
}
