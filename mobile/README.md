# MedFlow mobile

React Native app (Expo SDK 58, Expo Router) for all three MedFlow roles — patient, doctor and platform admin. The role comes from the account, so the same app opens the right screens after sign-in. It talks to the same
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

## What is in the app

**Everyone:** sign in with Google or email, create an account (with the consent tick), reset a password, notifications, and an **Auto / Light / Dark** theme switch (on the sign-in screens and on each "Me" tab). The choice is remembered.

**Patient** (`/home`, `/visits`, `/book`, `/doctors`, `/profile`) — next visit, specialty picker, doctor search, slot booking, visits with cancel, pay online and join video visits, **prescriptions** (View prescription on a visit, share as text), health details (edit phone, birth date, blood type, allergies, conditions, medicines, height/weight, emergency contact), **rate a completed visit** (stars + comment).

**Doctor** (`/clinic/*`) — *Today* (stats, requests waiting, today's visits), *Visits* (requests / upcoming / today / past with confirm, decline, complete, video join), *Hours* (weekly hours, minutes per visit, days off), *Patients*, *Me* (edit profile, 6-month chart). Visit detail has the patient's intake and notes, and a **prescription** editor (medicines with dose, how often and for how long, advice, follow-up date) for confirmed and completed visits.

**Platform admin** (`/admin/*`) — *Overview* (numbers and charts), *Doctors* (verify or hide, add a doctor), *Users* (search, suspend, make doctor, back to patient), *Activity* (paged audit log).

## Design: Liquid Glass

Everything translucent is built from `src/components/ui/GlassSurface.tsx`: a real blur of what is behind it, a faint tint, a bright specular sheen, a light edge that fades across the surface and a soft shadow. It sits on a vivid animated backdrop (`Backdrop.tsx`), because glass only reads as glass over something colourful. On Android the backdrop is an `expo-blur` `BlurTargetView` that each glass surface blurs.

- `theme.ts` — light and dark palettes; `lib/theme-pref.ts` — the Auto / Light / Dark choice.
- `GlassCard`, `GlassChip`, `GlassSwitch`, `Segmented` (a lens that slides and stretches), `Field`, `Button` (glossy accent glass), `GlossCard` (the one hero card per screen).
- `TabBar.tsx` — floating glass bar with a sliding lens and a raised glowing centre button; each role passes its own tabs.
- `components/icons/` — the MedFlow icon set: duotone icons that draw themselves in (`AnimatedIcon`).
- Reanimated drives the motion on the UI thread; entrances stagger with `Reveal`.

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

Every in-app notification (booking request, doctor confirmed, payment received, prescription ready, reminders…) is also pushed to the phone. Tapping it opens Visits or Notifications. The patient is asked once, from a card on Home; signing out stops pushes to that phone.

**Android goes straight through Firebase** (FCM) — no Expo account. The phone gives the server its Firebase device token and the server sends with the same service account the site already uses to verify sign-ins (`FIREBASE_ADMIN_*`, `src/lib/fcm.ts`). It needs:

1. `google-services.json` in `mobile/` (already there) — it is what lets the app get a token.
2. The **Firebase Cloud Messaging API (V1)** enabled for the Firebase project (Project settings → Cloud Messaging; it is on by default).
3. The site's Firebase service account (`FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY`) set on the server — the same one sign-in uses. If the `push_tokens` table already exists, run `mysql/migrations/002_push_tokens_fcm.sql` once (Firebase tokens are longer).
4. Install the APK, sign in, tap **Turn on** on Home and allow notifications.

Expo Go cannot receive pushes. iOS additionally needs an Expo project (`npx eas-cli@latest init`), an Apple Developer account and an Expo push token; the server sends those through Expo's push service (`EXPO_ACCESS_TOKEN` only if "enhanced push security" is on).

Code: `src/lib/push.ts` (phone side), `src/lib/use-push.ts`, and on the server `src/lib/push.ts`, `src/lib/fcm.ts`, `src/lib/notify.ts`, `/api/push/register`.

## Google sign-in

The native Google account picker gives a Google token, which Firebase turns into the same account the website uses (`src/lib/google.ts`). It needs two things on Google's side, once:

1. In the Firebase console → Project settings → Your apps → the Android app `in.nestfy.medflow` → **Add fingerprint**, and paste the **SHA-1 of the keystore that signs the APK** (`keytool -list -v -keystore medflow-release.jks -alias medflow`). Until this is done the app says "Google does not recognise this build yet".
2. Firebase console → Authentication → Sign-in method → **Google** must be enabled (the website already needs this).

New Google accounts become patients, like on the web. An account that already has an email + password sign-in with the same address must use that password.

## Build without Expo

`scripts/build-android.sh` makes a signed release APK on your own machine; no Expo account or cloud build is involved (Expo's open-source tooling still generates the native project). You need JDK 17, the Android SDK (platform 37, build-tools 37.0.0, NDK 27.1.12297006, CMake 3.22.1) and a release keystore:

```bash
keytool -genkeypair -keystore medflow-release.jks -alias medflow -keyalg RSA -keysize 2048 -validity 10000
export ANDROID_HOME=$HOME/android-sdk MEDFLOW_KEYSTORE=$PWD/medflow-release.jks MEDFLOW_KEYSTORE_PASSWORD=...
./scripts/build-android.sh
```

The first build takes 10–25 minutes; the APK lands in `dist/`. **Keep the keystore and its password safe and out of git** — every update must be signed with the same key, and Google sign-in is tied to its SHA-1.


## Not built yet

- Medical records (report uploads)
- Prescription as a PDF (today it is shared as text)
- Optional: Razorpay's native SDK and Daily's native SDK for a store build

## Layout

```
src/app/        routes (Expo Router): index (splash), login, register, (tabs)/*, doctor/[id], notifications
src/components/ shared UI (see above)
src/context/    auth (Firebase + /api/auth/me)
src/lib/        api client, types, formatting, clinic time
```
