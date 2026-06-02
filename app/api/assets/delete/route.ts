import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { loadAssetConfig, saveAssetConfig } from "@/lib/assets/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deletePublicAsset(assetPath: string | undefined): void {
  if (!assetPath?.startsWith("/assets/")) {
    return;
  }

  const publicAssetsRoot = path.resolve(process.cwd(), "public", "assets");
  const resolvedPath = path.resolve(publicAssetsRoot, assetPath.slice("/assets/".length));
  const relativePath = path.relative(publicAssetsRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return;
  }

  if (existsSync(resolvedPath)) {
    unlinkSync(resolvedPath);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      kind?: string;
      backgroundId?: string;
      productId?: string;
      viewId?: string;
    };
    const config = loadAssetConfig();

    if (body.kind === "background") {
      const background = config.backgrounds.find((item) => item.id === body.backgroundId);

      if (!background) {
        return NextResponse.json({ error: "背景场景不存在。" }, { status: 404 });
      }

      deletePublicAsset(background.image);
      delete background.image;

      return NextResponse.json(saveAssetConfig(config));
    }

    if (body.kind === "product-view") {
      const product = config.products.find((item) => item.id === body.productId);
      const view = product?.views.find((item) => item.id === body.viewId);

      if (!view) {
        return NextResponse.json({ error: "产品视角不存在。" }, { status: 404 });
      }

      deletePublicAsset(view.image);
      delete view.image;

      return NextResponse.json(saveAssetConfig(config));
    }

    return NextResponse.json({ error: "不支持的素材类型。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "素材删除失败。" },
      { status: 500 }
    );
  }
}
