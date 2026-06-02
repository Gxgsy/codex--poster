import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { aiGenerationTimeoutMessage } from "@/lib/api/generate-errors";
import { createAiProvider } from "@/lib/ai/provider";
import { findBackground, findLogo, findProductView, loadAssetConfig } from "@/lib/assets/load";
import { composePoster } from "@/lib/poster/compose";
import { parsePosterSize } from "@/lib/poster/size";

export const generateRequestSchema = z.object({
  doubaoApiKey: z.string().min(1),
  title: z.string().min(1).max(14),
  subtitle: z.string().min(1).max(20),
  posterSize: z.string().optional(),
  productId: z.string().min(1),
  viewId: z.string().min(1),
  backgroundId: z.string().min(1),
  logoId: z.string().min(1).optional(),
  showLogo: z.boolean(),
  showSalesInfo: z.boolean(),
  salesName: z.string().max(5).optional().default(""),
  salesPhone: z.string().max(12).optional().default(""),
  variationIndex: z.number().int().min(0).max(2).optional()
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export type GeneratedPoster = {
  id: string;
  image: string;
};

const posterVariationPrompts = [
  "Variation 1: clean teaching-building corner with a plain warm wall in the upper title-safe area; balanced medium shot, full cabin visible inside x=18% to 82% and y=36% to 84%, rear plane flush against wall, front open floor visible, soft contact shadow.",
  "Variation 2: corridor-window wall scene with softer diffused side light; keep the upper title-safe area calm and low contrast, no window frame or hard shadow crossing text area, full cabin visible inside x=18% to 82% and y=36% to 84%, rear plane parallel and flush against wall.",
  "Variation 3: slightly wider campus lounge or activity-room wall scene with more environmental context at the lower sides only; upper title-safe area remains simple blank wall, full cabin visible with no edge crop, no partial side panel, cabin inside x=18% to 82% and y=36% to 84%, front side faces open floor."
];

function writeGeneratedPoster(png: Buffer, index: number): string {
  const fileName = `poster-${Date.now()}-${randomUUID()}-${index + 1}.png`;
  const outputDir = path.join(process.cwd(), "data", "generated");
  const outputPath = path.join(outputDir, fileName);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, png);

  return `/api/generated/${fileName}`;
}

function getAiGenerationTimeoutMs(): number {
  const timeout = Number(process.env.AI_GENERATION_TIMEOUT_MS);

  return Number.isFinite(timeout) && timeout > 0 ? timeout : 60_000;
}

async function withAiGenerationTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(aiGenerationTimeoutMessage)), getAiGenerationTimeoutMs());
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function generatePosters(body: GenerateRequest): Promise<GeneratedPoster[]> {
  const config = loadAssetConfig();
  const { view } = findProductView(config, body.productId, body.viewId);
  const background = findBackground(config, body.backgroundId);
  const logo = body.showLogo ? findLogo(config, body.logoId ?? config.logos[0].id) : undefined;
  const outputSize = parsePosterSize(body.posterSize);

  if (!view.image) {
    throw new Error("Selected product view was not found.");
  }

  const provider = createAiProvider();
  const promptsToGenerate = typeof body.variationIndex === "number"
    ? [posterVariationPrompts[body.variationIndex]]
    : posterVariationPrompts;
  const posterStartIndex = body.variationIndex ?? 0;
  const posters: GeneratedPoster[] = [];

  for (const [index, variationPrompt] of promptsToGenerate.entries()) {
    const baseImage = await withAiGenerationTimeout(provider.generateBaseImage({
      apiKey: body.doubaoApiKey,
      productImagePath: view.image,
      backgroundImagePath: background.image,
      stylePrompt: background.stylePrompt,
      compositionPrompt: background.compositionPrompt,
      sceneType: background.sceneType,
      viewId: body.viewId,
      variationPrompt,
      outputSize
    }));

    const png = await composePoster({
      baseImage,
      title: body.title,
      subtitle: body.subtitle,
      viewId: body.viewId,
      showLogo: body.showLogo,
      logoImagePath: logo?.image,
      showSalesInfo: body.showSalesInfo,
      salesName: body.salesName,
      salesPhone: body.salesPhone,
      outputSize
    });

    posters.push({
      id: `poster-${posterStartIndex + index + 1}`,
      image: writeGeneratedPoster(png, posterStartIndex + index)
    });
  }

  return posters;
}
