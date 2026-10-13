import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { loadLabelPhoto } from "@/app/lib/label-image";
afterEach(() => vi.unstubAllGlobals());
describe("label image validation before pixel decoding", () => {
  it("rejects unsupported and empty files", async () => {
    await expect(
      loadLabelPhoto(
        new File(["test"], "file.pdf", { type: "application/pdf" }),
      ),
    ).rejects.toThrow(/HEIC, PDF/);
    await expect(
      loadLabelPhoto(new File([], "empty.png", { type: "image/png" })),
    ).rejects.toThrow(/non-empty/);
  });
  it("rejects malformed content and oversized image dimensions without constructing an image", async () => {
    const image = vi.fn();
    vi.stubGlobal("Image", image);
    await expect(
      loadLabelPhoto(
        new File(["bad bytes"], "fake.png", { type: "image/png" }),
      ),
    ).rejects.toThrow(/decoded/);
    const oversized = Buffer.from(
      readFileSync("e2e/fixtures/nutrition-label.png"),
    );
    oversized.writeUInt32BE(50000, 16);
    oversized.writeUInt32BE(50000, 20);
    await expect(
      loadLabelPhoto(
        new File([oversized], "oversized.png", { type: "image/png" }),
      ),
    ).rejects.toThrow(/too large/);
    expect(image).not.toHaveBeenCalled();
  });
  it("does not allow unsupported image contents disguised as a supported MIME type", async () => {
    const image = vi.fn();
    vi.stubGlobal("Image", image);
    const gif = Buffer.from("47494638396101000100800000", "hex");
    await expect(
      loadLabelPhoto(new File([gif], "fake.jpg", { type: "image/jpeg" })),
    ).rejects.toThrow(/not a supported/);
    expect(image).not.toHaveBeenCalled();
  });
});
