import { Hono } from "hono";
import { shouldBeUser } from "../middleware/authMiddleware";
import {
  CheckoutError,
  getCheckoutDetails,
  parseCheckoutInput,
  saveCheckoutDetails,
} from "../utils/checkout";

const checkoutRoute = new Hono();

// Called when the customer finishes the shipping step. The details are stored
// here and read back by /mobile-money/initiate and /bank-card/initiate, which
// also work out the delivery fee, so the browser never decides what to charge.
checkoutRoute.put("/details", shouldBeUser, async (c) => {
  try {
    const input = parseCheckoutInput(await c.req.json().catch(() => null));
    const saved = await saveCheckoutDetails(c.get("userId"), input);
    return c.json({ details: saved });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return c.json({ error: error.message }, 400);
    }
    console.error("save checkout details failed:", error);
    return c.json({ error: "Could not save your details" }, 500);
  }
});

// Lets the shipping form pre-fill, and the payment step recover after a refresh.
checkoutRoute.get("/details", shouldBeUser, async (c) => {
  try {
    const details = await getCheckoutDetails(c.get("userId"));
    return c.json({ details });
  } catch (error) {
    console.error("load checkout details failed:", error);
    return c.json({ error: "Could not load your details" }, 500);
  }
});

export default checkoutRoute;
