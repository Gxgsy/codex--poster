import { NextResponse } from "next/server";
import { z } from "zod";
import { AiProviderGenerationError, classifyGenerateError } from "@/lib/api/generate-errors";
import { createAiProvider } from "@/lib/ai/provider";
import { findBackground, findProductView, loadAssetConfig } from "@/lib/assets/load";
import { requireAccessPassword } from "@/lib/auth";
import { composePoster } from "@/lib/poster/compose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  password: z.string(),
  title: z.string().min(1).max(40),
  subtitle: z.string().min(1).max(80),
  productId: z.string().min(1),
  viewId: z.string().min(1),
  backgroundId: z.string().min(1),
  showLogo: z.boolean(),
  showSalesInfo: z.boolean()
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    requireAccessPassword(body.password);

    const config = loadAssetConfig();
    const { view } = findProductView(config, body.productId, body.viewId);
    const background = findBackground(config, body.backgroundId);

    const provider = createAiProvider();
    let baseImage: Buffer;
    try {
      baseImage = await provider.generateBaseImage({
        productImagePath: view.image,
        backgroundImagePath: background.image,
        stylePrompt: background.stylePrompt,
        compositionPrompt: background.compositionPrompt,
        sceneType: background.sceneType
      });
    } catch (error) {
      throw new AiProviderGenerationError(error);
    }

    const png = await composePoster({
      baseImage,
      title: body.title,
      subtitle: body.subtitle,
      showLogo: body.showLogo,
      logoImagePath: config.logo.image,
      showSalesInfo: body.showSalesInfo
    });

    const responseBody = Uint8Array.from(png).buffer;

    return new Response(responseBody, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=\"poster.png\""
      }
    });
  } catch (error) {
    const response = classifyGenerateError(error);

    return NextResponse.json({ error: response.message }, { status: response.status });
  }
}
