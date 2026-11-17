# MedFlow mobile (patients)

React Native app (Expo SDK 58, Expo Router) for the MedFlow patient portal. It talks to the same
`/api/*` routes as the web app at `https://app.nestfy.in`, signed in with the same Firebase
accounts — no separate backend.

## Run it

```bash
cd mobile
cp .env.example .env     # add the Firebase values from the web app's NEXT_PUBLIC_FIREBASE_*
npm install
npm run start:go         # Expo Go: scan the QR code (plain `npx expo start` targets a development build)
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

## Push notifications

Every in-app notification (booking request, doctor confirmed, payment received, reminders…) is
also pushed to the phone. Tapping it opens Visits or Notifications. The patient is asked once,
from a card on Home; signing out stops pushes to that phone.

Pushes need a **development or store build** (Expo Go cannot receive them on Android) and this
one-time setup:

1. **Server table** — nothing to do on MySQL: the web app creates `push_tokens` on first use.
2. **Expo project** — creates `extra.eas.projectId` in `app.json`; commit that change.
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
3. **Android (Firebase Cloud Messaging)** — `google-services.json` for package
   `in.nestfy.medflow` is already in `mobile/` and referenced from `app.json`. What remains: in the
   Firebase console → Project settings → *Service accounts* → Generate new private key, and upload
   that JSON at expo.dev → project → Credentials → Android → *FCM V1 service account key*.
   **Never commit this file.**
4. **Firebase values for the build** — already filled in `eas.json` (the same public values the
   website ships). `.env` is git-ignored, so cloud builds read them from there instead.
5. **Build and install**
   ```bash
   npx eas-cli@latest build --profile preview --platform android
   ```
   `preview` gives an APK that runs on its own; `development` gives one that loads the code from
   `npx expo start` on your computer. Install it, sign in, tap **Turn on** on Home. To test, book
   a visit or send one from https://expo.dev/notifications.

iOS additionally needs a paid Apple Developer account; `eas build --platform ios` sets up the
push key when it asks.

Code: `src/lib/push.ts` (phone side), `src/lib/use-push.ts`, and on the server `src/lib/push.ts`,
`src/lib/notify.ts`, `/api/push/register`.

## Not built yet

- Google sign-in, editing the health profile, medical records / prescriptions
- Optional: Razorpay's native SDK and Daily's native SDK for a store build

## Layout

```
src/app/        routes (Expo Router): index (splash), login, register, (tabs)/*, doctor/[id], notifications
src/components/ shared UI (see above)
src/context/    auth (Firebase + /api/auth/me)
src/lib/        api client, types, formatting, clinic time
```
