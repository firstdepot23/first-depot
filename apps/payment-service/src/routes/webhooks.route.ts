import { Hono } from "hono";
import { PendingPayment } from "@repo/order-db";
import { producer } from "../utils/kafka";
import { getPesapalTransactionStatus } from "../utils/pesapal";

const webhookRoute = new Hono();

webhookRoute.get("/", (c) => {
  return c.json({
    status: "ok webhook",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Pesapal's IPN. Registered as a GET notification type in
// registerPesapalIpn() (utils/pesapal.ts).
//
// The OrderTrackingId/OrderMerchantReference sent here are just a "go check"
// signal, not proof of payment - we always re-fetch the real status via
// GetTransactionStatus before treating anything as paid.
webhookRoute.get("/pesapal", async (c) => {
  const orderTrackingId = c.req.query("OrderTrackingId");
  const orderMerchantReference = c.req.query("OrderMerchantReference");

  console.log("pesapal IPN received:", { orderTrackingId, orderMerchantReference });

  if (!orderTrackingId || !orderMerchantReference) {
    return c.json(
      { error: "Missing OrderTrackingId/OrderMerchantReference" },
      400,
    );
  }

  try {
    const result = await getPesapalTransactionStatus(orderTrackingId);

    if (result.status_code === 1) {
      // Atomically claim the pending payment so Pesapal's repeated IPN
      // calls can't create duplicate orders.
      const pending = await PendingPayment.findOneAndUpdate(
        { reference: orderMerchantReference, processed: false },
        { processed: true },
      );

      if (!pending) {
        console.log(
          "pesapal IPN: unknown or already processed:",
          orderMerchantReference,
        );
      } else {
        try {
          await producer.send("payment.successful", {
            value: {
              userId: pending.userId,
              email: pending.email,
              amount: pending.amount,
              status: "success",
              products: pending.products.map((p) => ({
                name: p.name,
                quantity: p.quantity,
                price: p.price,
              })),
            },
          });
          console.log(
            "pesapal IPN: published payment.successful for",
            orderMerchantReference,
          );
        } catch (err) {
          // Release the claim so Pesapal's retry can succeed.
          await PendingPayment.updateOne(
            { reference: orderMerchantReference },
            { processed: false },
          );
          throw err; // outer catch returns 500 so Pesapal retries
        }
      }
    } else if (result.status_code === 2 || result.status_code === 3) {
      // Nothing consumes a "payment.failed" topic yet (and the Kafka plan
      // limits topics), so just log it.
      console.log(
        "Pesapal payment failed:",
        orderMerchantReference,
        orderTrackingId,
        result.payment_method,
      );
    }
    // status_code 0: still pending - Pesapal calls the IPN again on change.
  } catch (error) {
    console.error("pesapal IPN handling failed:", error);
    return c.json({ error: "Failed to process IPN" }, 500);
  }

  // Pesapal expects this exact echoed shape to mark the IPN as delivered.
  return c.json({
    orderNotificationType: "IPNCHANGE",
    orderTrackingId,
    orderMerchantReference,
    status: 200,
  });
});

export default webhookRoute;