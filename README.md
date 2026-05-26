# vowloop-web

Static marketing + legal site for [VowLoop](https://vowloop.app). Zero build step, deploys straight to Cloudflare Pages (or any static host).

## Layout

```
/                       index.html        — generic landing
/for/creators/          niche A — founders, writers, indie hackers
/for/fitness/           niche B — runners, gym, training
/for/study/             niche C — LSAT, MCAT, CFA, bar prep
/for/focus/             niche D — screen time, doomscroll, digital reset
/privacy.html           privacy policy
/terms.html             terms of service
/styles.css             shared Neon Discipline tokens, mirrors the app theme
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

## Deploy to Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select this repo.
3. Build settings: build command empty, output directory `/` (root).
4. Add custom domain `vowloop.app` once DNS is on Cloudflare.

Pushes to `main` auto-deploy.

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

## Universal links

`.well-known/apple-app-site-association` is a placeholder. Before publishing to the App Store, replace `REPLACE_WITH_TEAM_ID` with your Apple Developer Team ID (10 chars, from <https://developer.apple.com/account>).

## Stack

- Pure HTML / CSS / vanilla JS, no framework, no bundler
- Inter (body) + Manrope (display) via Google Fonts
- Palette mirrors the app's "Neon Discipline" tokens (`mobile-pixel/src/theme.ts`)

The privacy and terms text is honest about the app's actual data flow but is **not legal advice** — get a lawyer review before launching in regulated jurisdictions.
