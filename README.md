# Adventure Lab Finder

A React + TypeScript app for finding Geocaching Adventure Labs, viewing their
stages and reviews, and checking answers. The Vercel serverless API proxies
requests to Groundspeak.

This app uses unofficial, reverse-engineered endpoints. Review Geocaching's
Terms of Service before deploying or using it.

## Architecture

- `src/` — Vite + React + TypeScript single-page app.
- `api/` — Vercel serverless functions. Upstream requests are made server-side;
  the consumer key is not included in the browser bundle.
- `api/_lib/answer.ts` — checks answer hashes and attempts to calculate answers
  from common question types and stage text. Calculation is heuristic and may
  not find every answer.
- `api/_lib/database.ts` — stores calculated answers in Neon Postgres.

API routes:

- `POST /api/login`, `POST /api/refresh`, `GET /api/user`
- `GET /api/labs/search?lat=&lng=&radius=&take=&statuses=&excludeOwned=`
- `GET /api/labs/:guid`
- `GET /api/labs/:guid/reviews?skip=&take=`
- `POST /api/labs/check`

## Setup

Create a `.env.local` file with these server-side variables:

```dotenv
GEOCACHING_CONSUMER_KEY=your-consumer-key
DATABASE_URL=your-neon-postgres-connection-string
```

`GEOCACHING_CONSUMER_KEY` and `DATABASE_URL` are required. The database must
have the `stage_answers` table used by `api/_lib/database.ts`.

```bash
npm install
```

## Run locally

Run the Vercel development server, which serves the frontend and API routes:

```bash
npx vercel dev
```

To run Vite separately, start `npx vercel dev` on port 3000 and run
`npm run dev` in another terminal. Vite proxies `/api` requests to that server.

## Deploy

```bash
npx vercel
```

Configure `GEOCACHING_CONSUMER_KEY` and `DATABASE_URL` in the Vercel project's
environment settings.

## Checks

```bash
npm run typecheck
npm run lint
npm run test:run
```
