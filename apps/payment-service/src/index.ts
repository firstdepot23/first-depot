import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { clerkMiddleware } from "@hono/clerk-auth";
import sessionRoute from "./routes/session.route.js";
import { cors } from "hono/cors";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscriptions.js";
import webhookRoute from "./routes/webhooks.route.js";
import mobileMoneyRoute from "./routes/mobilemoney.route.js";
import bankCardRoute from "./routes/bankcard.route.js";

const app = new Hono();

// Comma-separated list, e.g.
// ALLOWED_ORIGINS=https://your-client.onrender.com,https://your-admin.onrender.com
// (no spaces, no trailing slashes). Falls back to localhost for local dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3004")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS first, so browser preflight (OPTIONS) requests are answered
// before Clerk's middleware runs.
app.use("*", cors({ origin: allowedOrigins }));
app.use("*", clerkMiddleware());

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.route("/sessions", sessionRoute);
app.route("/webhooks", webhookRoute);
app.route("/mobile-money", mobileMoneyRoute);
app.route("/bank-card", bankCardRoute);

// Render injects PORT. Locally, set PORT=8002 in .env (or rely on the fallback).
const port = Number(process.env.PORT) || 8002;

const start = async () => {
  try {
    // Connect both at once; if either fails we jump to the catch below.
    await Promise.all([producer.connect(), consumer.connect()]);
    await runKafkaSubscriptions();

    serve({ fetch: app.fetch, port }, () => {
      console.log(`Payment service is running on port ${port}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();