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

`OPENAI_BASE_URL` is optional. Leave it empty for the official OpenAI API, or set it to an OpenAI-compatible gateway such as `https://www.ddshub.cc` when using DDS Hub.

`OPENAI_IMAGE_MODEL` defaults to `gpt-image-2`. Keep it configurable so production can move to a newer supported image model without a code change.

`AI_GENERATION_TIMEOUT_MS` controls the server-side AI generation timeout. The default is `60000`.

For production, a licensed CJK font file is required so Chinese title, subtitle, and sales labels render deterministically on Vercel/Linux. Place the font under `public/fonts`, for example `public/fonts/NotoSansSC-Regular.otf`, then set:

```bash
POSTER_FONT_FAMILY=Noto Sans SC
POSTER_FONT_FILE=NotoSansSC-Regular.otf
```

If `POSTER_FONT_FILE` is missing in production, poster generation fails fast instead of silently rendering missing Chinese glyphs.

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

This app should be deployed as a Node web service because it uses API routes,
Sharp image composition, and longer-running AI image generation requests.

The repository includes `render.yaml` for Render Blueprint deployment. Render
will build with:

```bash
npm ci && npm run build
```

and start with:

```bash
npm run start
```

The production service uses users' own Doubao/OpenAI-compatible API keys from
the web form, so no default API key is committed to the repository.

Configured deployment environment variables:

- `AI_PROVIDER=openai`
- `OPENAI_BASE_URL=https://api.szamca.com:30000/v1`
- `OPENAI_IMAGE_MODEL=doubao-seedream-5-0-260128`
- `AI_GENERATION_TIMEOUT_MS=180000`
- `POSTER_TITLE_FONT_FAMILY=Alibaba PuHuiTi Heavy`
- `POSTER_TITLE_FONT_FILE=AlibabaPuHuiTi-3-105-Heavy.otf`
- `POSTER_SUBTITLE_FONT_FAMILY=Alibaba PuHuiTi Medium`
- `POSTER_SUBTITLE_FONT_FILE=AlibabaPuHuiTi-3-65-Medium.otf`

The current upload endpoints write to the service filesystem. This works for
local use and temporary edits, but durable production uploads should be moved
to object storage such as S3/R2/TOS before relying on user-uploaded assets long
term.
