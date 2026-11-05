import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { connectDb } from "./db";
import prescriptionRouter from "./routes/prescription.route";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3004")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
// Prescription uploads are multipart and parsed by multer on that route only;
// this limit just keeps the JSON routes (status updates) small.
app.use(express.json({ limit: "20kb" }));
app.use(clerkMiddleware());

// Keep this dependency-free (no DB) so Render's health check only restarts the
// service when the process itself is unresponsive.
app.get("/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

app.use("/prescriptions", prescriptionRouter);

const PORT = Number(process.env.PORT) || 8005;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`pharmacy-service listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to pharmacy-db:", error);
    process.exit(1);
  });