import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assetConfigSchema, type AssetConfig } from "./schema";

const assetConfigPath = path.resolve(process.cwd(), "data", "assets.config.json");

export function loadAssetConfig(): AssetConfig {
  const config = JSON.parse(readFileSync(assetConfigPath, "utf8"));

  return assetConfigSchema.parse(config);
}

export function saveAssetConfig(config: AssetConfig): AssetConfig {
  const parsedConfig = assetConfigSchema.parse(config);
  writeFileSync(assetConfigPath, `${JSON.stringify(parsedConfig, null, 2)}\n`);

  return parsedConfig;
}

export function findProductView(config: AssetConfig, productId: string, viewId: string) {
  const product = config.products.find((item) => item.id === productId);
  const view = product?.views.find((item) => item.id === viewId);

  if (!product || !view) {
    throw new Error("Selected product view was not found.");
  }

  return { product, view };
}

export function findBackground(config: AssetConfig, backgroundId: string) {
  const background = config.backgrounds.find((item) => item.id === backgroundId);

  if (!background) {
    throw new Error("Selected background was not found.");
  }

  return background;
}

export function findLogo(config: AssetConfig, logoId: string) {
  const logo = config.logos.find((item) => item.id === logoId);

  if (!logo) {
    throw new Error("Selected logo was not found.");
  }

  return logo;
}
