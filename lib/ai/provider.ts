import { generateMockBaseImage } from "./mock";
import type { PosterSize } from "@/lib/poster/size";

export type GenerateBaseImageInput = {
  apiKey?: string;
  productImagePath: string;
  backgroundImagePath?: string;
  stylePrompt: string;
  compositionPrompt: string;
  sceneType: string;
  viewId?: string;
  variationPrompt?: string;
  outputSize?: PosterSize;
};

export type AiImageProvider = {
  generateBaseImage(input: GenerateBaseImageInput): Promise<Buffer>;
};

export function createAiProvider(): AiImageProvider {
  if (process.env.AI_PROVIDER === "openai") {
    return {
      async generateBaseImage(input) {
        const { generateOpenAiBaseImage } = await import("./openai" as string) as {
          generateOpenAiBaseImage(input: GenerateBaseImageInput): Promise<Buffer>;
        };
        return generateOpenAiBaseImage(input);
      }
    };
  }

  return {
    generateBaseImage: generateMockBaseImage
  };
}
