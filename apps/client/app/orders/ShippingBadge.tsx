import type { OrderType } from "@repo/types";
import { getShippingStep, shippingCopy, type ShippingStep } from "../lib/order";

const STYLES: Record<ShippingStep, string> = {
  processing: "bg-amber-50 text-amber-700",
  shipped: "bg-sky-50 text-sky-700",
  at_station: "bg-violet-50 text-violet-700",
  delivered: "bg-green-50 text-green-700",
};

// Shows where a paid order is. Unpaid orders have nothing to track.
const ShippingBadge = ({ order }: { order: OrderType }) => {
  const step = getShippingStep(order);
  if (!step) return <span className="text-gray-400">-</span>;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[step]}`}
    >
      {shippingCopy(step, order.deliveryMethod).label}
    </span>
  );
};

export default ShippingBadge;
