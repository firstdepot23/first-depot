import { existsSync, readFileSync } from "node:fs";
import { Kafka, type KafkaConfig } from "kafkajs";

const readPem = (name: string, value?: string, path?: string) => {
  if (value) return value.replace(/\\n/g, "\n");
  if (path) {
    // A path copied from another machine (e.g. Render's /etc/secrets/...)
    // is the most common cause of a startup crash, so say so clearly.
    if (!existsSync(path)) {
      throw new Error(
        `${name}: file not found at "${path}". If this path came from your ` +
          `hosting provider, set a path that exists on this machine, or put ` +
          `the PEM contents in the matching *_CERT variable instead.`,
      );
    }
    return readFileSync(path, "utf8");
  }
  return undefined;
};

export const createKafkaClient = (service: string) => {
  const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

  const username = process.env.KAFKA_USERNAME;
  const password = process.env.KAFKA_PASSWORD;
  const mechanism = (process.env.KAFKA_SASL_MECHANISM ?? "plain").toLowerCase();

  const ca = readPem(
    "KAFKA_CA_PATH",
    process.env.KAFKA_CA_CERT,
    process.env.KAFKA_CA_PATH,
  );
  const cert = readPem(
    "KAFKA_CLIENT_CERT_PATH",
    process.env.KAFKA_CLIENT_CERT,
    process.env.KAFKA_CLIENT_CERT_PATH,
  );
  const key = readPem(
    "KAFKA_CLIENT_KEY_PATH",
    process.env.KAFKA_CLIENT_KEY,
    process.env.KAFKA_CLIENT_KEY_PATH,
  );

  const hasCredentials = Boolean(username && password);
  const useSsl =
    process.env.KAFKA_SSL !== undefined
      ? process.env.KAFKA_SSL !== "false"
      : hasCredentials || Boolean(ca || cert || key);

  const config: KafkaConfig = {
    clientId: service,
    brokers,
  };

  if (useSsl) {
    config.ssl = ca || cert || key ? { ca: ca ? [ca] : undefined, cert, key } : true;
  }

  if (hasCredentials) {
    if (mechanism === "scram-sha-256") {
      config.sasl = { mechanism: "scram-sha-256", username: username!, password: password! };
    } else if (mechanism === "scram-sha-512") {
      config.sasl = { mechanism: "scram-sha-512", username: username!, password: password! };
    } else {
      config.sasl = { mechanism: "plain", username: username!, password: password! };
    }
  }

  if (
    process.env.NODE_ENV === "production" &&
    brokers.some((b) => b.startsWith("localhost"))
  ) {
    console.warn(
      "Kafka is pointing at localhost in production. Set KAFKA_BROKERS and credentials.",
    );
  }

  return new Kafka(config);
};