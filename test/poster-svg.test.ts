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
});
