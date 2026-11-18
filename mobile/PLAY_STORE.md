# Publishing MedFlow on Google Play

The code side is ready; these are the things only you can supply.

## 1. Build the bundle

Google Play wants an `.aab`, not an `.apk`. Same keystore, same script:

```bash
export ANDROID_HOME=$HOME/android-sdk MEDFLOW_KEYSTORE=$PWD/medflow-release.jks MEDFLOW_KEYSTORE_PASSWORD=...
AAB=1 ./scripts/build-android.sh      # → dist/MedFlow-<version>.aab
```

Every upload needs a higher `android.versionCode` in `app.json` (it is `1` now). Bump it, and `version` if you like, before each release.

Sign with the **same keystore every time** — Google Sign-In is tied to its SHA-1, and Play will refuse an update signed with a different key. (Or enrol in Play App Signing, then add Play's SHA-1 to Firebase too.)

## 2. What Play will ask for

| Item | What to give |
|---|---|
| App name, short and full description | "MedFlow — book a doctor"; copy from https://app.nestfy.in |
| **Privacy policy URL** | `https://app.nestfy.in/privacy` (already live) |
| App icon 512×512 | export from `assets/images/icon.png` |
| Feature graphic 1024×500 | design needed |
| Phone screenshots (2–8) | take them from the installed app: Home, Doctors, booking, a visit, a prescription |
| Content rating | Health & medical. Answer the questionnaire honestly (no violence etc.) |
| Target audience | 18+ (accounts are for adults; family members are added by an adult) |
| Contact email | the support email on the site's contact page |

## 3. Data safety form

Collected and linked to the person: name, email, phone, date of birth, health information (allergies, conditions, medicines, prescriptions, uploaded reports), payment history (amount and status; card or UPI details go to Razorpay, never to MedFlow), photos/files the person uploads, approximate crash information (server log, not linked to an account). Data is encrypted in transit (HTTPS). Users can delete their reports in the app and ask for account deletion through the contact page.

Permissions the app declares: notifications, camera and photos (only when the person attaches a report), biometrics (only if the app lock is turned on), internet.

## 4. Account deletion

Play requires a way to request deletion. Today it is by email from the contact page; add that sentence to the Data safety form and the store listing.

## 5. Before the first release

- Test the `.aab`-built app with an internal testing track (Play Console → Testing → Internal testing) before production.
- Turn on Razorpay **live** keys on the server only when you are ready to take real payments.
