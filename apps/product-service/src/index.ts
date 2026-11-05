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

// Render injects PORT (10000 there). Locally this defaults to 8000, so it can't
// clash with another local service that is already sitting on 10000.
const port = Number(process.env.PORT) || 8000;

// Listen immediately. This service used to connect to Kafka BEFORE opening
// its port, so while Kafka was slow (or failing) Render saw no open port and
// the website got 502. The product service does not need Kafka any more:
// the only consumer of product.created / product.deleted was the payment
// service's Stripe sync, which no longer exists.
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Product service is running on ${port}`);
});

// If the port is already taken, say so and stop. Without this, the
// uncaughtException handler above swallowed the error: the service never
// started listening, while ANOTHER program kept answering on the same port
// and the admin app received that program's replies instead of products.
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Product service could NOT start: port ${port} is already in use by another program. ` +
        `Stop that program, or give this service a different PORT.`,
    );
  } else {
    console.error("Product service could not start listening:", error);
  }
  process.exit(1);
});