import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { shouldBeUser } from "./middleware/authMiddleware.js";
import productRouter from "./routes/product.route";
import categoryRouter from "./routes/category.route";

const app = express();

// Comma-separated list, e.g.
// ALLOWED_ORIGINS=https://first-depot.com,https://admin.first-depot.com
// (no trailing slashes). Spaces around commas are tolerated.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:3003,http://localhost:3004"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(clerkMiddleware());

// Keep this endpoint dependency-free (no DB, no Kafka) and set it as the
// "Health Check Path" in Render, so Render only restarts the service when
// the process itself is really unresponsive.
app.get("/health", (req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.get("/test", shouldBeUser, (req, res) => {
  res.json({ message: "Product service authenticated", userId: req.userId });
});

app.use("/products", productRouter);
app.use("/categories", categoryRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error!" });
});

// Safety nets: log instead of letting a stray error kill the process
// (a dead process = Render answers 502 until it restarts).
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// Render injects PORT. Locally, set PORT=8000 in .env (or rely on the fallback).
const port = Number(process.env.PORT) || 8000;

// Listen immediately. This service used to connect to Kafka BEFORE opening
// its port, so while Kafka was slow (or failing) Render saw no open port and
// the website got 502. The product service does not need Kafka any more:
// the only consumer of product.created / product.deleted was the payment
// service's Stripe sync, which no longer exists.
app.listen(port, "0.0.0.0", () => {
  console.log(`Product service is running on ${port}`);
});