import dns from "node:dns";

// Fallback for networks where the DNS SRV/TXT lookups behind
// "mongodb+srv://" time out (querySrv ETIMEOUT) but ordinary HTTPS works.
// We ask Cloudflare's DNS-over-HTTPS service for the same two records the
// driver would have asked for, and build the plain "mongodb://" string the
// driver would have built. Only used when the normal lookup fails.

type DohAnswer = { type: number; data: string };
type Fetch = typeof fetch;

const doh = async (name: string, type: "SRV" | "TXT", f: Fetch) => {
  const res = await f(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { accept: "application/dns-json" }, signal: AbortSignal.timeout(6_000) },
  );
  if (!res.ok) throw new Error(`DNS-over-HTTPS ${type} lookup failed (${res.status})`);
  const json = (await res.json()) as { Answer?: DohAnswer[] };
  return json.Answer ?? [];
};

/** mongodb+srv://user:pw@cluster/db?x=y  ->  mongodb://user:pw@h1:27017,h2:27017/db?x=y&tls=true&... */
export const srvToStandardUri = async (uri: string, f: Fetch = fetch) => {
  const m = uri.match(/^mongodb\+srv:\/\/(?:([^@/]*)@)?([^/?#]+)(\/[^?#]*)?(?:\?([^#]*))?/);
  if (!m) throw new Error("Not a mongodb+srv:// connection string");
  const [, userinfo, host, path = "/", query = ""] = m;

  const [srv, txt] = await Promise.all([
    doh(`_mongodb._tcp.${host}`, "SRV", f),
    doh(host!, "TXT", f).catch(() => [] as DohAnswer[]),
  ]);

  const hosts = srv
    .filter((a) => a.type === 33)
    .map((a) => {
      const [, , port, target] = a.data.trim().split(/\s+/);
      return `${(target ?? "").replace(/\.$/, "")}:${port}`;
    })
    .filter((h) => !h.startsWith(":"));
  if (hosts.length === 0) throw new Error(`No SRV records found for ${host}`);

  const params = new URLSearchParams(query);
  // TXT holds the replica set / auth source, e.g. "authSource=admin&replicaSet=atlas-xyz-shard-0"
  for (const a of txt.filter((t) => t.type === 16)) {
    const raw = a.data.replace(/^"|"$/g, "").replace(/"\s*"/g, "");
    new URLSearchParams(raw).forEach((v, k) => {
      if (!params.has(k)) params.set(k, v);
    });
  }
  if (!params.has("tls") && !params.has("ssl")) params.set("tls", "true");

  return `mongodb://${userinfo ? `${userinfo}@` : ""}${hosts.join(",")}${path}?${params.toString()}`;
};

/** Returns the URI to use: unchanged unless it is +srv and the normal lookup is failing. */
export const usableUri = async (uri: string, f: Fetch = fetch): Promise<string> => {
  if (!uri.startsWith("mongodb+srv://")) return uri;
  const host = uri.match(/^mongodb\+srv:\/\/(?:[^@/]*@)?([^/?#]+)/)?.[1];
  if (!host) return uri;

  try {
    await Promise.race([
      dns.promises.resolveSrv(`_mongodb._tcp.${host}`),
      new Promise((_, rej) => setTimeout(() => rej(new Error("SRV lookup timed out")), 4_000)),
    ]);
    return uri; // normal DNS works
  } catch (error) {
    console.warn(
      `MongoDB: SRV lookup failed (${(error as Error).message}); resolving over HTTPS instead.`,
    );
    return srvToStandardUri(uri, f);
  }
};
