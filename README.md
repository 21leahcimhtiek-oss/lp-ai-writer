# ai-writer

AI-powered application from Aurora Market.

## Domain
https://auroramarket.org

## Features
- Premium-only AI tools
- No free tier
- Subscription required

## Deployment (Vercel)
1. Import this repository into Vercel.
2. Use the **Other** framework preset.
3. Keep the root directory as `.`.
4. Deploy. `vercel.json` rewrites all routes to `index.html` for SPA behavior.

## Environment Variables
Copy `.env.example` to `.env` and set values for:
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `OPENAI_API_KEY`

## License
See LICENSE file for details.
