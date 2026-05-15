import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { composePoster } from "@/lib/poster/compose";

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

  it("creates a 1394 x 2700 PNG", async () => {
    const baseImage = await createBaseImage();

    const output = await composePoster({
      baseImage,
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showLogo: true,
      logoImagePath: "/assets/logo/logo.svg",
      showSalesInfo: true
    });

    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(1394);
    expect(metadata.height).toBe(2700);
    expect(metadata.format).toBe("png");
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
});
