import { Order } from "@repo/order-db";
import { OrderType } from "@repo/types";
import { producer } from "./kafka";

export const createOrder = async (order: OrderType) => {
  const userId = (order as { userId?: string }).userId;
  if (!userId) {
    console.warn(
      "createOrder: incoming order has NO userId - it will not appear on any user's Orders page",
      { email: (order as { email?: string }).email },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...fields } = order;
  const trackingId = fields.trackingId;

  let saved;
  try {
    if (!trackingId) {
      saved = await new Order(fields).save();
    } else if (fields.status === "success") {
      // Upsert by tracking id: a successful payment creates the order, or
      // upgrades an earlier "failed" one for the same Pesapal payment.
      saved = await Order.findOneAndUpdate(
        { trackingId },
        { $set: fields },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } else {
      // A failed payment is stored once and never overwrites an existing
      // order (e.g. one that already succeeded).
      await Order.updateOne(
        { trackingId },
        { $setOnInsert: fields },
        { upsert: true },
      );
      saved = await Order.findOne({ trackingId });
    }

    if (!saved) throw new Error(`Order not found after save: ${trackingId}`);

    console.log(
      `Order saved: id=${saved._id} status=${saved.status} trackingId=${trackingId ?? "none"} userId=${userId ?? "MISSING"} email=${saved.email}`,
    );
  } catch (error) {
    console.error("createOrder failed:", error);
    throw error;
  }

  // Only successful orders are announced (the email service shouldn't send
  // a confirmation for a failed payment). The order is already stored; a
  // failure to announce it must not crash the process or be reported as a
  // failed order.
  if (saved.status !== "success") return;

  try {
    await producer.send("order.created", {
      value: {
        email: saved.email,
        amount: saved.amount,
        status: saved.status,
      },
    });
  } catch (error) {
    console.error("order.created publish failed (order itself was saved):", error);
  }
};