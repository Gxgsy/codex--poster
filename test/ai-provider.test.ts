import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { createAiProvider } from "@/lib/ai/provider";
import { generateMockBaseImage } from "@/lib/ai/mock";
import { getOpenAiImageModel } from "@/lib/ai/openai";

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

  it("requires an API key for the OpenAI provider before loading assets", async () => {
    const originalProvider = process.env.AI_PROVIDER;
    const originalApiKey = process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;

    try {
      await expect(createAiProvider().generateBaseImage(mockInput)).rejects.toThrow(
        "OPENAI_API_KEY is required when AI_PROVIDER=openai."
      );
    } finally {
      if (originalProvider === undefined) {
        delete process.env.AI_PROVIDER;
      } else {
        process.env.AI_PROVIDER = originalProvider;
      }

      if (originalApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
    }
  });

  it("uses the supported OpenAI image model by default and allows an override", () => {
    const originalModel = process.env.OPENAI_IMAGE_MODEL;

    try {
      delete process.env.OPENAI_IMAGE_MODEL;
      expect(getOpenAiImageModel()).toBe("gpt-image-2");

      process.env.OPENAI_IMAGE_MODEL = " gpt-image-1 ";
      expect(getOpenAiImageModel()).toBe("gpt-image-1");
    } finally {
      if (originalModel === undefined) {
        delete process.env.OPENAI_IMAGE_MODEL;
      } else {
        process.env.OPENAI_IMAGE_MODEL = originalModel;
      }
    }
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
