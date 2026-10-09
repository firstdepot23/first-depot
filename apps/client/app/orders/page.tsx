import { auth } from "@clerk/nextjs/server";
import { OrderType } from "@repo/types";
import AutoRefresh from "../components/AutoRefresh";
import OrdersTable from "../components/OrdersTable";
import RetryButton from "../components/RetryButton";

type FetchResult =
  { ok: true; orders: OrderType[] } | { ok: false; message: string };

const isPending = (order: OrderType) => order.paymentStatus === "PENDING";

const requestOrders = async (
  baseUrl: string,
  token: string,
): Promise<FetchResult> => {
  try {
    const res = await fetch(`${baseUrl}/user-orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`Failed to fetch orders: ${res.status} ${body}`);

      if (res.status === 401) {
        return {
          ok: false,
          message:
            "We couldn't verify your sign-in. Try signing out and back in.",
        };
      }
      return { ok: false, message: "We couldn't load your orders right now." };
    }

    const data = await res.json();
    return {
      ok: true,
      orders: Array.isArray(data) ? (data as OrderType[]) : [],
    };
  } catch (error) {
    console.error("Couldn't reach the order service:", error);
    return {
      ok: false,
      message:
        "Couldn't reach the orders service. It may be waking up - try again in a few seconds.",
    };
  }
};

// Asks the payment service to re-check this customer's unpaid orders with
// Pesapal. Best effort: if it fails we still show what is stored.
// Returns true if the request went through.
const syncPendingPayments = async (token: string): Promise<boolean> => {
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;
  if (!paymentUrl) {
    console.warn(
      "NEXT_PUBLIC_PAYMENT_SERVICE_URL is not set - pending payments are only updated by Pesapal's IPN",
    );
    return false;
  }

  try {
    const res = await fetch(`${paymentUrl}/payments/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (error) {
    console.error("Payment sync failed (showing stored orders):", error);
    return false;
  }
};

const fetchOrders = async (): Promise<FetchResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_ORDER_SERVICE_URL is not set");
    return { ok: false, message: "The orders service isn't configured." };
  }

  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    return { ok: false, message: "Please sign in to see your orders." };
  }

  let result = await requestOrders(baseUrl, token);

  // Something is still PENDING: ask Pesapal (via the payment service) for the
  // real status, then load the orders again so the page shows it.
  if (result.ok && result.orders.some(isPending)) {
    if (await syncPendingPayments(token)) {
      result = await requestOrders(baseUrl, token);
    }
  }

  return result;
};

const OrdersPage = async () => {
  const result = await fetchOrders();
  const hasPending = result.ok && result.orders.some(isPending);

  return (
    <div className="mx-auto max-w-5xl py-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-medium">Your Orders</h1>

      {!result.ok ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
          <p>{result.message}</p>
          <RetryButton />
        </div>
      ) : result.orders.length === 0 ? (
        <p className="text-sm text-gray-500">
          You haven&apos;t placed any orders yet.
        </p>
      ) : (
        <>
          {hasPending && (
            <>
              <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
                We&apos;re confirming a payment with Pesapal. This page updates
                automatically.
              </p>
              <AutoRefresh />
            </>
          )}
          <OrdersTable orders={result.orders} />
        </>
      )}
    </div>
  );
};

export default OrdersPage;
