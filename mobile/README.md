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

Push notifications need an Expo project id and so do not run in a build made this way (the card is hidden); everything else works.

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
