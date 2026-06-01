import { describe, it, expect } from "vitest";
import { resolveLangFromAcceptLanguage } from "@/lib/lang";

/**
 * Accept-Language resolution rules (locked product decisions):
 *  - en-PH (case-insensitive) => "en"
 *  - fil / fil-PH / tl / tl-PH => "fil"
 *  - Generic English (en, en-US, en-GB) does NOT opt into English — crawler
 *    protection: Googlebot/FB send en-US and MUST get Filipino.
 *  - First recognized tag (highest q-value) wins; unrecognized tags skipped.
 *  - Nothing recognized / null / empty => "fil" default.
 */
describe("resolveLangFromAcceptLanguage", () => {
  it("returns 'fil' for null header", () => {
    expect(resolveLangFromAcceptLanguage(null)).toBe("fil");
  });

  it("returns 'fil' for empty string", () => {
    expect(resolveLangFromAcceptLanguage("")).toBe("fil");
    expect(resolveLangFromAcceptLanguage("   ")).toBe("fil");
  });

  it("returns 'en' for en-PH", () => {
    expect(resolveLangFromAcceptLanguage("en-PH")).toBe("en");
  });

  it("matches en-PH case-insensitively", () => {
    expect(resolveLangFromAcceptLanguage("EN-ph")).toBe("en");
    expect(resolveLangFromAcceptLanguage("en-Ph,en;q=0.9")).toBe("en");
  });

  it("returns 'fil' for fil and fil-PH", () => {
    expect(resolveLangFromAcceptLanguage("fil")).toBe("fil");
    expect(resolveLangFromAcceptLanguage("fil-PH")).toBe("fil");
  });

  it("returns 'fil' for tl and tl-PH", () => {
    expect(resolveLangFromAcceptLanguage("tl")).toBe("fil");
    expect(resolveLangFromAcceptLanguage("tl-PH")).toBe("fil");
  });

  it("does NOT treat generic English as an English opt-in (crawler protection)", () => {
    expect(resolveLangFromAcceptLanguage("en")).toBe("fil");
    expect(resolveLangFromAcceptLanguage("en-US")).toBe("fil");
    expect(resolveLangFromAcceptLanguage("en-GB,en;q=0.9")).toBe("fil");
    // Typical Googlebot / Facebook crawler header.
    expect(resolveLangFromAcceptLanguage("en-US,en;q=0.5")).toBe("fil");
  });

  it("uses the highest q-value (first recognized) tag — fil before en-PH", () => {
    // fil has higher q than en-PH, fil recognized first => "fil"
    expect(
      resolveLangFromAcceptLanguage("fil-PH,fil;q=0.9,en-PH;q=0.8"),
    ).toBe("fil");
  });

  it("uses the highest q-value (first recognized) tag — en-PH before fil", () => {
    // en-PH has higher q than fil => "en"
    expect(
      resolveLangFromAcceptLanguage("en-PH,en;q=0.9,fil;q=0.8"),
    ).toBe("en");
  });

  it("skips unrecognized higher-q tags and matches the first recognized one", () => {
    // fr-FR (unrecognized, q=1) skipped; en-PH (q=0.8) is first recognized.
    expect(
      resolveLangFromAcceptLanguage("fr-FR,en-PH;q=0.8"),
    ).toBe("en");
    // de (unrecognized) and en-US (generic, not an opt-in) skipped; fil wins.
    expect(
      resolveLangFromAcceptLanguage("de,en-US;q=0.9,fil;q=0.5"),
    ).toBe("fil");
  });

  it("orders strictly by q-value, not by header position", () => {
    // en-PH listed second but has a higher q than the generic en-US.
    expect(
      resolveLangFromAcceptLanguage("en-US;q=0.4,en-PH;q=0.9"),
    ).toBe("en");
  });

  it("treats a tag with no q as q=1 (default)", () => {
    // en-PH (implicit q=1) outranks fil;q=0.9.
    expect(resolveLangFromAcceptLanguage("en-PH,fil;q=0.9")).toBe("en");
  });

  it("ignores surrounding whitespace in tags", () => {
    expect(
      resolveLangFromAcceptLanguage("  fr ,  en-PH ; q=0.8 "),
    ).toBe("en");
  });

  it("falls back to 'fil' when only unrecognized tags are present", () => {
    expect(resolveLangFromAcceptLanguage("fr-FR,de,es;q=0.9")).toBe("fil");
  });
});
