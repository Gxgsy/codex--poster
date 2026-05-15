import { generateMockBaseImage } from "./mock";

export type GenerateBaseImageInput = {
  productImagePath: string;
  backgroundImagePath: string;
  stylePrompt: string;
  compositionPrompt: string;
  sceneType: string;
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
