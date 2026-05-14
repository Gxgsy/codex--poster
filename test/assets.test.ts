import { describe, expect, it } from "vitest";
import { assetConfigSchema } from "@/lib/assets/schema";

describe("assetConfigSchema", () => {
  it("accepts a valid school-scene asset config", () => {
    const result = assetConfigSchema.safeParse({
      products: [
        {
          id: "cabin",
          name: "示例舱体",
          views: [{ id: "front", name: "正面", image: "/assets/products/cabin/front.svg" }]
        }
      ],
      backgrounds: [
        {
          id: "school-library-lounge",
          name: "图书馆休息区",
          sceneType: "library-lounge",
          image: "/assets/backgrounds/school-library-lounge.svg",
          stylePrompt: "premium and warm commercial poster, clean soft lighting",
          compositionPrompt: "place the cabin against a wall, parallel to the wall, preserve cabin text, leave upper empty space"
        }
      ],
      logo: { image: "/assets/logo/logo.svg" }
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported school scene types", () => {
    const result = assetConfigSchema.safeParse({
      products: [{ id: "cabin", name: "示例舱体", views: [{ id: "front", name: "正面", image: "/x.svg" }] }],
      backgrounds: [
        {
          id: "office",
          name: "办公室",
          sceneType: "office",
          image: "/x.svg",
          stylePrompt: "premium and warm",
          compositionPrompt: "leave upper empty space"
        }
      ],
      logo: { image: "/assets/logo/logo.svg" }
    });

    expect(result.success).toBe(false);
  });
});
