# MedFlow — Future Improvements

This document tracks what remains to build or fix, grouped by priority. Everything in the current codebase that is wired up and working is excluded. This is only what's left.

---

## Priority 1 — Broken stubs (replace or delete)

These API routes exist but use a dead helper layer (`lib/api/response`, `lib/middleware/rateLimiter`, `lib/services/*`) that was never connected to real database calls. They will always fail in production. Either rewrite them using the established pattern (`supabaseAdmin` + `verifyToken`) or delete them if the feature is cut.

### `/api/medical-records` (GET, POST)
**File:** `src/app/api/medical-records/route.ts`
**Problem:** Imports `medicalRecordService` from a stub file that returns nothing. Uses `request.headers.get('user-id')` instead of `verifyToken`.
**Fix:** Rewrite to read/write the `appointments.notes` column or add a dedicated `medical_records` table (not in current schema). Use `verifyToken` + `supabaseAdmin`. Add file upload via Supabase Storage if you want PDF uploads.

### `/api/prescriptions` (GET, POST) and `/api/prescriptions/refill` (POST)
**File:** `src/app/api/prescriptions/route.ts`, `src/app/api/prescriptions/refill/route.ts`
**Problem:** Same pattern — imports `prescriptionService` which is a stub.
**Fix:** Rewrite using `supabaseAdmin`. Prescriptions live in `appointments.prescription` (text column in current schema) or add a separate `prescriptions` table.

### `/api/payments/route.ts`
**File:** `src/app/api/payments/route.ts`
**Problem:** Old stub — uses same broken helper layer. The real payment flow is in `api/payments/checkout` and `api/payments/webhook` (both working). This file is dead.
**Fix:** Delete the file. The route conflicts with the working `checkout` and `webhook` sub-routes may cause issues depending on Next.js routing.

### `/api/consultations/*` (three routes)
**Files:** `src/app/api/consultations/route.ts`, `.../token/route.ts`, `.../chat/route.ts`
**Problem:** In-memory session storage, stub imports, no database persistence. TypeScript reports ~20 errors in these files.
**Fix:** Delete all three if you are using Jitsi (no backend needed). Replace with a real WebRTC signalling layer only if you need custom video.

### `/api/admin/analytics/route.ts`
**File:** `src/app/api/admin/analytics/route.ts`
**Problem:** Uses the same broken `logAudit` + helper pattern. TypeScript errors on lines 25, 79, 94.
**Fix:** Delete — the working analytics endpoint is at `/api/doctor/analytics`.

---

## Priority 2 — Missing UI pages

### Medical records page (patient)
**Path to create:** `src/app/client/records/page.tsx`
**What it should show:**
- List of past appointment notes (from `appointments.notes` where patient is the owner)
- Download button per note (PDF export or just formatted text)
- If Supabase Storage is set up: uploaded files with their metadata

**API to create:** `GET /api/patient/records` — queries completed appointments with notes for the current patient.

### Prescriptions page (patient)
**Path to create:** `src/app/client/prescriptions/page.tsx`
**What it should show:**
- Prescription text stored on completed appointments (`appointments.prescription`)
- Doctor name, date issued, refill button (triggers a notification to the doctor)

**API to create:** `GET /api/patient/prescriptions` — returns completed appointments where `prescription IS NOT NULL`.

### Doctor — add notes when completing appointment
**File to update:** `src/app/admin/appointments/page.tsx`
**What to add:** When doctor clicks "Mark completed", show a textarea for notes and prescription before confirming the status change. POST those to the existing `PATCH /api/doctor/appointments/[id]` route (it already accepts `notes`).
**Implementation hint:** Add a `completingId` state; when set, show a modal with notes/prescription inputs; on confirm, PATCH with `{ status: 'completed', notes, prescription }`.

### Doctor — patient detail drawer
**File to update:** `src/app/admin/patients/page.tsx`
**What to add:** Clicking a patient row shows a slide-in drawer with their full appointment history, health stats, and a link to compose a note.
**API to create:** `GET /api/doctor/patients/[id]` — returns profile + all appointments for that patient under this doctor.

---

## Priority 3 — AI chat (partially wired)

### What exists
- `src/app/api/ai/chat/route.ts` — uses `@google/genai` (Gemini). Reads `GEMINI_API_KEY`. Falls back to a demo message if the key is missing.
- `src/components/MedFlowVoiceAssistant.tsx` and `src/components/shared/AIBot.tsx` — UI components exist.

### What's missing
- No page mounts the AI chat component for patients.
- `createAppointment` and `getPatientProfile` are imported from `src/app/actions` but that file may not exist — check before enabling.
- The route doesn't verify the Firebase token (`verifyToken` is absent) — add it before exposing to real users.

### Steps to enable
1. Add `GEMINI_API_KEY` to `.env.local`
2. Verify `src/app/actions.ts` exists and exports `createAppointment`, `getPatientProfile`
3. Add `verifyToken` check at the top of the chat route
4. Mount the chat component at `/client/assistant` or as a floating button

---

## Priority 4 — Security hardening

### Middleware token verification
**File:** `src/middleware.ts`
**Current state:** Reads `userRole` HttpOnly cookie (set by the server — already improved). This is good for routing but the role value itself is not cryptographically signed, so a compromised session cookie would still route a user to the wrong area.
**Recommended fix:** Verify the cookie value using a server-side HMAC signature. Steps:
1. When setting the cookie in `/api/auth/session`, compute `HMAC-SHA256(role + uid, SESSION_SECRET)` and store `role.uid.signature` in the cookie value.
2. In middleware, split the cookie value, recompute the HMAC, and reject mismatches.
3. Add `SESSION_SECRET` to environment variables.

Note: Full Firebase token verification in middleware is not practical — `firebase-admin` does not run in the Next.js Edge Runtime. The HMAC approach above is the right tradeoff.

### Rate limiting on auth endpoints
**Files to protect:** `/api/auth/me`, `/api/auth/session`, `/api/auth/register`
**Recommended:** Use Upstash Redis + `@upstash/ratelimit` (works in Edge). Limit to 10 requests / 60 seconds per IP on auth routes. The stub `src/lib/middleware/rateLimiter.ts` exists but is backed by in-memory storage — it resets on every deploy and doesn't work across serverless instances.

### Input validation
All current API routes do minimal validation. Add `zod` schemas (the package is already installed — `src/lib/validations/index.ts` has stubs) for:
- Appointment booking (`date`, `time`, `consultationType`)
- Profile updates (field length limits, valid enum values)
- Review submission (rating is already checked; `comment` length should be capped)

---

## Priority 5 — Dead code to delete

These files are never imported by any page or active API route. They contain TypeScript errors and inflate the build. Safe to delete:

| File | Reason |
|------|--------|
| `src/lib/services/appointmentService.ts` | ~374 lines of TODO stubs, never called |
| `src/lib/services/patientService.ts` | Stub, never called from any route |
| `src/lib/services/consultationService.ts` | Stub, never called |
| `src/lib/db/queries.ts` | All functions return `null`, never called |
| `src/lib/audit/logger.ts` | Logs to console only, never called (real audit goes via `supabaseAdmin` directly) |
| `src/lib/analytics/analyticsService.ts` | All TODO, never called |
| `src/lib/cache/cacheManager.ts` | In-memory, resets on redeploy, never called |
| `src/lib/jobs/scheduler.ts` | Stub, never called |
| `src/lib/organizations/organizationService.ts` | Stub, never called |
| `src/lib/organizations/staffService.ts` | Stub, never called |
| `src/lib/insurance/insuranceService.ts` | Stub, never called |
| `src/lib/payments/paymentService.ts` | Stub — real payments handled by Stripe routes |
| `src/lib/prescriptions/prescriptionService.ts` | Stub, never called |
| `src/lib/medical-records/recordService.ts` | Stub, never called |
| `src/lib/video/videoClient.ts` | Stub, Jitsi is used instead |
| `src/lib/video/chatManager.ts` | Stub |
| `src/lib/video/recordingService.ts` | Stub |
| `src/lib/api/response.ts` | Dead helper, only used by broken stubs above |
| `src/lib/middleware/rateLimiter.ts` | In-memory, non-functional in production |
| `src/lib/middleware/securityHeaders.ts` | Dead helper, only used by broken stubs |

---

## Priority 6 — Quality of life

### Email notifications
When an appointment is booked, confirmed, or cancelled, send a transactional email to the patient. Recommended: **Resend** (`npm install resend`). Trigger from the webhook route and from the doctor appointments PATCH route.

### Appointment reminders (cron)
Create a daily cron job (Vercel Cron or GitHub Actions) that calls a protected `/api/cron/reminders` endpoint. It should:
1. Query appointments scheduled for tomorrow
2. Insert a notification row for the patient
3. Optionally send an email

### Pagination on doctor patients page
`src/app/admin/patients/page.tsx` currently loads all appointments for all of this doctor's patients. Add `?page=N&limit=20` to the API call and add prev/next controls.

### Search on doctors list
`src/app/client/doctors/page.tsx` — check if it does client-side or server-side filtering. Move the search to a query param (`?q=cardiology`) so results are bookmarkable and SEO-friendly.

### Environment variable validation
Add a startup check (in `next.config.ts`) that throws a build error if required env vars are missing:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

### Mobile layout
The design system CSS (`globals.css`) is desktop-first. The `.bento` grid and `.admin-grid` break below 768 px. Add `@media (max-width: 768px)` overrides in `globals.css` for:
- `.bento` → `grid-template-columns: 1fr`
- `.admin-grid` → `grid-template-columns: 1fr`
- `.sidebar` → slide-out drawer pattern (the `.app-shell` layout already has a variable for this)

---

## Env vars checklist

All variables required for the app to function end-to-end:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Firebase (client — public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase (server — private)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
# Run locally: stripe listen --forward-to localhost:3000/api/payments/webhook

# Optional
GEMINI_API_KEY=          # enables AI chat assistant
SESSION_SECRET=          # HMAC key for middleware cookie signing (future improvement)
```
