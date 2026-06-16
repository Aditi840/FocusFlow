# FocusFlow — Complete Build Guide
# From zero to APK in ~30 minutes, all free

## STEP 1 — Install Prerequisites (one-time)

```bash
# Install Node.js (if not installed)
# Download from https://nodejs.org (LTS version)

# Install Expo CLI
npm install -g expo-cli eas-cli

# Install Android Studio (for local builds)
# https://developer.android.com/studio
# During install, enable: Android SDK, Android SDK Platform, Android Virtual Device
```

## STEP 2 — Set Up Supabase (Free Database)

1. Go to https://supabase.com → Create account (free)
2. Click "New Project" → name it "focusflow" → pick a region close to India (e.g. Singapore)
3. Save your password somewhere safe
4. Go to Settings → API → copy:
   - Project URL  →  paste into app.json as "supabaseUrl"
   - anon public key → paste into app.json as "supabaseAnonKey"
5. Go to SQL Editor → New Query → paste ALL of src/lib/schema.sql → Run
6. Go to SQL Editor → New Query → paste ALL of src/lib/subscription_schema.sql → Run
7. Go to Authentication → Providers → enable Email and Google

## STEP 3 — Set Up Razorpay (Free to register)

1. Go to https://dashboard.razorpay.com → Sign up (free)
2. Complete KYC (required for live payments, takes 1-2 days)
3. Go to Settings → API Keys → Generate Key
4. Copy Key ID → paste into src/lib/subscription.ts as YOUR_RAZORPAY_KEY_ID
5. Install the native module:
   npm install react-native-razorpay

## STEP 4 — Clone & Install

```bash
# In your terminal:
cd focusflow-app
npm install

# If any peer dependency issues:
npm install --legacy-peer-deps
```

## STEP 5 — Run on your Android phone (fastest way)

```bash
# Install Expo Go on your Android phone from Play Store
# Then run:
npx expo start

# Scan the QR code with Expo Go
# The app loads instantly on your phone — live reload included
```

## STEP 6 — Build a real APK (shareable, no Play Store needed)

### Option A: EAS Cloud Build (RECOMMENDED — no Android Studio needed)

```bash
# Login to Expo
eas login

# Create EAS project
eas build:configure

# Build APK (free tier: 30 builds/month)
eas build --platform android --profile apk

# Wait ~10-15 minutes → you get a download link for the .apk file
# Share this link with anyone — they can install it directly
```

### Option B: Local build (needs Android Studio)

```bash
# Generate native Android folder
npx expo prebuild --platform android

# Build APK locally
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

## STEP 7 — Install APK on Android phone

```bash
# Via USB:
adb install android/app/build/outputs/apk/release/app-release.apk

# Or share the EAS download link — user opens in browser → Install
# (User needs to enable "Install from unknown sources" in phone settings)
```

## STEP 8 — Publish to Google Play Store (optional)

```bash
# Build AAB (required for Play Store)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android

# Requirements:
# - Google Play Developer account: $25 one-time fee
# - AAB file from above command
# - App icon, screenshots, description
```

---

## FREE TIER SUMMARY

| Service        | Free Limit                          | Cost After |
|----------------|-------------------------------------|------------|
| Supabase DB    | 500MB, unlimited auth               | $25/month  |
| EAS Build      | 30 builds/month                     | $99/month  |
| Expo Go        | Unlimited during development        | Free       |
| Razorpay       | 0% setup, 2% per transaction        | 2% per txn |
| Google Play    | $25 one-time                        | $25 once   |

## FOLDER STRUCTURE

```
focusflow-app/
├── app/
│   ├── _layout.tsx          ← Root layout, auth guard, trial check
│   ├── (auth)/
│   │   ├── login.tsx        ← Login, signup, OTP, forgot password
│   │   └── paywall.tsx      ← 30-day trial, ₹99 Razorpay payment
│   └── (tabs)/
│       ├── _layout.tsx      ← Tab bar with trial countdown banner
│       ├── home.tsx         ← Dashboard, habits, XP, scores
│       ├── focus.tsx        ← Pomodoro timer, sounds
│       ├── reflect.tsx      ← Daily journal, mood tracking
│       ├── insights.tsx     ← AI Brain — all 4 ML models
│       └── rewards.tsx      ← Achievements, challenges
├── src/
│   ├── lib/
│   │   ├── supabase.ts      ← Supabase client + TypeScript types
│   │   ├── schema.sql       ← Full PostgreSQL schema with RLS
│   │   ├── subscription.ts  ← Trial logic + Razorpay integration
│   │   └── subscription_schema.sql
│   ├── ml/
│   │   └── engine.ts        ← Prophet + IsoForest + Sentiment + ColabFilter
│   ├── store/
│   │   └── index.ts         ← Zustand global state with MMKV persistence
│   └── theme/
│       └── index.ts         ← Light/dark theme tokens
├── app.json                 ← Expo config, permissions
├── eas.json                 ← APK + Play Store build profiles
└── package.json             ← All dependencies

## ENVIRONMENT VARIABLES (never commit these)

Create a .env file:
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
RAZORPAY_KEY_ID=rzp_live_xxxx

Add .env to .gitignore!
```
