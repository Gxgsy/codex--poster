export type GeneratePosterRequest = {
  doubaoApiKey: string;
  title: string;
  subtitle: string;
  productId: string;
  viewId: string;
  backgroundId: string;
  showLogo: boolean;
  showSalesInfo: boolean;
  salesName?: string;
  salesPhone?: string;
};

export type PosterTextAlign = "left" | "center" | "right";

export type PosterOverlayInput = {
  title: string;
  subtitle: string;
  showSalesInfo: boolean;
  salesName?: string;
  salesPhone?: string;
  viewId?: string;
  titleColor?: string;
  subtitleColor?: string;
  textShadowColor?: string;
};
