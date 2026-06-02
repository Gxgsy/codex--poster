import { NextResponse } from "next/server";
import { AiProviderGenerationError, classifyGenerateError } from "@/lib/api/generate-errors";
import { generatePosters, generateRequestSchema } from "@/lib/api/generate-posters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logGenerateError(error: unknown): void {
  const errorLike = error instanceof AiProviderGenerationError ? error.cause : error;
  if (errorLike instanceof Error) {
    console.error("[generate]", errorLike.name, errorLike.message);
    return;
  }

  console.error("[generate]", errorLike);
}

export async function POST(request: Request) {
  try {
    const body = generateRequestSchema.parse(await request.json());
    const posters = await generatePosters(body);

    return NextResponse.json({ posters });
  } catch (error) {
    logGenerateError(error);
    const response = classifyGenerateError(error);

    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
