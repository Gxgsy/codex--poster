import sharp from "sharp";
import { buildPosterOverlaySvg } from "./svg";
import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import type { PosterOverlayInput } from "./types";

export type ComposePosterInput = PosterOverlayInput & {
  baseImage: Buffer;
  showLogo: boolean;
  logoImagePath: string;
};

export async function composePoster(input: ComposePosterInput): Promise<Buffer> {
  const base = await sharp(input.baseImage)
    .resize(POSTER_WIDTH, POSTER_HEIGHT, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  const overlay = Buffer.from(buildPosterOverlaySvg(input));
  const composites: sharp.OverlayOptions[] = [{ input: overlay, top: 0, left: 0 }];

  if (input.showLogo) {
    const logo = await sharp(process.cwd() + "/public" + input.logoImagePath)
      .resize(posterLayout.logo.width, posterLayout.logo.height, { fit: "contain" })
      .png()
      .toBuffer();

    composites.unshift({
      input: logo,
      top: posterLayout.logo.y,
      left: posterLayout.logo.x
    });
  }

  return sharp(base)
    .composite(composites)
    .png()
    .toBuffer();
}
