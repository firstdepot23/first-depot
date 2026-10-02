import { Hono } from "hono";
import stripe from "../utils/stripe";
import { shouldBeUser } from "../middleware/authMiddleware";
import { CartItemsType } from "@repo/types";
import { getStripeProductPrice } from "../utils/stripeProduct";

const sessionRoute = new Hono();

const RETURN_URL =
  process.env.CHECKOUT_RETURN_URL ??
  "http://localhost:3004/return?session_id={CHECKOUT_SESSION_ID}";

sessionRoute.post("/create-checkout-session", shouldBeUser, async (c) => {
  const userId = c.get("userId");

  try {
    const { cart }: { cart: CartItemsType } = await c.req.json();

    if (!Array.isArray(cart) || cart.length === 0) {
      return c.json({ error: "Cart is empty" }, 400);
    }

    // Price lookup is inside the try block so any failure
    // (missing product, Stripe error, etc.) is caught and reported.
    const lineItems = await Promise.all(
      cart.map(async (item) => ({
        price_data: {
          // UGX matches the currency used across the rest of the app
          // (admin + client). Stripe fully supports it as a
          // presentment currency - see stripeProduct.ts for the note
          // on how amounts are represented for this currency.
          currency: "ugx",
          product_data: {
            name: item.name,
          },
          unit_amount: await getStripeProductPrice(item.id),
        },
        quantity: item.quantity,
      })),
    );

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      client_reference_id: userId,
      mode: "payment",
      ui_mode: "custom",
      return_url: RETURN_URL,
    });

    return c.json({ checkoutSessionClientSecret: session.client_secret });
  } catch (error) {
    console.error("create-checkout-session failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    // Return a real error status so the frontend's `response.ok` check works.
    return c.json({ error: message }, 500);
  }
});

sessionRoute.get("/:session_id", async (c) => {
  const { session_id } = c.req.param();

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });

    return c.json({
      status: session.status,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error("retrieve checkout session failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: message }, 500);
  }
});

export default sessionRoute;