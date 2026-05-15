export type GeneratePosterRequest = {
  password: string;
  title: string;
  subtitle: string;
  productId: string;
  viewId: string;
  backgroundId: string;
  showLogo: boolean;
  showSalesInfo: boolean;
};

export type PosterOverlayInput = {
  title: string;
  subtitle: string;
  showSalesInfo: boolean;
};
