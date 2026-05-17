import path from "node:path";
import OpenAI, { toFile } from "openai";
import sharp from "sharp";
import type { GenerateBaseImageInput } from "./provider";

const defaultOpenAiImageModel = "gpt-image-2";

export function getOpenAiImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || defaultOpenAiImageModel;
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

function buildPrompt(input: GenerateBaseImageInput): string {
  return [
    input.stylePrompt,
    input.compositionPrompt,
    "Create a premium, warm, vertical commercial poster base image.",
    `School scene type: ${input.sceneType}.`,
    "Place the product cabin against the wall and parallel to the wall.",
    "Preserve visible product cabin text and markings accurately from the reference image.",
    "Leave generous empty space in the upper area for title text.",
    "Do not add new text, labels, logos, watermarks, or signatures."
  ].join("\n");
}

async function toPngReference(assetPath: string, assetLabel: "product" | "background") {
  const resolvedPath = resolveAssetPath(assetPath, assetLabel);
  const pngBuffer = await sharp(resolvedPath).png().toBuffer();
  const fileName = `${path.basename(assetPath, path.extname(assetPath))}.png`;

  return toFile(pngBuffer, fileName, { type: "image/png" });
}

export async function generateOpenAiBaseImage(
  input: GenerateBaseImageInput
): Promise<Buffer> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const [productReference, backgroundReference] = await Promise.all([
    toPngReference(input.productImagePath, "product"),
    toPngReference(input.backgroundImagePath, "background")
  ]);

  const response = await client.images.edit({
    model: getOpenAiImageModel(),
    image: [productReference, backgroundReference],
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
