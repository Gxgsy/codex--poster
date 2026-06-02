import { NextResponse } from "next/server";
import { classifyGenerateError } from "@/lib/api/generate-errors";
import { startGenerateJob } from "@/lib/api/generate-jobs";
import { generateRequestSchema } from "@/lib/api/generate-posters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = generateRequestSchema.omit({ variationIndex: true }).parse(await request.json());
    const job = startGenerateJob(body);

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      posters: job.posters
    });
  } catch (error) {
    const response = classifyGenerateError(error);

    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
