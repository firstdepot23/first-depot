import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { shouldBeUser } from "./middleware/authMiddleware.js";
import productRouter from "./routes/product.route";
import categoryRouter from "./routes/category.route";
import { consumer, producer } from "./utils/kafka.js";

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
  console.log(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Inter Server Error!" });
});

// Safety net: log a promise that nobody handled instead of letting Node
// terminate the process. A crash here shows up as 502 errors on the website
// until Render restarts the service.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

// Render injects PORT. Locally, set PORT=8000 in .env (or rely on the fallback).
const port = Number(process.env.PORT) || 8000;

const start = async () => {
  try {
    await Promise.all([producer.connect(), consumer.connect()]);
    // Explicit host so Render's proxy can always reach the service.
    app.listen(port, "0.0.0.0", () => {
      console.log(`Product service is running on ${port}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();