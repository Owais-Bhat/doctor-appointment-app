# MedFlow — Doctor Appointment App

Book doctors, manage clinic schedules, and run the platform — in one Next.js app with three portals:

| Portal | Path | Who |
|---|---|---|
| Patient | `/client` | Find doctors, book slots, pay, intake forms, reviews, notifications |
| Doctor | `/admin` | Today's schedule, appointments, availability, blocked dates, patients, analytics |
| Super Admin | `/super-admin` | Users, doctor verification, roles, platform analytics, audit log |

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · Supabase (Postgres) · Firebase Auth · Stripe · Gemini

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values you have
npm run dev                  # http://localhost:3000
```

Without Supabase credentials, local development stores data in `db.json` (never in production).
Sign-in always needs a Firebase project.

### Database

New database: run `supabase/schema.sql` in the Supabase SQL editor.
Existing database: run the files in `supabase/migrations/` in order.

## How security works

- **Identity** comes only from the Firebase ID token (`Authorization: Bearer <token>`), verified on the server. User ids or roles sent in headers or request bodies are never trusted.
- **Roles** are read from the `profiles` table on every request by `requireUser(request, roles)` in `src/lib/api-auth.ts`.
- **Pages** are guarded by `src/proxy.ts` using a role cookie signed with `SESSION_SECRET` (`src/lib/session.ts`), so it cannot be forged in the browser.
- **Database** access goes through server routes with the service role key; Row Level Security is enabled on every table so the public anon key cannot read patient data.
- **Booking** (`src/lib/appointments.ts`) checks the doctor is verified, the slot is inside their availability and still free; a partial unique index blocks double-booking under concurrency.

## Project layout

```
src/
  app/            pages for each portal + API routes (app/api)
  components/     UI components (ui/ = design-system primitives)
  context/        AuthContext (Firebase session)
  lib/            api-auth, session, appointments, supabase, firebase, stripe
  proxy.ts        page access control
supabase/         schema.sql and migrations
design/           MedFlow design prototypes (source of truth for the UI)
docs/             guides, design system, roadmap, history
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (type-checked) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
