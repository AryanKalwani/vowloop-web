// Cloudflare Pages Function: owns /invite and /invite/<token>.
//
// Why a Function instead of the static invite.html:
// A static invite.html makes Cloudflare canonicalise clean URLs, so a request to
// /invite/<token> gets a 307 redirect to /invite — which STRIPS the token. The
// landing page then can't recover it and the "Open in VowLoop" button dead-ends
// on the home page. A Function takes precedence over static-asset routing, serves
// the page at the original URL (HTTP 200, no redirect), and embeds the token
// server-side so the button always has it.

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const match = url.pathname.match(/\/invite\/([^/?#]+)/);
  const token = match ? decodeURIComponent(match[1]) : "";

  return new Response(renderInvite(token), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}

function renderInvite(token) {
  const hasToken = token.length > 0;
  // encodeURIComponent output is URL-safe (no quotes/backslashes/angle brackets),
  // so these are safe to interpolate into both attributes and JS string literals.
  const enc = encodeURIComponent(token);
  const appUrl = hasToken ? `vowloop://invite/${enc}` : "";
  const universalUrl = hasToken ? `https://vowloop.app/invite/${enc}` : "/";
  const ctaLabel = hasToken ? "Open in VowLoop" : "Go to VowLoop";
  const ctaHref = hasToken ? appUrl : "/";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your VowLoop invite</title>
    <meta name="description" content="You've been invited to a VowLoop accountability agreement. Open it in the app to review and accept." />
    <meta name="referrer" content="no-referrer" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="theme-color" content="#131110" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="stylesheet" href="/styles.css" />
    <style>
      .invite-wrap { min-height: 100svh; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; }
      .invite-card { width: 100%; max-width: 420px; background: var(--bg-high); border: 1px solid var(--border-mid); border-radius: 24px; padding: 36px 28px 32px; box-shadow: var(--shadow); }
      .invite-badge { display: inline-block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary-soft); background: var(--primary-muted); border: 1px solid var(--primary-border); padding: 6px 12px; border-radius: 999px; margin-bottom: 20px; }
      .invite-card h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 700; font-size: 26px; line-height: 1.2; color: var(--text); margin: 0 0 12px; }
      .invite-card p { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, sans-serif; font-size: 15px; line-height: 1.55; color: var(--text-soft); margin: 0 0 24px; }
      .invite-cta { display: block; width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, sans-serif; font-weight: 700; font-size: 16px; color: var(--bg); background: var(--primary); border: none; border-radius: 14px; padding: 15px 20px; text-decoration: none; cursor: pointer; }
      .invite-cta:hover { color: var(--bg); background: var(--primary-soft); opacity: 1; }
      .invite-foot { margin-top: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Roboto, sans-serif; font-size: 13px; color: var(--text-muted); }
      .invite-foot a { color: var(--primary-soft); }
    </style>
  </head>
  <body>
    <main class="invite-wrap">
      <section class="invite-card">
        <span class="invite-badge">VowLoop invite</span>
        <h1>You've been invited to an agreement</h1>
        <p>Open this invite in the VowLoop app to review the rules, the stake, and accept.</p>
        <a id="openApp" class="invite-cta" href="${ctaHref}">${ctaLabel}</a>
        <p class="invite-foot">
          Don't have the app yet? VowLoop is in private beta &mdash;
          <a href="/">join the waitlist</a> and we'll get you in.
        </p>
      </section>
    </main>
    <script>
      (function () {
        var appUrl = "${appUrl}";
        var universalUrl = "${universalUrl}";
        var btn = document.getElementById("openApp");
        if (!appUrl) { return; }
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          // Custom scheme opens the app directly if installed (works from Safari).
          window.location.href = appUrl;
          // If nothing handled it, fall back to the universal link after a beat.
          setTimeout(function () { window.location.href = universalUrl; }, 700);
        });
      })();
    </script>
  </body>
</html>`;
}
