# Adventure Lab Finder

A React + TypeScript frontend with a Vercel serverless backend for browsing
Geocaching Adventure Labs, built against the unofficial API documented at
[adv-lab/geocaching-adventure-labs-doc](https://github.com/adv-lab/geocaching-adventure-labs-doc).

**Scope:** browse only — search nearby labs and view their details/stages.
Answer checking is intentionally out of scope: the upstream hash-check
algorithm salts with the _logged-in user's_ account GUID
(`md5(publicGuid + answer)`), so solving stages requires a real Geocaching
login even if the app never submits progress. That's a bigger scope than
"browse," so it's left for a future iteration.

This is an unofficial, reverse-engineered API — review Geocaching's Terms of
Service before deploying this beyond local/personal use.

## Architecture

- `src/` — Vite + React + TypeScript SPA. Calls its own backend at `/api/*`,
  never the Groundspeak API directly.
- `api/` — Vercel serverless functions (Node runtime) that proxy to
  `https://api.groundspeak.com/adventuresmobile/v1`, attaching the
  `X-Consumer-Key` header server-side so it never reaches the browser bundle.
    - `GET /api/labs/search?lat=&lng=&radius=&take=`
    - `GET /api/labs/:guid`

### ⚠️ Response schema is unverified

The upstream doc shows request body shapes (PascalCase, e.g. `Origin`,
`RadiusInMeters`) but does **not** show example JSON for the search/detail
_responses_. `api/_lib/normalize.ts` defensively tries both PascalCase and
camelCase field names, but it hasn't been checked against a live response.
Before relying on this:

1. Set `GEOCACHING_CONSUMER_KEY` (see below) and run a real search.
2. Log the raw response in `api/_lib/groundspeak.ts` or inspect it via the
   Vercel dev console.
3. Adjust the field names in `api/_lib/normalize.ts` to match.

## Setup

```bash
npm install
cp .env.example .env
```

## Run locally

This needs both the Vite dev server (frontend) and Vercel's dev server
(serverless functions). Easiest is to use the Vercel CLI for everything:

```bash
npm install -g vercel
vercel dev
```

Alternatively, run Vite standalone (`npm run dev`) against `vercel dev`
running on port 3000 — `vite.config.ts` already proxies `/api` there.

## Deploy

```bash
vercel
```

Set `GEOCACHING_CONSUMER_KEY` as an environment variable in the Vercel
project settings (Project → Settings → Environment Variables).

## Type checking

```bash
npm run typecheck
```
