import { describe, expect, it } from "vitest";
import { posterLayout } from "@/lib/poster/layout";
import { wrapText, buildPosterOverlaySvg, getTitleTypography } from "@/lib/poster/svg";

describe("wrapText", () => {
  it("wraps long Chinese text into bounded lines", () => {
    const lines = wrapText("高级温馨校园智慧空间解决方案", 8, 3);
    expect(lines).toEqual(["高级温馨校园智慧", "空间解决方案"]);
  });

  it("does not leave Chinese punctuation alone on a new line", () => {
    const lines = wrapText("标题文字。", 4, 3);
    expect(lines).toEqual(["标题文字。"]);
  });
});

describe("buildPosterOverlaySvg", () => {
  it("places title text lower while keeping subtitle close to the title", () => {
    const titleToSubtitleDistance = posterLayout.subtitle.y - posterLayout.title.y;
    const safeMargin = Math.ceil(1394 * 0.08) + 10;

    expect(posterLayout.title.y).toBeGreaterThanOrEqual(530);
    expect(titleToSubtitleDistance).toBeLessThanOrEqual(130);
    expect(posterLayout.subtitle.fontSize).toBe(posterLayout.title.fontSize / 2);
    expect(posterLayout.subtitle.maxChars).toBeLessThan(24);
    expect(posterLayout.title.x).toBeGreaterThanOrEqual(safeMargin);
    expect(posterLayout.subtitle.x).toBeGreaterThanOrEqual(safeMargin);
    expect(posterLayout.title.x + posterLayout.title.width).toBeLessThanOrEqual(1394 - safeMargin);
    expect(posterLayout.subtitle.x + posterLayout.subtitle.width).toBeLessThanOrEqual(1394 - safeMargin);
  });

  it("keeps the main title on one line and shrinks it to fit the safe width", () => {
    expect(getTitleTypography("智慧校园").fontSize).toBe(160);
    expect(getTitleTypography("高级温馨校园智慧空间解决方案适合学生学习休息").fontSize).toBeLessThan(96);

    const title = "高级温馨校园智慧空间解决方案适合学生学习休息";
    const svg = buildPosterOverlaySvg({
      title,
      subtitle: "高级温馨的学习休息场景可以自动换行",
      showSalesInfo: false
    });
    const titleText = svg.match(/<text font-weight="800"[^>]*>(.*?)<\/text>/s)?.[1] ?? "";
    const titleLines = [...titleText.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map((match) => match[1]);

    expect(titleLines).toEqual([title]);
  });

  it("aligns logo-area text according to the selected product view", () => {
    const leftSvg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: false,
      viewId: "left"
    });
    const frontSvg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: false,
      viewId: "front"
    });
    const rightSvg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: false,
      viewId: "right"
    });

    expect(leftSvg).toContain('text-anchor="start"');
    expect(frontSvg).toContain('text-anchor="middle"');
    expect(rightSvg).toContain('text-anchor="end"');
  });

  it("includes accurate poster and sales text", () => {
    const svg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: true,
      salesName: "张三",
      salesPhone: "13800138000"
    });

    expect(svg).toContain("智慧校园空间");
    expect(svg).toContain("高级温馨的学习休息场景");
    expect(svg).toContain("姓名：张三");
    expect(svg).toContain("电话：13800138000");
    expect(svg).toContain("1394");
    expect(svg).toContain("2700");
  });

  it("limits sales contact text inside the overlay renderer", () => {
    const svg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: true,
      salesName: "张三李四王五",
      salesPhone: "1234567890123"
    });

    expect(svg).toContain("姓名：张三李四王");
    expect(svg).toContain("电话：123456789012");
    expect(svg).not.toContain("张三李四王五");
    expect(svg).not.toContain("1234567890123");
  });

  it("renders default warm dark title colors with no white stroke", () => {
    const svg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: false
    });

    expect(svg).toContain('fill="#2C241E"');
    expect(svg).toContain('fill="#4D4035"');
    expect(svg).not.toContain('paint-order="stroke"');
    expect(svg).not.toContain('stroke-width="5"');
  });

  it("allows caller-selected light title colors without adding a stroke", () => {
    const svg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: false,
      titleColor: "#FFFFFF",
      subtitleColor: "#F3EFE8"
    });

    expect(svg).toContain('fill="#FFFFFF"');
    expect(svg).toContain('fill="#F3EFE8"');
    expect(svg).not.toContain('paint-order="stroke"');
    expect(svg).not.toContain('stroke-width="5"');
  });

  it("escapes XML entities in title and subtitle text", () => {
    const svg = buildPosterOverlaySvg({
      title: `智慧&空间<标题>"'`,
      subtitle: `温馨&高级<副标题>"'`,
      showSalesInfo: false
    });

    const renderedText = [...svg.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)]
      .map((match) => match[1])
      .join("");

    expect(renderedText).toContain("智慧&amp;空间&lt;标题&gt;&quot;&apos;");
    expect(svg).toContain("温馨&amp;高级&lt;副标题&gt;&quot;&apos;");
    expect(svg).not.toContain(`智慧&空间<标题>"'`);
    expect(svg).not.toContain(`温馨&高级<副标题>"'`);
  });

  it("allows subtitle text to wrap while keeping the title unwrapped", () => {
    const svg = buildPosterOverlaySvg({
      title: "高级温馨校园智慧空间解决方案",
      subtitle: "打造温暖明亮的共享校园空间支持阅读讨论休息展示活动与日常陪伴服务",
      showSalesInfo: false
    });
    const titleText = svg.match(/<text font-weight="800"[^>]*>(.*?)<\/text>/s)?.[1] ?? "";
    const titleLines = [...titleText.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map((match) => match[1]);
    const subtitleText = svg.match(/<text font-weight="500"[^>]*>(.*?)<\/text>/s)?.[1] ?? "";
    const subtitleLines = [...subtitleText.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map((match) => match[1]);

    expect(titleLines).toEqual(["高级温馨校园智慧空间解决方案"]);
    expect(subtitleLines.length).toBeGreaterThan(1);
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

  it("includes separate configured title and subtitle font families in overlay styles", () => {
    const originalTitleFontFamily = process.env.POSTER_TITLE_FONT_FAMILY;
    const originalSubtitleFontFamily = process.env.POSTER_SUBTITLE_FONT_FAMILY;
    process.env.POSTER_TITLE_FONT_FAMILY = "Poster Heavy";
    process.env.POSTER_SUBTITLE_FONT_FAMILY = "Poster Medium";

    try {
      const svg = buildPosterOverlaySvg({
        title: "智慧校园空间",
        subtitle: "高级温馨的学习休息场景",
        showSalesInfo: false
      });

      expect(svg).toContain('font-family: "Poster Heavy"');
      expect(svg).toContain('font-family: "Poster Medium"');
    } finally {
      if (originalTitleFontFamily === undefined) {
        delete process.env.POSTER_TITLE_FONT_FAMILY;
      } else {
        process.env.POSTER_TITLE_FONT_FAMILY = originalTitleFontFamily;
      }

      if (originalSubtitleFontFamily === undefined) {
        delete process.env.POSTER_SUBTITLE_FONT_FAMILY;
      } else {
        process.env.POSTER_SUBTITLE_FONT_FAMILY = originalSubtitleFontFamily;
      }
    }
  });

  it("embeds configured local title and subtitle font files when provided", () => {
    const originalTitleFontFamily = process.env.POSTER_TITLE_FONT_FAMILY;
    const originalTitleFontFile = process.env.POSTER_TITLE_FONT_FILE;
    const originalSubtitleFontFamily = process.env.POSTER_SUBTITLE_FONT_FAMILY;
    const originalSubtitleFontFile = process.env.POSTER_SUBTITLE_FONT_FILE;
    process.env.POSTER_TITLE_FONT_FAMILY = "Poster Heavy";
    process.env.POSTER_TITLE_FONT_FILE = "AlibabaPuHuiTi-3-105-Heavy.otf";
    process.env.POSTER_SUBTITLE_FONT_FAMILY = "Poster Medium";
    process.env.POSTER_SUBTITLE_FONT_FILE = "AlibabaPuHuiTi-3-65-Medium.otf";

    try {
      const svg = buildPosterOverlaySvg({
        title: "智慧校园空间",
        subtitle: "高级温馨的学习休息场景",
        showSalesInfo: false
      });

      expect(svg).toContain('@font-face { font-family: "Poster Heavy"');
      expect(svg).toContain('@font-face { font-family: "Poster Medium"');
      expect(svg).toContain("data:font/otf;base64,");
    } finally {
      if (originalTitleFontFamily === undefined) {
        delete process.env.POSTER_TITLE_FONT_FAMILY;
      } else {
        process.env.POSTER_TITLE_FONT_FAMILY = originalTitleFontFamily;
      }

      if (originalTitleFontFile === undefined) {
        delete process.env.POSTER_TITLE_FONT_FILE;
      } else {
        process.env.POSTER_TITLE_FONT_FILE = originalTitleFontFile;
      }

      if (originalSubtitleFontFamily === undefined) {
        delete process.env.POSTER_SUBTITLE_FONT_FAMILY;
      } else {
        process.env.POSTER_SUBTITLE_FONT_FAMILY = originalSubtitleFontFamily;
      }

      if (originalSubtitleFontFile === undefined) {
        delete process.env.POSTER_SUBTITLE_FONT_FILE;
      } else {
        process.env.POSTER_SUBTITLE_FONT_FILE = originalSubtitleFontFile;
      }
    }
  });

  it("fails fast in production when title or subtitle font files are not configured", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalTitleFontFile = process.env.POSTER_TITLE_FONT_FILE;
    const originalSubtitleFontFile = process.env.POSTER_SUBTITLE_FONT_FILE;
    process.env.NODE_ENV = "production";
    delete process.env.POSTER_TITLE_FONT_FILE;
    delete process.env.POSTER_SUBTITLE_FONT_FILE;

    try {
      expect(() => buildPosterOverlaySvg({
        title: "智慧校园空间",
        subtitle: "高级温馨的学习休息场景",
        showSalesInfo: false
      })).toThrow("POSTER_TITLE_FONT_FILE is required for production poster rendering.");
    } finally {
      process.env.NODE_ENV = originalNodeEnv;

      if (originalTitleFontFile === undefined) {
        delete process.env.POSTER_TITLE_FONT_FILE;
      } else {
        process.env.POSTER_TITLE_FONT_FILE = originalTitleFontFile;
      }

      if (originalSubtitleFontFile === undefined) {
        delete process.env.POSTER_SUBTITLE_FONT_FILE;
      } else {
        process.env.POSTER_SUBTITLE_FONT_FILE = originalSubtitleFontFile;
      }
    }
  });
});
