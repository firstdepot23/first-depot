import dns from "node:dns";
import mongoose from "mongoose";
import { usableUri } from "./srv";

let connecting: Promise<unknown> | null = null;
let dnsConfigured = false;

// Some networks (and some ISPs' DNS servers) can't answer the SRV lookup that
// "mongodb+srv://" connection strings need, which fails with
// "querySrv ETIMEOUT". Setting MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 makes
// Node use public DNS for this process only.
const configureDns = () => {
  if (dnsConfigured) return;
  dnsConfigured = true;
  const servers = (process.env.MONGODB_DNS_SERVERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (servers.length > 0) dns.setServers(servers);
};

const CONNECT_BUDGET_MS = 25_000;

// Same pattern as blog-db: safe to call before every query, concurrent
// callers share one in-flight connect.
export const connectQuoteDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in env file!");
  }

  configureDns();

  if (!connecting) {
    const uri = process.env.MONGODB_URI;
    const attempt = usableUri(uri)
      .then((resolved) =>
        mongoose.connect(resolved, {
          serverSelectionTimeoutMS: 10_000,
          connectTimeoutMS: 10_000,
        }),
      )
      .catch((error) => {
        connecting = null; // allow a retry on the next call
        console.error(error);
        throw error;
      });

    // The SRV DNS lookup is not covered by the driver's own timeouts and can
    // hang for ~a minute, so cap the whole attempt.
    let timer: ReturnType<typeof setTimeout>;
    const budget = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        connecting = null;
        reject(
          new Error(
            `Could not reach MongoDB within ${CONNECT_BUDGET_MS / 1000}s. ` +
              "If the error mentions querySrv/ETIMEOUT, DNS is the problem: " +
              "set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 or use Atlas's non-SRV connection string.",
          ),
        );
      }, CONNECT_BUDGET_MS);
    });
    connecting = Promise.race([attempt, budget]).finally(() => clearTimeout(timer));
    // Avoid an unhandled rejection from the losing branch.
    attempt.catch(() => {});
  }
  await connecting;
};
