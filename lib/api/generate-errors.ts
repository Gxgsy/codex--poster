import { ZodError } from "zod";

const invalidPasswordMessage = "Invalid access password.";
const missingOpenAiKeyMessage = "OPENAI_API_KEY is required when AI_PROVIDER=openai.";

const clientErrorMessages = new Set([
  "Selected product view was not found.",
  "Selected background was not found."
]);

const aiProviderErrorMessages = new Set([
  missingOpenAiKeyMessage,
  "OpenAI image response did not include image data."
]);

export type GenerateErrorResponse = {
  message: string;
  status: 400 | 401 | 500 | 502;
};

export class AiProviderGenerationError extends Error {
  constructor(public readonly cause: unknown) {
    super("AI image generation failed.");
    this.name = "AiProviderGenerationError";
  }
}

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

function classifyAiProviderError(error: unknown): GenerateErrorResponse {
  const message = getErrorMessage(error);

  return {
    message: message === missingOpenAiKeyMessage ? missingOpenAiKeyMessage : "AI image generation failed.",
    status: 502
  };
}

export function classifyGenerateError(error: unknown): GenerateErrorResponse {
  if (error instanceof ZodError) {
    return { message: "Invalid request.", status: 400 };
  }

  const message = getErrorMessage(error);

  if (message === invalidPasswordMessage) {
    return { message: invalidPasswordMessage, status: 401 };
  }

  if (message && clientErrorMessages.has(message)) {
    return { message, status: 400 };
  }

  if (error instanceof AiProviderGenerationError) {
    return classifyAiProviderError(error.cause);
  }

  if (message && aiProviderErrorMessages.has(message)) {
    return classifyAiProviderError(error);
  }

  return { message: "Poster generation failed.", status: 500 };
}
