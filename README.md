# Noel AgriTV

Agriculture information platform for Noel AgriTV (Philippines). Built with Next.js App Router, Tailwind CSS, and Vercel Blob.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

## Environment Variables

See `.env.example` for required variables. On Vercel, set these in **Settings > Environment Variables**:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | NextAuth secret (`npx auth secret`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ADMIN_EMAILS` | Comma-separated owner emails |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `BLOB_STORE_ID` | Vercel Blob store ID (for image proxy SSRF check) |
| `NEXT_PUBLIC_SITE_URL` | Production URL for SEO |
| `NEXT_PUBLIC_ECOMMERCE_ENABLED` | `false` until e-commerce phase |

## Deployment

Deployed on Vercel. Functions pinned to `sin1` (Singapore) via `vercel.json`.

```bash
vercel deploy --prod
```
