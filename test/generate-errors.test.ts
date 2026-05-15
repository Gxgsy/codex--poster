import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AiProviderGenerationError, classifyGenerateError } from "@/lib/api/generate-errors";

describe("generate API error classification", () => {
  it("keeps invalid password failures as 401", () => {
    expect(classifyGenerateError(new Error("Invalid access password."))).toEqual({
      message: "Invalid access password.",
      status: 401
    });
  });

  it("returns 400 for malformed request schema errors", () => {
    const schema = z.object({ title: z.string().min(1) });

    expect(classifyGenerateError(schema.safeParse({ title: "" }).error)).toEqual({
      message: "Invalid request.",
      status: 400
    });
  });

  it("returns 400 for unknown product and background selections", () => {
    expect(classifyGenerateError(new Error("Selected product view was not found."))).toEqual({
      message: "Selected product view was not found.",
      status: 400
    });
    expect(classifyGenerateError(new Error("Selected background was not found."))).toEqual({
      message: "Selected background was not found.",
      status: 400
    });
  });

  it("returns 502 for OpenAI API key failures with the internal MVP message", () => {
    expect(classifyGenerateError(
      new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.")
    )).toEqual({
      message: "OPENAI_API_KEY is required when AI_PROVIDER=openai.",
      status: 502
    });
  });

  it("returns 502 for AI provider failures with sanitized messages", () => {
    expect(classifyGenerateError(
      new Error("AI image generation timed out.")
    )).toEqual({
      message: "AI image generation timed out.",
      status: 502
    });
    expect(classifyGenerateError(
      new Error("OpenAI image response did not include image data.")
    )).toEqual({
      message: "AI image generation failed.",
      status: 502
    });
    expect(classifyGenerateError(
      new AiProviderGenerationError(new Error("raw provider SDK failure"))
    )).toEqual({
      message: "AI image generation failed.",
      status: 502
    });
  });

  it("returns 500 for generic internal failures with sanitized messages", () => {
    expect(classifyGenerateError(new Error("raw filesystem failure"))).toEqual({
      message: "Poster generation failed.",
      status: 500
    });
  });
});
