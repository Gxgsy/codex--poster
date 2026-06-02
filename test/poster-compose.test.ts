import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { composePoster, getOverlayTextColors, preparePosterLogo } from "@/lib/poster/compose";

describe("composePoster", () => {
  async function createBaseImage(): Promise<Buffer> {
    return sharp({
      create: {
        width: 1394,
        height: 2700,
        channels: 4,
        background: "#f2eadf"
      }
    }).png().toBuffer();
  }

  it("creates a PNG at the requested output size", async () => {
    const baseImage = await createBaseImage();

    const output = await composePoster({
      baseImage,
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showLogo: true,
      logoImagePath: "/assets/logo/LOGO横版-心大陆（全彩）.png",
      showSalesInfo: true,
      outputSize: { width: 1080, height: 1920 }
    });

    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1920);
    expect(metadata.format).toBe("png");
  });

  it("fits the full poster into custom output sizes and fills the remaining canvas", async () => {
    const baseImage = await createBaseImage();

    const output = await composePoster({
      baseImage,
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showLogo: false,
      showSalesInfo: true,
      outputSize: { width: 1080, height: 1920 }
    });
    const { data, info } = await sharp(output)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const topLeftAlpha = data[3];
    const topRightAlpha = data[((info.width - 1) * info.channels) + 3];
    const bottomLeftAlpha = data[((info.height - 1) * info.width * info.channels) + 3];
    const bottomRightAlpha = data[(((info.height - 1) * info.width + info.width - 1) * info.channels) + 3];

    expect(topLeftAlpha).toBe(255);
    expect(topRightAlpha).toBe(255);
    expect(bottomLeftAlpha).toBe(255);
    expect(bottomRightAlpha).toBe(255);
  });

  it("rejects logo paths that traverse outside public assets", async () => {
    const baseImage = await createBaseImage();

    await expect(composePoster({
      baseImage,
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showLogo: true,
      logoImagePath: "/assets/../../package.json",
      showSalesInfo: true
    })).rejects.toThrow("Invalid logo image path");
  });

  it("trims transparent logo canvas before resizing", async () => {
    const logo = await preparePosterLogo("/assets/logo/LOGO横版-心大陆（全彩）.png");
    const { data, info } = await sharp(logo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    function columnHasBlackLinePixels(x: number) {
      for (let y = 0; y < info.height; y += 1) {
        const index = (y * info.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];

        if (alpha > 220 && r < 8 && g < 8 && b < 8) {
          return true;
        }
      }

      return false;
    }

    expect(columnHasBlackLinePixels(0)).toBe(false);
    expect(columnHasBlackLinePixels(info.width - 1)).toBe(false);
  });

  it("chooses overlay colors from the current title area brightness", async () => {
    const darkBase = await sharp({
      create: { width: 1394, height: 2700, channels: 4, background: "#111827" }
    }).png().toBuffer();
    const lightBase = await sharp({
      create: { width: 1394, height: 2700, channels: 4, background: "#f8fafc" }
    }).png().toBuffer();

    await expect(getOverlayTextColors(darkBase)).resolves.toMatchObject({
      title: "#FFFFFF",
      subtitle: "#F3EFE8",
      shadow: "rgba(0,0,0,0.34)"
    });
    await expect(getOverlayTextColors(lightBase)).resolves.toMatchObject({ title: "#2C241E" });
  });
});
