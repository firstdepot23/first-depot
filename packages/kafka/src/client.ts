import { readFileSync } from "node:fs";
import { Kafka, type KafkaConfig } from "kafkajs";

// Local dev: no env vars needed, it connects to your local broker.
//
// Hosted (Aiven, Confluent, etc.) - set on every service that uses Kafka:
//   KAFKA_BROKERS=host:port[,host:port]
//   KAFKA_USERNAME=...
//   KAFKA_PASSWORD=...
//   KAFKA_SASL_MECHANISM=plain | scram-sha-256 | scram-sha-512   (default: plain)
//   KAFKA_SSL=true | false                  (default: true when credentials/certs are set)
//
// CA certificate (Aiven needs this because it uses its own project CA).
// Provide ONE of:
//   KAFKA_CA_PATH=/etc/secrets/aiven-ca.pem     (Render Secret File - recommended)
//   KAFKA_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
//
// Optional, only if you use certificate auth instead of SASL:
//   KAFKA_CLIENT_CERT_PATH / KAFKA_CLIENT_CERT
//   KAFKA_CLIENT_KEY_PATH  / KAFKA_CLIENT_KEY

const readPem = (value?: string, path?: string) => {
  if (value) return value.replace(/\\n/g, "\n");
  if (path) return readFileSync(path, "utf8");
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

  const ca = readPem(process.env.KAFKA_CA_CERT, process.env.KAFKA_CA_PATH);
  const cert = readPem(
    process.env.KAFKA_CLIENT_CERT,
    process.env.KAFKA_CLIENT_CERT_PATH,
  );
  const key = readPem(
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