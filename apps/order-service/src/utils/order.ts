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

  try {
    const saved = await newOrder.save();
    console.log(
      `Order saved: id=${saved._id} userId=${userId ?? "MISSING"} email=${saved.email}`,
    );

    producer.send("order.created", {
      value: {
        email: saved.email,
        amount: saved.amount,
        status: saved.status,
      },
    });
  } catch (error) {
    console.error("createOrder failed:", error);
    throw error;
  }
};