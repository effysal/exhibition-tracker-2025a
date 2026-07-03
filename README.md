# Opatra VeRO Tracker

Finds eBay listings that use the Opatra trademark, scores them for likely
infringement, and gives you a dashboard to review and file VeRO takedown
reports from. Single Node.js service (Express + React/Vite frontend +
Postgres) built to run on Railway.

## How it works

1. A scheduled job (`server/cron.js`, every 6 hours, plus an on-demand "Scan
   eBay now" button) searches eBay's official **Browse API** for your
   configured brand keywords across your configured marketplaces.
2. Each result is scored by a heuristic (`server/detection.js`) - keyword
   match, high-risk terms ("replica", "fake", "wholesale", ...), price far
   below typical retail, and whether the seller is on your authorized
   reseller allowlist - and stored in Postgres.
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

## Architecture

- **Frontend**: React (Vite), built to static assets and served by the same
  Express server as the API - one deployable, one URL.
- **Backend**: Express (`server/index.js`) - REST API under `/api/*`, plus
  the scheduled eBay scan (`node-cron`).
- **Database**: Postgres (`server/db.js` creates its own schema on startup -
  no separate migration step).
- **Auth**: Custom email/password login - `bcryptjs` for hashing, a JWT in an
  httpOnly cookie for sessions. There's no self-signup; accounts are created
  via a CLI script (see below).

## One-time setup

### 1. Deploy to Railway

- Create a new Railway project from this repo.
- Add a **Postgres** plugin to the project - Railway wires `DATABASE_URL`
  into your service automatically.
- On the service, set environment variables:
  - `JWT_SECRET` - a long random string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
  - `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET` - see step 2
  - `NODE_ENV=production`
- Railway builds with `npm run build` and starts with `npm start`
  (`railway.json` pins these explicitly).

### 2. eBay Developer API credentials

- Register at [developer.ebay.com](https://developer.ebay.com), create an
  application, and get **production** keys for the Browse API (Client ID /
  Client Secret). Set them as `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` on the
  Railway service.

### 3. eBay VeRO enrollment

- Apply for eBay's VeRO program if you haven't already (proof of trademark
  ownership required). Once enrolled, note your VeRO portal URL - you'll
  paste it into the app's Settings page so "Open eBay VeRO portal" links
  straight there.

### 4. Create your login

There's no signup form - create an account with the CLI script, run once
against the deployed database (e.g. via `railway run`, or locally with
`DATABASE_URL` pointed at the Railway Postgres instance):

```
npm run create-user -- you@opatra.com "a strong password"
```

Run it again with the same email to reset a password.

### 5. Configure the brand in-app

After deploying and signing in, go to **Settings** and fill in:

- Brand keywords to search for (defaults to "Opatra", "Opatra London")
- eBay marketplaces to search (e.g. `EBAY_GB`, `EBAY_US`)
- Authorized reseller eBay usernames (their listings get auto-tagged instead
  of flagged)
- Typical retail price (used to flag suspiciously cheap listings)
- Trademark registration details and VeRO portal URL (used in generated
  reports)

## Local development

You need a local (or remote) Postgres instance:

```
createdb opatra_vero
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET; PGSSL=false for local
npm install
npm run start           # API + scan scheduler on :3000
npm run create-user -- you@example.com "yourpassword"
```

In a second terminal, run the frontend with hot reload (proxies `/api` to
the server above):

```
npm run dev
```

Open the Vite URL it prints (typically `http://localhost:5173`).

## Deployment (manual, outside Railway)

```
npm install
npm run build
npm start
```

Serves the built dashboard and the API from a single process on `$PORT`
(default 3000). Needs `DATABASE_URL`, `JWT_SECRET`, `EBAY_CLIENT_ID`,
`EBAY_CLIENT_SECRET` in the environment.

## Manually triggering a scan

The Overview page has a "Scan eBay now" button (`POST /api/scan`) if you
don't want to wait for the 6-hourly schedule.
