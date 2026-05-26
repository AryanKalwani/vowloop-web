/*
 * Waitlist form handler.
 *
 * Each .waitlist <form> on the page is captured. On submit:
 *  - We derive the niche from the URL path (`/for/<niche>` → "<niche>"; root → "general").
 *  - We capture every utm_* query param so Reddit/ads attribution flows through.
 *  - We POST to the public Supabase edge function `waitlist_signup`.
 *  - Success / duplicate / error messaging renders inline.
 *
 * Endpoint URL is set via <script data-endpoint="..."> or window.WAITLIST_ENDPOINT.
 * Falls back to the deployed production URL.
 */
(function () {
  const SCRIPT_TAG = document.currentScript;
  const FALLBACK_ENDPOINT =
    "https://mmzmpwhefmvsgxyutjlc.supabase.co/functions/v1/waitlist_signup";
  const SUPABASE_ANON_KEY = ""; // edge function is open (verify_jwt = false); no anon header required

  const endpoint =
    (SCRIPT_TAG && SCRIPT_TAG.dataset && SCRIPT_TAG.dataset.endpoint) ||
    window.WAITLIST_ENDPOINT ||
    FALLBACK_ENDPOINT;

  function deriveNiche() {
    const path = window.location.pathname || "/";
    const match = path.match(/\/for\/([a-z0-9-]+)/i);
    if (match && match[1]) return match[1].toLowerCase();
    return "general";
  }

  function collectUtms() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    for (const [key, value] of params.entries()) {
      if (key.startsWith("utm_") && value) {
        out[key] = String(value).slice(0, 200);
      }
    }
    // also pass referrer when present, so Reddit posts that strip UTMs are still attributed
    if (document.referrer) out.referrer = document.referrer.slice(0, 500);
    return out;
  }

  function setMessage(form, text, tone) {
    const msg = form.querySelector(".waitlist-msg");
    if (!msg) return;
    msg.textContent = text;
    msg.classList.remove("ok", "err");
    if (tone) msg.classList.add(tone);
  }

  async function submit(form) {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector("button");
    const email = (input.value || "").trim();
    if (!email) {
      setMessage(form, "Drop your email above first.", "err");
      input.focus();
      return;
    }

    const niche = form.dataset.niche || deriveNiche();
    const utms = collectUtms();

    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = "...";
    setMessage(form, "", null);

    try {
      const headers = { "Content-Type": "application/json" };
      if (SUPABASE_ANON_KEY) headers["apikey"] = SUPABASE_ANON_KEY;

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, niche, utms }),
      });

      if (res.status === 200 || res.status === 201) {
        setMessage(form, "You're on the list. We'll be in touch.", "ok");
        input.value = "";
      } else if (res.status === 409) {
        setMessage(form, "You're already on the list — thank you.", "ok");
        input.value = "";
      } else if (res.status === 429) {
        setMessage(form, "Too many tries from this network. Try again in a minute.", "err");
      } else if (res.status === 400) {
        setMessage(form, "That email didn't look right. Try again.", "err");
      } else {
        setMessage(form, "Something went wrong on our end. Try again shortly.", "err");
      }
    } catch (err) {
      setMessage(form, "Network error. Check your connection and retry.", "err");
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  function bind() {
    const forms = document.querySelectorAll("form.waitlist");
    forms.forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        submit(form);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
