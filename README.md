# MessCal — Vercel Ready

MessCal turns a monthly college mess-menu PDF into a reviewed monthly calendar and can sync the reviewed meals into a student's Google Calendar.

## Local

```bash
npm install
npm start
```

Open `http://localhost:3000`.

For local Google Calendar testing, copy `.env.example` to `.env` and set the Google OAuth values plus `SESSION_SECRET`.

## Vercel

This project is adapted for Vercel's Express deployment model. Google OAuth state and per-user Google tokens are kept in encrypted HttpOnly cookies instead of global server memory, so the app does not depend on a single long-running Node process.

Read `VERCEL_SETUP.md` before deploying.

### Important
- Do not commit `.env` or real API keys.
- Add production secrets in Vercel Project Settings → Environment Variables.
- Add the production Google OAuth callback URL to the Google OAuth client after you know your Vercel domain.
- PDF upload is limited to 4 MB in this Vercel-ready MVP because Vercel Functions have a 4.5 MB request payload limit. For larger PDFs, use direct object-storage uploads in a later version.

## Manage MessCal
The Export section includes:
- Remove MessCal events: deletes only Google Calendar events carrying the MessCal private tag.
- Disconnect Google Calendar: revokes the user's Google OAuth token when possible and clears the local authorization cookie.

This build uses the same existing Vercel project when deployed from a linked folder.
