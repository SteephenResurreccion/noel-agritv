import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { YouTubeFacade } from "@/components/youtube-facade";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

describe("YouTubeFacade", () => {
  it("renders thumbnail image, not iframe, on initial load", () => {
    render(<YouTubeFacade videoId="abc123" title="Test Video" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.queryByTitle("Test Video")).not.toBeInTheDocument();
  });

  it("renders iframe after clicking play", () => {
    render(<YouTubeFacade videoId="abc123" title="Test Video" />);
    const playButton = screen.getByRole("button", { name: /play/i });
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
