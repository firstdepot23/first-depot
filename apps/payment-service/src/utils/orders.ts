import { Order, type PaymentStatusType } from "@repo/order-db";
import { producer } from "./kafka";
import {
  getPesapalTransactionStatus,
  type PesapalTransactionStatus,
} from "./pesapal";
import type { DeliveryCity, DeliveryMethod } from "./delivery";
import type { Shipping } from "./checkout";

export type CartLine = {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
  selectedSize: string;
  selectedColor: string;
};

// Pesapal status_code: 0 INVALID, 1 COMPLETED, 2 FAILED, 3 REVERSED.
export const toPaymentStatus = (
  result: Pick<
    PesapalTransactionStatus,
    "status_code" | "payment_status_description"
  >,
): PaymentStatusType => {
  switch (Number(result.status_code)) {
    case 1:
      return "COMPLETED";
    case 2:
      return "FAILED";
    case 3:
      return "REVERSED";
  }

  // Fall back to the text, in case the code is ever missing. Pesapal's own
  // sample responses use mixed case ("Failed"), so compare upper-cased.
  switch (String(result.payment_status_description ?? "").toUpperCase()) {
    case "COMPLETED":
      return "COMPLETED";
    case "FAILED":
      return "FAILED";
    case "REVERSED":
      return "REVERSED";
    default:
      return "PENDING"; // 0 / INVALID = not paid (yet)
  }
};

// Legacy `status` field, mirrored so the admin app and chart keep working.
const LEGACY_STATUS: Record<
  PaymentStatusType,
  "success" | "failed" | "pending"
> = {
  COMPLETED: "success",
  FAILED: "failed",
  REVERSED: "failed",
  PENDING: "pending",
};

// Which existing statuses a new Pesapal status may overwrite. Stops a late or
// stale response from undoing a payment (e.g. COMPLETED -> PENDING/FAILED).
// null = may always overwrite. A FAILED payment CAN become COMPLETED, because
// Pesapal lets the customer retry on the same hosted page.
const CAN_REPLACE: Record<PaymentStatusType, PaymentStatusType[] | null> = {
  COMPLETED: null,
  REVERSED: null,
  FAILED: ["PENDING", "FAILED"],
  PENDING: ["PENDING"],
};

// How long a customer has to pay. Pesapal's checkout session lasts about 5
// minutes; after that a payment that is still PENDING was cancelled or timed
// out. KEEP IN SYNC with PAYMENT_WINDOW_MS in apps/client/app/lib/orders.ts.
export const PAYMENT_WINDOW_MS = 5 * 60 * 1000;

export type OrderDraft = {
  userId: string;
  email: string;
  merchantReference: string;
  cart: CartLine[];
  subtotal: number;
  deliveryFee: number;
  amount: number; // subtotal + deliveryFee: what Pesapal charges
  deliveryMethod: DeliveryMethod;
  deliveryCity: DeliveryCity;
  shipping: Shipping;
};

/**
 * Creates the Order (status PENDING) BEFORE the customer pays, then starts the
 * Pesapal payment. The Order itself remembers who is paying, what they bought
 * and where it goes, and Pesapal's IPN / status calls update it in place.
 */
export const placeOrder = async <T extends { reference: string }>(
  input: OrderDraft,
  startPayment: () => Promise<T>,
): Promise<T> => {
  const order = await Order.create({
    userId: input.userId,
    email: input.email,
    amount: input.amount,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    currency: "UGX",
    deliveryMethod: input.deliveryMethod,
    deliveryCity: input.deliveryCity,
    shipping: input.shipping,
    merchantReference: input.merchantReference,
    paymentStatus: "PENDING",
    status: "pending",
    confirmationSent: false,
    cartCleared: false,
    products: input.cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      productId: String(item.id),
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
    })),
  });

  let result: T;
  try {
    result = await startPayment();
  } catch (error) {
    // Pesapal never accepted the order, so there is nothing to track.
    await Order.deleteOne({ _id: order._id }).catch(() => undefined);
    throw error;
  }

  // result.reference is Pesapal's order_tracking_id.
  await Order.updateOne(
    { _id: order._id },
    { $set: { orderTrackingId: result.reference } },
  );

  return result;
};

/**
 * Asks Pesapal for the real status of a payment and stores it on the Order.
 * Safe to call any number of times, from the IPN, the status endpoint or the
 * orders page - the confirmation event is only published once.
 */
export const syncOrderWithPesapal = async (
  orderTrackingId: string,
  merchantReferenceHint?: string,
) => {
  const result = await getPesapalTransactionStatus(orderTrackingId);
  const paymentStatus = toPaymentStatus(result);

  const merchantReference = result.merchant_reference || merchantReferenceHint;
  const identity = merchantReference
    ? { $or: [{ orderTrackingId }, { merchantReference }] }
    : { orderTrackingId };

  const paidAt = new Date(result.created_date);

  const update = {
    orderTrackingId,
    paymentStatus,
    status: LEGACY_STATUS[paymentStatus],
    statusCode: Number(result.status_code),
    ...(result.payment_method && { paymentMethod: result.payment_method }),
    ...(result.payment_account && { paymentAccount: result.payment_account }),
    ...(result.confirmation_code && {
      confirmationCode: result.confirmation_code,
    }),
    ...(result.currency && { currency: result.currency }),
    ...((result.description || result.message) && {
      statusDescription: result.description || result.message,
    }),
    ...(paymentStatus === "COMPLETED" && {
      paidAt: Number.isNaN(paidAt.getTime()) ? new Date() : paidAt,
    }),
  };

  const allowed = CAN_REPLACE[paymentStatus];
  const updated = await Order.findOneAndUpdate(
    allowed ? { ...identity, paymentStatus: { $in: allowed } } : identity,
    {
      $set: update,
      // A real Pesapal result (completed, failed, reversed) replaces our own
      // "session expired" verdict. This is what lets a payment that finished
      // a little late still become COMPLETED.
      ...(paymentStatus !== "PENDING" && { $unset: { expiredAt: "" } }),
    },
    { new: true },
  );

  // null = not found, OR a stale response we deliberately didn't apply.
  const order = updated ?? (await Order.findOne(identity));
  if (!order) {
    throw new Error(
      `No order found for Pesapal tracking id ${orderTrackingId} (merchant reference ${merchantReference ?? "unknown"})`,
    );
  }

  let notifyFailed = false;
  if (order.paymentStatus === "COMPLETED") {
    notifyFailed = !(await announceOrder(order._id));
  }

  return { order, notifyFailed };
};

// Publishes "order.created" (the email service listens for it) exactly once
// per order. Returns false if publishing failed, so the caller can retry later.
const announceOrder = async (orderId: unknown): Promise<boolean> => {
  // Atomically claim it, so concurrent IPN / polling calls can't double-send.
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, confirmationSent: { $ne: true } },
    { $set: { confirmationSent: true } },
  );
  if (!claimed) return true; // already announced

  try {
    await producer.send("order.created", {
      value: {
        email: claimed.email,
        amount: claimed.amount,
        status: "success",
        deliveryMethod: claimed.deliveryMethod,
        deliveryFee: claimed.deliveryFee,
        shipping: claimed.shipping
          ? {
              name: claimed.shipping.name,
              phone: claimed.shipping.phone,
              address: claimed.shipping.address,
              city: claimed.shipping.city,
            }
          : undefined,
      },
    });
    return true;
  } catch (error) {
    console.error("order.created publish failed:", error);
    // Release the claim so the next IPN / status call tries again.
    await Order.updateOne(
      { _id: orderId },
      { $set: { confirmationSent: false } },
    ).catch(() => undefined);
    return false;
  }
};

type OrderLike = {
  orderTrackingId?: string | null;
  merchantReference: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  paymentAccount?: string | null;
  confirmationCode?: string | null;
  statusDescription?: string | null;
};

// Same shape the client already polls for: pending | successful | failed.
const toClientStatus = (paymentStatus: string) =>
  paymentStatus === "COMPLETED"
    ? ("successful" as const)
    : paymentStatus === "FAILED" || paymentStatus === "REVERSED"
      ? ("failed" as const)
      : ("pending" as const);

export const toStatusResponse = (order: OrderLike) => ({
  reference: order.orderTrackingId ?? order.merchantReference,
  merchantReference: order.merchantReference,
  status: toClientStatus(order.paymentStatus),
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod ?? undefined,
  paymentAccount: order.paymentAccount ?? undefined,
  confirmationCode: order.confirmationCode ?? undefined,
  description: order.statusDescription ?? undefined,
});

/**
 * Used by the /status/:reference endpoints. `reference` can be Pesapal's
 * tracking id OR our merchant reference. Only the owner can check an order.
 * Returns null if the order doesn't exist.
 */
export const checkPaymentStatus = async (userId: string, reference: string) => {
  const existing = await Order.findOne({
    userId,
    $or: [{ orderTrackingId: reference }, { merchantReference: reference }],
  });
  if (!existing) return null;

  if (!existing.orderTrackingId) return toStatusResponse(existing);

  try {
    const { order } = await syncOrderWithPesapal(
      existing.orderTrackingId,
      existing.merchantReference,
    );
    return toStatusResponse(order);
  } catch (error) {
    // Pesapal hiccup: report what we have (usually "pending") instead of an
    // error that the checkout page could mistake for a failed payment.
    console.error("status sync failed, returning stored status:", error);
    return toStatusResponse(existing);
  }
};

/**
 * Marks this customer's payments that are STILL pending after the payment
 * window as FAILED (cancelled or timed out). Call it AFTER asking Pesapal for
 * the latest status, so a payment that just went through is not expired.
 * If Pesapal reports it completed later, it is upgraded to COMPLETED again.
 * Returns how many orders were expired.
 */
export const expireStalePending = async (userId: string): Promise<number> => {
  const result = await Order.updateMany(
    {
      userId,
      paymentStatus: "PENDING",
      createdAt: { $lte: new Date(Date.now() - PAYMENT_WINDOW_MS) },
    },
    {
      $set: {
        paymentStatus: "FAILED",
        status: "failed",
        statusDescription:
          "Payment was not completed: the payment session was cancelled or timed out.",
        expiredAt: new Date(),
      },
    },
  );
  return result.modifiedCount;
};

// ---------------------------------------------------------------------------
// Emptying the cart after a successful payment
// ---------------------------------------------------------------------------

const RECENT_PENDING_MS = 30 * 60 * 1000;

// Re-checks (with Pesapal) payments the customer started in the last 30
// minutes, so a completed payment is noticed without waiting for the IPN.
const syncRecentPending = async (userId: string) => {
  const pending = await Order.find({
    userId,
    paymentStatus: "PENDING",
    orderTrackingId: { $exists: true, $ne: null },
    createdAt: { $gte: new Date(Date.now() - RECENT_PENDING_MS) },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  await Promise.allSettled(
    pending.map((order) =>
      syncOrderWithPesapal(order.orderTrackingId as string, order.merchantReference),
    ),
  );
};

/**
 * COMPLETED orders whose items are still waiting to be removed from the
 * customer's cart. FAILED / PENDING orders are never returned, so a payment
 * that didn't go through leaves the cart untouched.
 */
export const getPaidOrderLines = async (userId: string) => {
  await syncRecentPending(userId).catch((error) =>
    console.error("syncRecentPending failed:", error),
  );

  const orders = await Order.find({
    userId,
    paymentStatus: "COMPLETED",
    cartCleared: false, // only new orders have this; old orders are ignored
  }).limit(20);

  return orders.map((order) => ({
    merchantReference: order.merchantReference,
    lines: order.products.flatMap((p) =>
      p.productId
        ? [
            {
              productId: p.productId,
              selectedSize: p.selectedSize ?? "",
              selectedColor: p.selectedColor ?? "",
            },
          ]
        : [],
    ),
  }));
};

/** The customer's cart was saved without these orders' items. */
export const markCartCleared = async (
  userId: string,
  merchantReferences: string[],
) => {
  await Order.updateMany(
    {
      userId,
      merchantReference: { $in: merchantReferences },
      paymentStatus: "COMPLETED",
    },
    { $set: { cartCleared: true } },
  );
};