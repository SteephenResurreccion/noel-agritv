import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AuditEntry } from "@/lib/audit";

// Short-circuit the service-account JWT so the test exercises only the append
// request shape, not the credential flow. Mirrors sheets.test.ts exactly.
vi.mock("google-auth-library", () => {
  // No constructor: audit.ts does `new JWT({...})`, and a default constructor
  // ignores the args at runtime. (Avoids an unused-param lint warning.)
  class FakeJWT {
    async getAccessToken() {
      return { token: "fake-token" };
    }
  }
  return { JWT: FakeJWT };
});

const base: AuditEntry = {
  actor: "owner@example.com",
  action: "PRODUCT_ADD",
  target: "bio-plant-booster",
  summary: "Added product 'Bio Plant Booster' (bio-plant-booster)",
};

function okFetch() {
  return vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () =>
      new Response(JSON.stringify({ updates: { updatedRows: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
  );
}

function bodyRow(fetchMock: ReturnType<typeof okFetch>): string[] {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return JSON.parse(init.body as string).values[0] as string[];
}

describe("appendAuditLog", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_SHEET_ID", "sheet-id-stub");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "stub@example.com");
    vi.stubEnv("GOOGLE_PRIVATE_KEY", "stub-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("appends to the AuditLog tab with RAW + INSERT_ROWS (never USER_ENTERED)", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const { appendAuditLog } = await import("@/lib/audit");
    await appendAuditLog(base);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("/values/AuditLog!A1:append");
    expect(url).toContain("valueInputOption=RAW");
    expect(url).toContain("insertDataOption=INSERT_ROWS");
    expect(url).not.toContain("USER_ENTERED");
  });

  it("writes the row as [timestamp, actor, action, target, summary]", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const { appendAuditLog } = await import("@/lib/audit");
    await appendAuditLog(base);

    const row = bodyRow(fetchMock);
    expect(row).toHaveLength(5);
    expect(row[1]).toBe("owner@example.com");
    expect(row[2]).toBe("PRODUCT_ADD");
    expect(row[3]).toBe("bio-plant-booster");
    expect(row[4]).toBe("Added product 'Bio Plant Booster' (bio-plant-booster)");
  });

  it("writes an ISO-8601 UTC timestamp in column 0", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const { appendAuditLog } = await import("@/lib/audit");
    await appendAuditLog(base);

    const ts = bodyRow(fetchMock)[0];
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    // Round-trips through Date — proves it is a real toISOString() value.
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it("sanitizes actor/target/summary against formula injection but NOT the action code", async () => {
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const { appendAuditLog } = await import("@/lib/audit");
    // action is a fixed server string in practice; the leading "=" here only
    // proves the transport does NOT sanitize column 2.
    await appendAuditLog({
      actor: "=IMPORTDATA()",
      action: "=NOT_SANITIZED",
      target: "+target",
      summary: "@summary",
    });

    const row = bodyRow(fetchMock);
    expect(row[1]).toBe("'=IMPORTDATA()"); // actor sanitized
    expect(row[2]).toBe("=NOT_SANITIZED"); // action verbatim
    expect(row[3]).toBe("'+target"); // target sanitized
    expect(row[4]).toBe("'@summary"); // summary sanitized
  });

  it("throws when Google env vars are missing (no fetch issued)", async () => {
    vi.stubEnv("GOOGLE_SHEET_ID", "");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "");
    vi.stubEnv("GOOGLE_PRIVATE_KEY", "");
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    const { appendAuditLog } = await import("@/lib/audit");
    await expect(appendAuditLog(base)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the Sheets API responds !ok (e.g. missing AuditLog tab → HTTP 400)", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("Unable to parse range: AuditLog!A1", { status: 400 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { appendAuditLog } = await import("@/lib/audit");
    await expect(appendAuditLog(base)).rejects.toThrow(/AuditLog append failed/);
  });
});
