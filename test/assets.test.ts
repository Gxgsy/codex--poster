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
          stylePrompt: "premium and warm commercial poster, clean soft lighting",
          compositionPrompt: "place the cabin against a wall, parallel to the wall, preserve cabin text, leave upper empty space"
        }
      ],
      logos: [
        { id: "full-color", name: "全彩", image: "/assets/logo/full-color.png" },
        { id: "white", name: "反白", image: "/assets/logo/white.png" }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported school scene types", () => {
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
          id: "office",
          name: "办公室",
          sceneType: "office",
          stylePrompt: "premium and warm commercial poster, clean soft lighting",
          compositionPrompt: "leave upper empty space for title text while preserving product details"
        }
      ],
      logos: [{ id: "full-color", name: "全彩", image: "/assets/logo/full-color.png" }]
    });

    expect(result.success).toBe(false);
  });

  it("allows product views and backgrounds without uploaded reference images", () => {
    const result = assetConfigSchema.safeParse({
      products: [
        {
          id: "cabin",
          name: "示例舱体",
          views: [{ id: "front", name: "正面" }]
        }
      ],
      backgrounds: [
        {
          id: "school-library-lounge",
          name: "图书馆休息区",
          sceneType: "library-lounge",
          stylePrompt: "premium and warm commercial poster, clean soft lighting",
          compositionPrompt: "place the cabin against a wall, parallel to the wall, preserve cabin text, leave upper empty space"
        }
      ],
      logos: [{ id: "full-color", name: "全彩", image: "/assets/logo/full-color.png" }]
    });

    expect(result.success).toBe(true);
  });
});
