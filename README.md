# Noel AgriTV

Agriculture storefront for Noel AgriTV (Philippines) — guest **cash-on-delivery ordering** with a Google Sheets order book, bilingual Filipino/English UI, and a Blob-backed admin. Built with Next.js App Router, Tailwind CSS v4, Vercel Blob, Google Sheets, NextAuth (Google), Resend, and Cloudflare Turnstile. Conventions and agent rules: see `AGENTS.md`.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values (provisioning notes inside)
npm run dev
```

## Environment Variables

See `.env.example` for provisioning steps. On Vercel, set these in **Settings > Environment Variables**:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | NextAuth secret (`npx auth secret`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `ADMIN_EMAILS` | Comma-separated owner emails |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `BLOB_STORE_ID` | Vercel Blob store ID (for image proxy SSRF check) |
| `GOOGLE_SHEET_ID` | Orders spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Sheets service-account email (Editor on the sheet) |
| `GOOGLE_PRIVATE_KEY` | Service-account private key (`\n`-escaped, quoted) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (invisible widget) |
| `TURNSTILE_SECRET_KEY` | Turnstile server-side secret |
| `RESEND_API_KEY` | Resend API key (owner order-notification email; optional — feature no-ops if unset) |
| `ORDER_NOTIFY_EMAIL` | Recipient for new-order emails |
| `NEXT_PUBLIC_SITE_URL` | Production URL for SEO |

## Testing & linting

```bash
npm test       # vitest run
npm run lint   # eslint
npx tsc --noEmit
```

## Deployment

Deployed on Vercel; pushes to `master` build production (then promote). Functions pinned to `sin1` (Singapore) via `vercel.json`.
