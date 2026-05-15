import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import type { PosterOverlayInput } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const chars = Array.from(text.trim());
  const lines: string[] = [];

  for (let index = 0; index < chars.length && lines.length < maxLines; index += maxChars) {
    lines.push(chars.slice(index, index + maxChars).join(""));
  }

  return lines;
}

function textLines(lines: string[], x: number, y: number, lineHeight: number): string {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
}

export function buildPosterOverlaySvg(input: PosterOverlayInput): string {
  const titleLines = wrapText(input.title, posterLayout.title.maxChars, posterLayout.title.maxLines);
  const subtitleLines = wrapText(input.subtitle, posterLayout.subtitle.maxChars, posterLayout.subtitle.maxLines);

  const sales = input.showSalesInfo
    ? `<g>
        <rect x="${posterLayout.sales.x}" y="${posterLayout.sales.y}" width="${posterLayout.sales.width}" height="${posterLayout.sales.height}" rx="24" fill="rgba(255,255,255,0.78)"/>
        <text x="${posterLayout.sales.x + 42}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">姓名：</text>
        <text x="${posterLayout.sales.x + 520}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">电话：</text>
      </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
    <style>
      text { font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif; }
    </style>
    <text font-size="${posterLayout.title.fontSize}" font-weight="800" fill="#172033">${textLines(titleLines, posterLayout.title.x, posterLayout.title.y, posterLayout.title.lineHeight)}</text>
    <text font-size="${posterLayout.subtitle.fontSize}" font-weight="500" fill="#405066">${textLines(subtitleLines, posterLayout.subtitle.x, posterLayout.subtitle.y, posterLayout.subtitle.lineHeight)}</text>
    ${sales}
  </svg>`;
}
