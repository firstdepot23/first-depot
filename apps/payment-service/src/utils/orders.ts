import { Order, type PaymentStatusType } from "@repo/order-db";
import { producer } from "./kafka";
import {
  getPesapalTransactionStatus,
  type PesapalTransactionStatus,
} from "./pesapal";

export type CartLine = { name: string; quantity: number; price: number };

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

/**
 * Creates the Order (status PENDING) BEFORE the customer pays, then starts the
 * Pesapal payment. This replaces the old PendingPayment collection: the Order
 * itself remembers who is paying and what they bought, and Pesapal's
 * IPN / status calls update it in place.
 */
export const placeOrder = async <T extends { reference: string }>(
  input: {
    userId: string;
    email: string;
    amount: number;
    merchantReference: string;
    cart: CartLine[];
  },
  startPayment: () => Promise<T>,
): Promise<T> => {
  const order = await Order.create({
    userId: input.userId,
    email: input.email,
    amount: input.amount,
    currency: "UGX",
    merchantReference: input.merchantReference,
    paymentStatus: "PENDING",
    status: "pending",
    confirmationSent: false,
    products: input.cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
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
    { $set: update },
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