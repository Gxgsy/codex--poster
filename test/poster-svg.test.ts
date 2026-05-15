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
    const titleText = svg.match(/<text font-size="92"[^>]*>(.*?)<\/text>/s)?.[1] ?? "";
    const titleLines = [...titleText.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g)].map((match) => match[1]);

    expect(titleLines.length).toBeGreaterThan(0);
    expect(titleLines.every((line) => Array.from(line).length <= 11)).toBe(true);
  });
});
