import { Hono } from "hono";
import Stripe from "stripe";
import stripe from "../utils/stripe";
import { producer } from "../utils/kafka";
import { getPesapalTransactionStatus } from "../utils/pesapal";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const webhookRoute = new Hono();

webhookRoute.get("/", (c) => {
  return c.json({
    status: "ok webhook",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

webhookRoute.post("/stripe", async (c) => {
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (error) {
    console.log("Webhook verification failed!");
    return c.json({ error: "Webhook verification failed!" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id
        );

        // Awaited so a Kafka failure is caught here instead of becoming an
        // unhandled rejection that crashes the whole service.
        await producer.send("payment.successful", {
          value: {
            userId: session.client_reference_id,
            email: session.customer_details?.email,
            amount: session.amount_total,
            status: session.payment_status === "paid" ? "success" : "failed",
            paymentMethod: "stripe",
            products: lineItems.data.map((item) => ({
              name: item.description,
              quantity: item.quantity,
              price: item.price?.unit_amount,
            })),
          },
        });
      } catch (error) {
        console.error("stripe webhook: failed to publish payment.successful:", error);
        // A non-2xx response makes Stripe retry the webhook later.
        return c.json({ error: "Failed to process event" }, 500);
      }

      break;
    }

    default:
      break;
  }
  return c.json({ received: true });
});

// Pesapal's IPN. Registered as a GET notification type in
// registerPesapalIpn() (utils/pesapal.ts) - if you registered yours as
// POST instead, add a matching webhookRoute.post("/pesapal", ...) with
// the params read from the body instead of the query string.
//
// IMPORTANT: the OrderTrackingId/OrderMerchantReference Pesapal sends
// here are just a "go check" signal, not proof of payment on their own -
// we always re-fetch the real status via GetTransactionStatus before
// treating anything as paid, same principle as verifying a Stripe
// signature before trusting a webhook body.
webhookRoute.get("/pesapal", async (c) => {
  const orderTrackingId = c.req.query("OrderTrackingId");
  const orderMerchantReference = c.req.query("OrderMerchantReference");

  if (!orderTrackingId || !orderMerchantReference) {
    return c.json(
      { error: "Missing OrderTrackingId/OrderMerchantReference" },
      400,
    );
  }

  try {
    const result = await getPesapalTransactionStatus(orderTrackingId);

    if (result.status_code === 1) {
      // TODO: the order service needs userId, email and products to create
      // an order, and this message does not carry them yet. Save the user
      // and cart when the payment is initiated (keyed by the merchant
      // reference) and include them here.
      await producer.send("payment.successful", {
        value: {
          reference: orderMerchantReference,
          orderTrackingId,
          amount: result.amount,
          status: "success",
          paymentMethod: "mobile_money",
          // Pesapal's own payment_method (e.g. "MTNUG", "AIRTELUG") - a
          // finer-grained operator label than the "mobile_money" rail
          // itself, worth keeping if your order schema has room for it.
          provider: result.payment_method,
        },
      });
    } else if (result.status_code === 2 || result.status_code === 3) {
      // Nothing consumes a "payment.failed" topic yet, and the Kafka plan
      // limits how many topics can exist, so just log it for now.
      console.log(
        "Pesapal payment failed:",
        orderMerchantReference,
        orderTrackingId,
        result.payment_method,
      );
    }
    // status_code 0 (INVALID) - Pesapal will typically call the IPN again
    // once the transaction resolves, so there's nothing to do yet.
  } catch (error) {
    console.error("pesapal IPN handling failed:", error);
    return c.json({ error: "Failed to process IPN" }, 500);
  }

  // Pesapal expects this exact echoed shape in the 200 response to mark
  // the IPN as delivered - returning anything else makes it keep retrying.
  return c.json({
    orderNotificationType: "IPNCHANGE",
    orderTrackingId,
    orderMerchantReference,
    status: 200,
  });
});

export default webhookRoute;