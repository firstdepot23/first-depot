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

  const newOrder = new Order(order);

  let saved;
  try {
    saved = await newOrder.save();
    console.log(
      `Order saved: id=${saved._id} userId=${userId ?? "MISSING"} email=${saved.email}`,
    );
  } catch (error) {
    console.error("createOrder failed:", error);
    throw error;
  }

  // The order is already stored; a failure to announce it must not
  // crash the process or be reported as a failed order.
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