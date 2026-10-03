import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { connectCartDb } from "@repo/cart-db";
import cartRouter from "./routes/cart.route";

const app = express();

// Comma-separated list, e.g.
// ALLOWED_ORIGINS=https://your-client.onrender.com
// (no spaces, no trailing slashes). Falls back to localhost for local dev.
// If you open the client from another address locally (e.g. your LAN IP),
// add it to ALLOWED_ORIGINS in this service's local .env.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3004")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Populates req.auth for every request so requireAuth can read it.
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.use("/cart", cartRouter);

// Render injects PORT. Locally, set PORT=8004 in .env (or rely on the fallback).
const PORT = Number(process.env.PORT) || 8004;

connectCartDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`cart-service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to cart-db:", error);
    process.exit(1);
  });