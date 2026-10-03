import { auth } from "@clerk/nextjs/server";
import { OrderType } from "@repo/types";
import OrdersTable from "../components/OrdersTable";

const fetchOrders = async (): Promise<OrderType[]> => {
  const { getToken } = await auth();
  const token = await getToken();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/user-orders`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    console.error(`Failed to fetch orders: ${res.status}`);
    return [];
  }

  const data: OrderType[] = await res.json();
  return data;
};

const OrdersPage = async () => {
  const orders = await fetchOrders();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-medium mb-6">Your Orders</h1>
      <OrdersTable orders={orders} />
    </div>
  );
};

export default OrdersPage;
