import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackPage from "@/app/(storefront)/track/page";

// jsdom's window.location does not let `.assign` be spied on directly because the
// Location object is not configurable. Replace it with a stub for the suite.
const originalLocation = window.location;
const assignMock = vi.fn();

beforeEach(() => {
  assignMock.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { ...originalLocation, assign: assignMock },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
});

describe("TrackPage", () => {
  it("renders the heading, tracking-number input and submit button", () => {
    render(<TrackPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /track my order/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /tracking number/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /track on j&t/i })
    ).toBeInTheDocument();
  });

  it("does not redirect when the input is empty and shows an inline hint", async () => {
    render(<TrackPage />);
    await userEvent.click(screen.getByRole("button", { name: /track on j&t/i }));
    expect(assignMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /enter your tracking number/i
    );
  });

  it("does not redirect when the input is whitespace-only", async () => {
    render(<TrackPage />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /tracking number/i }),
      "   "
    );
    await userEvent.click(screen.getByRole("button", { name: /track on j&t/i }));
    expect(assignMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("redirects same-tab to J&T's official tracker with the URL-encoded trimmed number", async () => {
    render(<TrackPage />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /tracking number/i }),
      "  JT1234567890  "
    );
    await userEvent.click(screen.getByRole("button", { name: /track on j&t/i }));

    expect(assignMock).toHaveBeenCalledTimes(1);
    const target = assignMock.mock.calls[0][0] as string;
    expect(target).toBe(
      "https://www.jtexpress.ph/index/query/gzquery.html?bills=JT1234567890"
    );
  });

  it("URL-encodes special characters in the tracking number", async () => {
    render(<TrackPage />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /tracking number/i }),
      "AB 12+34"
    );
    await userEvent.click(screen.getByRole("button", { name: /track on j&t/i }));

    expect(assignMock).toHaveBeenCalledTimes(1);
    const target = assignMock.mock.calls[0][0] as string;
    expect(target).toContain("bills=AB%2012%2B34");
  });

  it("clears the inline hint once the user starts typing again", async () => {
    render(<TrackPage />);
    await userEvent.click(screen.getByRole("button", { name: /track on j&t/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: /tracking number/i }),
      "X"
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
