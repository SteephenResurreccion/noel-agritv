import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Guards the role-read retry/preserve logic behind the admin auth session
 * (availability fix). `resolveRole` reads the admin config from Vercel Blob and
 * THROWS on an outage; a single blip would otherwise drop an admin's role
 * mid-session. `resolveRoleWithRetry` retries once and, only on a double
 * failure, preserves the prior successfully-read role — without ever inventing,
 * defaulting, or widening a role.
 *
 * We mock only `resolveRole` and pass `delayMs: 0` so the retry path runs with
 * no real timer wait.
 */

const { resolveRoleMock } = vi.hoisted(() => ({ resolveRoleMock: vi.fn() }));

vi.mock("@/lib/admin-store", () => ({
  resolveRole: resolveRoleMock,
}));

import { resolveRoleWithRetry } from "@/lib/auth-role";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveRoleWithRetry", () => {
  it("returns the resolved role on first success without retrying", async () => {
    resolveRoleMock.mockResolvedValueOnce("owner");
    const role = await resolveRoleWithRetry("a@b.com", undefined, 0);
    expect(role).toBe("owner");
    expect(resolveRoleMock).toHaveBeenCalledTimes(1);
  });

  it("clears the role when a SUCCESSFUL read returns null, even with a prior role (never masks de-auth)", async () => {
    resolveRoleMock.mockResolvedValueOnce(null);
    const role = await resolveRoleWithRetry("a@b.com", "owner", 0);
    expect(role).toBeUndefined();
    expect(resolveRoleMock).toHaveBeenCalledTimes(1);
  });

  it("failure -> retry -> success: returns the retried role", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockResolvedValueOnce("manager");
    const role = await resolveRoleWithRetry("a@b.com", undefined, 0);
    expect(role).toBe("manager");
    expect(resolveRoleMock).toHaveBeenCalledTimes(2);
    errSpy.mockRestore();
  });

  it("failure -> failure -> prior role preserved", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockRejectedValueOnce(new Error("still down"));
    const role = await resolveRoleWithRetry("a@b.com", "owner", 0);
    expect(role).toBe("owner");
    expect(resolveRoleMock).toHaveBeenCalledTimes(2);
    errSpy.mockRestore();
  });

  it("failure -> failure -> no prior role: yields undefined (unchanged fail-closed behavior)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockRejectedValueOnce(new Error("still down"));
    const role = await resolveRoleWithRetry("a@b.com", undefined, 0);
    expect(role).toBeUndefined();
    errSpy.mockRestore();
  });

  it("logs failures with the stable [auth] tag", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    resolveRoleMock
      .mockRejectedValueOnce(new Error("blob down"))
      .mockRejectedValueOnce(new Error("still down"));
    await resolveRoleWithRetry("a@b.com", "owner", 0);
    expect(
      errSpy.mock.calls.some((c) => String(c[0]).includes("[auth]")),
    ).toBe(true);
    errSpy.mockRestore();
  });
});
