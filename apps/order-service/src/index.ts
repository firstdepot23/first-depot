import Fastify from "fastify";
import { clerkPlugin } from "@clerk/fastify";

import { shouldBeUser } from "./middleware/authMiddleware.js";
import { connectOrderDB } from "@repo/order-db";
import { orderRoute } from "./routes/order.js";
import cors from "@fastify/cors";

const fastify = Fastify();

fastify.addHook("onResponse", async (request, reply) => {
  if (request.url === "/health") return;
  console.log(`${request.method} ${request.url} -> ${reply.statusCode}`);
});

fastify.register(clerkPlugin);

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3004")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

fastify.register(cors, { origin: allowedOrigins });

fastify.get("/health", async (request, reply) => {
  return reply.status(200).send({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

fastify.get(
  "/test",
  { preHandler: shouldBeUser },
  async (request, reply) => {
    return reply.send({
      message: "Order service is authenticated!",
      userId: request.userId,
    });
  }
);

fastify.register(orderRoute);

const port = Number(process.env.PORT) || 8001;

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

// The order service only READS orders now. The payment service creates and
// updates them from Pesapal, so no Kafka consumer is needed here.
const start = async () => {
  try {
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Order service is listening on port ${port}`);

    await withTimeout(connectOrderDB(), 60_000, "MongoDB connection");
    console.log("MongoDB ready");
  } catch (err) {
    console.error("Order service failed to start:", err);
    process.exit(1);
  }
};

start();