import { z } from "zod";

export const schoolSceneSchema = z.enum([
  "teaching-building-corner",
  "campus",
  "library-lounge",
  "dormitory-activity-room"
]);

export const assetConfigSchema = z.object({
  products: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      views: z.array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          image: z.string().startsWith("/assets/").optional()
        })
      ).min(1)
    })
  ).min(1),
  backgrounds: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      sceneType: schoolSceneSchema,
      image: z.string().startsWith("/assets/").optional(),
      stylePrompt: z.string().min(20),
      compositionPrompt: z.string().min(20)
    })
  ).min(1),
  logos: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      image: z.string().startsWith("/assets/")
    })
  ).min(1)
});

export type AssetConfig = z.infer<typeof assetConfigSchema>;
export type SchoolScene = z.infer<typeof schoolSceneSchema>;
