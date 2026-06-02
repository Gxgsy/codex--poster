import { afterEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { createAiProvider } from "@/lib/ai/provider";
import { generateMockBaseImage } from "@/lib/ai/mock";
import { buildPrompt, generateOpenAiBaseImage, getOpenAiBaseUrl, getOpenAiImageModel } from "@/lib/ai/openai";

const mockInput = {
  productImagePath: "/assets/products/cabin/ftont.png",
  backgroundImagePath: "/assets/backgrounds/01.png",
  stylePrompt: "premium warm",
  compositionPrompt: "product centered",
  sceneType: "library lounge"
};

describe("AI image provider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("allows an OpenAI-compatible base URL override", () => {
    const originalBaseUrl = process.env.OPENAI_BASE_URL;

    try {
      delete process.env.OPENAI_BASE_URL;
      expect(getOpenAiBaseUrl()).toBeUndefined();

      process.env.OPENAI_BASE_URL = " https://www.ddshub.cc ";
      expect(getOpenAiBaseUrl()).toBe("https://www.ddshub.cc");
    } finally {
      if (originalBaseUrl === undefined) {
        delete process.env.OPENAI_BASE_URL;
      } else {
        process.env.OPENAI_BASE_URL = originalBaseUrl;
      }
    }
  });

  it("asks the image model to integrate the product instead of pasting it", () => {
    const prompt = buildPrompt({
      ...mockInput,
      viewId: "left",
      variationPrompt: "distinct candidate"
    });

    expect(prompt).toContain("not a pasted cutout");
    expect(prompt).toContain("seamlessly integrated into the generated environment");
    expect(prompt).toContain("No hard cutout edge");
    expect(prompt).toContain("shared ambient light");
    expect(prompt).toContain("same white balance");
    expect(prompt).toContain("same exposure");
    expect(prompt).toContain("Do not crop or cut off any part of the cabin");
    expect(prompt).toContain("minimum 8% margin");
    expect(prompt).toContain("upper 0% to 32% title-safe area");
    expect(prompt).toContain("TITLE READABILITY BACKGROUND");
    expect(prompt).toContain("uniform color temperature and a single continuous tone");
    expect(prompt).toContain("no large brightness gradients, color blocks, hard shadow boundaries, or high-contrast texture");
    expect(prompt).toContain("headline and subtitle remain crisp and readable");
    expect(prompt).toContain("TITLE-TO-CABIN GAP");
    expect(prompt).toContain("cabin top must start below 36% of poster height");
    expect(prompt).toContain("at least 120px visual gap below the subtitle area");
    expect(prompt).toContain("clean, light, low-contrast wall or empty space");
    expect(prompt).toContain("no window frames, strong light patches, dark shadows, columns, decorations, or key objects");
    expect(prompt).toContain("x=18% to 82% and y=36% to 84%");
    expect(prompt).toContain("No partial side panel");
    expect(prompt).toContain("contact shadow");
    expect(prompt).toContain("consistent wall and floor perspective");
    expect(prompt).toContain("39% to 41%");
    expect(prompt).toContain("bottom of the cabin should land around 80% to 84%");
    expect(prompt).toContain("Selected product view: left");
    expect(prompt).toContain("PROMPT PRIORITY");
    expect(prompt).toContain("HARD REQUIREMENTS");
    expect(prompt).toContain("GLOBAL PRODUCT SCALE LOCK");
    expect(prompt).toContain("This applies to front, left, and right views equally");
    expect(prompt).toContain("Left-view and right-view cabins must not become larger than the front-view cabin");
    expect(prompt).toContain("VIEW-SPECIFIC HARD RULE - LEFT VIEW");
    expect(prompt).toContain("The left-view cabin must use the same 40% target scale as the front view");
    expect(prompt).toContain("outer bounding box height 39% to 41% of poster height");
    expect(prompt).toContain("GLOBAL WALL CONTACT LOCK");
    expect(prompt).toContain("The left-view cabin rear/back broad vertical panel must be directly flush against the wall");
    expect(prompt).toContain("all views must share the same visual scale");
    expect(prompt).toContain("Do not enlarge side-view cabins");
    expect(prompt).toContain("cabin outer bounding box height must be 39% to 41%");
    expect(prompt).toContain("cabin outer bounding box width must stay between 42% and 58%");
    expect(prompt).toContain("rear/back broad vertical plane must be flush against the wall");
    expect(prompt).toContain("front side of the cabin must face open floor space");
    expect(prompt).toContain("at least 22% visible open floor area in front");
    expect(prompt).toContain("not a product close-up");
    expect(prompt).toContain("distinct candidate");
    expect(prompt).toContain("A background reference image is provided");
    expect(prompt).toContain("use it only as loose atmosphere");
  });

  it("asks the image model to generate backgrounds only from text when no background reference exists", () => {
    const prompt = buildPrompt({
      ...mockInput,
      backgroundImagePath: undefined,
      viewId: "front"
    });

    expect(prompt).toContain("No background reference image is provided");
    expect(prompt).toContain("generate the background only from the scene text prompts");
  });

  it("adds right-view wall-contact instructions for side-view cabin placement", () => {
    const prompt = buildPrompt({
      ...mockInput,
      viewId: "right",
      variationPrompt: "right side candidate"
    });

    expect(prompt).toContain("VIEW-SPECIFIC HARD RULE - RIGHT VIEW");
    expect(prompt).toContain("The right-view cabin must use the same 40% target scale as the front view");
    expect(prompt).toContain("outer bounding box height 39% to 41% of poster height");
    expect(prompt).toContain("The right-view cabin rear/back broad vertical panel must be directly flush against the wall");
    expect(prompt).toContain("generated wall must sit immediately behind that rear plane");
    expect(prompt).toContain("front/door side must face open floor space");
  });

  it("uses the Seedream images endpoint and downloads URL responses from the configured gateway", async () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalBaseUrl = process.env.OPENAI_BASE_URL;
    const originalModel = process.env.OPENAI_IMAGE_MODEL;
    const generatedPng = await sharp({
      create: { width: 24, height: 24, channels: 4, background: "#2563eb" }
    }).png().toBuffer();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlString = String(url);
      if (urlString === "https://api.szamca.com:30000/v1/images/generations") {
        const body = JSON.parse(String(init?.body));
        expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
        expect(body.model).toBe("doubao-seedream-5-0-260128");
        expect(body.response_format).toBe("url");
        expect(body.size).toBe("1440x2560");
        expect(body.prompt).toContain("Final poster export size is 1080x1920");
        expect(body.prompt).toContain("Generate the base image at 1440x2560");
        expect(body.prompt).toContain("same aspect ratio as the final poster");
        expect(body.prompt).toContain("Do not generate a square image and do not rely on later cropping, padding, stitching, blurred extension, or background splicing");
        expect(Array.isArray(body.image) ? body.image[0] : body.image).toContain("data:image/png;base64,");
        return new Response(JSON.stringify({
          data: [{ url: "https://example.test/generated.png" }]
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (urlString === "https://example.test/generated.png") {
        return new Response(generatedPng, { status: 200, headers: { "Content-Type": "image/png" } });
      }

      throw new Error(`Unexpected fetch URL: ${urlString}`);
    });

    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = "https://api.szamca.com:30000/v1";
    process.env.OPENAI_IMAGE_MODEL = "doubao-seedream-5-0-260128";

    try {
      const output = await generateOpenAiBaseImage({
        ...mockInput,
        outputSize: { width: 1080, height: 1920 }
      });
      expect(output.equals(generatedPng)).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }

      if (originalBaseUrl === undefined) {
        delete process.env.OPENAI_BASE_URL;
      } else {
        process.env.OPENAI_BASE_URL = originalBaseUrl;
      }

      if (originalModel === undefined) {
        delete process.env.OPENAI_IMAGE_MODEL;
      } else {
        process.env.OPENAI_IMAGE_MODEL = originalModel;
      }
    }
  });

  it("sends only the product reference image when no background reference is provided", async () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalBaseUrl = process.env.OPENAI_BASE_URL;
    const originalModel = process.env.OPENAI_IMAGE_MODEL;
    const generatedPng = await sharp({
      create: { width: 24, height: 24, channels: 4, background: "#111827" }
    }).png().toBuffer();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlString = String(url);
      if (urlString === "https://api.szamca.com:30000/v1/images/generations") {
        const body = JSON.parse(String(init?.body));
        expect(typeof body.image).toBe("string");
        expect(body.image).toContain("data:image/png;base64,");
        return new Response(JSON.stringify({
          data: [{ url: "https://example.test/generated-product-only.png" }]
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (urlString === "https://example.test/generated-product-only.png") {
        return new Response(generatedPng, { status: 200, headers: { "Content-Type": "image/png" } });
      }

      throw new Error(`Unexpected fetch URL: ${urlString}`);
    });

    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_BASE_URL = "https://api.szamca.com:30000/v1";
    process.env.OPENAI_IMAGE_MODEL = "doubao-seedream-5-0-260128";

    try {
      const output = await generateOpenAiBaseImage({
        ...mockInput,
        backgroundImagePath: undefined
      });
      expect(output.equals(generatedPng)).toBe(true);
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }

      if (originalBaseUrl === undefined) {
        delete process.env.OPENAI_BASE_URL;
      } else {
        process.env.OPENAI_BASE_URL = originalBaseUrl;
      }

      if (originalModel === undefined) {
        delete process.env.OPENAI_IMAGE_MODEL;
      } else {
        process.env.OPENAI_IMAGE_MODEL = originalModel;
      }
    }
  });

  it("uses a request API key instead of the server environment API key", async () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalBaseUrl = process.env.OPENAI_BASE_URL;
    const originalModel = process.env.OPENAI_IMAGE_MODEL;
    const generatedPng = await sharp({
      create: { width: 24, height: 24, channels: 4, background: "#0f766e" }
    }).png().toBuffer();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlString = String(url);
      if (urlString === "https://api.szamca.com:30000/v1/images/generations") {
        expect(init?.headers).toMatchObject({ Authorization: "Bearer user-request-key" });
        return new Response(JSON.stringify({
          data: [{ url: "https://example.test/generated-user-key.png" }]
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (urlString === "https://example.test/generated-user-key.png") {
        return new Response(generatedPng, { status: 200, headers: { "Content-Type": "image/png" } });
      }

      throw new Error(`Unexpected fetch URL: ${urlString}`);
    });

    process.env.OPENAI_API_KEY = "server-env-key";
    process.env.OPENAI_BASE_URL = "https://api.szamca.com:30000/v1";
    process.env.OPENAI_IMAGE_MODEL = "doubao-seedream-5-0-260128";

    try {
      const output = await generateOpenAiBaseImage({
        ...mockInput,
        apiKey: "user-request-key"
      });
      expect(output.equals(generatedPng)).toBe(true);
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }

      if (originalBaseUrl === undefined) {
        delete process.env.OPENAI_BASE_URL;
      } else {
        process.env.OPENAI_BASE_URL = originalBaseUrl;
      }

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
