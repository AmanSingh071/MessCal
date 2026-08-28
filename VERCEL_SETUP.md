# MessCal — Vercel deployment

This version is prepared for Vercel's serverless environment.

## 1. Deploy

### Easiest: Vercel dashboard
- Create/import a Vercel project from this folder/repository.
- Framework preset: Other (or let Vercel detect Express).
- Build command can remain the default; the included `vercel-build` is harmless.
- Deploy.

### CLI
```bash
npm i -g vercel
vercel login
vercel
```
For production:
```bash
vercel --prod
```

## 2. Add environment variables in Vercel

Project → Settings → Environment Variables → Production:

- `GOOGLE_CLIENT_ID` = your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` = your Google OAuth client secret
- `SESSION_SECRET` = a long random secret (32+ random characters)
- `APP_URL` = your production URL, for example `https://messcal-yourname.vercel.app`
- `ANTHROPIC_API_KEY` = optional, only needed for arbitrary PDFs that are not the included August sample

Do NOT put real secrets into Git. Vercel's environment variables are the correct place for production secrets.

## 3. Update Google OAuth

In Google Cloud → Google Auth Platform → Clients, add this exact production redirect URI:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/auth/google/callback
```

Also keep your local redirect URI if you still want local testing:

```text
http://localhost:3000/auth/google/callback
```

If you use a custom domain later, add its callback URI too.

## 4. Redeploy

Environment variable changes require a new deployment.

## 5. Important Vercel changes in this version

- Google OAuth state is stored in a short-lived encrypted HttpOnly cookie instead of server memory.
- Google OAuth tokens are stored per user in an encrypted HttpOnly cookie instead of a global Node variable. This makes the app compatible with stateless/serverless Vercel functions for this MVP.
- The Google calendar ID is looked up/created on each import instead of relying on server memory.
- PDF upload is capped at 4 MB because Vercel Functions have a 4.5 MB request payload limit; larger PDFs should use direct object storage uploads in a later version.
- Secrets are intentionally excluded from the deployment package.
