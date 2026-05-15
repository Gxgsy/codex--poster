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
