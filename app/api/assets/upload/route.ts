import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { loadAssetConfig, saveAssetConfig } from "@/lib/assets/load";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function safeFileName(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "asset";

  if (!allowedExtensions.has(extension)) {
    throw new Error("只支持 PNG、JPG、JPEG、WEBP 图片。");
  }

  return `${Date.now()}-${baseName}${extension}`;
}

async function saveUploadedFile(file: File, folder: "backgrounds" | "products/cabin"): Promise<string> {
  const fileName = safeFileName(file.name);
  const relativeAssetPath = `/assets/${folder}/${fileName}`;
  const outputDir = path.resolve(process.cwd(), "public", "assets", folder);
  const outputPath = path.resolve(outputDir, fileName);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, Buffer.from(await file.arrayBuffer()));

  return relativeAssetPath;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const kind = String(formData.get("kind") ?? "");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请先选择图片文件。" }, { status: 400 });
    }

    const config = loadAssetConfig();

    if (kind === "background") {
      const backgroundId = String(formData.get("backgroundId") ?? "");
      const background = config.backgrounds.find((item) => item.id === backgroundId);

      if (!background) {
        return NextResponse.json({ error: "背景场景不存在。" }, { status: 404 });
      }

      background.image = await saveUploadedFile(file, "backgrounds");

      return NextResponse.json(saveAssetConfig(config));
    }

    if (kind === "product-view") {
      const productId = String(formData.get("productId") ?? "");
      const viewId = String(formData.get("viewId") ?? "");
      const product = config.products.find((item) => item.id === productId);
      const view = product?.views.find((item) => item.id === viewId);

      if (!view) {
        return NextResponse.json({ error: "产品视角不存在。" }, { status: 404 });
      }

      view.image = await saveUploadedFile(file, "products/cabin");

      return NextResponse.json(saveAssetConfig(config));
    }

    return NextResponse.json({ error: "不支持的素材类型。" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "素材上传失败。" },
      { status: 500 }
    );
  }
}
