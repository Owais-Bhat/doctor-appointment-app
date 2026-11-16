# MedFlow mobile (patients)

React Native app (Expo SDK 58, Expo Router) for the MedFlow patient portal. It talks to the same
`/api/*` routes as the web app at `https://app.nestfy.in`, signed in with the same Firebase
accounts — no separate backend.

## Run it

```bash
cd mobile
cp .env.example .env     # add the Firebase values from the web app's NEXT_PUBLIC_FIREBASE_*
npm install
npx expo start           # press a/i, or scan the QR code with Expo Go
```

Until the Firebase values are set, the login screen says so instead of failing silently.
`npx tsc --noEmit` type-checks; `npx expo export --platform android` checks the native bundle.

## What is in Phase 1

| Screen | What it does |
|---|---|
| Splash, Sign in, Create account | Firebase email/password, consent checkbox (same as web), password reset |
| Home | Next visit, quick actions, unread dot, top-rated doctors |
| Book (centre tab) | Pick a specialty → doctors |
| Doctors | Search + specialty chips |
| Doctor → Book | 14-day date strip, free slots from the server, visit type, reason → request sent |
| Visits | Upcoming / past, cancel (two-tap confirm), **pay online**, **join video visit** |
| Notifications | List, mark one or all read |
| Me | Health profile (read-only for now), sign out |

Doctor and admin accounts see a "use the web portal" screen; those portals stay on the web.

## Design and animation

- `src/constants/theme.ts` — the web app's palette (light + dark, follows the phone).
- `src/components/icons/` — the MedFlow icon set: 35 duotone icons drawn on a 24-grid
  (`paths.ts`). `AnimatedIcon` draws each outline in with Reanimated and pops when active.
- `src/components/ui/` — `Aurora` (drifting blurred blobs), `GlassCard`, `Tap` (spring press +
  haptic), `Button`, `Field` (animated focus ring), `Segmented` (sliding pill), `Reveal`
  (staggered entrance), `Skeleton`, `SuccessCheck` (ring and tick draw).
- `src/components/TabBar.tsx` — floating glass tab bar with a sliding highlight and a pulsing centre button.

To add an icon, add its paths to `ICONS` in `paths.ts`; it is available everywhere by name.

## Payments and video

Both use the web app's existing endpoints and work in Expo Go (no native SDK).

- **Pay** — shown on a confirmed, unpaid visit when the server has Razorpay keys.
  `POST /api/payments/order` → Razorpay Checkout → `POST /api/payments/verify`. On phones Checkout
  runs in a WebView sheet (`src/components/Checkout.tsx`); the web build uses the normal overlay
  (`Checkout.web.tsx`). The amount always comes from the server. UPI app links (`upi://`,
  `phonepe://`, Android `intent://`) are handed to the phone to open.
- **Join video** — shown from 15 minutes before a confirmed video visit until the end of that day.
  `POST /api/visits/:id/join` returns the private Daily/Jitsi room link, opened in the in-app
  browser, which asks for camera and microphone itself. Unpaid video visits must be paid first.

Test payments with Razorpay **test keys** (`rzp_test_…`) on the server before going live.

## Not built yet

- Push notifications (needs an EAS project, a device-token table and a send step on the web app)
- Google sign-in, editing the health profile, medical records / prescriptions
- Optional: Razorpay's native SDK and Daily's native SDK for a store build (need a development build)

```bash
npx eas-cli@latest build --profile development --platform android
```

## Layout

```
src/app/        routes (Expo Router): index (splash), login, register, (tabs)/*, doctor/[id], notifications
src/components/ shared UI (see above)
src/context/    auth (Firebase + /api/auth/me)
src/lib/        api client, types, formatting, clinic time
```
