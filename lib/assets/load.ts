import config from "@/data/assets.config.json";
import { assetConfigSchema, type AssetConfig } from "./schema";

let cachedConfig: AssetConfig | undefined;

export function loadAssetConfig(): AssetConfig {
  if (!cachedConfig) {
    cachedConfig = assetConfigSchema.parse(config);
  }

  return cachedConfig;
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
