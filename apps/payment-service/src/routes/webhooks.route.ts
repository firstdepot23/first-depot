import { Hono } from "hono";
import type { Context } from "hono";
import { syncOrderWithPesapal } from "../utils/orders";

const webhookRoute = new Hono();

webhookRoute.get("/", (c) => {
  return c.json({
    status: "ok webhook",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Pesapal expects this exact shape back. status 200 = received and processed,
// 500 = received but something went wrong (Pesapal will call again).
const ipnReply = (
  c: Context,
  orderTrackingId: string,
  orderMerchantReference: string,
  status: 200 | 500,
) =>
  c.json(
    {
      orderNotificationType: "IPNCHANGE",
      orderTrackingId,
      orderMerchantReference,
      status,
    },
    status,
  );

// The IPN only says "this transaction changed" - it is NOT proof of payment.
// We always ask Pesapal for the real status (GetTransactionStatus) and store
// that result on the Order.
const handleIpn = async (
  c: Context,
  orderTrackingId?: string,
  orderMerchantReference?: string,
) => {
  console.log("pesapal IPN received:", {
    orderTrackingId,
    orderMerchantReference,
  });

  if (!orderTrackingId) {
    return c.json({ error: "Missing OrderTrackingId" }, 400);
  }

  try {
    const { order, notifyFailed } = await syncOrderWithPesapal(
      orderTrackingId,
      orderMerchantReference,
    );

    console.log(
      `pesapal IPN: ${order.merchantReference} -> ${order.paymentStatus}`,
    );

    // Order is saved, but the confirmation event couldn't be published:
    // answer 500 so Pesapal calls again and we retry publishing.
    return ipnReply(
      c,
      orderTrackingId,
      orderMerchantReference ?? order.merchantReference,
      notifyFailed ? 500 : 200,
    );
  } catch (error) {
    console.error("pesapal IPN handling failed:", error);
    return ipnReply(c, orderTrackingId, orderMerchantReference ?? "", 500);
  }
};

// Registered as a GET notification type in registerPesapalIpn() (utils/pesapal.ts).
webhookRoute.get("/pesapal", (c) =>
  handleIpn(
    c,
    c.req.query("OrderTrackingId"),
    c.req.query("OrderMerchantReference"),
  ),
);

// Same handler for the POST notification type, in case the IPN is ever
// registered as POST.
webhookRoute.post("/pesapal", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    OrderTrackingId?: string;
    OrderMerchantReference?: string;
  };

  return handleIpn(
    c,
    body.OrderTrackingId ?? c.req.query("OrderTrackingId"),
    body.OrderMerchantReference ?? c.req.query("OrderMerchantReference"),
  );
});

export default webhookRoute;