# Opatra VeRO Tracker

Finds eBay listings that use the Opatra trademark, scores them for likely
infringement, and gives you a dashboard to review and file VeRO takedown
reports from. Built on Firebase (Auth, Firestore, Cloud Functions, Hosting) +
React (Vite).

## How it works

1. A scheduled Cloud Function (`scheduledEbayScan`, every 6 hours) searches
   eBay's official **Browse API** for your configured brand keywords across
   your configured marketplaces.
2. Each result is scored by a heuristic (`functions/detection.js`) - keyword
   match, high-risk terms ("replica", "fake", "wholesale", ...), price far
   below typical retail, and whether the seller is on your authorized
   reseller allowlist - and stored in Firestore.
3. The dashboard (`/`, `/listings`) shows what was found, why it was flagged,
   and lets you mark a listing as an authorized reseller, dismiss it, or
   prepare a VeRO report.
4. "Prepare VeRO report" generates a pre-filled infringement notice from your
   trademark details (Settings) and the listing's evidence. **You still
   review and submit it yourself** through eBay's VeRO portal - see "Why
   reporting isn't automated" below.

## Why reporting isn't automated

VeRO submissions are legal takedown claims. Two things rule out full
automation here:

- eBay does not publish a public API for filing VeRO reports - submissions
  go through the VeRO member portal/web form. Automating that web UI would
  violate eBay's terms of use and risks your VeRO account being suspended.
- Even if it were technically possible, filing unreviewed automated
  trademark claims risks false positives against legitimate sellers
  (authorized resellers, secondhand sales, nominative fair use) and creates
  real legal exposure for Opatra. The detection scoring is a triage aid, not
  a legal determination.

So the tool takes you right up to the point of submission - pre-filled text,
one click to copy it, a link to your VeRO portal - and asks a human to send
it.

## One-time setup

### 1. Firebase project

- Create a Firebase project (or use an existing one) at
  [console.firebase.google.com](https://console.firebase.google.com).
- Enable **Authentication** (Email/Password provider) and create an account
  for each person who should access the dashboard - there's no self-signup.
- Enable **Firestore** (production mode).
- Copy `.env.example` to `.env` and fill in the web app config from Project
  Settings > General > Your apps.
- Log in with the Firebase CLI (`npx firebase-tools login`) and run
  `npx firebase-tools use --add` to point this repo at your project.

### 2. eBay Developer API credentials

- Register at [developer.ebay.com](https://developer.ebay.com), create an
  application, and get **production** keys for the Browse API (Client ID /
  Client Secret).
- Store them as Firebase secrets (never commit these):
  ```
  cd functions
  npx firebase-tools functions:secrets:set EBAY_CLIENT_ID
  npx firebase-tools functions:secrets:set EBAY_CLIENT_SECRET
  ```

### 3. eBay VeRO enrollment

- Apply for eBay's VeRO program if you haven't already (proof of trademark
  ownership required). Once enrolled, note your VeRO portal URL - you'll
  paste it into the app's Settings page so "Open eBay VeRO portal" links
  straight there.

### 4. Configure the brand in-app

After deploying (or running locally) and signing in, go to **Settings** and
fill in:

- Brand keywords to search for (defaults to "Opatra", "Opatra London")
- eBay marketplaces to search (e.g. `EBAY_GB`, `EBAY_US`)
- Authorized reseller eBay usernames (their listings get auto-tagged instead
  of flagged)
- Typical retail price (used to flag suspiciously cheap listings)
- Trademark registration details and VeRO portal URL (used in generated
  reports)

## Local development

```
npm install
npm run dev
```

The dashboard needs a real Firebase project's Auth + Firestore to do
anything useful. To develop against the local Firebase emulators instead
(no real data, safe to experiment):

```
npx firebase-tools emulators:start --only auth,firestore,functions
```

and set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` alongside any (even
fake) `VITE_FIREBASE_*` values.

## Deployment

```
npm run build
npx firebase-tools deploy
```

This deploys Hosting (the built dashboard), the Cloud Functions, and
Firestore rules/indexes.

## Manually triggering a scan

The Overview page has a "Scan eBay now" button (calls the `runEbayScanNow`
callable function) if you don't want to wait for the 6-hourly schedule.
