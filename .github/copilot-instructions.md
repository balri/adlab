# Copilot instructions

## Project overview

Adventure Lab Finder is a React and TypeScript application for finding
Geocaching Adventure Labs, viewing their details, stages, and reviews, and
checking or submitting answers. The frontend is a Vite single-page app, and
the backend consists of Vercel serverless functions that proxy requests to
Groundspeak and use Neon Postgres for stored answers.

The app uses unofficial, reverse-engineered Groundspeak endpoints. Preserve
the existing integrations and avoid implying that they are official or
guaranteed to remain stable.

## Repository layout

- `src/pages/` contains route-level screens.
- `src/components/` contains reusable React UI.
- `src/types.ts` contains shared frontend and API types.
- `src/useApi.ts` exposes typed frontend calls to the API; authentication is
  handled through `src/useAuth.ts` and `src/AuthProvider.tsx`.
- `api/` contains Vercel serverless route handlers.
- `api/_lib/` contains shared upstream, answer-checking, and database logic.

## Development practices

- Follow the existing TypeScript, React, and formatting patterns. Keep changes
  focused and preserve existing behavior unless a change is required.
- Keep upstream credentials and database connection strings on the server.
  Never expose secrets in frontend code or commit `.env.local`.
- Keep API request and response types consistent between route handlers,
  `src/types.ts`, and `src/useApi.ts`. Return explicit errors using the
  established API patterns.
- Build UI that remains responsive and accessible. Use the existing components
  and styles before introducing new dependencies or abstractions.
- Add focused Vitest and React Testing Library tests for behavior changes.
  Tests are generally colocated with the implementation as `*.test.ts` or
  `*.test.tsx`.
- Store browser-persisted state using the existing storage patterns and
  utilities; avoid duplicating persistence logic.

## Common commands

- `npx vercel dev` — run the frontend and API locally.
- `npm run dev` — run Vite; use alongside `npx vercel dev` when working on the
  frontend with the configured API proxy.
- `npm run test:run` — run tests.
- `npm run typecheck` — type-check the project.
- `npm run lint` — run ESLint and Stylelint.
- `npm run build` — type-check and build the frontend.

Set `DATABASE_URL` in the local server environment as described in `README.md`.
Do not include real database credentials in code, tests, or documentation.
