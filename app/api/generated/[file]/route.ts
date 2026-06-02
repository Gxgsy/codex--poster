import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ file: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { file } = await context.params;

  if (!/^poster-[a-zA-Z0-9._-]+\.png$/.test(file)) {
    return NextResponse.json({ error: "Invalid generated image path." }, { status: 400 });
  }

  try {
    const image = await readFile(path.join(process.cwd(), "data", "generated", file));

    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Generated image was not found." }, { status: 404 });
  }
}
