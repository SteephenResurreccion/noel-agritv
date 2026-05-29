import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { openMessenger } from "@/lib/open-messenger";

const MESSENGER_WEB = "https://www.messenger.com/t/noeltolentino2728";

// jsdom's window.location does not let `.assign` be spied on directly because the
// Location object is not configurable. Replace it with a stub for the suite —
// same idiom as track-page.test.tsx.
const originalLocation = window.location;
const assignMock = vi.fn();

// `window.open` should never be called. Spy so we can assert that.
const openSpy = vi.fn();

function setUserAgent(ua: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value: ua,
  });
}

beforeEach(() => {
  assignMock.mockReset();
  openSpy.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { ...originalLocation, assign: assignMock },
  });
  Object.defineProperty(window, "open", {
    configurable: true,
    writable: true,
    value: openSpy,
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
});

describe("openMessenger — IAB-safe same-tab navigation", () => {
  it("navigates same-tab via window.location.assign and never calls window.open (desktop)", () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );
    openMessenger();
    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("navigates same-tab and never calls window.open (mobile)", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
    );
    openMessenger("Bio Enzyme");
    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("navigates same-tab and never calls window.open inside the Facebook in-app browser", () => {
    // Facebook IAB UA on Android — the primary traffic source.
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 [FBAN/EMA;FBAV/420.0.0]"
    );
    openMessenger("Jasmine 479");
    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it("appends the ?text= prefill on desktop when a product name is given", () => {
    setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"
    );
    openMessenger("Bio Plant Booster");
    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(assignMock.mock.calls[0][0]).toBe(
      `${MESSENGER_WEB}?text=${encodeURIComponent(
        "Hi, I'm interested in Bio Plant Booster"
      )}`
    );
  });

  it("uses the bare Messenger URL on mobile even with a product name (app ignores ?text=)", () => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0"
    );
    openMessenger("Mayumi");
    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(assignMock.mock.calls[0][0]).toBe(MESSENGER_WEB);
  });

  it("uses the bare Messenger URL on desktop when no product name is given", () => {
    setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );
    openMessenger();
    expect(assignMock.mock.calls[0][0]).toBe(MESSENGER_WEB);
  });
});
