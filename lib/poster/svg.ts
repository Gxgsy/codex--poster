import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import type { PosterOverlayInput, PosterTextAlign } from "./types";

const defaultPosterFontFamily = "Noto Sans SC";
const lineStartPunctuation = new Set(["。", "，", "、", "；", "：", "！", "？", "）", "】", "》", "」", "』", ".", ",", ";", ":", "!", "?"]);

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

  for (let index = 1; index < lines.length; index += 1) {
    const firstChar = Array.from(lines[index])[0];
    if (firstChar && lineStartPunctuation.has(firstChar)) {
      lines[index - 1] += firstChar;
      lines[index] = Array.from(lines[index]).slice(1).join("");
    }
  }

  for (let index = lines.length - 1; index > 0; index -= 1) {
    if (!lines[index]) {
      lines.splice(index, 1);
    }
  }

  return lines;
}

function textLines(lines: string[], x: number, y: number, lineHeight: number, fontSize: number): string {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}">${escapeXml(line)}</tspan>`)
    .join("");
}

function limitText(value: string | undefined, maxChars: number): string {
  return Array.from(value?.trim() ?? "").slice(0, maxChars).join("");
}

export function getPosterTextAlign(viewId?: string): PosterTextAlign {
  if (viewId === "front") {
    return "center";
  }

  if (viewId === "right") {
    return "right";
  }

  return "left";
}

function getTextAnchor(align: PosterTextAlign): "start" | "middle" | "end" {
  if (align === "center") {
    return "middle";
  }

  if (align === "right") {
    return "end";
  }

  return "start";
}

function getAlignedTextX(align: PosterTextAlign): number {
  if (align === "center") {
    return POSTER_WIDTH / 2;
  }

  if (align === "right") {
    return POSTER_WIDTH - posterLayout.title.x;
  }

  return posterLayout.title.x;
}

export function getTitleTypography(title: string) {
  const length = Array.from(title.trim()).length;
  const estimatedFitSize = Math.floor(posterLayout.title.width / Math.max(1, length * 0.92));
  const fontSize = Math.max(56, Math.min(160, estimatedFitSize));
  const maxChars = Number.MAX_SAFE_INTEGER;

  return {
    fontSize,
    lineHeight: Math.round(fontSize * 1.12),
    maxChars
  };
}

function getPosterFontFamily(envName: string): string {
  return process.env[envName]?.trim() || process.env.POSTER_FONT_FAMILY?.trim() || defaultPosterFontFamily;
}

function getPosterFontFaceCss(fontFamily: string, envName: string): string {
  const fontFile = process.env[envName]?.trim() || process.env.POSTER_FONT_FILE?.trim();

  if (!fontFile) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${envName} is required for production poster rendering.`);
    }

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
  const titleTextLayout = getTitleTypography(input.title);
  const subtitleFontSize = Math.round(titleTextLayout.fontSize / 2);
  const subtitleLineHeight = Math.round(subtitleFontSize * 1.32);
  const subtitleMaxChars = Math.max(12, Math.floor(posterLayout.subtitle.width / (subtitleFontSize * 0.9)));
  const titleLines = [input.title.trim()];
  const subtitleLines = wrapText(input.subtitle, subtitleMaxChars, posterLayout.subtitle.maxLines);
  const titleFontFamily = getPosterFontFamily("POSTER_TITLE_FONT_FAMILY");
  const subtitleFontFamily = getPosterFontFamily("POSTER_SUBTITLE_FONT_FAMILY");
  const posterFontFaceCss = [
    getPosterFontFaceCss(titleFontFamily, "POSTER_TITLE_FONT_FILE"),
    getPosterFontFaceCss(subtitleFontFamily, "POSTER_SUBTITLE_FONT_FILE")
  ].filter(Boolean).join("\n");
  const textAlign = getPosterTextAlign(input.viewId);
  const textAnchor = getTextAnchor(textAlign);
  const textX = getAlignedTextX(textAlign);
  const titleColor = input.titleColor ?? "#2C241E";
  const subtitleColor = input.subtitleColor ?? "#4D4035";
  const textShadowColor = input.textShadowColor ?? "rgba(44,36,30,0.18)";
  const salesName = limitText(input.salesName, 5);
  const salesPhone = limitText(input.salesPhone, 12);

  const sales = input.showSalesInfo
    ? `<g>
        <rect x="${posterLayout.sales.x}" y="${posterLayout.sales.y}" width="${posterLayout.sales.width}" height="${posterLayout.sales.height}" rx="24" fill="rgba(255,255,255,0.78)"/>
        <text x="${posterLayout.sales.x + 42}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">姓名：${escapeXml(salesName)}</text>
        <text x="${posterLayout.sales.x + 520}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">电话：${escapeXml(salesPhone)}</text>
      </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
    <style>
      ${posterFontFaceCss}
      .title-text { font-family: "${titleFontFamily}", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif; }
      .subtitle-text { font-family: "${subtitleFontFamily}", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif; }
    </style>
    <defs>
      <filter id="softTextShadow" x="-10%" y="-20%" width="120%" height="150%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="${textShadowColor}" flood-opacity="1"/>
      </filter>
    </defs>
    <text font-weight="800" class="title-text" fill="${titleColor}" text-anchor="${textAnchor}" filter="url(#softTextShadow)">${textLines(titleLines, textX, posterLayout.title.y, titleTextLayout.lineHeight, titleTextLayout.fontSize)}</text>
    <text font-weight="500" class="subtitle-text" fill="${subtitleColor}" text-anchor="${textAnchor}" filter="url(#softTextShadow)">${textLines(subtitleLines, textX, posterLayout.subtitle.y, subtitleLineHeight, subtitleFontSize)}</text>
    ${sales}
  </svg>`;
}
