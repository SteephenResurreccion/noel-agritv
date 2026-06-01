import { describe, it, expect, vi } from "vitest";
import { renderWithLang as render, screen, fireEvent } from "../test-utils";
import { YouTubeFacade } from "@/components/youtube-facade";
import { copy } from "@/lib/copy";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

// The render wrapper (renderWithLang) mounts LangProvider, which calls
// useRouter() on every render — stub it so the App Router context isn't required.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

describe("YouTubeFacade", () => {
  it("renders thumbnail image, not iframe, on initial load", () => {
    render(<YouTubeFacade videoId="abc123" title="Test Video" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.queryByTitle("Test Video")).not.toBeInTheDocument();
  });

  it("renders iframe after clicking play", () => {
    render(<YouTubeFacade videoId="abc123" title="Test Video" />);
    const playButton = screen.getByRole("button", {
      name: copy.videoFacade.play("Test Video"),
    });
    fireEvent.click(playButton);
    const iframe = screen.getByTitle("Test Video");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube.com/embed/abc123")
    );
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("autoplay=1")
    );
  });
});
