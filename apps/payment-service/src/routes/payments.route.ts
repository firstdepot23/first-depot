import { Hono } from "hono";
import { Order } from "@repo/order-db";
import { shouldBeUser } from "../middleware/authMiddleware";
import {
  getPaidOrderLines,
  markCartCleared,
  syncOrderWithPesapal,
} from "../utils/orders";

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

// Which cart lines the customer has already PAID for. The shop removes them
// from the cart, saves it, and then calls /cart-cleared below.
paymentsRoute.get("/paid-lines", shouldBeUser, async (c) => {
  try {
    const orders = await getPaidOrderLines(c.get("userId"));
    return c.json({ orders });
  } catch (error) {
    console.error("paid-lines failed:", error);
    return c.json({ error: "Could not check your payments" }, 500);
  }
});

paymentsRoute.post("/cart-cleared", shouldBeUser, async (c) => {
  try {
    const body = (await c.req.json().catch(() => null)) as {
      references?: unknown;
    } | null;

    const references = Array.isArray(body?.references)
      ? body.references.filter((r): r is string => typeof r === "string")
      : [];

    if (references.length > 0) {
      await markCartCleared(c.get("userId"), references);
    }
    return c.json({ ok: true });
  } catch (error) {
    console.error("cart-cleared failed:", error);
    return c.json({ error: "Could not update your orders" }, 500);
  }
});

export default paymentsRoute;
