import Fastify from "fastify";
import { clerkPlugin } from "@clerk/fastify";

import { shouldBeUser } from "./middleware/authMiddleware.js";
import { connectOrderDB } from "@repo/order-db";
import { orderRoute } from "./routes/order.js";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscriptions.js";

const fastify = Fastify();

fastify.register(clerkPlugin);

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