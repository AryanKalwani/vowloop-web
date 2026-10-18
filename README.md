# vowloop-web

Static marketing + legal site for [VowLoop](https://vowloop.app). Zero build step, deploys straight to Cloudflare Workers (or any static host).

## Layout

```
/                       index.html        — generic landing
/for/creators/          niche A — founders, writers, indie hackers
/for/fitness/           niche B — runners, gym, training
/for/study/             niche C — LSAT, MCAT, CFA, bar prep
/for/focus/             niche D — screen time, doomscroll, digital reset
/privacy.html           privacy policy
/terms.html             terms of service
/support                support.html      — contact + FAQ
/styles.css             shared Kept Word tokens, mirrors the app theme
/waitlist.js            shared form handler → POSTs to Supabase edge function
/.well-known/apple-app-site-association   universal links (Apple team ID required)
```

Each niche page is identical scaffolding with a swapped hero block + example agreement card. Footers, "how it works", and "why" sections are constants across all pages so the A/B test isolates niche resonance only.

## Run locally

```bash
npx serve .
# or
python3 -m http.server 4321
```

## Deploy

- vowloop.app is a Cloudflare Workers project that serves the repo root as static assets. Pushes to `main` deploy it.
- `.assetsignore` keeps `.git`, `public/`, `functions/` and `README.md` out of the deployed assets.
- `_redirects` rewrites `/invite/<token>` to `/invite`, the invite page (`invite.html`).
- `public/` is a stale copy of the site and isn't served.

## Waitlist backend

Form submits go to the Supabase edge function `waitlist_signup` (lives in the app repo at `backend/supabase/functions/waitlist_signup`). Deployed URL:

```
https://mmzmpwhefmvsgxyutjlc.supabase.co/functions/v1/waitlist_signup
```

`waitlist.js` POSTs `{ email, niche, utms }`. The `niche` is derived from the URL path (`/for/<niche>` → `<niche>`; root → `general`). UTM params are forwarded so Reddit / ad attribution lands in the `waitlist_signups` table.

## A/B / niche attribution

UTM convention per Reddit subreddit:

```
https://vowloop.app/for/fitness?utm_source=reddit&utm_medium=organic&utm_campaign=r_loseit
https://vowloop.app/for/creators?utm_source=reddit&utm_medium=organic&utm_campaign=r_SideProject
```

The Supabase table records both `niche` (URL path) and `utms` (query params), so you can query "which subreddit drove the most signups for which niche" directly.

## Universal links & invite deep links

Partner invite links (`https://vowloop.app/invite/<token>`) open the VowLoop app
directly when it's installed, and fall back to a landing page otherwise.

- **iOS** — `.well-known/apple-app-site-association` (appID `77975GL4GA.app.vowloop.mobile`,
  paths `/invite/*`). Served as `application/json` via `_headers`.
- **Android** — `.well-known/assetlinks.json` (package `app.vowloop.mobile`).
  ⚠️ Replace `REPLACE_WITH_ANDROID_SHA256_FINGERPRINT` with the production signing
  cert's SHA-256, from `cd mobile-pixel && eas credentials` (Android → production
  keystore → "SHA256 Fingerprint").
- **Web fallback** — `_redirects` rewrites `/invite/*` → `/invite.html` (HTTP 200,
  URL preserved) so non-app users get a real page instead of a download/404.
  `invite.html` reads the token and offers an "Open in VowLoop" button.

After deploying, verify:
- `curl -sI https://vowloop.app/.well-known/apple-app-site-association` → `200` +
  `content-type: application/json`, **no** `content-disposition`.
- Apple's cache: <https://app-site-association.cdn-apple.com/a/v1/vowloop.app>
- `curl -sI https://vowloop.app/invite/test-token` → `200` + `text/html`.

## Stack

- Pure HTML / CSS / vanilla JS, no framework, no bundler
- Inter (body) + Fraunces (display) + IBM Plex Mono (ledger labels) via Google Fonts
- Palette mirrors the app's "Kept Word" tokens (`mobile-pixel/src/theme.ts`)

The privacy and terms text is honest about the app's actual data flow but is **not legal advice** — get a lawyer review before launching in regulated jurisdictions.
