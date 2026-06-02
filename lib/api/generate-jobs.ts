import { randomUUID } from "node:crypto";
import { classifyGenerateError } from "@/lib/api/generate-errors";
import { generatePosters, type GenerateRequest, type GeneratedPoster } from "@/lib/api/generate-posters";

type GenerateJobStatus = "queued" | "running" | "success" | "error";

export type GenerateJobSnapshot = {
  id: string;
  status: GenerateJobStatus;
  posters: GeneratedPoster[];
  error?: string;
  createdAt: number;
  updatedAt: number;
};

const jobs = new Map<string, GenerateJobSnapshot>();
const jobTtlMs = 30 * 60 * 1000;

function cleanupJobs(): void {
  const expiresBefore = Date.now() - jobTtlMs;
  for (const [jobId, job] of jobs.entries()) {
    if (job.updatedAt < expiresBefore) {
      jobs.delete(jobId);
    }
  }
}

function updateJob(jobId: string, patch: Partial<Omit<GenerateJobSnapshot, "id" | "createdAt">>): void {
  const job = jobs.get(jobId);
  if (!job) {
    return;
  }

  jobs.set(jobId, {
    ...job,
    ...patch,
    updatedAt: Date.now()
  });
}

async function runGenerateJob(jobId: string, request: GenerateRequest): Promise<void> {
  updateJob(jobId, { status: "running" });
  const posters: GeneratedPoster[] = [];

  try {
    for (let variationIndex = 0; variationIndex < 3; variationIndex += 1) {
      const [poster] = await generatePosters({ ...request, variationIndex });
      if (poster) {
        posters.push(poster);
        updateJob(jobId, { posters: [...posters] });
      }
    }

    updateJob(jobId, { status: "success", posters });
  } catch (error) {
    const response = classifyGenerateError(error);
    console.error("[generate-job]", error instanceof Error ? `${error.name} ${error.message}` : error);
    updateJob(jobId, {
      status: "error",
      posters,
      error: response.message
    });
  }
}

export function startGenerateJob(request: GenerateRequest): GenerateJobSnapshot {
  cleanupJobs();

  const now = Date.now();
  const job: GenerateJobSnapshot = {
    id: randomUUID(),
    status: "queued",
    posters: [],
    createdAt: now,
    updatedAt: now
  };

  jobs.set(job.id, job);
  void runGenerateJob(job.id, request);

  return job;
}

export function getGenerateJob(jobId: string): GenerateJobSnapshot | undefined {
  cleanupJobs();

  return jobs.get(jobId);
}
