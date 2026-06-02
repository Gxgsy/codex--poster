import { NextResponse } from "next/server";
import { getGenerateJob } from "@/lib/api/generate-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = getGenerateJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Generation job was not found." }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    posters: job.posters,
    error: job.error
  });
}
