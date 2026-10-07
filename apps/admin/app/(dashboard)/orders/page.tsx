import { auth } from "@clerk/nextjs/server";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { OrderType } from "@repo/types";

// 502/503/504 from the order service mean "not reachable right now": a cold
// start on a sleeping Render instance, a restart, or a deploy in progress.
// Those are worth retrying. A 401/403/404/500 is not, so it fails right away.
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 20_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchOrders = async (url: string, token: string): Promise<Response> => {
  let lastFailure = "unknown";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response | undefined;

    try {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
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
      if (res.ok) return res;

      if (!RETRYABLE_STATUSES.has(res.status)) {
        throw new Error(`Order service responded with ${res.status}`);
      }

      lastFailure = `HTTP ${res.status}`;
      // Release the connection before retrying.
      await res.body?.cancel().catch(() => undefined);
    }

    if (attempt < MAX_ATTEMPTS) await sleep(attempt * 2000);
  }

  throw new Error(
    `Order service unavailable after ${MAX_ATTEMPTS} attempts (${lastFailure})`,
  );
};

const getData = async (): Promise<OrderType[]> => {
  // Strip a trailing slash so we never request "//orders".
  const baseUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL?.replace(
    /\/+$/,
    "",
  );
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_ORDER_SERVICE_URL is not set");
  }

  // auth() is deliberately NOT inside a try/catch: Next.js signals "this page
  // is dynamic" by throwing from it, and swallowing that error is what caused
  // the "Dynamic server usage" noise in the build log.
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    throw new Error("Could not verify your session");
  }

  const res = await fetchOrders(`${baseUrl}/orders`, token);

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Order service returned unexpected data");
  }

  return data as OrderType[];
};

// Failures are thrown on purpose: the dashboard's error.tsx shows
// "Something went wrong" with a Try again button, which is better than a
// misleading empty table that looks like there are no orders.
const OrdersPage = async () => {
  const data = await getData();
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Orders</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default OrdersPage;
