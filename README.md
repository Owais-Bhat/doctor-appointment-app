# MedFlow — Doctor Appointment App

Book doctors, manage clinic schedules, and run the platform — in one Next.js app with three portals:

| Portal | Path | Who |
|---|---|---|
| Patient | `/client` | Find doctors, book slots, pay, intake forms, reviews, notifications |
| Doctor | `/admin` | Today's schedule, appointments, availability, blocked dates, patients, analytics |
| Super Admin | `/super-admin` | Users, doctor verification, roles, platform analytics, audit log |

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS 4 · Supabase (Postgres) · Firebase Auth · Razorpay · Daily/Jitsi · Twilio · Gemini

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
Existing database: run the files in `supabase/migrations/` in order (`004_visit_intake.sql` also moves old pre-visit forms out of the doctor's notes).

## Video visits

Patients and doctors join from the visit page inside MedFlow (`/client/visit/<id>`, `/admin/visit/<id>`): camera and microphone check, a countdown until the room opens (15 min before for patients, 60 for doctors), the call itself, and for doctors a notes panel with “End visit and complete”.

- **Daily (recommended):** set `DAILY_API_KEY` and `DAILY_DOMAIN`. Each visit gets a private room and only its patient and doctor receive a join token. The free plan includes 10,000 participant minutes a month.
- **Jitsi:** without Daily, set `NEXT_PUBLIC_JITSI_DOMAIN` to your own Jitsi server or JaaS. The public meet.jit.si is fine for trying it out but isn't meant for embedding in production.

## Online payments (Razorpay)

Patients pay for a visit once the doctor confirms it — UPI, cards, netbanking or wallets through Razorpay Checkout. Without Razorpay keys, nothing changes: patients pay at the clinic.

1. Run `supabase/migrations/003_payments.sql`.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test keys first: `rzp_test_…`).
3. In the Razorpay dashboard add a webhook to `https://<your-site>/api/payments/razorpay-webhook` for `order.paid`, `payment.captured` and `refund.processed`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`.

How it works:
- The server creates the order from the doctor's fee, so the browser can never choose the amount.
- The Checkout result is checked with its HMAC signature (`/api/payments/verify`); the webhook records the payment too if the patient closes the tab first. Recording is idempotent, so both arriving is fine.
- **Video visits** must be paid before the patient can join the room. Doctors can always start.
- **Cancelling** a paid visit (by the patient or the doctor) refunds it in full automatically. If a refund call fails, the visit stays `refund_pending` (and is logged) so it can be refunded from the Razorpay dashboard.
- Doctors see *Paid* / *Awaiting payment* on each visit and *Paid online this month* on their dashboard.

## Legal pages

Public pages at `/about`, `/pricing`, `/contact`, `/terms`, `/privacy`, `/refunds` and `/shipping` (service delivery) — the set Razorpay checks before activating live payments. They describe what the app actually does (which providers receive which data, refunds until the visit starts, no-show = no refund).

1. Fill in the `NEXT_PUBLIC_LEGAL_*`, contact and grievance values in `.env` (a warning lists missing ones in development).
2. Have a lawyer review the text before launch — especially the refund rules, liability and the doctor terms — and edit the pages in `src/app/(legal)/`. Update `LEGAL.updated` in `src/lib/legal.ts` when they change.
3. Run `supabase/migrations/005_doctor_registration.sql`. Doctors add their medical registration number on their profile (shown to patients, as the Telemedicine Practice Guidelines require), and admins can't verify a doctor without one.

New accounts must tick a consent box (age 18+, terms, privacy and use of health data) before signing up, including with Google.

## Visit reminders

Patients get a reminder about 24 hours and 1 hour before each **confirmed** visit: always in the app, and by SMS or WhatsApp when configured. Patients can turn text reminders off on their health profile.

1. Run `supabase/migrations/002_appointment_reminders.sql`.
2. Set `CRON_SECRET`, and for texts `REMINDER_CHANNEL` plus the `TWILIO_*` values (see `.env.example`).
3. Call `GET /api/cron/reminders` every 15 minutes with `Authorization: Bearer <CRON_SECRET>`.
   `vercel.json` schedules this on Vercel; per-15-minute cron jobs need a Vercel Pro plan. On the free plan use Supabase `pg_cron` or a free service such as cron-job.org instead.

Each reminder is claimed in the database before sending, so overlapping runs never send it twice.
For India: SMS needs DLT-registered sender and templates; WhatsApp outside a 24-hour chat window needs an approved message template in Twilio.

## How security works

- **Identity** comes only from the Firebase ID token (`Authorization: Bearer <token>`), verified on the server. User ids or roles sent in headers or request bodies are never trusted.
- **Roles** are read from the `profiles` table on every request by `requireUser(request, roles)` in `src/lib/api-auth.ts`.
- **Portals are separate**: each role can open only its own portal (patients `/client`, doctors `/admin`, admins `/super-admin`); anything else redirects to their home.
- **Pages** are guarded by `src/proxy.ts` using a role cookie signed with `SESSION_SECRET` (`src/lib/session.ts`), so it cannot be forged in the browser.
- **Database** access goes through server routes with the service role key; Row Level Security is enabled on every table so the public anon key cannot read patient data.
- **Time zone**: appointment times are the clinic's wall-clock time (`NEXT_PUBLIC_TIME_ZONE`, default Asia/Kolkata), so servers running in UTC still know what "today" and "in the past" mean.
- **Booking** (`src/lib/appointments.ts`) checks the doctor is verified, the slot is inside their availability and still free; a partial unique index blocks double-booking under concurrency.

## Project layout

```
src/
  app/            pages for each portal + API routes (app/api)
  components/     UI components (ui/ = design-system primitives)
  context/        AuthContext (Firebase session)
  lib/            api-auth, session, appointments, payments, video, reminders, supabase, firebase
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
