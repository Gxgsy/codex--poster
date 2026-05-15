import type { GenerateBaseImageInput } from "./provider";

export async function generateOpenAiBaseImage(
  _input: GenerateBaseImageInput
): Promise<Buffer> {
  throw new Error("OpenAI image provider is not implemented yet.");
}
