import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import type { PosterOverlayInput, PosterTextAlign } from "./types";

const require = createRequire(import.meta.url);
const TextToSVG = require("text-to-svg") as {
  loadSync(fontPath: string): TextToSvgRenderer;
};
const defaultPosterTitleFontFile = "AlibabaPuHuiTi-3-105-Heavy.otf";
const defaultPosterSubtitleFontFile = "AlibabaPuHuiTi-3-65-Medium.otf";
const lineStartPunctuation = new Set(["。", "，", "、", "；", "：", "！", "？", "）", "】", "》", "」", "』", ".", ",", ";", ":", "!", "?"]);
const fontRendererCache = new Map<string, TextToSvgRenderer>();

type TextToSvgRenderer = {
  getD(text: string, options: { x: number; y: number; fontSize: number; anchor?: "left" | "center" | "right" }): string;
};

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

function textLinePaths(
  renderer: TextToSvgRenderer,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  fontSize: number,
  anchor: "left" | "center" | "right",
  className: string
): string {
  return lines
    .map((line, index) => {
      const d = renderer.getD(line, { x, y: y + index * lineHeight, fontSize, anchor });

      return `<path class="${className}" d="${d}"/>`;
    })
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

function getPathAnchor(align: PosterTextAlign): "left" | "center" | "right" {
  if (align === "center") {
    return "center";
  }

  if (align === "right") {
    return "right";
  }

  return "left";
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

function getPosterFontPath(envName: string): string {
  const defaultFontFile = envName === "POSTER_TITLE_FONT_FILE" ? defaultPosterTitleFontFile : defaultPosterSubtitleFontFile;
  const fontFile = process.env[envName]?.trim() || process.env.POSTER_FONT_FILE?.trim() || defaultFontFile;

  if (!fontFile) {
    throw new Error(`${envName} is required for poster rendering.`);
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

  return resolvedPath;
}

function getPosterFontRenderer(envName: string): TextToSvgRenderer {
  const fontPath = getPosterFontPath(envName);
  const cached = fontRendererCache.get(fontPath);

  if (cached) {
    return cached;
  }

  const renderer = TextToSVG.loadSync(fontPath);

  fontRendererCache.set(fontPath, renderer);
  return renderer;
}

export function buildPosterOverlaySvg(input: PosterOverlayInput): string {
  const titleTextLayout = getTitleTypography(input.title);
  const subtitleFontSize = Math.round(titleTextLayout.fontSize / 2);
  const subtitleLineHeight = Math.round(subtitleFontSize * 1.32);
  const subtitleMaxChars = Math.max(12, Math.floor(posterLayout.subtitle.width / (subtitleFontSize * 0.9)));
  const titleLines = [input.title.trim()];
  const subtitleLines = wrapText(input.subtitle, subtitleMaxChars, posterLayout.subtitle.maxLines);
  const titleFontRenderer = getPosterFontRenderer("POSTER_TITLE_FONT_FILE");
  const subtitleFontRenderer = getPosterFontRenderer("POSTER_SUBTITLE_FONT_FILE");
  const textAlign = getPosterTextAlign(input.viewId);
  const pathAnchor = getPathAnchor(textAlign);
  const textX = getAlignedTextX(textAlign);
  const titleColor = input.titleColor ?? "#2C241E";
  const subtitleColor = input.subtitleColor ?? "#4D4035";
  const textShadowColor = input.textShadowColor ?? "rgba(44,36,30,0.18)";
  const salesName = limitText(input.salesName, 5);
  const salesPhone = limitText(input.salesPhone, 12);
  const titlePaths = textLinePaths(titleFontRenderer, titleLines, textX, posterLayout.title.y, titleTextLayout.lineHeight, titleTextLayout.fontSize, pathAnchor, "title-text");
  const subtitlePaths = textLinePaths(subtitleFontRenderer, subtitleLines, textX, posterLayout.subtitle.y, subtitleLineHeight, subtitleFontSize, pathAnchor, "subtitle-text");
  const salesNamePath = subtitleFontRenderer.getD(`姓名：${salesName}`, {
    x: posterLayout.sales.x + 42,
    y: posterLayout.sales.y + 70,
    fontSize: posterLayout.sales.fontSize,
    anchor: "left"
  });
  const salesPhonePath = subtitleFontRenderer.getD(`电话：${salesPhone}`, {
    x: posterLayout.sales.x + 520,
    y: posterLayout.sales.y + 70,
    fontSize: posterLayout.sales.fontSize,
    anchor: "left"
  });

  const sales = input.showSalesInfo
    ? `<g>
        <rect x="${posterLayout.sales.x}" y="${posterLayout.sales.y}" width="${posterLayout.sales.width}" height="${posterLayout.sales.height}" rx="24" fill="rgba(255,255,255,0.78)"/>
        <path d="${salesNamePath}" fill="#172033"/>
        <path d="${salesPhonePath}" fill="#172033"/>
      </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
    <style>
      .title-text { fill: ${titleColor}; }
      .subtitle-text { fill: ${subtitleColor}; }
    </style>
    <defs>
      <filter id="softTextShadow" x="-10%" y="-20%" width="120%" height="150%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="${textShadowColor}" flood-opacity="1"/>
      </filter>
    </defs>
    <g filter="url(#softTextShadow)">${titlePaths}</g>
    <g filter="url(#softTextShadow)">${subtitlePaths}</g>
    ${sales}
  </svg>`;
}
