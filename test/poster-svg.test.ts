import { describe, expect, it } from "vitest";
import { wrapText, buildPosterOverlaySvg } from "@/lib/poster/svg";

describe("wrapText", () => {
  it("wraps long Chinese text into bounded lines", () => {
    const lines = wrapText("高级温馨校园智慧空间解决方案", 8, 3);
    expect(lines).toEqual(["高级温馨校园智慧", "空间解决方案"]);
  });
});

describe("buildPosterOverlaySvg", () => {
  it("includes accurate poster and sales text", () => {
    const svg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: true
    });

    expect(svg).toContain("智慧校园空间");
    expect(svg).toContain("高级温馨的学习休息场景");
    expect(svg).toContain("姓名：");
    expect(svg).toContain("电话：");
    expect(svg).toContain("1394");
    expect(svg).toContain("2700");
  });

  it("escapes XML entities in title and subtitle text", () => {
    const svg = buildPosterOverlaySvg({
      title: `智慧&空间<标题>"'`,
      subtitle: `温馨&高级<副标题>"'`,
      showSalesInfo: false
    });

    expect(svg).toContain("智慧&amp;空间&lt;标题&gt;&quot;&apos;");
    expect(svg).toContain("温馨&amp;高级&lt;副标题&gt;&quot;&apos;");
    expect(svg).not.toContain(`智慧&空间<标题>"'`);
    expect(svg).not.toContain(`温馨&高级<副标题>"'`);
  });

  it("keeps Chinese title tspans within 11 characters", () => {
    const svg = buildPosterOverlaySvg({
      title: "高级温馨校园智慧空间解决方案",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: false
    });
    const titleText = svg.match(/<text font-weight="800"[^>]*>(.*?)<\/text>/s)?.[1] ?? "";
    const titleLines = [...titleText.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map((match) => match[1]);

    expect(titleLines.length).toBeGreaterThan(0);
    expect(titleLines.every((line) => Array.from(line).length <= 11)).toBe(true);
  });

  it("preserves full long title and subtitle text in the SVG output", () => {
    const title = "高级温馨校园智慧空间解决方案适合学生学习休息交流成长";
    const subtitle = "打造温暖明亮的共享校园空间支持阅读讨论休息展示活动与日常陪伴服务";
    const svg = buildPosterOverlaySvg({
      title,
      subtitle,
      showSalesInfo: false
    });

    const renderedText = [...svg.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)]
      .map((match) => match[1])
      .join("");

    expect(renderedText).toContain(title);
    expect(renderedText).toContain(subtitle);
  });

  it("includes the configured poster font family in overlay styles", () => {
    const originalFontFamily = process.env.POSTER_FONT_FAMILY;
    process.env.POSTER_FONT_FAMILY = "Noto Sans SC";

    try {
      const svg = buildPosterOverlaySvg({
        title: "智慧校园空间",
        subtitle: "高级温馨的学习休息场景",
        showSalesInfo: false
      });

      expect(svg).toContain(`font-family: "Noto Sans SC"`);
    } finally {
      if (originalFontFamily === undefined) {
        delete process.env.POSTER_FONT_FAMILY;
      } else {
        process.env.POSTER_FONT_FAMILY = originalFontFamily;
      }
    }
  });

  it("embeds a configured local poster font file when provided", () => {
    const originalFontFamily = process.env.POSTER_FONT_FAMILY;
    const originalFontFile = process.env.POSTER_FONT_FILE;
    process.env.POSTER_FONT_FAMILY = "Poster Test Font";
    process.env.POSTER_FONT_FILE = "test-font.ttf";

    try {
      const svg = buildPosterOverlaySvg({
        title: "智慧校园空间",
        subtitle: "高级温馨的学习休息场景",
        showSalesInfo: false
      });

      expect(svg).toContain('@font-face { font-family: "Poster Test Font"');
      expect(svg).toContain("data:font/ttf;base64,");
    } finally {
      if (originalFontFamily === undefined) {
        delete process.env.POSTER_FONT_FAMILY;
      } else {
        process.env.POSTER_FONT_FAMILY = originalFontFamily;
      }

      if (originalFontFile === undefined) {
        delete process.env.POSTER_FONT_FILE;
      } else {
        process.env.POSTER_FONT_FILE = originalFontFile;
      }
    }
  });
});
