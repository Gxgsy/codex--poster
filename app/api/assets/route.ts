import { NextResponse } from "next/server";
import { loadAssetConfig } from "@/lib/assets/load";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json(loadAssetConfig());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset config could not be loaded." },
      { status: 500 },
    );
  }
}
