import { auth } from "@clerk/nextjs/server";
import { OrderType } from "@repo/types";
import OrdersTable from "../components/OrdersTable";
import RetryButton from "../components/RetryButton";

type FetchResult =
  { ok: true; orders: OrderType[] } | { ok: false; message: string };

// Previously every failure (bad URL, 401, server asleep) returned [] and the
// page just looked like "no orders". Now each failure is logged with its
// status and shown to the user, so an empty list really means "no orders".
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

const OrdersPage = async () => {
  const result = await fetchOrders();

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
        <OrdersTable orders={result.orders} />
      )}
    </div>
  );
};

export default OrdersPage;
