#!/usr/bin/env node
/**
 * First Depot keep-warm pinger.
 *
 * Sends a GET request to each service every 10 minutes so hosts that put idle
 * apps to sleep (Render, Railway, Fly, Vercel functions, etc.) stay awake.
 * Zero dependencies. Needs Node 18 or newer.
 *
 *   node scripts/keep-warm.mjs           run forever, ping every 10 minutes
 *   node scripts/keep-warm.mjs --once    ping once and exit (for cron / CI)
 *
 * Optional environment variables:
 *   KEEP_WARM_INTERVAL_MIN   minutes between rounds          (default 10)
 *   KEEP_WARM_URLS           comma separated URLs, replaces the default list
 *   KEEP_WARM_TIMEOUT_SEC    give up on one request after   (default 60)
 *   KEEP_WARM_ALERT_WEBHOOK  URL that gets a JSON {"text": "..."} when a
 *                            service is down (Slack/Discord-style webhook)
 */

const SERVICES = [
  "https://products.first-depot.com",
  "https://cart.first-depot.com",
  "https://orders.first-depot.com",
  "https://payment.first-depot.com",
];
// Tip: if a service has a lightweight health route, use it, e.g.
// "https://payment.first-depot.com/api/health". GET only; this script never
// sends anything else to the payment service.

const env = process.env;
const INTERVAL_MS = Number(env.KEEP_WARM_INTERVAL_MIN ?? 10) * 60_000;
const TIMEOUT_MS = Number(env.KEEP_WARM_TIMEOUT_SEC ?? 60) * 1000;
const URLS = env.KEEP_WARM_URLS
  ? env.KEEP_WARM_URLS.split(",").map((u) => u.trim()).filter(Boolean)
  : SERVICES;
const ONCE = process.argv.includes("--once");
const ALERT = env.KEEP_WARM_ALERT_WEBHOOK;

const stamp = () => new Date().toISOString();

// A sleeping app can take a minute to wake, so one failed try is retried once.
async function ping(url) {
  let last;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const started = Date.now();
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "manual", // a redirect to sign-in still proves the app is awake
        headers: { "user-agent": "first-depot-keep-warm/1.0", accept: "text/html,*/*" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      await res.arrayBuffer().catch(() => {}); // finish the response
      const ms = Date.now() - started;
      // Anything below 500 means the app answered (200, 3xx, 401, 404 all count).
      if (res.status < 500) return { url, ok: true, status: res.status, ms };
      last = { url, ok: false, status: res.status, ms };
    } catch (err) {
      last = { url, ok: false, error: err?.name === "TimeoutError" ? "timeout" : String(err?.cause?.code ?? err?.message ?? err), ms: Date.now() - started };
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, 5000));
  }
  return last;
}

async function round() {
  const results = await Promise.all(URLS.map(ping));
  for (const r of results) {
    console.log(`${stamp()}  ${r.ok ? "OK  " : "DOWN"}  ${r.url}  ${r.status ?? r.error}  ${r.ms}ms`);
  }
  const down = results.filter((r) => !r.ok);
  if (down.length && ALERT) {
    const text = "First Depot keep-warm: " + down.map((d) => `${d.url} (${d.status ?? d.error})`).join(", ") + " not responding";
    await fetch(ALERT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, content: text }),
    }).catch((e) => console.error(`${stamp()}  alert failed: ${e.message}`));
  }
  return down.length === 0;
}

if (ONCE) {
  const allUp = await round();
  process.exit(allUp ? 0 : 1);
} else {
  console.log(`${stamp()}  keep-warm started: ${URLS.length} services every ${INTERVAL_MS / 60_000} min`);
  // Wait for the previous round to finish before scheduling the next one.
  for (;;) {
    try { await round(); } catch (e) { console.error(`${stamp()}  round failed: ${e.message}`); }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}
