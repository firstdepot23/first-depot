import Fastify from "fastify";
import { clerkPlugin } from "@clerk/fastify";

import { shouldBeUser } from "./middleware/authMiddleware.js";
import { connectOrderDB } from "@repo/order-db";
import { orderRoute } from "./routes/order.js";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscriptions.js";
import cors from "@fastify/cors";

const fastify = Fastify();

// One log line per request (skipping /health, which Render hits constantly),
// so you can see in Render's logs whether the orders page reached this
// service and what status it got back.
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

// Render injects PORT. Locally, set PORT=8001 in .env (or rely on the fallback).
const port = Number(process.env.PORT) || 8001;

const start = async () => {
  try {
    await connectOrderDB();
    await producer.connect();
    await consumer.connect();

    await runKafkaSubscriptions();

    await fastify.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`Order service is running on port ${port}`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

start();