import { cn } from "../../lib/utils";
import {
  getPaymentStatus,
  getShippingStatus,
  shippingLabel,
  type AdminOrder,
  type PaymentStatusType,
  type ShippingStatusType,
} from "./order-types";

const Pill = ({
  tone,
  children,
}: {
  tone: string;
  children: React.ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
      tone,
    )}
  >
    <span className="size-1.5 rounded-full bg-current" aria-hidden />
    {children}
  </span>
);

const PAYMENT_TONES: Record<
  PaymentStatusType,
  { label: string; tone: string }
> = {
  COMPLETED: {
    label: "Paid",
    tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  PENDING: {
    label: "Pending",
    tone: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  },
  FAILED: {
    label: "Failed",
    tone: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
  REVERSED: {
    label: "Reversed",
    tone: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
};

export const SHIPPING_TONES: Record<ShippingStatusType, string> = {
  processing: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  shipped: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  at_station: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export const PaymentBadge = ({ order }: { order: AdminOrder }) => {
  const { label, tone } = PAYMENT_TONES[getPaymentStatus(order)];
  return <Pill tone={tone}>{label}</Pill>;
};

export const ShippingBadge = ({ order }: { order: AdminOrder }) => {
  const status = getShippingStatus(order);
  // Unpaid orders are never shipped, so there is nothing to show.
  if (!status) return <span className="text-muted-foreground">-</span>;
  return (
    <Pill tone={SHIPPING_TONES[status]}>
      {shippingLabel(status, order.deliveryMethod)}
    </Pill>
  );
};
