# AI Poster Generator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy an internal password-protected AI poster generator that outputs 1394 x 2700 PNG posters from fixed school-scene assets, product view references, and user-entered Chinese title/subtitle.

**Architecture:** Use a Next.js App Router app with server-side API routes. The AI provider is isolated behind an interface; final text/logo/sales information composition is performed server-side with deterministic image composition so Chinese poster text is accurate. Asset metadata lives in `data/assets.config.json` and file assets live under `public/assets`.

**Tech Stack:** Next.js, TypeScript, React, Zod, Sharp, Vitest, Vercel, replaceable AI provider adapter.

---

## File Structure

- Create `package.json`: project scripts and dependencies.
- Create `tsconfig.json`: strict TypeScript config.
- Create `next.config.ts`: Next.js configuration.
- Create `vitest.config.ts`: unit test configuration.
- Create `app/layout.tsx`: app shell metadata.
- Create `app/page.tsx`: password gate and single-page generator UI.
- Create `app/globals.css`: utilitarian internal-tool UI styles.
- Create `app/api/assets/route.ts`: returns validated asset config.
- Create `app/api/generate/route.ts`: validates request, calls provider, composes final PNG.
- Create `data/assets.config.json`: initial product/background/logo config.
- Create `lib/assets/schema.ts`: Zod asset config schema.
- Create `lib/assets/load.ts`: load and validate config.
- Create `lib/auth.ts`: shared password helpers.
- Create `lib/ai/provider.ts`: AI provider types and factory.
- Create `lib/ai/mock.ts`: deterministic local provider for local/test use.
- Create `lib/ai/openai.ts`: OpenAI adapter behind the provider interface.
- Create `lib/poster/types.ts`: generation and composition types.
- Create `lib/poster/layout.ts`: 1394 x 2700 poster layout constants.
- Create `lib/poster/compose.ts`: Sharp-based final PNG composition.
- Create `lib/poster/svg.ts`: SVG overlay builders and text wrapping helpers.
- Create `test/assets.test.ts`: asset schema tests.
- Create `test/auth.test.ts`: auth tests.
- Create `test/poster-svg.test.ts`: wrapping and overlay tests.
- Create `test/poster-compose.test.ts`: generated PNG dimension tests.
- Create `public/assets/products/cabin/front.svg`: MVP seed product reference.
- Create `public/assets/backgrounds/school-library-lounge.svg`: MVP seed background reference.
- Create `public/assets/logo/logo.svg`: MVP seed logo.
- Create `.env.example`: required environment variables.

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `.env.example`

- [ ] **Step 1: Create project configuration**

Create `package.json`:

```json
{
  "name": "ai-poster-generator",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^16.2.6",
    "openai": "^6.37.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "sharp": "^0.34.5",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.8.0",
    "vitest": "^4.1.6"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"]
};

export default nextConfig;
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url))
    }
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"]
  }
});
```

Create `.env.example`:

```bash
APP_ACCESS_PASSWORD=change-me
AI_PROVIDER=mock
OPENAI_API_KEY=
```

- [ ] **Step 2: Add app shell and global styles**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Poster Generator",
  description: "Internal AI poster generator"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/globals.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f5f7fb;
  color: #182033;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and install exits successfully.

- [ ] **Step 4: Verify scaffold**

Run: `npm test`

Expected: Vitest exits successfully with no tests found or no failing tests.

- [ ] **Step 5: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts vitest.config.ts app/layout.tsx app/globals.css .env.example
git commit -m "feat: scaffold Next.js poster generator"
```

## Task 2: Asset Config and Validation

**Files:**
- Create: `data/assets.config.json`
- Create: `lib/assets/schema.ts`
- Create: `lib/assets/load.ts`
- Create: `test/assets.test.ts`
- Create: `public/assets/products/cabin/front.svg`
- Create: `public/assets/backgrounds/school-library-lounge.svg`
- Create: `public/assets/logo/logo.svg`

- [ ] **Step 1: Write failing asset schema tests**

Create `test/assets.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/assets.test.ts`

Expected: FAIL because `@/lib/assets/schema` does not exist.

- [ ] **Step 3: Implement asset schema and loader**

Create `lib/assets/schema.ts`:

```ts
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
          image: z.string().startsWith("/assets/")
        })
      ).min(1)
    })
  ).min(1),
  backgrounds: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      sceneType: schoolSceneSchema,
      image: z.string().startsWith("/assets/"),
      stylePrompt: z.string().min(20),
      compositionPrompt: z.string().min(20)
    })
  ).min(1),
  logo: z.object({
    image: z.string().startsWith("/assets/")
  })
});

export type AssetConfig = z.infer<typeof assetConfigSchema>;
export type SchoolScene = z.infer<typeof schoolSceneSchema>;
```

Create `lib/assets/load.ts`:

```ts
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
```

- [ ] **Step 4: Add initial config and seed assets**

Create `data/assets.config.json`:

```json
{
  "products": [
    {
      "id": "cabin",
      "name": "示例舱体",
      "views": [
        {
          "id": "front",
          "name": "正面",
          "image": "/assets/products/cabin/front.svg"
        }
      ]
    }
  ],
  "backgrounds": [
    {
      "id": "school-library-lounge",
      "name": "图书馆休息区",
      "sceneType": "library-lounge",
      "image": "/assets/backgrounds/school-library-lounge.svg",
      "stylePrompt": "premium and warm commercial poster, clean soft lighting, modern school library lounge area",
      "compositionPrompt": "place the cabin against a wall, parallel to the wall, accurate perspective, accurate camera angle, preserve any visible text and markings on the cabin exactly as in the reference product image, leave generous clean empty space in the upper area for title text, no important details in the upper title area, do not add any new text, labels, logos, or watermark"
    }
  ],
  "logo": {
    "image": "/assets/logo/logo.svg"
  }
}
```

Create `public/assets/products/cabin/front.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
  <rect width="600" height="900" fill="#f4f7fb"/>
  <rect x="110" y="90" width="380" height="720" rx="36" fill="#fdfefe" stroke="#8fa3b8" stroke-width="8"/>
  <rect x="160" y="150" width="280" height="120" rx="18" fill="#dce7f2"/>
  <text x="300" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" font-weight="700" fill="#243244">AI CABIN</text>
  <rect x="185" y="330" width="230" height="330" rx="24" fill="#edf3f8" stroke="#b5c4d4" stroke-width="4"/>
  <circle cx="300" cy="735" r="30" fill="#8fb5c8"/>
</svg>
```

Create `public/assets/backgrounds/school-library-lounge.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1394" height="2700" viewBox="0 0 1394 2700">
  <defs>
    <linearGradient id="wall" x1="0" x2="1">
      <stop stop-color="#f5efe5"/>
      <stop offset="1" stop-color="#e7eef2"/>
    </linearGradient>
  </defs>
  <rect width="1394" height="2700" fill="url(#wall)"/>
  <rect y="940" width="1394" height="1760" fill="#dfd3c2"/>
  <path d="M0 940h1394v140H0z" fill="#d5c0a8"/>
  <rect x="80" y="1030" width="340" height="1080" rx="18" fill="#c9b191" opacity="0.35"/>
  <rect x="974" y="1030" width="340" height="1080" rx="18" fill="#b8c7ca" opacity="0.35"/>
</svg>
```

Create `public/assets/logo/logo.svg`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120">
  <rect width="360" height="120" rx="24" fill="#172033"/>
  <text x="180" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">LOGO</text>
</svg>
```

- [ ] **Step 5: Verify tests pass**

Run: `npm test -- test/assets.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit asset model**

```bash
git add data/assets.config.json lib/assets/schema.ts lib/assets/load.ts test/assets.test.ts public/assets
git commit -m "feat: add asset config model"
```

## Task 3: Authentication and Assets API

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/assets/route.ts`
- Create: `test/auth.test.ts`

- [ ] **Step 1: Write failing auth tests**

Create `test/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isPasswordValid } from "@/lib/auth";

describe("isPasswordValid", () => {
  it("accepts matching non-empty passwords", () => {
    expect(isPasswordValid("secret", "secret")).toBe(true);
  });

  it("rejects empty or mismatched passwords", () => {
    expect(isPasswordValid("", "secret")).toBe(false);
    expect(isPasswordValid("wrong", "secret")).toBe(false);
    expect(isPasswordValid("secret", "")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/auth.test.ts`

Expected: FAIL because `@/lib/auth` does not exist.

- [ ] **Step 3: Implement auth helper and assets API**

Create `lib/auth.ts`:

```ts
export function isPasswordValid(input: string, expected: string | undefined): boolean {
  return input.length > 0 && Boolean(expected) && input === expected;
}

export function requireAccessPassword(input: string | null): void {
  const password = input === null ? "" : input;

  if (!isPasswordValid(password, process.env.APP_ACCESS_PASSWORD)) {
    throw new Error("Invalid access password.");
  }
}
```

Create `app/api/assets/route.ts`:

```ts
import { NextResponse } from "next/server";
import { loadAssetConfig } from "@/lib/assets/load";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return NextResponse.json(loadAssetConfig());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset config could not be loaded." },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Verify auth tests pass**

Run: `npm test -- test/auth.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit auth and assets API**

```bash
git add lib/auth.ts app/api/assets/route.ts test/auth.test.ts
git commit -m "feat: add auth helper and assets API"
```

## Task 4: Poster Layout and SVG Overlay

**Files:**
- Create: `lib/poster/types.ts`
- Create: `lib/poster/layout.ts`
- Create: `lib/poster/svg.ts`
- Create: `test/poster-svg.test.ts`

- [ ] **Step 1: Write failing overlay tests**

Create `test/poster-svg.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { wrapText, buildPosterOverlaySvg } from "@/lib/poster/svg";

describe("wrapText", () => {
  it("wraps long Chinese text into bounded lines", () => {
    const lines = wrapText("高级温馨校园智慧空间解决方案", 8, 3);
    expect(lines).toEqual(["高级温馨校园智慧", "空间解决方案"]);
  });
});

describe("buildPosterOverlaySvg", () => {
  it("includes accurate poster and sales text", () => {
    const svg = buildPosterOverlaySvg({
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showSalesInfo: true
    });

    expect(svg).toContain("智慧校园空间");
    expect(svg).toContain("高级温馨的学习休息场景");
    expect(svg).toContain("姓名：");
    expect(svg).toContain("电话：");
    expect(svg).toContain("1394");
    expect(svg).toContain("2700");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/poster-svg.test.ts`

Expected: FAIL because poster SVG helpers do not exist.

- [ ] **Step 3: Implement poster types, layout, and SVG helper**

Create `lib/poster/types.ts`:

```ts
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
```

Create `lib/poster/layout.ts`:

```ts
export const POSTER_WIDTH = 1394;
export const POSTER_HEIGHT = 2700;

export const posterLayout = {
  title: { x: 112, y: 220, width: 1170, fontSize: 92, lineHeight: 112, maxChars: 13, maxLines: 2 },
  subtitle: { x: 116, y: 485, width: 1160, fontSize: 42, lineHeight: 58, maxChars: 22, maxLines: 2 },
  logo: { x: 108, y: 96, width: 220, height: 74 },
  sales: { x: 118, y: 2510, width: 1158, height: 112, fontSize: 38 }
} as const;
```

Create `lib/poster/svg.ts`:

```ts
import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import type { PosterOverlayInput } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const chars = Array.from(text.trim());
  const lines: string[] = [];

  for (let index = 0; index < chars.length && lines.length < maxLines; index += maxChars) {
    lines.push(chars.slice(index, index + maxChars).join(""));
  }

  return lines;
}

function textLines(lines: string[], x: number, y: number, lineHeight: number): string {
  return lines
    .map((line, index) => `<tspan x="${x}" y="${y + index * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
}

export function buildPosterOverlaySvg(input: PosterOverlayInput): string {
  const titleLines = wrapText(input.title, posterLayout.title.maxChars, posterLayout.title.maxLines);
  const subtitleLines = wrapText(input.subtitle, posterLayout.subtitle.maxChars, posterLayout.subtitle.maxLines);

  const sales = input.showSalesInfo
    ? `<g>
        <rect x="${posterLayout.sales.x}" y="${posterLayout.sales.y}" width="${posterLayout.sales.width}" height="${posterLayout.sales.height}" rx="24" fill="rgba(255,255,255,0.78)"/>
        <text x="${posterLayout.sales.x + 42}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">姓名：</text>
        <text x="${posterLayout.sales.x + 520}" y="${posterLayout.sales.y + 70}" font-size="${posterLayout.sales.fontSize}" font-weight="600" fill="#172033">电话：</text>
      </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}">
    <style>
      text { font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif; }
    </style>
    <text font-size="${posterLayout.title.fontSize}" font-weight="800" fill="#172033">${textLines(titleLines, posterLayout.title.x, posterLayout.title.y, posterLayout.title.lineHeight)}</text>
    <text font-size="${posterLayout.subtitle.fontSize}" font-weight="500" fill="#405066">${textLines(subtitleLines, posterLayout.subtitle.x, posterLayout.subtitle.y, posterLayout.subtitle.lineHeight)}</text>
    ${sales}
  </svg>`;
}
```

- [ ] **Step 4: Verify overlay tests pass**

Run: `npm test -- test/poster-svg.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit poster overlay**

```bash
git add lib/poster test/poster-svg.test.ts
git commit -m "feat: add poster overlay layout"
```

## Task 5: Poster Composition

**Files:**
- Create: `lib/poster/compose.ts`
- Create: `test/poster-compose.test.ts`

- [ ] **Step 1: Write failing composition test**

Create `test/poster-compose.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { composePoster } from "@/lib/poster/compose";

describe("composePoster", () => {
  it("creates a 1394 x 2700 PNG", async () => {
    const baseImage = await sharp({
      create: {
        width: 1394,
        height: 2700,
        channels: 4,
        background: "#f2eadf"
      }
    }).png().toBuffer();

    const output = await composePoster({
      baseImage,
      title: "智慧校园空间",
      subtitle: "高级温馨的学习休息场景",
      showLogo: true,
      logoImagePath: "/assets/logo/logo.svg",
      showSalesInfo: true
    });

    const metadata = await sharp(output).metadata();
    expect(metadata.width).toBe(1394);
    expect(metadata.height).toBe(2700);
    expect(metadata.format).toBe("png");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/poster-compose.test.ts`

Expected: FAIL because `composePoster` does not exist.

- [ ] **Step 3: Implement composition**

Create `lib/poster/compose.ts`:

```ts
import sharp from "sharp";
import { buildPosterOverlaySvg } from "./svg";
import { posterLayout, POSTER_HEIGHT, POSTER_WIDTH } from "./layout";
import type { PosterOverlayInput } from "./types";

export type ComposePosterInput = PosterOverlayInput & {
  baseImage: Buffer;
  showLogo: boolean;
  logoImagePath: string;
};

export async function composePoster(input: ComposePosterInput): Promise<Buffer> {
  const base = await sharp(input.baseImage)
    .resize(POSTER_WIDTH, POSTER_HEIGHT, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  const overlay = Buffer.from(buildPosterOverlaySvg(input));
  const composites: sharp.OverlayOptions[] = [{ input: overlay, top: 0, left: 0 }];

  if (input.showLogo) {
    const logo = await sharp(process.cwd() + "/public" + input.logoImagePath)
      .resize(posterLayout.logo.width, posterLayout.logo.height, { fit: "contain" })
      .png()
      .toBuffer();

    composites.unshift({
      input: logo,
      top: posterLayout.logo.y,
      left: posterLayout.logo.x
    });
  }

  return sharp(base)
    .composite(composites)
    .png()
    .toBuffer();
}
```

- [ ] **Step 4: Verify composition tests pass**

Run: `npm test -- test/poster-compose.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit composition**

```bash
git add lib/poster/compose.ts test/poster-compose.test.ts
git commit -m "feat: add poster composition"
```

## Task 6: AI Provider Interface and Mock Provider

**Files:**
- Create: `lib/ai/provider.ts`
- Create: `lib/ai/mock.ts`

- [ ] **Step 1: Implement provider interface**

Create `lib/ai/provider.ts`:

```ts
import { generateMockBaseImage } from "./mock";

export type GenerateBaseImageInput = {
  productImagePath: string;
  backgroundImagePath: string;
  stylePrompt: string;
  compositionPrompt: string;
  sceneType: string;
};

export type AiImageProvider = {
  generateBaseImage(input: GenerateBaseImageInput): Promise<Buffer>;
};

export function createAiProvider(): AiImageProvider {
  if (process.env.AI_PROVIDER === "openai") {
    return {
      async generateBaseImage(input) {
        const { generateOpenAiBaseImage } = await import("./openai");
        return generateOpenAiBaseImage(input);
      }
    };
  }

  return {
    generateBaseImage: generateMockBaseImage
  };
}
```

- [ ] **Step 2: Implement deterministic mock provider**

Create `lib/ai/mock.ts`:

```ts
import sharp from "sharp";
import type { GenerateBaseImageInput } from "./provider";

export async function generateMockBaseImage(input: GenerateBaseImageInput): Promise<Buffer> {
  const cabin = await sharp(process.cwd() + "/public" + input.productImagePath)
    .resize(540, 810, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const base = await sharp({
    create: {
      width: 1394,
      height: 2700,
      channels: 4,
      background: "#efe7dc"
    }
  })
    .composite([
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1394" height="2700">
          <rect width="1394" height="930" fill="#f6efe4"/>
          <rect y="930" width="1394" height="1770" fill="#ded2c0"/>
          <rect x="140" y="900" width="1114" height="56" fill="#cdb99f"/>
          <text x="96" y="1200" font-family="Arial" font-size="38" fill="#8a7660">Premium warm ${input.sceneType}</text>
        </svg>`),
        top: 0,
        left: 0
      },
      { input: cabin, top: 1120, left: 430 }
    ])
    .png()
    .toBuffer();

  return base;
}
```

- [ ] **Step 3: Verify provider compiles through tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Commit provider interface**

```bash
git add lib/ai/provider.ts lib/ai/mock.ts
git commit -m "feat: add AI provider interface"
```

## Task 7: OpenAI Adapter

**Files:**
- Create: `lib/ai/openai.ts`

- [ ] **Step 1: Verify current official OpenAI image API docs**

Use the openai-docs skill or official OpenAI documentation before writing this adapter. Confirm the current image model name, image input format, edit endpoint, and response format. Current checked guidance says GPT Image models include `gpt-image-2`, the Image API supports image edits with multiple input images as references, and GPT image output is returned as base64 image data.

Expected: You know the current API call shape before coding. Do not use non-official docs for this step.

- [ ] **Step 2: Implement adapter behind the existing interface**

Create `lib/ai/openai.ts` with the current official API call shape. If the current API differs from the example below, adapt the code to the verified official API while keeping the exported function signature identical.

```ts
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import sharp from "sharp";
import type { GenerateBaseImageInput } from "./provider";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateOpenAiBaseImage(input: GenerateBaseImageInput): Promise<Buffer> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai.");
  }

  const prompt = [
    input.stylePrompt,
    input.compositionPrompt,
    "Create a premium and warm vertical commercial poster base image.",
    "School scene type: " + input.sceneType,
    "The product cabin must be against a wall and parallel to the wall.",
    "Preserve any visible product cabin text and markings accurately from the reference image.",
    "Leave generous empty space in the upper area for title text.",
    "Do not add new text, labels, logos, watermarks, or signatures."
  ].join("\n");

  const productReference = await imagePathToPngFile(input.productImagePath, "product-reference.png");
  const backgroundReference = await imagePathToPngFile(input.backgroundImagePath, "background-reference.png");

  const response = await client.images.edit({
    model: "gpt-image-2",
    image: [productReference, backgroundReference],
    prompt,
    size: "1024x1536",
    quality: "medium"
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI image response did not include image data.");
  }

  return Buffer.from(b64, "base64");
}

async function imagePathToPngFile(publicPath: string, fileName: string) {
  const png = await sharp(process.cwd() + "/public" + publicPath).png().toBuffer();
  return toFile(png, fileName, { type: "image/png" });
}
```

- [ ] **Step 3: Run type and test checks**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit OpenAI adapter**

```bash
git add lib/ai/openai.ts
git commit -m "feat: add OpenAI image provider adapter"
```

## Task 8: Generate API

**Files:**
- Create: `app/api/generate/route.ts`

- [ ] **Step 1: Implement generate route**

Create `app/api/generate/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
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
    const baseImage = await provider.generateBaseImage({
      productImagePath: view.image,
      backgroundImagePath: background.image,
      stylePrompt: background.stylePrompt,
      compositionPrompt: background.compositionPrompt,
      sceneType: background.sceneType
    });

    const png = await composePoster({
      baseImage,
      title: body.title,
      subtitle: body.subtitle,
      showLogo: body.showLogo,
      logoImagePath: config.logo.image,
      showSalesInfo: body.showSalesInfo
    });

    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=\"poster.png\""
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Poster generation failed." },
      { status: error instanceof Error && error.message === "Invalid access password." ? 401 : 400 }
    );
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Commit generate API**

```bash
git add app/api/generate/route.ts
git commit -m "feat: add poster generation API"
```

## Task 9: Generator UI

**Files:**
- Create: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Implement single-page generator**

Create `app/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetConfig } from "@/lib/assets/schema";

type Status = "idle" | "loading" | "success" | "error";

export default function HomePage() {
  const [assets, setAssets] = useState<AssetConfig | null>(null);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("智慧校园空间");
  const [subtitle, setSubtitle] = useState("高级温馨的学习休息场景");
  const [productId, setProductId] = useState("");
  const [viewId, setViewId] = useState("");
  const [backgroundId, setBackgroundId] = useState("");
  const [showLogo, setShowLogo] = useState(true);
  const [showSalesInfo, setShowSalesInfo] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  useEffect(() => {
    fetch("/api/assets")
      .then((response) => response.json())
      .then((config: AssetConfig) => {
        setAssets(config);
        setProductId(config.products[0]?.id ? config.products[0].id : "");
        setViewId(config.products[0]?.views[0]?.id ? config.products[0].views[0].id : "");
        setBackgroundId(config.backgrounds[0]?.id ? config.backgrounds[0].id : "");
      })
      .catch(() => setError("素材配置加载失败"));
  }, []);

  const selectedProduct = useMemo(
    () => assets?.products.find((product) => product.id === productId),
    [assets, productId]
  );

  async function generatePoster() {
    setStatus("loading");
    setError("");
    setPosterUrl("");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        title,
        subtitle,
        productId,
        viewId,
        backgroundId,
        showLogo,
        showSalesInfo
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: "生成失败" }));
      setError(payload.error ? payload.error : "生成失败");
      setStatus("error");
      return;
    }

    const blob = await response.blob();
    setPosterUrl(URL.createObjectURL(blob));
    setStatus("success");
  }

  return (
    <main className="page-shell">
      <section className="tool-panel">
        <div className="form-panel">
          <h1>AI 海报生成器</h1>
          <label>
            访问密码
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </label>
          <label>
            标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={40} />
          </label>
          <label>
            副标题
            <textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} maxLength={80} />
          </label>
          <label>
            主视觉产品
            <select value={productId} onChange={(event) => {
              const nextProduct = assets?.products.find((product) => product.id === event.target.value);
              setProductId(event.target.value);
              setViewId(nextProduct?.views[0]?.id ? nextProduct.views[0].id : "");
            }}>
              {assets?.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
          <label>
            产品视角
            <select value={viewId} onChange={(event) => setViewId(event.target.value)}>
              {selectedProduct?.views.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
            </select>
          </label>
          <label>
            背景场景
            <select value={backgroundId} onChange={(event) => setBackgroundId(event.target.value)}>
              {assets?.backgrounds.map((background) => <option key={background.id} value={background.id}>{background.name}</option>)}
            </select>
          </label>
          <div className="switch-row">
            <label><input type="checkbox" checked={showLogo} onChange={(event) => setShowLogo(event.target.checked)} /> 显示 logo</label>
            <label><input type="checkbox" checked={showSalesInfo} onChange={(event) => setShowSalesInfo(event.target.checked)} /> 显示销售栏</label>
          </div>
          <button disabled={status === "loading"} onClick={generatePoster}>
            {status === "loading" ? "生成中..." : "生成海报"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </div>
        <div className="preview-panel">
          {posterUrl ? (
            <>
              <img src={posterUrl} alt="生成的海报" />
              <a className="download" href={posterUrl} download="poster.png">下载 PNG</a>
            </>
          ) : (
            <div className="empty-preview">1394 x 2700 海报预览</div>
          )}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Add UI styles**

Append to `app/globals.css`:

```css
.page-shell {
  min-height: 100vh;
  padding: 32px;
}

.tool-panel {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(420px, 1fr);
  gap: 28px;
  max-width: 1320px;
  margin: 0 auto;
}

.form-panel,
.preview-panel {
  background: #ffffff;
  border: 1px solid #dde5ee;
  border-radius: 8px;
  padding: 24px;
}

h1 {
  margin: 0 0 22px;
  font-size: 28px;
}

label {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #c9d4e2;
  border-radius: 8px;
  padding: 12px 14px;
  background: #ffffff;
  color: #182033;
}

textarea {
  min-height: 92px;
  resize: vertical;
}

.switch-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.switch-row label {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  padding: 12px;
}

.switch-row input {
  width: auto;
}

button,
.download {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  background: #172033;
  color: #ffffff;
  font-weight: 700;
  text-decoration: none;
}

button:disabled {
  opacity: 0.62;
}

.error {
  color: #b42318;
  font-weight: 600;
}

.preview-panel {
  display: grid;
  place-items: center;
  gap: 18px;
}

.preview-panel img {
  width: min(100%, 430px);
  aspect-ratio: 1394 / 2700;
  object-fit: contain;
  border: 1px solid #dbe3ef;
  background: #f8fafc;
}

.empty-preview {
  display: grid;
  place-items: center;
  width: min(100%, 430px);
  aspect-ratio: 1394 / 2700;
  border: 1px dashed #aebdd0;
  border-radius: 8px;
  color: #6b7a90;
  background: #f8fafc;
}

@media (max-width: 900px) {
  .page-shell {
    padding: 16px;
  }

  .tool-panel {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit UI**

```bash
git add app/page.tsx app/globals.css
git commit -m "feat: add poster generator UI"
```

## Task 10: End-to-End Local Verification and Deployment Notes

**Files:**
- Create: `README.md`

- [ ] **Step 1: Add README**

Create `README.md`:

```md
# AI Poster Generator

Internal password-protected AI poster generator for 1394 x 2700 vertical commercial posters.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `APP_ACCESS_PASSWORD` in `.env.local`.

Use `AI_PROVIDER=mock` for local deterministic generation. Use `AI_PROVIDER=openai` with `OPENAI_API_KEY` after the OpenAI image adapter has been verified against current official docs.

## Assets

Configured assets live in `data/assets.config.json`.

Files referenced by config live under:

- `public/assets/products`
- `public/assets/backgrounds`
- `public/assets/logo`

Background scenes must be one of:

- `teaching-building-corner`
- `campus`
- `library-lounge`
- `dormitory-activity-room`

Generated images must keep a premium warm style, place the cabin against and parallel to a wall, preserve cabin text accurately, leave generous upper empty space, and avoid adding new text or watermarks.

## Deployment

Deploy to Vercel and configure:

- `APP_ACCESS_PASSWORD`
- `AI_PROVIDER`
- `OPENAI_API_KEY` when using OpenAI
```

- [ ] **Step 2: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

Run: `npm run dev`

Expected: local server starts. Open the displayed localhost URL, generate a poster with `AI_PROVIDER=mock`, and confirm the downloaded PNG is 1394 x 2700.

- [ ] **Step 3: Commit docs and verification result**

```bash
git add README.md
git commit -m "docs: add setup and deployment notes"
```
