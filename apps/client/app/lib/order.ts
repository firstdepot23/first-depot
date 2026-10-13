import type { OrderType } from "@repo/types";

// How long a customer has to pay. Pesapal's checkout session lasts about 5
// minutes, so a payment still "pending" after that was cancelled or timed
// out. KEEP IN SYNC with PAYMENT_WINDOW_MS in
// apps/payment-service/src/utils/orders.ts (the server is what actually marks
// the order failed; this copy only decides when the page stops waiting).
export const PAYMENT_WINDOW_MS = 5 * 60 * 1000;

type PendingFields = Pick<OrderType, "paymentStatus" | "createdAt">;

const createdAtMs = (order: PendingFields) =>
  order.createdAt ? new Date(order.createdAt).getTime() : 0;

/** Milliseconds left in this payment's session. 0 or less = it has ended. */
export const sessionTimeLeftMs = (order: PendingFields, now: number) =>
  createdAtMs(order) + PAYMENT_WINDOW_MS - now;

/** Still pending AND still inside its 5 minute session: worth waiting for. */
export const isActivePending = (order: PendingFields, now: number) =>
  order.paymentStatus === "PENDING" && sessionTimeLeftMs(order, now) > 0;

/** Still pending in the database but its session is over: cancelled/timed out. */
export const isStalePending = (order: PendingFields, now: number) =>
  order.paymentStatus === "PENDING" && sessionTimeLeftMs(order, now) <= 0;
// ---------------------------------------------------------------------------
// Shipping / tracking (the admin changes shippingStatus on the order page)
// ---------------------------------------------------------------------------

// processing -> shipped -> at_station -> delivered
export const SHIPPING_STEPS = [
  "processing",
  "shipped",
  "at_station",
  "delivered",
] as const;
export type ShippingStep = (typeof SHIPPING_STEPS)[number];

type PaidFields = Pick<OrderType, "paymentStatus" | "status">;
type TrackedFields = PaidFields &
  Pick<OrderType, "shippingStatus" | "deliveryMethod">;

// Orders saved before Pesapal statuses existed only have the old `status`.
export const isPaidOrder = (order: PaidFields) =>
  order.paymentStatus === "COMPLETED" ||
  (!order.paymentStatus && order.status === "success");

/**
 * Where the parcel is. Unpaid orders are never shipped (null). Paid orders
 * the admin hasn't touched yet count as "processing".
 */
export const getShippingStep = (order: TrackedFields): ShippingStep | null => {
  if (!isPaidOrder(order)) return null;
  const value = order.shippingStatus as string | null | undefined;
  return (SHIPPING_STEPS as readonly string[]).includes(value ?? "")
    ? (value as ShippingStep)
    : "processing";
};

// Pickup orders skip "shipped": they go straight to the store.
export const stepsFor = (method?: string | null): ShippingStep[] =>
  method === "pickup"
    ? ["processing", "at_station", "delivered"]
    : [...SHIPPING_STEPS];

// Position of `current` in `steps` (the closest step at or before it, in case
// the order is on a step this delivery method doesn't list).
export const stepPosition = (steps: ShippingStep[], current: ShippingStep) => {
  const rank = SHIPPING_STEPS.indexOf(current);
  let position = -1;
  steps.forEach((step, index) => {
    if (SHIPPING_STEPS.indexOf(step) <= rank) position = index;
  });
  return position;
};

/** Customer-facing wording for a step. */
export const shippingCopy = (
  step: ShippingStep,
  method?: string | null,
  city?: string | null,
): { label: string; detail: string } => {
  const pickup = method === "pickup";
  switch (step) {
    case "processing":
      return {
        label: "Processing",
        detail: "We've received your order and are getting it ready.",
      };
    case "shipped":
      return { label: "Shipped", detail: "Your order is on its way." };
    case "at_station":
      return pickup
        ? {
            label: "Ready for pickup",
            detail: "Your order is ready. Come and collect it from our store.",
          }
        : {
            label: "At the station",
            detail: `Your order has arrived at the station${city ? ` in ${city}` : ""}.`,
          };
    case "delivered":
      return pickup
        ? {
            label: "Collected",
            detail: "You've collected your order. Thank you for shopping with us.",
          }
        : {
            label: "Delivered",
            detail: "You've received your order. Thank you for shopping with us.",
          };
  }
};

export const formatMoney = (amount: number, currency?: string | null) =>
  `${currency || "UGX"} ${amount.toLocaleString("en-UG")}`;

export const formatDateTime = (date: string | Date | undefined | null) =>
  date
    ? new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";