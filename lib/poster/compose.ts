import path from "node:path";
import sharp from "sharp";
import { buildPosterOverlaySvg } from "./svg";
import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import { defaultPosterSize, type PosterSize } from "./size";
import type { PosterOverlayInput, PosterTextAlign } from "./types";

export type ComposePosterInput = PosterOverlayInput & {
  baseImage: Buffer;
  showLogo: boolean;
  logoImagePath?: string;
  outputSize?: PosterSize;
};

function resolvePublicAssetPath(assetPath: string): string {
  if (!assetPath.startsWith("/assets/")) {
    throw new Error("Invalid logo image path: expected a path under /assets/");
  }

  const publicAssetsRoot = path.resolve(process.cwd(), "public", "assets");
  const resolvedPath = path.resolve(publicAssetsRoot, assetPath.slice("/assets/".length));
  const relativePath = path.relative(publicAssetsRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid logo image path: path must stay within /assets/");
  }

  return resolvedPath;
}

export async function preparePosterLogo(assetPath: string): Promise<Buffer> {
  return sharp(resolvePublicAssetPath(assetPath))
    .ensureAlpha()
    .trim({ threshold: 10 })
    .resize(posterLayout.logo.width, posterLayout.logo.height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}

function getPosterTextAlign(viewId?: string): PosterTextAlign {
  if (viewId === "front") {
    return "center";
  }

  if (viewId === "right") {
    return "right";
  }

  return "left";
}

function getAlignedLogoX(viewId?: string): number {
  const align = getPosterTextAlign(viewId);

  if (align === "center") {
    return Math.round((POSTER_WIDTH - posterLayout.logo.width) / 2);
  }

  if (align === "right") {
    return POSTER_WIDTH - posterLayout.logo.x - posterLayout.logo.width;
  }

  return posterLayout.logo.x;
}

export async function getOverlayTextColors(baseImage: Buffer) {
  const sampleTop = Math.max(0, posterLayout.title.y - 70);
  const sampleHeight = Math.min(360, POSTER_HEIGHT - sampleTop);
  const { data, info } = await sharp(baseImage)
    .resize(POSTER_WIDTH, POSTER_HEIGHT, { fit: "cover", position: "center" })
    .extract({ left: 80, top: sampleTop, width: POSTER_WIDTH - 160, height: sampleHeight })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let luminance = 0;
  const pixels = info.width * info.height;

  for (let index = 0; index < data.length; index += info.channels) {
    luminance += 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
  }

  const averageLuminance = luminance / pixels;

  if (averageLuminance < 118) {
    return {
      title: "#FFFFFF",
      subtitle: "#F3EFE8",
      shadow: "rgba(0,0,0,0.34)"
    };
  }

  return {
    title: "#2C241E",
    subtitle: "#4D4035",
    shadow: "rgba(44,36,30,0.18)"
  };
}

export async function composePoster(input: ComposePosterInput): Promise<Buffer> {
  const outputSize = input.outputSize ?? defaultPosterSize;
  const base = await sharp(input.baseImage)
    .resize(outputSize.width, outputSize.height, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  const textColors = await getOverlayTextColors(base);
  const overlay = Buffer.from(buildPosterOverlaySvg({
    ...input,
    titleColor: textColors.title,
    subtitleColor: textColors.subtitle,
    textShadowColor: textColors.shadow
  }));
  const overlayComposites: sharp.OverlayOptions[] = [{ input: overlay, top: 0, left: 0 }];

  if (input.showLogo && input.logoImagePath) {
    const logo = await preparePosterLogo(input.logoImagePath);

    overlayComposites.unshift({
      input: logo,
      top: posterLayout.logo.y,
      left: getAlignedLogoX(input.viewId)
    });
  }

  const overlayLayer = await sharp({
    create: {
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(overlayComposites)
    .png()
    .toBuffer();
  const scaledOverlay = await sharp(overlayLayer)
    .resize(outputSize.width, outputSize.height, {
      fit: "fill"
    })
    .png()
    .toBuffer();

  return sharp(base)
    .composite([{ input: scaledOverlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}
