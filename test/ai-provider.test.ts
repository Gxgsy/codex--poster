import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { createAiProvider } from "@/lib/ai/provider";
import { generateMockBaseImage } from "@/lib/ai/mock";

const mockInput = {
  productImagePath: "/assets/products/cabin/front.svg",
  backgroundImagePath: "/assets/backgrounds/school-library-lounge.svg",
  stylePrompt: "premium warm",
  compositionPrompt: "product centered",
  sceneType: "library lounge"
};

describe("AI image provider", () => {
  it("uses the deterministic mock provider by default", async () => {
    const output = await createAiProvider().generateBaseImage(mockInput);
    const expected = await generateMockBaseImage(mockInput);

    expect(output.equals(expected)).toBe(true);
  });

  it("creates a 1394 x 2700 PNG base image with the mock provider", async () => {
    const output = await generateMockBaseImage(mockInput);

    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(1394);
    expect(metadata.height).toBe(2700);
    expect(metadata.format).toBe("png");
  });

  it("rejects product paths that traverse outside public assets", async () => {
    await expect(generateMockBaseImage({
      ...mockInput,
      productImagePath: "/assets/../../package.json"
    })).rejects.toThrow("Invalid product image path");
  });
});
