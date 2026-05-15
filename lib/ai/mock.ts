import path from "node:path";
import sharp from "sharp";
import type { GenerateBaseImageInput } from "./provider";

function resolveProductAssetPath(assetPath: string): string {
  if (!assetPath.startsWith("/assets/")) {
    throw new Error("Invalid product image path: expected a path under /assets/");
  }

  const publicAssetsRoot = path.resolve(process.cwd(), "public", "assets");
  const resolvedPath = path.resolve(publicAssetsRoot, assetPath.slice("/assets/".length));
  const relativePath = path.relative(publicAssetsRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid product image path: path must stay within /assets/");
  }

  return resolvedPath;
}

export async function generateMockBaseImage(input: GenerateBaseImageInput): Promise<Buffer> {
  const cabin = await sharp(resolveProductAssetPath(input.productImagePath))
    .resize(540, 810, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const sceneSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1394" height="2700">
    <rect width="1394" height="930" fill="#f6efe4"/>
    <rect y="930" width="1394" height="1770" fill="#ded2c0"/>
    <rect x="140" y="900" width="1114" height="56" fill="#cdb99f"/>
    <text x="96" y="1200" font-family="Arial" font-size="38" fill="#8a7660">Premium warm ${input.sceneType}</text>
  </svg>`);

  return sharp({
    create: {
      width: 1394,
      height: 2700,
      channels: 4,
      background: "#efe7dc"
    }
  })
    .composite([
      {
        input: sceneSvg,
        top: 0,
        left: 0
      },
      { input: cabin, top: 1120, left: 430 }
    ])
    .png()
    .toBuffer();
}
