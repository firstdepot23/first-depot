import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { clerkMiddleware } from "@hono/clerk-auth";
import { cors } from "hono/cors";
import { connectOrderDB } from "@repo/order-db";
import { producer } from "./utils/kafka.js";
import webhookRoute from "./routes/webhooks.route.js";
import mobileMoneyRoute from "./routes/mobilemoney.route.js";
import bankCardRoute from "./routes/bankcard.route.js";

const app = new Hono();

// Comma-separated list, no spaces, no trailing slashes. Falls back to localhost.
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

app.route("/webhooks", webhookRoute);
app.route("/mobile-money", mobileMoneyRoute);
app.route("/bank-card", bankCardRoute);

const port = Number(process.env.PORT) || 8002;

// Listen first so the host (Render) sees the port immediately.
serve({ fetch: app.fetch, port }, () => {
  console.log(`Payment service is running on port ${port}`);
});

const start = async () => {
  try {
    // MongoDB: used to store pending payments (user + cart) between
    // payment initiation and the Pesapal IPN.
    await connectOrderDB();
    console.log("MongoDB ready");

    await producer.connect();
    console.log("Kafka producer ready");

    console.log("Payment service fully started");
  } catch (error) {
    console.error("Payment service failed to start:", error);
    process.exit(1);
  }
};

start();