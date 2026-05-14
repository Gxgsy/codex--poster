# AI Poster Generator MVP Design

Date: 2026-05-14

## Goal

Build a 0-to-1 internal AI poster generation website and deploy it online. The product lets an internal user generate a vertical commercial poster by entering only a title and subtitle, choosing whether to show a logo, choosing a pre-uploaded product view, and choosing whether to show a sales information area.

The generated output is a 1394 x 2700 vertical PNG poster. The visual background is AI-generated from fixed reference assets and style prompts. The overall style should feel premium and warm. Chinese poster text, logo, and sales information are added by the system after generation so the final poster text stays accurate and readable.

## MVP Scope

The first version is an internal usable MVP.

Included:

- Password-protected access with one shared password.
- Single-page generator interface.
- User inputs:
  - Title.
  - Subtitle.
  - Product and product view.
  - Show or hide logo.
  - Show or hide sales promotion area.
- Fixed sales promotion copy at the poster bottom:
  - `姓名：`
  - `电话：`
- Fixed poster size: 1394 x 2700.
- Product images, background reference images, logo files, and style prompts managed through project files and a JSON config.
- School background scene requirements managed through the same config.
- Overall visual style requirement: premium and warm.
- Any visible text on the product cabin must remain accurate.
- AI generation provider hidden behind a replaceable interface.
- Default implementation can use one primary provider first, with the code structured so OpenAI or another image provider can be swapped later.
- Final PNG preview and download.
- Vercel-first deployment.

Not included in MVP:

- User accounts.
- Payment or credit system.
- User history or gallery.
- Drag-and-drop poster editor.
- Admin upload dashboard.
- AI-generated product view changes from a single image.
- Multiple poster sizes.

## Recommended Approach

Use AI to generate a no-text poster base image, then use programmatic composition to add text, logo, and sales copy.

This keeps the AI-generated visual quality while avoiding the main risk of full-image AI generation: inaccurate Chinese text. The final poster should not rely on the image model to render Chinese titles, phone labels, or logo text.

## User Flow

1. User opens the deployed site.
2. User enters the shared access password.
3. User fills in title and subtitle.
4. User chooses a product and one of its named views.
5. User chooses whether the logo should be displayed.
6. User chooses whether the bottom sales promotion area should be displayed.
7. User clicks generate.
8. Server reads the selected product view, background reference, school scene, composition rules, and style prompt from config.
9. AI provider generates a no-text poster base image.
10. Server composes the final poster at 1394 x 2700:
    - Adds title.
    - Adds subtitle.
    - Adds logo if enabled.
    - Adds bottom sales area if enabled.
11. User previews the final result.
12. User downloads the PNG.

## System Architecture

Recommended stack:

- Next.js App Router.
- TypeScript.
- Vercel deployment.
- Server-side API route for generation.
- Server-side image composition through a Canvas-compatible renderer.

Proposed project structure:

```text
app/
  page.tsx                 # Generator page
  api/generate/route.ts    # Creates the final poster
  api/assets/route.ts      # Returns available configured assets
lib/
  assets.ts                # Loads and validates asset config
  auth.ts                  # Shared password handling
  ai/
    provider.ts            # Provider interface
    openai.ts              # Optional default provider implementation
  poster/
    compose.ts             # Final poster composition
    layout.ts              # 1394 x 2700 layout rules
data/
  assets.config.json       # Products, views, backgrounds, style prompts
public/
  assets/products/...      # Main product reference images
  assets/backgrounds/...   # Background reference images
  assets/logo/...          # Logo files
```

## Asset Model

Product views are fixed reference images. The user will upload multiple product view files and name them clearly. The MVP does not ask AI to rotate or reinterpret a product view.

Backgrounds describe school scenes. The first supported scene types are:

- Teaching building corner.
- Campus.
- Library lounge area.
- Dormitory building activity room.

Every generated base image must follow these scene and composition requirements:

- The overall style is premium and warm.
- The product cabin is placed against a wall.
- The cabin is parallel to the wall.
- Perspective is accurate.
- Camera angle is accurate for the selected product view.
- Any visible text, branding, labels, or markings already printed on the product cabin must remain accurate to the reference product image.
- The upper area of the poster has generous empty space reserved for the title.
- The upper empty area must not contain important scene details, key product parts, signage, labels, or other information that would be covered by the title.
- The AI base image must avoid adding new text, words, logos, labels, watermarks, and signatures outside the original product cabin markings.

If the selected AI provider cannot reliably preserve cabin text, implementation should prefer a workflow that protects or re-composites the cabin from the source product view after the background is generated. The requirement is that final visible cabin text is accurate, not that the AI model must render it unaided.

Example config shape:

```json
{
  "products": [
    {
      "id": "product-a",
      "name": "产品 A",
      "views": [
        {
          "id": "front",
          "name": "正面",
          "image": "/assets/products/product-a/front.png"
        },
        {
          "id": "angle-45",
          "name": "45度",
          "image": "/assets/products/product-a/angle-45.png"
        }
      ]
    }
  ],
  "backgrounds": [
    {
      "id": "school-library-lounge",
      "name": "图书馆休息区",
      "sceneType": "library-lounge",
      "image": "/assets/backgrounds/school-library-lounge.png",
      "stylePrompt": "premium and warm commercial poster, clean soft lighting, modern school library lounge area",
      "compositionPrompt": "place the cabin against a wall, parallel to the wall, accurate perspective, accurate camera angle, preserve any visible text and markings on the cabin exactly as in the reference product image, leave generous clean empty space in the upper area for title text, no important details in the upper title area, do not add any new text, labels, logos, or watermark"
    }
  ],
  "logo": {
    "image": "/assets/logo/logo.png"
  }
}
```

## AI Provider Interface

The image provider should be isolated behind one interface. The rest of the app should not know whether the provider is OpenAI, a Chinese image platform, or another service.

The provider receives:

- Product view image.
- Background reference image.
- Style prompt.
- School scene type and composition prompt.
- Output dimensions or target aspect ratio.
- Instruction to use a premium and warm visual style.
- Instruction to place the cabin against a wall and parallel to the wall.
- Instruction to preserve accurate perspective and an accurate camera angle for the selected product view.
- Instruction to preserve visible product cabin text, branding, labels, and markings accurately from the reference product image.
- Instruction to leave generous empty space in the upper area for title placement.
- Instruction to keep important scene details out of the upper title area.
- Instruction to avoid adding new text, words, logos, labels, watermarks, and signatures outside the original product cabin markings.

The provider returns:

- A generated base image suitable for composition.

Implementation should verify current provider API details before coding the adapter. The adapter must be replaceable without changing the generator page or poster composition module.

## Poster Composition

Composition creates the final production image after the AI base image is generated.

Composition responsibilities:

- Resize or crop the AI base to 1394 x 2700.
- Draw title and subtitle with configured fonts and responsive wrapping.
- Draw logo when enabled.
- Draw the bottom sales area when enabled.
- Export PNG.

The title, subtitle, logo, and sales labels are not generated by AI. They are drawn by the app.

Initial layout:

- Logo near the upper area when enabled.
- Title and subtitle placed in a controlled upper text area that relies on the AI base image leaving enough empty space.
- Sales information area at the bottom:
  - `姓名：`
  - `电话：`
- Text must never overflow the poster width. Long text wraps or scales within defined limits.

## Error Handling

The app should show clear errors for:

- Incorrect access password.
- Missing or invalid asset config.
- Missing selected product view file.
- Missing background reference file.
- Missing or invalid background scene configuration.
- AI provider failure.
- AI generation timeout.
- Poster composition failure.

For MVP, generation state does not need to be persisted. A failed generation can simply allow the user to try again.

## Security and Cost Controls

MVP access control is a shared password stored in an environment variable. This is acceptable for internal validation but not for a public commercial product.

Required environment variables:

- `APP_ACCESS_PASSWORD`
- AI provider credentials, such as `OPENAI_API_KEY` if OpenAI is used.

The app should avoid exposing provider keys to the browser. All generation calls run server-side.

## Testing Strategy

Core tests:

- Asset config validation.
- Provider interface contract with a mocked provider.
- Poster composition creates a 1394 x 2700 PNG.
- Title and subtitle rendering handles long Chinese text without overflow.
- Sales promotion area appears only when enabled.
- Logo appears only when enabled.
- Background scene config includes a valid school scene type and composition prompt.

Manual verification:

- Generate a poster for at least one product view.
- Generate at least one school scene: teaching building corner, campus, library lounge area, or dormitory building activity room.
- Confirm the overall style feels premium and warm.
- Confirm the cabin is against a wall and parallel to the wall.
- Confirm perspective and camera angle are visually plausible.
- Confirm any visible text on the cabin is accurate and not distorted.
- Confirm the upper title area has enough empty space and does not contain important details.
- Generate with logo on and off.
- Generate with sales area on and off.
- Download final PNG and confirm dimensions are 1394 x 2700.
- Confirm Chinese title, subtitle, `姓名：`, and `电话：` are accurate.

## Deployment

Deploy the MVP to Vercel first.

Deployment steps:

1. Add required environment variables in Vercel.
2. Upload fixed assets to the repo under `public/assets`.
3. Configure `data/assets.config.json`.
4. Deploy Next.js app.
5. Test password gate and generation route from the deployed URL.

## Future Extensions

Likely next steps after MVP validation:

- Admin interface for uploading products, views, backgrounds, and prompts.
- Poster history and re-download.
- User login and permissions.
- Usage limits, credit system, and payments.
- Simple post-generation text editor.
- Multiple poster sizes.
- Multiple AI provider options in the UI.
- Optional full-AI experimental mode.
