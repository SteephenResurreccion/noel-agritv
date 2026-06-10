import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Guards the role-read retry/preserve logic behind the admin auth session
 * (availability fix). `resolveRoleStrict` reads the admin config from Vercel
 * Blob and REJECTS on an outage (the strict resolver — it does NOT swallow the
 * error). A single blip would otherwise drop an admin's role mid-session.
 * `resolveRoleWithRetry` retries once and, only on a double failure, preserves
 * the prior successfully-read role — without ever inventing, defaulting, or
 * widening a role.
 *
 * We mock `resolveRoleStrict` (the resolver `resolveRoleWithRetry` actually
 * calls) and pass `delayMs: 0` so the retry path runs with no real timer wait.
 * The rejection mocks below are honest: the real `resolveRoleStrict` genuinely
 * rejects on a Blob outage (see __tests__/lib/admin-store.test.ts for the
 * propagation proof).
 */

const { resolveRoleStrictMock } = vi.hoisted(() => ({ resolveRoleStrictMock: vi.fn() }));

vi.mock("@/lib/admin-store", () => ({
  resolveRoleStrict: resolveRoleStrictMock,
}));

import { resolveRoleWithRetry } from "@/lib/auth-role";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveRoleWithRetry", () => {
  it("returns the resolved role on first success without retrying", async () => {
    resolveRoleStrictMock.mockResolvedValueOnce("owner");
    const role = await resolveRoleWithRetry("a@b.com", undefined, 0);
    expect(role).toBe("owner");
    expect(resolveRoleStrictMock).toHaveBeenCalledTimes(1);
  });

  it("clears the role when a SUCCESSFUL read returns null, even with a prior role (never masks de-auth)", async () => {
    resolveRoleStrictMock.mockResolvedValueOnce(null);
    const role = await resolveRoleWithRetry("a@b.com", "owner", 0);
    expect(role).toBeUndefined();
    expect(resolveRoleStrictMock).toHaveBeenCalledTimes(1);
  });

  it("failure -> retry -> success: returns the retried role", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleStrictMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockResolvedValueOnce("manager");
    const role = await resolveRoleWithRetry("a@b.com", undefined, 0);
    expect(role).toBe("manager");
    expect(resolveRoleStrictMock).toHaveBeenCalledTimes(2);
    errSpy.mockRestore();
  });

  it("failure -> failure -> prior role preserved", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleStrictMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockRejectedValueOnce(new Error("still down"));
    const role = await resolveRoleWithRetry("a@b.com", "owner", 0);
    expect(role).toBe("owner");
    expect(resolveRoleStrictMock).toHaveBeenCalledTimes(2);
    errSpy.mockRestore();
  });

  it("failure -> failure -> no prior role: yields undefined (unchanged fail-closed behavior)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleStrictMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockRejectedValueOnce(new Error("still down"));
    const role = await resolveRoleWithRetry("a@b.com", undefined, 0);
    expect(role).toBeUndefined();
    errSpy.mockRestore();
  });

  it("logs failures with the stable [auth] tag", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleStrictMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockRejectedValueOnce(new Error("still down"));
    await resolveRoleWithRetry("a@b.com", "owner", 0);
    expect(
      errSpy.mock.calls.some((c) => String(c[0]).includes("[auth]")),
    ).toBe(true);
    errSpy.mockRestore();
  });
});
