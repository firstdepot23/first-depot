import { auth } from "@clerk/nextjs/server";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { OrderType } from "@repo/types";

const getData = async (): Promise<OrderType[]> => {
  const baseUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL;
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

  const res = await fetch(`${baseUrl}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    // Fail fast instead of hanging the page if the order service is asleep.
    signal: AbortSignal.timeout(8000),
  });

  // Without this check, a 401/403/500 JSON body such as {"message": "..."}
  // was passed to the table as if it were a list of orders and crashed it.
  if (!res.ok) {
    throw new Error(`Order service responded with ${res.status}`);
  }

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
