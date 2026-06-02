export const defaultPosterSize = {
  width: 1080,
  height: 1920
} as const;

export type PosterSize = {
  width: number;
  height: number;
};

export function parsePosterSize(value: string | undefined): PosterSize {
  const normalizedValue = value?.trim().replace(/[xX＊×]/g, "*") || "";
  const match = normalizedValue.match(/^(\d{3,5})\*(\d{3,5})$/);

  if (!match) {
    return defaultPosterSize;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return defaultPosterSize;
  }

  return { width, height };
}

export function formatPosterSize(size: PosterSize): string {
  return `${size.width}*${size.height}`;
}
