import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { shouldBeAdmin } from "./middleware/authMiddleware";
import userRoute from "./routes/user.route";
import { producer } from "./utils/kafka.js";

const app = express();

// Comma-separated list, e.g.
// ALLOWED_ORIGINS=https://your-admin.onrender.com
// (no spaces, no trailing slashes). Falls back to localhost for local dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3003")
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

app.use("/users", shouldBeAdmin, userRoute);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.log(err);
  return res
    .status(err.status || 500)
    .json({ message: err.message || "Inter Server Error!" });
});

// Render injects PORT. Locally, set PORT=8003 in .env (or rely on the fallback).
const port = Number(process.env.PORT) || 8003;

const start = async () => {
  try {
    await producer.connect();
    app.listen(port, () => {
      console.log(`Auth service is running on ${port}`);
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();