import { Hono } from "hono";
import { Order } from "@repo/order-db";
import { shouldBeUser } from "../middleware/authMiddleware";
import { syncOrderWithPesapal } from "../utils/orders";

const paymentsRoute = new Hono();

// Called by the Orders page. Re-checks every payment of the signed-in user
// that is still PENDING directly with Pesapal, so an order flips to COMPLETED
// even if Pesapal's IPN never reached us.
paymentsRoute.post("/sync", shouldBeUser, async (c) => {
  try {
    const pending = await Order.find({
      userId: c.get("userId"),
      paymentStatus: "PENDING",
      orderTrackingId: { $exists: true, $ne: null },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const results = await Promise.allSettled(
      pending.map((order) =>
        syncOrderWithPesapal(order.orderTrackingId as string, order.merchantReference),
      ),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    return c.json({ checked: pending.length, failed });
  } catch (error) {
    console.error("payments sync failed:", error);
    return c.json({ error: "Sync failed" }, 500);
  }
});

export default paymentsRoute;