import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import type { PosterOverlayInput } from "./types";

const defaultPosterFontFamily = "Noto Sans SC";

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

  for (let index = 0; index < chars.length; index += maxChars) {
    lines.push(chars.slice(index, index + maxChars).join(""));
  }

  return lines;
}

function textLines(lines: string[], x: number, y: number, lineHeight: number, fontSize: number): string {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}">${escapeXml(line)}</tspan>`)
    .join("");
}

function scaleTextLayout(lineCount: number, baseFontSize: number, baseLineHeight: number, nominalMaxLines: number) {
  if (lineCount <= nominalMaxLines) {
    return { fontSize: baseFontSize, lineHeight: baseLineHeight };
  }

  const scale = nominalMaxLines / lineCount;
  const fontSize = Math.max(34, Math.floor(baseFontSize * scale));
  const lineHeight = Math.max(44, Math.floor(baseLineHeight * scale));

  return { fontSize, lineHeight };
}

function getPosterFontFamily(): string {
  return process.env.POSTER_FONT_FAMILY?.trim() || defaultPosterFontFamily;
}

function getPosterFontFaceCss(fontFamily: string): string {
  const fontFile = process.env.POSTER_FONT_FILE?.trim();

  if (!fontFile) {
    return "";
  }

  const fontRoot = path.resolve(process.cwd(), "public", "fonts");
  const normalizedFontFile = fontFile.replace(/^public\/fonts\//, "");
  const resolvedPath = path.resolve(fontRoot, normalizedFontFile);
  const relativePath = path.relative(fontRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Configured poster font file must stay within public/fonts.");
  }

  if (!existsSync(resolvedPath)) {
    throw new Error("Configured poster font file was not found.");
  }

  const fontData = readFileSync(resolvedPath).toString("base64");
  const extension = path.extname(resolvedPath).toLowerCase();
  const mimeType = extension === ".otf" ? "font/otf" : "font/ttf";

  return `@font-face { font-family: "${fontFamily}"; src: url("data:${mimeType};base64,${fontData}") format("${extension === ".otf" ? "opentype" : "truetype"}"); }`;
}

export function buildPosterOverlaySvg(input: PosterOverlayInput): string {
  const titleLines = wrapText(input.title, posterLayout.title.maxChars, posterLayout.title.maxLines);
  const subtitleLines = wrapText(input.subtitle, posterLayout.subtitle.maxChars, posterLayout.subtitle.maxLines);
  const titleTextLayout = scaleTextLayout(
    titleLines.length,
    posterLayout.title.fontSize,
    posterLayout.title.lineHeight,
    posterLayout.title.maxLines
  );
  const subtitleTextLayout = scaleTextLayout(
    subtitleLines.length,
    posterLayout.subtitle.fontSize,
    posterLayout.subtitle.lineHeight,
    posterLayout.subtitle.maxLines
  );
  const posterFontFamily = getPosterFontFamily();
  const posterFontFaceCss = getPosterFontFaceCss(posterFontFamily);

  const sales = input.showSalesInfo
    ? `<g>
        <rect x="${posterLayout.sales.x}" y="${posterLayout.sales.y}" width="${posterLayout.sales.width}" height="${posterLayout.sales.height}" rx="24" fill="rgba(255,255,255,0.78)"/>
        <text x="${posterLayout.sales.x + 42}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">姓名：</text>
        <text x="${posterLayout.sales.x + 520}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">电话：</text>
      </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
    <style>
      ${posterFontFaceCss}
      text { font-family: "${posterFontFamily}", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif; }
    </style>
    <text font-weight="800" fill="#172033">${textLines(titleLines, posterLayout.title.x, posterLayout.title.y, titleTextLayout.lineHeight, titleTextLayout.fontSize)}</text>
    <text font-weight="500" fill="#405066">${textLines(subtitleLines, posterLayout.subtitle.x, posterLayout.subtitle.y, subtitleTextLayout.lineHeight, subtitleTextLayout.fontSize)}</text>
    ${sales}
  </svg>`;
}
