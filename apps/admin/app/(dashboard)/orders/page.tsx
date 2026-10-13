import { OrdersTable } from "./OrdersTable";
import { OrderApiError, orderFetch, readApiError } from "./order-api";
import {
  formatMoney,
  getShippingStatus,
  isPaid,
  type AdminOrder,
} from "./order-types";

const getData = async (): Promise<AdminOrder[]> => {
  const res = await orderFetch("/orders");
  if (!res.ok) {
    throw new OrderApiError(
      await readApiError(res, "Order service responded with an error"),
      res.status,
    );
  }

  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Order service returned unexpected data");
  }

  return data as AdminOrder[];
};

const Stat = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

// Failures are thrown on purpose: the dashboard's error.tsx shows
// "Something went wrong" with a Try again button, which is better than a
// misleading empty table that looks like there are no orders.
const OrdersPage = async () => {
  const orders = await getData();

  const paid = orders.filter(isPaid);
  const revenue = paid.reduce((sum, order) => sum + order.amount, 0);
  const toShip = paid.filter(
    (o) => getShippingStatus(o) === "processing",
  ).length;
  const onTheWay = paid.filter((o) => {
    const status = getShippingStatus(o);
    return status === "shipped" || status === "at_station";
  }).length;

  return (
    <div className="space-y-6">
      <div className="px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Orders</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Paid revenue" value={formatMoney(revenue)} />
        <Stat
          label="To ship"
          value={String(toShip)}
          hint="Paid, still processing"
        />
        <Stat
          label="On the way"
          value={String(onTheWay)}
          hint="Shipped or at a station"
        />
      </div>

      <OrdersTable orders={orders} />
    </div>
  );
};

export default OrdersPage;
