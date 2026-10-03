import { createServer } from "node:http";
import sendMail from "./utils/mailer";
import { createConsumer, createKafkaClient } from "@repo/kafka/src";

const kafka = createKafkaClient("email-service");
const consumer = createConsumer(kafka, "email-service");

// This service only consumes Kafka messages and has no API. Render Web
// Services must listen on a port, so if PORT is set (Web Service) we expose
// a tiny /health endpoint. As a Background Worker, or locally, PORT is not
// needed and nothing is started.
if (process.env.PORT) {
  const port = Number(process.env.PORT);
  createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
  }).listen(port, () => {
    console.log(`Email service health check listening on port ${port}`);
  });
}

const start = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe([
      {
        topicName: "user.created",
        topicHandler: async (message) => {
          const { email, username } = message.value;

          if (email) {
            await sendMail({
              email,
              subject: "Welcome to FIRST DEPOT",
              text: `Welcome ${username}. Your account has been created!`,
            });
          }
        },
      },
      {
        topicName: "order.created",
        topicHandler: async (message) => {
          const { email, amount, status } = message.value;

          if (email) {
            await sendMail({
              email,
              subject: "Order has been created",
              text: `Hello! Your order: Amount: ${amount / 100}, Status: ${status}`,
            });
          }
        },
      },
    ]);
  } catch (error) {
    console.log(error);
    // Exit so Render restarts the service instead of leaving it running
    // without a working consumer.
    process.exit(1);
  }
};

start();