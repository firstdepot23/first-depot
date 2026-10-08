import { PendingPayment } from "@repo/order-db";
import { producer } from "./kafka";
import {
  getPesapalTransactionStatus,
  type PesapalTransactionStatus,
} from "./pesapal";

export type FinalizeResult = {
  status: "pending" | "successful" | "failed";
  reference: string; // Pesapal order tracking id
};

/**
 * The single place where a Pesapal payment becomes an order.
 *
 * Called from BOTH the Pesapal IPN (webhooks.route.ts) and the status
 * endpoints the frontend polls, so an order is created even if the IPN never
 * reaches us (wrong registered URL, service asleep on Render, etc.).
 *
 * Safe to call any number of times: the pending payment is claimed
 * atomically, so only the first successful call publishes payment.successful.
 */
export const finalizePayment = async (
  orderTrackingId: string,
  known?: PesapalTransactionStatus,
): Promise<FinalizeResult> => {
  // Never trust the caller - always ask Pesapal for the real status.
  const result = known ?? (await getPesapalTransactionStatus(orderTrackingId));
  const reference = result.merchant_reference;

  if (result.status_code === 2 || result.status_code === 3) {
    console.log("Pesapal payment failed:", reference, orderTrackingId);
    return { status: "failed", reference: orderTrackingId };
  }

  if (result.status_code !== 1) {
    // 0 = still pending / invalid so far
    return { status: "pending", reference: orderTrackingId };
  }

  if (!reference) {
    console.error("Pesapal returned no merchant_reference:", orderTrackingId);
    return { status: "successful", reference: orderTrackingId };
  }

  // Atomically claim the pending payment so concurrent IPN/status calls
  // can't create duplicate orders.
  const pending = await PendingPayment.findOneAndUpdate(
    { reference, processed: false },
    { processed: true, trackingId: orderTrackingId },
  );

  if (!pending) {
    console.log("finalizePayment: unknown or already processed:", reference);
    return { status: "successful", reference: orderTrackingId };
  }

  try {
    await producer.send("payment.successful", {
      value: {
        userId: pending.userId,
        email: pending.email,
        amount: pending.amount,
        status: "success",
        trackingId: orderTrackingId,
        paymentMethod: result.payment_method,
        products: pending.products.map(
          (p: { name: string; quantity: number; price: number }) => ({
            name: p.name,
            quantity: p.quantity,
            price: p.price,
          }),
        ),
      },
    });
    console.log("finalizePayment: published payment.successful for", reference);
  } catch (err) {
    // Release the claim so the next IPN / status poll can retry.
    await PendingPayment.updateOne({ reference }, { processed: false });
    throw err;
  }

  return { status: "successful", reference: orderTrackingId };
};