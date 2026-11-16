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
| Visits | Upcoming / past, cancel (two-tap confirm) |
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

## Not built yet (need a development build, not Expo Go)

- Online payment (Razorpay) after the doctor confirms
- Video visits (Daily)
- Push notifications (needs a device-token table and `/api/push` on the web app)
- Google sign-in, editing the health profile, medical records / prescriptions

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
