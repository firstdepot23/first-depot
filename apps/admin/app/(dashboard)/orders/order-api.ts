import { auth } from "@clerk/nextjs/server";

// 502/503/504 from the order service mean "not reachable right now": a cold
// start on a sleeping Render instance, a restart, or a deploy in progress.
// Those are worth retrying (for reads). A 401/403/404/500 is not.
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 20_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class OrderApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

const getBaseUrl = () => {
  // Strip a trailing slash so we never request "//orders".
  const baseUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new OrderApiError("NEXT_PUBLIC_ORDER_SERVICE_URL is not set");
  return baseUrl;
};

const getAuthToken = async () => {
  // auth() is deliberately NOT inside a try/catch: Next.js signals "this page
  // is dynamic" by throwing from it.
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) throw new OrderApiError("Could not verify your session", 401);
  return token;
};

// Calls the order service as the signed-in admin.
// GET requests retry on cold starts; writes are sent once so a retry can
// never create the same order twice.
export const orderFetch = async (
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<Response> => {
  const url = `${getBaseUrl()}${path}`;
  const token = await getAuthToken();
  const method = init.method ?? "GET";
  const maxAttempts = method === "GET" ? MAX_ATTEMPTS : 1;
  let lastFailure = "unknown";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res: Response | undefined;

    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.body !== undefined && { "Content-Type": "application/json" }),
        },
        body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // "fetch failed" hides the real reason (ECONNREFUSED, ENOTFOUND,
      // timeout...) in error.cause, so surface it.
      const err = error as Error & {
        cause?: { code?: string; message?: string };
      };
      lastFailure = err.cause?.code ?? err.cause?.message ?? err.name;
    }

    if (res) {
      // Callers handle 4xx themselves (404 -> notFound, 400 -> form error).
      if (!RETRYABLE_STATUSES.has(res.status)) return res;

      lastFailure = `HTTP ${res.status}`;
      // Release the connection before retrying.
      await res.body?.cancel().catch(() => undefined);
    }

    if (attempt < maxAttempts) await sleep(attempt * 2000);
  }

  throw new OrderApiError(
    `Order service unavailable after ${maxAttempts} attempt${maxAttempts > 1 ? "s" : ""} (${lastFailure})`,
  );
};

// Reads the order service's { message } error body, falling back to the status.
export const readApiError = async (res: Response, fallback: string) => {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? `${fallback} (${res.status})`;
  } catch {
    return `${fallback} (${res.status})`;
  }
};