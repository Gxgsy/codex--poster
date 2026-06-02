import path from "node:path";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import { ProxyAgent } from "undici";
import type { GenerateBaseImageInput } from "./provider";
import { defaultPosterSize, type PosterSize } from "@/lib/poster/size";

const defaultOpenAiImageModel = "gpt-image-2";
const seedreamMinimumPixels = 3_686_400;

export function getOpenAiImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || defaultOpenAiImageModel;
}

export function getOpenAiBaseUrl(): string | undefined {
  return process.env.OPENAI_BASE_URL?.trim() || undefined;
}

function getOpenAiProxyUrl(): string | undefined {
  return process.env.HTTPS_PROXY?.trim()
    || process.env.HTTP_PROXY?.trim()
    || process.env.ALL_PROXY?.trim()
    || undefined;
}

function shouldUseSeedreamImagesApi(): boolean {
  const baseUrl = getOpenAiBaseUrl();
  const model = getOpenAiImageModel();

  return Boolean(baseUrl && (baseUrl.includes("volces.com") || baseUrl.includes("szamca.com") || model.includes("seedream")));
}

function getRequestApiKey(input: GenerateBaseImageInput): string | undefined {
  return input.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || undefined;
}

function createOpenAiClient(apiKey: string): OpenAI {
  const proxyUrl = getOpenAiProxyUrl();
  type OpenAiOptions = NonNullable<ConstructorParameters<typeof OpenAI>[0]>;
  const fetchOptions = proxyUrl
    ? ({ dispatcher: new ProxyAgent(proxyUrl) } as unknown as OpenAiOptions["fetchOptions"])
    : undefined;

  return new OpenAI({
    apiKey,
    baseURL: getOpenAiBaseUrl(),
    timeout: 120_000,
    maxRetries: 0,
    fetchOptions
  });
}

function resolveAssetPath(assetPath: string, assetLabel: "product" | "background"): string {
  if (!assetPath.startsWith("/assets/")) {
    throw new Error(`Invalid ${assetLabel} image path: expected a path under /assets/`);
  }

  const publicAssetsRoot = path.resolve(process.cwd(), "public", "assets");
  const resolvedPath = path.resolve(publicAssetsRoot, assetPath.slice("/assets/".length));
  const relativePath = path.relative(publicAssetsRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Invalid ${assetLabel} image path: path must stay within /assets/`);
  }

  return resolvedPath;
}

function getRequestedOutputSize(input: GenerateBaseImageInput): PosterSize {
  return input.outputSize ?? defaultPosterSize;
}

function formatGenerationApiSize(size: PosterSize): string {
  return `${size.width}x${size.height}`;
}

function getSeedreamGenerationSize(input: GenerateBaseImageInput): PosterSize {
  const requestedSize = getRequestedOutputSize(input);
  const requestedPixels = requestedSize.width * requestedSize.height;

  if (requestedPixels >= seedreamMinimumPixels) {
    return requestedSize;
  }

  const scale = Math.sqrt(seedreamMinimumPixels / requestedPixels);
  const width = Math.ceil(requestedSize.width * scale);
  const height = Math.ceil(requestedSize.height * scale);

  return { width, height };
}

export function buildPrompt(input: GenerateBaseImageInput): string {
  const outputSize = getRequestedOutputSize(input);
  const generationSize = getSeedreamGenerationSize(input);
  const outputSizeText = formatGenerationApiSize(outputSize);
  const generationSizeText = formatGenerationApiSize(generationSize);
  const backgroundReferencePrompt = input.backgroundImagePath
    ? "A background reference image is provided; use it only as loose atmosphere, material, lighting, and campus-scene reference, but create a new background composition and do not copy it exactly."
    : "No background reference image is provided; generate the background only from the scene text prompts and do not imitate any uploaded background image.";
  const sideViewPrompt = input.viewId === "left"
    ? [
      "VIEW-SPECIFIC HARD RULE - LEFT VIEW:",
      "The left-view cabin must use the same 40% target scale as the front view: outer bounding box height 39% to 41% of poster height, never larger, never closer to camera.",
      "The left-view cabin rear/back broad vertical panel must be directly flush against the wall; the generated wall must sit immediately behind that rear plane, parallel to it, with no visible gap.",
      "The left-view front/door side must face open floor space; keep extra open floor visible in front of the door side."
    ].join(" ")
    : input.viewId === "right"
      ? [
        "VIEW-SPECIFIC HARD RULE - RIGHT VIEW:",
        "The right-view cabin must use the same 40% target scale as the front view: outer bounding box height 39% to 41% of poster height, never larger, never closer to camera.",
        "The right-view cabin rear/back broad vertical panel must be directly flush against the wall; the generated wall must sit immediately behind that rear plane, parallel to it, with no visible gap.",
        "The right-view front/door side must face open floor space; keep extra open floor visible in front of the door side."
      ].join(" ")
      : undefined;
  const viewScalePrompt = input.viewId
    ? [
      `Selected product view: ${input.viewId}.`,
      "GLOBAL PRODUCT SCALE LOCK:",
      "This applies to front, left, and right views equally.",
      "The cabin outer bounding box height must be 39% to 41% of the poster height, measured from the top roof edge to the bottom feet, targeting exactly 40%.",
      "Left-view and right-view cabins must not become larger than the front-view cabin; all views must share the same visual scale.",
      "The cabin outer bounding box width must stay between 42% and 58% of the poster width, never wider and never closer to camera.",
      "The cabin bottom must land around 80% to 84% of the poster height, with the full cabin visible and no edge crop.",
      "The entire cabin must stay inside the safe composition box: x=18% to 82% and y=36% to 84%, with no part outside the poster.",
      "Do not enlarge side-view cabins, do not make left or right views closer to camera, and do not crop any side-view edge.",
      "No partial side panel, no half-visible side wall, no object cut off by the left or right poster edge.",
      "GLOBAL WALL CONTACT LOCK:",
      "For every selected view, the cabin rear/back broad vertical plane must be flush against the wall and parallel to the wall; there must be no visible gap behind it.",
      "The front side of the cabin must face open floor space, with at least 22% visible open floor area in front of the cabin.",
      "Keep consistent left and right margins around the cabin so it does not touch poster edges.",
      sideViewPrompt
    ].join(" ")
    : undefined;

  return [
    "PROMPT PRIORITY: obey the HARD REQUIREMENTS first. If any style, scene, reference image, or variation instruction conflicts with a HARD REQUIREMENT, the HARD REQUIREMENT wins.",
    "HARD REQUIREMENTS:",
    `OUTPUT SIZE HARD REQUIREMENT: Final poster export size is ${outputSizeText} (${outputSize.width}px wide by ${outputSize.height}px high). Generate the base image at ${generationSizeText}, same aspect ratio as the final poster, vertical poster composition, full-frame complete image.`,
    "Do not generate a square image and do not rely on later cropping, padding, stitching, blurred extension, or background splicing to fit the requested poster size.",
    "The requested output aspect ratio is the real composition frame; all product scale percentages and title-safe-area percentages must be measured against this final frame.",
    viewScalePrompt,
    "Create a new premium, warm, vertical commercial poster base image. Do not copy any background reference composition exactly.",
    backgroundReferencePrompt,
    `School scene type: ${input.sceneType}.`,
    "The product cabin's back side must be placed against a wall and parallel to the wall in every view.",
    "The product cabin should occupy about 39% to 41% of the poster height, targeting exactly 40%, not a product close-up, and it must not cover the upper title area.",
    "The bottom of the cabin should land around 80% to 84% of the poster height, with visible floor space and sales area below.",
    "Do not crop or cut off any part of the cabin; keep the full cabin visible with a minimum 8% margin from the left and right poster edges.",
    "Hard composition rule: keep the entire cabin outer box inside x=18% to 82% and y=36% to 84%; the full top, bottom, left side, right side, front face, and side panel must be visible.",
    "No partial side panel, no clipped corner, no cropped roof, no cropped door frame, and no product edge touching the poster border.",
    "Keep the cabin in the middle-lower portion of the poster; preserve enough surrounding wall and floor environment.",
    "TITLE AREA HARD REQUIREMENTS:",
    "Use expressive campus atmosphere and layered light-and-shadow effects only in the lower and side areas: warm sunlight, soft reflected light, natural indoor ambient light, and subtle depth.",
    "Reserve the upper 0% to 32% title-safe area as clean, light, low-contrast wall or empty space; no window frames, strong light patches, dark shadows, columns, decorations, or key objects in this area.",
    "TITLE READABILITY BACKGROUND: the entire upper title area must use uniform color temperature and a single continuous tone, with no large brightness gradients, color blocks, hard shadow boundaries, or high-contrast texture, so the headline and subtitle remain crisp and readable.",
    "TITLE-TO-CABIN GAP: cabin top must start below 36% of poster height and keep at least 120px visual gap below the subtitle area; no cabin roof, side wall, door frame, or product detail may overlap or crowd the title/subtitle area.",
    "The title-safe area must have small brightness changes and readable contrast for overlaid Chinese headline and subtitle text.",
    "SCENE AND STYLE REQUIREMENTS:",
    input.stylePrompt,
    input.compositionPrompt,
    "Generate a fresh school environment based on the selected scene text, not a near-duplicate of any reference background.",
    "INTEGRATION REQUIREMENTS:",
    "Integrate the product as a real physical object in the room, not a pasted cutout or flat sticker.",
    "The product must be seamlessly integrated into the generated environment as if photographed there, with shared ambient light and physically plausible surface interaction.",
    "Match the product with the scene lighting, color temperature, same white balance, same exposure, wall perspective, floor perspective, occlusion, reflections, and contact shadow.",
    "Use one coherent camera and one coherent light source direction for the entire scene; avoid mixed studio-product lighting and background lighting.",
    "No hard cutout edge, no pasted foreground layer, no mismatched sharpness, no isolated product-background rectangle.",
    "The cabin must touch the floor naturally and have a consistent wall and floor perspective with believable scale.",
    "VARIATION REQUIREMENTS:",
    input.variationPrompt,
    "NEGATIVE REQUIREMENTS:",
    "Do not keep any white canvas, transparent-image border, rectangular cutout edge, or isolated product background from the reference image.",
    "Preserve visible product cabin text and markings accurately from the reference image.",
    "Leave generous empty space in the upper area for title text, and keep visual detail away from the text area.",
    "Do not add new text, labels, logos, watermarks, or signatures."
  ].filter(Boolean).join("\n");
}

async function toPngReference(assetPath: string, assetLabel: "product" | "background") {
  const resolvedPath = resolveAssetPath(assetPath, assetLabel);
  const pngBuffer = await sharp(resolvedPath).png().toBuffer();
  const fileName = `${path.basename(assetPath, path.extname(assetPath))}.png`;

  return toFile(pngBuffer, fileName, { type: "image/png" });
}

async function toPngDataUrl(assetPath: string, assetLabel: "product" | "background"): Promise<string> {
  const resolvedPath = resolveAssetPath(assetPath, assetLabel);
  const pngBuffer = await sharp(resolvedPath).png().toBuffer();

  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}

async function downloadImageUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Generated image download failed: ${response.status} ${message.slice(0, 300)}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function generateSeedreamBaseImage(input: GenerateBaseImageInput): Promise<Buffer> {
  const baseUrl = getOpenAiBaseUrl();
  if (!baseUrl) {
    throw new Error("OPENAI_BASE_URL is required for Seedream image generation.");
  }
  const apiKey = getRequestApiKey(input);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  const [productReference, backgroundReference] = await Promise.all([
    toPngDataUrl(input.productImagePath, "product"),
    input.backgroundImagePath ? toPngDataUrl(input.backgroundImagePath, "background") : undefined
  ]);
  const images = [productReference, backgroundReference].filter((item): item is string => Boolean(item));
  const responseFormat = baseUrl.includes("szamca.com") ? "url" : "b64_json";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getOpenAiImageModel(),
      prompt: buildPrompt(input),
      image: images.length === 1 ? images[0] : images,
      sequential_image_generation: "disabled",
      size: formatGenerationApiSize(getSeedreamGenerationSize(input)),
      response_format: responseFormat,
      stream: false,
      watermark: false
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Seedream image generation failed: ${response.status} ${message.slice(0, 300)}`);
  }

  const payload = await response.json() as { data?: Array<{ b64_json?: string; url?: string }> };
  const item = payload.data?.[0];
  const b64 = item?.b64_json;

  if (item?.url) {
    return downloadImageUrl(item.url);
  }

  if (!b64) {
    throw new Error("OpenAI image response did not include image data.");
  }

  return Buffer.from(b64, "base64");
}

export async function generateOpenAiBaseImage(
  input: GenerateBaseImageInput
): Promise<Buffer> {
  const apiKey = getRequestApiKey(input);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  if (shouldUseSeedreamImagesApi()) {
    return generateSeedreamBaseImage(input);
  }

  const client = createOpenAiClient(apiKey);
  const [productReference, backgroundReference] = await Promise.all([
    toPngReference(input.productImagePath, "product"),
    input.backgroundImagePath ? toPngReference(input.backgroundImagePath, "background") : undefined
  ]);
  const images = [productReference, backgroundReference].filter((item): item is Awaited<ReturnType<typeof toPngReference>> => Boolean(item));

  const response = await client.images.edit({
    model: getOpenAiImageModel(),
    image: images,
    prompt: buildPrompt(input),
    size: "1024x1536",
    quality: "medium"
  });
  const b64 = response.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI image response did not include image data.");
  }

  return Buffer.from(b64, "base64");
}
